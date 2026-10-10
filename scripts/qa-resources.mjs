/**
 * Resource-aware QA scheduling. No third-party dependencies.
 *
 * CPU parallelism reflects affinity where Node supports it. Memory detection
 * considers Windows available RAM, Linux MemAvailable, and cgroup limits.
 * Concurrency is a heuristic, not a benchmark: chrome instances differ by page.
 */
import { readFileSync } from 'node:fs';
import os from 'node:os';

export const GiB = 1024 ** 3;

function readString(name) {
  try { return readFileSync(name, 'utf8').trim(); }
  catch { return ''; }
}

function readPositiveInteger(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : null;
}

function linuxMemoryAvailable() {
  const match = readString('/proc/meminfo').match(/^MemAvailable:\s*(\d+)\s+kB/m);
  return match ? Number(match[1]) * 1024 : null;
}

function linuxCgroupMemory() {
  // v2 (modern distributions / Docker / WSL containers)
  let limit = readPositiveInteger(readString('/sys/fs/cgroup/memory.max'));
  let used = readPositiveInteger(readString('/sys/fs/cgroup/memory.current'));
  let inactive = Number(readString('/sys/fs/cgroup/memory.stat').match(/^inactive_file\s+(\d+)/m)?.[1] || 0);
  if (!limit) {
    // v1 (older distributions)
    limit = readPositiveInteger(readString('/sys/fs/cgroup/memory/memory.limit_in_bytes'));
    used = readPositiveInteger(readString('/sys/fs/cgroup/memory/memory.usage_in_bytes'));
    inactive = Number(readString('/sys/fs/cgroup/memory/memory.stat').match(/^total_inactive_file\s+(\d+)/m)?.[1] || 0);
  }
  // Kernel sentinel values effectively mean "unlimited".
  if (!limit || limit >= Number.MAX_SAFE_INTEGER / 2) return null;
  const available = Math.max(0, limit - (used || 0) + inactive);
  return { limit, available: Math.min(limit, available) };
}

function linuxCgroupCpus() {
  const cpuMax = readString('/sys/fs/cgroup/cpu.max').split(/\s+/);
  if (cpuMax.length === 2 && cpuMax[0] !== 'max') {
    const quota = readPositiveInteger(cpuMax[0]);
    const period = readPositiveInteger(cpuMax[1]);
    if (quota && period) return Math.max(1, Math.floor(quota / period));
  }
  const quota = readPositiveInteger(readString('/sys/fs/cgroup/cpu/cpu.cfs_quota_us'));
  const period = readPositiveInteger(readString('/sys/fs/cgroup/cpu/cpu.cfs_period_us'));
  return quota && period ? Math.max(1, Math.floor(quota / period)) : null;
}

export function detectQaResources() {
  const platform = process.platform;
  const systemThreads = os.cpus().length;
  const affinityThreads = typeof os.availableParallelism === 'function' ? os.availableParallelism() : systemThreads;
  const quotaThreads = platform === 'linux' ? linuxCgroupCpus() : null;
  const logicalThreads = Math.max(1, Math.min(systemThreads, affinityThreads, quotaThreads ?? Infinity));
  let totalBytes = os.totalmem();
  let availableBytes = platform === 'linux' ? linuxMemoryAvailable() ?? os.freemem() : os.freemem();
  const containerMemory = platform === 'linux' ? linuxCgroupMemory() : null;
  if (containerMemory) {
    totalBytes = Math.min(totalBytes, containerMemory.limit);
    availableBytes = Math.min(availableBytes, containerMemory.available);
  }
  return {
    logicalThreads,
    systemThreads,
    totalBytes,
    availableBytes: Math.max(0, Math.min(availableBytes, totalBytes)),
    cpuLimited: logicalThreads < systemThreads,
    memoryLimited: Boolean(containerMemory && containerMemory.limit < os.totalmem()),
  };
}

export function estimatedCaptureBytes(theme, profile = 'review') {
  const typical = theme === 'glass' ? 3.4 : theme === 'gaming' ? 2.8 : 1.65;
  return (typical + (profile === 'detailed' ? 0.75 : 0)) * GiB;
}

/** Pure calculation: useful for deterministic tests on Windows/Linux machines. */
export function planQaConcurrency({ resources, tasks, profile = 'review', jobs = 'auto' }) {
  if (!Array.isArray(tasks) || tasks.length < 1) throw new Error('No capture tasks provided');
  const { logicalThreads, availableBytes, totalBytes } = resources;
  if (![logicalThreads, availableBytes, totalBytes].every(Number.isFinite) || logicalThreads < 1 || totalBytes <= 0 || availableBytes < 0) {
    throw new Error('Invalid system resources');
  }
  // Leave headroom for OS, Vite, the dashboard developer tooling and browser peaks.
  const reserveBytes = Math.min(4 * GiB, Math.max(2 * GiB, totalBytes * 0.10));
  const memoryBudgetBytes = Math.max(0, availableBytes - reserveBytes);
  // Chromium tasks generally use substantial CPU. Reserve one logical thread
  // for the OS + Vite and allow about two threads per capture.
  const cpuLimit = logicalThreads <= 2 ? 1 : Math.max(1, Math.floor((logicalThreads - 1) / 2));
  const typicalBytes = (profile === 'detailed' ? 2.55 : 1.9) * GiB;
  const memoryLimit = Math.max(1, Math.floor(memoryBudgetBytes / typicalBytes));
  const automatic = jobs === 'auto';
  const requested = automatic ? Math.min(cpuLimit, memoryLimit) : jobs;
  if (!Number.isInteger(requested) || requested < 1 || requested > 64) throw new Error('Jobs must be auto or an integer from 1 to 64');
  const workerCount = Math.min(requested, tasks.length);
  return {
    workerCount, automatic, cpuLimit, memoryLimit, reserveBytes, memoryBudgetBytes,
    // A first worker is always allowed even when available RAM is low; log warning.
    lowMemory: memoryBudgetBytes < Math.min(...tasks.map(task => estimatedCaptureBytes(task.theme, profile))),
  };
}

/** Pure admission decision. Callers reserve memory before launching. */
export function memoryAdmissionAllowed({ activeCount, reservedBytes, memoryBudgetBytes, costBytes, currentFreeBytes, reserveBytes }) {
  if (activeCount === 0) return true; // progress even when one capture exceeds budget
  return reservedBytes + costBytes <= memoryBudgetBytes &&
    currentFreeBytes >= Math.max(reserveBytes, costBytes * 0.65);
}

export function formatGiB(bytes) { return `${(bytes / GiB).toFixed(1)} GB`; }
