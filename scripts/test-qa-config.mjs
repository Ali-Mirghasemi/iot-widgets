import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getQaThemes, screenshotOptions } from './qa-config.mjs';

const themes = getQaThemes();
assert.ok(themes.includes('studio') && themes.includes('horizon'));
const tokens = readFileSync(new URL('../src/widgets/core/themeTokens.ts', import.meta.url), 'utf8');
const themeKeys = [...tokens.matchAll(/^  ([a-z][a-z0-9-]*):\s*\{/gm)].map(match => match[1]);
assert.deepEqual([...themes].sort(), [...themeKeys].sort(), 'Theme union and token registry must match');
const renderer = readFileSync(new URL('../src/widgets/renderers/WidgetVisuals.tsx', import.meta.url), 'utf8');
const rendererKeys = [...renderer.matchAll(/^  ([a-z][a-z0-9-]*):\s*[A-Za-z]+VisualRenderer,/gm)].map(match => match[1]);
assert.deepEqual([...themes].sort(), [...rendererKeys].sort(), 'Theme union and renderer registry must match');
assert.deepEqual(screenshotOptions({ WIDGET_QA_IMAGE_FORMAT: 'png' }).extension, 'png');
assert.deepEqual(screenshotOptions({ WIDGET_QA_IMAGE_FORMAT: 'jpeg', WIDGET_QA_JPEG_QUALITY: '82' }).quality, 82);
assert.equal(screenshotOptions({ WIDGET_QA_WIDGET_SHEETS: '0' }).widgetSheets, false);
assert.equal(screenshotOptions({ WIDGET_QA_CATEGORY_SHEETS: '0' }).categorySheets, false);
assert.throws(() => screenshotOptions({ WIDGET_QA_IMAGE_FORMAT: 'webp' }));
assert.throws(() => screenshotOptions({ WIDGET_QA_JPEG_QUALITY: '101' }));
console.log(`QA configuration OK: ${themes.length} themes; image profiles validated`);
