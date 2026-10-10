/**
 * The public WidgetThemeId union is the canonical list for the QA scripts.
 * Extending the theme union automatically makes the new ID visible to the
 * Linux, PowerShell and direct Playwright capture commands.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function getQaThemes() {
  const types = readFileSync(path.join(root, 'src/widgets/core/types.ts'), 'utf8');
  const declaration = types.match(/export\s+type\s+WidgetThemeId\s*=\s*([^;]+);/);
  if (!declaration) throw new Error('Cannot find WidgetThemeId in src/widgets/core/types.ts');
  const ids = [...declaration[1].matchAll(/'([a-z][a-z0-9-]*)'/g)].map(match => match[1]);
  if (!ids.length || ids.length !== new Set(ids).size) {
    throw new Error('WidgetThemeId must contain unique string literal theme IDs');
  }
  return ids;
}

export function screenshotOptions(env = process.env) {
  const format = (env.WIDGET_QA_IMAGE_FORMAT || 'png').toLowerCase();
  if (!['png', 'jpeg', 'jpg'].includes(format)) {
    throw new Error(`WIDGET_QA_IMAGE_FORMAT must be png or jpeg, received ${format}`);
  }
  const imageType = format === 'jpg' ? 'jpeg' : format;
  const quality = Number(env.WIDGET_QA_JPEG_QUALITY || 85);
  if (!Number.isInteger(quality) || quality < 1 || quality > 100) {
    throw new Error('WIDGET_QA_JPEG_QUALITY must be an integer from 1 to 100');
  }
  const options = imageType === 'jpeg' ? { type: 'jpeg', quality } : { type: 'png' };
  return {
    ...options,
    extension: imageType === 'jpeg' ? 'jpg' : 'png',
    categorySheets: env.WIDGET_QA_CATEGORY_SHEETS !== '0',
    widgetSheets: env.WIDGET_QA_WIDGET_SHEETS !== '0',
  };
}
