/** Catch missing local modules before release, including run-qa imports. */
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const directory=path.dirname(fileURLToPath(import.meta.url));
let checks=0;
for (const file of readdirSync(directory).filter(name => name.endsWith('.mjs'))) {
  const source=readFileSync(path.join(directory,file),'utf8');
  for (const match of source.matchAll(/(?:\bfrom\s*|\bimport\s*\(|\bimport\s*)['"](\.[^'"]+)['"]/g)) {
    const relative=match[1];
    const destination=path.resolve(directory,relative);
    assert(existsSync(destination),`Missing local module: ${file} imports ${relative}`);
    checks++;
  }
}
console.log(`QA imports OK: ${checks} relative dependencies exist`);
