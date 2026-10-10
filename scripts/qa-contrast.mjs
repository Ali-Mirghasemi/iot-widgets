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
  let expectedReadings = 0;
  const requiresReading = new Set(['metric', 'battery', 'tank']);
  for (const card of document.querySelectorAll('[data-widget-theme="ios"]')) {
    const visual = card.getAttribute('data-widget-visual');
    const mustHaveReading = requiresReading.has(visual);
    if (mustHaveReading) expectedReadings++;
    const frame = card.querySelector('[data-ios-palette]');
    if (!frame) {
      issues.push({ id: card.getAttribute('data-widget-id'), issue: 'missing Cupertino frame' });
      continue;
    }
    const reading = frame.querySelector('[data-iot-reading]');
    if (!reading) {
      if (mustHaveReading) issues.push({ id: card.getAttribute('data-widget-id'), issue: 'missing primary reading' });
      continue;
    }
    readingCount++;
    const id = card.getAttribute('data-widget-id');
    const bg = parseRgb(frame.getAttribute('data-ios-surface-color'));
    const style = getComputedStyle(reading);
    const fg = parseRgb(style.color);
    const ratio = bg && fg ? contrast(fg, bg) : null;
    // The compact value is large text: 3:1 is the WCAG AA threshold.
    if (!ratio || ratio < 3) issues.push({
      id, issue: 'low contrast reading',
      ratio: ratio === null ? null : Math.round(ratio * 100) / 100,
      palette: frame.getAttribute('data-ios-palette'),
      foreground: style.color,
      surface: frame.getAttribute('data-ios-surface-color'),
      token: getComputedStyle(frame).getPropertyValue?.('--iot-ios-label')?.trim() || '(unset)',
    });
    if (typeof reading.textContent === 'string' && !reading.textContent.trim()) issues.push({ id, issue: 'empty primary reading' });
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0)
      issues.push({ id, issue: 'hidden primary reading' });
    const body = frame.querySelector('[data-responsive-widget-body]');
    // Check the rendered geometry rather than trusting a non-empty DOM node.
    if (typeof reading.getBoundingClientRect === 'function' && typeof body?.getBoundingClientRect === 'function') {
      const r = reading.getBoundingClientRect();
      const b = body.getBoundingClientRect();
      if (r.width < 2 || r.height < 2 || b.width < 2 || b.height < 2 ||
          r.right < b.left + 2 || r.left > b.right - 2 || r.bottom < b.top + 2 || r.top > b.bottom - 2)
        issues.push({ id, issue: 'reading not visible in widget body',
          body: { width: Math.round(b.width), height: Math.round(b.height) },
          reading: { width: Math.round(r.width), height: Math.round(r.height) },
          // Include the frame/content slot to distinguish a CSS grid-height
          // regression from an individual visual renderer overflowing.
          frame: (() => { const box=frame.getBoundingClientRect?.();return box?{width:Math.round(box.width),height:Math.round(box.height)}:null; })(),
          slot: (() => { const box=frame.querySelector('[data-ios-content-slot]')?.getBoundingClientRect?.();return box?{width:Math.round(box.width),height:Math.round(box.height)}:null; })(),
        });
    }
  }
  return { contrastReadings: readingCount, expectedReadings, contrastIssues: issues };
}
