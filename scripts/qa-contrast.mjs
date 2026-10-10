/** Lightweight, targeted contrast inspection for Cupertino's compact readings.
 * General visual contrast requires a rendered-image audit; this DOM check
 * specifically catches white-on-white readings missed by geometry QA.
 * Serializable for Playwright page.evaluate().
 */
export function inspectIOSReadingContrast() {
  const parseRgb = color => {
    const value = String(color || '').trim();
    if (/^#[0-9a-f]{6}$/i.test(value)) return [1, 3, 5].map(i => parseInt(value.slice(i, i + 2), 16));
    if (/^#[0-9a-f]{3}$/i.test(value)) return [1, 2, 3].map(i => parseInt(value[i] + value[i], 16));
    const match = value.match(/^rgba?\((\d+)[,\s]+(\d+)[,\s]+(\d+)/i);
    return match ? match.slice(1, 4).map(Number) : null;
  };
  const luminance = rgb => {
    const channel = v => {
      const n = v / 255;
      return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
  };
  const contrast = (a, b) => {
    const l1 = luminance(a), l2 = luminance(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  const issues = [];
  let readingCount = 0;
  for (const card of document.querySelectorAll('[data-widget-theme="ios"]')) {
    const frame = card.querySelector('[data-ios-palette]');
    const reading = frame?.querySelector('[data-iot-reading]');
    if (!reading || !frame) continue;
    readingCount++;
    const bg = parseRgb(frame.getAttribute('data-ios-surface-color'));
    const fg = parseRgb(getComputedStyle(reading).color);
    const ratio = bg && fg ? contrast(fg, bg) : null;
    // Compact value font is >= 24px, so WCAG AA large text requires 3:1.
    if (!ratio || ratio < 3) issues.push({
      id: card.getAttribute('data-widget-id'),
      issue: 'low contrast reading',
      ratio: ratio === null ? null : Math.round(ratio * 100) / 100,
      palette: frame.getAttribute('data-ios-palette'),
    });
  }
  return { contrastReadings: readingCount, contrastIssues: issues };
}
