#!/usr/bin/env node
import { getQaThemes } from './qa-config.mjs';
const themes = getQaThemes();
if (process.argv.includes('--lines')) {
  console.log(themes.join('\n'));
} else if (process.argv.includes('--json')) {
  console.log(JSON.stringify(themes));
} else {
  console.log(themes.join(','));
}
