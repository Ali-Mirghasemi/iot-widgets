/** Strict validation of captured category sheets before QA says PASS. */
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

export const QA_CATEGORIES = ['metrics', 'controls', 'charts', 'location', 'tables', 'display'];

/** Read dimensions from a real PNG or JPEG file, without adding image dependencies. */
export function imageDimensions(buffer) {
  if (buffer.length >= 24 && buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) {
    if (buffer.toString('ascii',12,16) !== 'IHDR') throw new Error('Invalid PNG header');
    return { format:'png', width:buffer.readUInt32BE(16), height:buffer.readUInt32BE(20) };
  }
  if (buffer.length >= 16 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset=2;
    while (offset+9 < buffer.length) {
      if (buffer[offset] !== 0xff) { offset++; continue; }
      while (buffer[offset] === 0xff) offset++;
      const marker=buffer[offset++];
      if (marker === 0xd9 || marker === 0xda) break;
      if (marker >= 0xd0 && marker <= 0xd7 || marker === 0x01) continue;
      if (offset+2 > buffer.length) break;
      const size=buffer.readUInt16BE(offset);
      if (size < 2 || offset+size > buffer.length) break;
      if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) {
        return { format:'jpeg', height:buffer.readUInt16BE(offset+3), width:buffer.readUInt16BE(offset+5) };
      }
      offset+=size;
    }
    throw new Error('JPEG has no valid image dimensions');
  }
  throw new Error('File is neither a valid PNG header nor a JPEG image');
}

/** Reject missing/empty/fake category images, missing diagnostic reports and render failures. */
export async function verifyCapture({ directory, theme, locale, category='', format='jpeg' }) {
  const failures=[];
  let report;
  try { report=JSON.parse(await readFile(path.join(directory,'report.json'),'utf8')); }
  catch(e) { return { ok:false, failures:[`Missing or unreadable report.json: ${e.message}`], screenshots:0 }; }
  if (report.locale !== locale) failures.push(`Report locale ${report.locale} differs from ${locale}`);
  const categories=category ? [category] : QA_CATEGORIES;
  const captures=Array.isArray(report.captures) ? report.captures : [];
  const expectedFormat=format === 'jpg'?'jpeg':format;
  for (const name of categories) {
    const capture=captures.find(c=>c.category===name && c.theme===theme);
    if (!capture) { failures.push(`Missing category in report: ${theme}/${name}`); continue; }
    if (!(capture.widgetVariants > 0)) failures.push(`No widget variants: ${theme}/${name}`);
    if (capture.renderErrorCount > 0) failures.push(`${capture.renderErrorCount} widget errors: ${theme}/${name}`);
    const relative=capture.file;
    if (!relative || typeof relative !== 'string') { failures.push(`Missing image filename: ${theme}/${name}`); continue; }
    const full=path.resolve(directory,relative);
    if (!full.startsWith(path.resolve(directory)+path.sep)) { failures.push(`Unsafe image path: ${relative}`); continue; }
    try {
      const size=await stat(full);
      if (size.size < 300) failures.push(`Empty/tiny screenshot: ${relative} (${size.size} B)`);
      const dims=imageDimensions(await readFile(full));
      if (dims.format !== expectedFormat) failures.push(`Wrong image format: ${relative} (${dims.format})`);
      if (dims.width < 700 || dims.height < 200) failures.push(`Unexpected small screenshot: ${relative} (${dims.width}x${dims.height})`);
    } catch(e) { failures.push(`Invalid screenshot ${relative}: ${e.message}`); }
  }
  if (Array.isArray(report.consoleErrors) && report.consoleErrors.length) failures.push(`${report.consoleErrors.length} browser console errors`);
  return { ok:failures.length===0, failures, screenshots:categories.length };
}
