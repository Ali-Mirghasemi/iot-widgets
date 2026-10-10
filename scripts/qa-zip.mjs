/**
 * Dependency-free ZIP32 writer for QA archives.
 * JPEG/PNG files are already compressed, so they are stored without recompression.
 * Text/JSON/log files use DEFLATE. Writes screenshots in bounded chunks instead
 * of holding a full archive (or a large screenshot) in RAM.
 */
import { createReadStream } from 'node:fs';
import { open, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { deflateRawSync } from 'node:zlib';

const LIMIT = 0xffffffff;
const table = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c >>> 1) ^ ((c & 1) ? 0xedb88320 : 0);
  table[n] = c >>> 0;
}
function crc32(part, previous = 0) {
  let crc = (previous ^ 0xffffffff) >>> 0;
  for (const byte of part) crc = table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

async function listFiles(folder, prefix = '') {
  const result = [];
  for (const entry of await readdir(folder, { withFileTypes:true })) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    const absolute = path.join(folder,entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Refusing to archive symlink: ${relative}`);
    if (entry.isDirectory()) result.push(...await listFiles(absolute, relative));
    else if (entry.isFile()) result.push({ absolute, relative });
  }
  return result.sort((a,b) => a.relative.localeCompare(b.relative));
}

function dosDateTime(timestamp) {
  const d = new Date(timestamp);
  const year = Math.max(1980, Math.min(2107,d.getFullYear()));
  return {
    time: (d.getHours()<<11) | (d.getMinutes()<<5) | Math.floor(d.getSeconds()/2),
    date: ((year-1980)<<9) | ((d.getMonth()+1)<<5) | d.getDate(),
  };
}

export async function zipDirectory(folder, destination) {
  const files = await listFiles(folder);
  if (files.length > 0xffff) throw new Error('ZIP32 file count exceeded');
  const output = await open(destination,'w');
  let offset = 0;
  let closed = false;
  const records = [];
  async function write(bytes) {
    // Explicit position prevents short writes from corrupting the next record.
    let written = 0;
    while (written < bytes.length) {
      const result = await output.write(bytes, written, bytes.length-written, offset);
      if (result.bytesWritten < 1) throw new Error('ZIP output write failed');
      written += result.bytesWritten;
      offset += result.bytesWritten;
    }
    if (offset > LIMIT) throw new Error('QA archive exceeds ZIP32 4 GiB limit; use fewer themes/locales or JPEG');
  }
  try {
    for (const file of files) {
      const info = await stat(file.absolute);
      if (info.size > LIMIT) throw new Error(`File too large for ZIP32: ${file.relative}`);
      const name = Buffer.from(file.relative.replaceAll('\\','/'),'utf8');
      if (name.length > 0xffff) throw new Error(`ZIP path too long: ${file.relative}`);
      const image = /\.(?:png|jpe?g|webp)$/i.test(file.relative);
      const method = image ? 0 : 8;
      const {date,time} = dosDateTime(info.mtime);
      const start = offset;
      const local = Buffer.alloc(30);
      local.writeUInt32LE(0x04034b50,0);
      local.writeUInt16LE(20,4);
      local.writeUInt16LE(0x0808,6); // UTF-8 filename and data descriptor
      local.writeUInt16LE(method,8);
      local.writeUInt16LE(time,10);
      local.writeUInt16LE(date,12);
      local.writeUInt16LE(name.length,26);
      await write(local);
      await write(name);
      let crc = 0;
      let uncompressed = 0;
      let compressed = 0;
      if (image) {
        for await (const chunk of createReadStream(file.absolute,{highWaterMark:1024*1024})) {
          crc = crc32(chunk,crc);
          uncompressed += chunk.length;
          compressed += chunk.length;
          await write(chunk);
        }
      } else {
        // Reports and logs are generally small; fallback to streaming in
        // memory for deflate efficiency while refusing huge text files.
        if (info.size > 32*1024*1024) throw new Error(`Unusually large QA text file: ${file.relative}`);
        const chunks=[];
        for await (const chunk of createReadStream(file.absolute)) {
          chunks.push(chunk);
          uncompressed += chunk.length;
          crc = crc32(chunk,crc);
        }
        const bytes=deflateRawSync(Buffer.concat(chunks), {level:6});
        compressed=bytes.length;
        await write(bytes);
      }
      const descriptor=Buffer.alloc(16);
      descriptor.writeUInt32LE(0x08074b50,0);
      descriptor.writeUInt32LE(crc,4);
      descriptor.writeUInt32LE(compressed,8);
      descriptor.writeUInt32LE(uncompressed,12);
      await write(descriptor);
      records.push({name,crc,compressed,uncompressed,start,method,time,date});
    }
    const directoryStart=offset;
    for (const record of records) {
      const b=Buffer.alloc(46);
      b.writeUInt32LE(0x02014b50,0);
      b.writeUInt16LE(20,4);
      b.writeUInt16LE(20,6);
      b.writeUInt16LE(0x0808,8);
      b.writeUInt16LE(record.method,10);
      b.writeUInt16LE(record.time,12);
      b.writeUInt16LE(record.date,14);
      b.writeUInt32LE(record.crc,16);
      b.writeUInt32LE(record.compressed,20);
      b.writeUInt32LE(record.uncompressed,24);
      b.writeUInt16LE(record.name.length,28);
      b.writeUInt32LE(record.start,42);
      await write(b);
      await write(record.name);
    }
    const dirSize=offset-directoryStart;
    const end=Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50,0);
    end.writeUInt16LE(records.length,8);
    end.writeUInt16LE(records.length,10);
    end.writeUInt32LE(dirSize,12);
    end.writeUInt32LE(directoryStart,16);
    await write(end);
    await output.close();
    closed=true;
    return {entries:records.length, bytes:offset};
  } catch (error) {
    if (!closed) await output.close();
    throw error;
  }
}
