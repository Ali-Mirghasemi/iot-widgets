/** Deterministic CPU/RAM sizing tests; do not require Chromium. */
import assert from 'node:assert/strict';
import { GiB, detectQaResources, estimatedCaptureBytes, planQaConcurrency, memoryAdmissionAllowed } from './qa-resources.mjs';

const tasks = ['glass','gaming','studio','horizon','ios','flat','material','minimal'].flatMap(theme => [
  {theme,locale:'en'}, {theme,locale:'fa'},
]);
const plan = (threads,total,available,profile='review',jobs='auto') => planQaConcurrency({
  resources:{logicalThreads:threads,totalBytes:total*GiB,availableBytes:available*GiB},
  tasks,profile,jobs,
});
const workstation = plan(24,32,26);
const memoryRich = plan(8,64,55);
const lowMemory = plan(24,32,3);
assert(workstation.workerCount >= 7 && workstation.workerCount <= 11,
  `24-thread, 32-GB workstation should use meaningful parallelism: ${workstation.workerCount}`);
assert(memoryRich.workerCount >= 3 && memoryRich.workerCount <= 4,
  `8-thread, 64-GB machine is CPU-bound: ${memoryRich.workerCount}`);
assert.equal(lowMemory.workerCount,1,'Free RAM, not installed RAM, must limit concurrency');
assert.equal(plan(24,32,26,'review',2).workerCount,2,'Manual override preserved');
assert.equal(plan(24,32,26,'review','auto').automatic,true);
assert(plan(24,32,26,'detailed').workerCount < workstation.workerCount,
  'Detailed captures should use fewer workers');
assert(estimatedCaptureBytes('glass') > estimatedCaptureBytes('gaming'));
assert(estimatedCaptureBytes('gaming') > estimatedCaptureBytes('studio'));
assert(estimatedCaptureBytes('studio','detailed') > estimatedCaptureBytes('studio','review'));
assert.equal(plan(8,64,55,'review',64).workerCount,tasks.length,
  'Manual override may raise the task count; runtime memory admission applies');
const detected=detectQaResources();
assert(detected.logicalThreads >= 1 && detected.totalBytes > 0 && detected.availableBytes >= 0);
assert(detected.availableBytes <= detected.totalBytes);
assert(memoryAdmissionAllowed({activeCount:1,reservedBytes:2*GiB,memoryBudgetBytes:10*GiB,costBytes:3*GiB,currentFreeBytes:8*GiB,reserveBytes:2*GiB}));
assert(!memoryAdmissionAllowed({activeCount:1,reservedBytes:8*GiB,memoryBudgetBytes:10*GiB,costBytes:3*GiB,currentFreeBytes:8*GiB,reserveBytes:2*GiB}));
assert(!memoryAdmissionAllowed({activeCount:1,reservedBytes:2*GiB,memoryBudgetBytes:10*GiB,costBytes:3*GiB,currentFreeBytes:1*GiB,reserveBytes:2*GiB}));
assert(memoryAdmissionAllowed({activeCount:0,reservedBytes:0,memoryBudgetBytes:0,costBytes:3*GiB,currentFreeBytes:1*GiB,reserveBytes:2*GiB}));
console.log(`QA resource sizing OK: 24-thread/32-GB -> ${workstation.workerCount} workers; 8-thread/64-GB -> ${memoryRich.workerCount}; low free RAM -> ${lowMemory.workerCount}`);
