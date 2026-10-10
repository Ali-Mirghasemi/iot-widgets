/** ZIP contents must be readable without any third-party ZIP dependency. */
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { inflateRawSync } from 'node:zlib';
import { zipDirectory } from './qa-zip.mjs';

const base=await mkdtemp(path.join(tmpdir(),'iot-qa-zip-test-'));
try {
  const source=path.join(base,'source');
  await mkdir(path.join(source,'fa','widget-screenshots'),{recursive:true});
  const image=Buffer.from([0x89,0x50,0x4e,0x47,0,1,2,3]);
  await writeFile(path.join(source,'fa','widget-screenshots','نقشه.png'),image);
  await writeFile(path.join(source,'fa','widget-screenshots','report.json'),JSON.stringify({theme:'studio',locale:'fa'}));
  const zipPath=path.join(base,'qa.zip');
  assert.equal((await zipDirectory(source,zipPath)).entries,2);
  const zip=await readFile(zipPath);
  const end=zip.lastIndexOf(Buffer.from([0x50,0x4b,0x05,0x06]));
  assert(end>=0,'ZIP end directory is missing');
  const count=zip.readUInt16LE(end+10), off=zip.readUInt32LE(end+16);
  assert.equal(count,2);
  let at=off;
  for (let index=0; index<count; index++) {
    assert.equal(zip.readUInt32LE(at),0x02014b50);
    const method=zip.readUInt16LE(at+10);
    const compressed=zip.readUInt32LE(at+20);
    const nameLen=zip.readUInt16LE(at+28);
    const extraLen=zip.readUInt16LE(at+30);
    const commentLen=zip.readUInt16LE(at+32);
    const name=zip.subarray(at+46,at+46+nameLen).toString('utf8');
    const local=zip.readUInt32LE(at+42);
    assert.equal(zip.readUInt32LE(local),0x04034b50);
    const dataStart=local+30+zip.readUInt16LE(local+26)+zip.readUInt16LE(local+28);
    const bytes=zip.subarray(dataStart,dataStart+compressed);
    const uncompressed=method === 8 ? inflateRawSync(bytes) : bytes;
    if (name.endsWith('.png')) assert.deepEqual(uncompressed,image);
    else assert.deepEqual(JSON.parse(uncompressed),{theme:'studio',locale:'fa'});
    at+=46+nameLen+extraLen+commentLen;
  }
  console.log('ZIP writer OK: UTF-8 names, stored PNG, deflated JSON, valid directory offsets');
} finally {
  await rm(base,{recursive:true,force:true});
}
