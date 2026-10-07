import { useMemo, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import { Box, Typography } from '@mui/material';
import type { Locale, WidgetDefinition, WidgetSize, WidgetThemeTokens } from '../core/types';
import { bars, heat, spark, spark2 } from '../data/mockData';

interface Props { def: WidgetDefinition; theme: WidgetThemeTokens; locale: Locale; size: WidgetSize; }

type TableMode = 'table' | 'measurement-list' | 'alarms' | 'events' | 'logs';

const ink = '#111318';
const graphite = '#4b5058';
const muted = '#8a9099';
const faint = '#dfe2e6';
const danger = '#b42318';
const warning = '#9a6700';
const good = '#166534';

const n = (value: unknown, fallback = 0) => typeof value === 'number' ? value : fallback;
const s = (value: unknown, fallback = '') => typeof value === 'string' ? value : fallback;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function profile(size: WidgetSize) {
  const [w, h] = size.split('x').map(Number);
  const area = w * h;
  return {
    w, h, area,
    compact: area === 1,
    small: area <= 2,
    medium: area >= 2,
    large: area >= 4,
    tall: h > w,
    wide: w > h,
    roomy: area >= 4 || w >= 3 || h >= 3,
  };
}

const l = (locale: Locale, en: string, fa: string) => locale === 'fa' ? fa : en;

function MonoRule({ strong = false, vertical = false }: { strong?: boolean; vertical?: boolean }) {
  return <Box sx={vertical
    ? { width: strong ? '2px' : '1px', height: '100%', bgcolor: strong ? ink : faint, flex: '0 0 auto' }
    : { height: strong ? '2px' : '1px', width: '100%', bgcolor: strong ? ink : faint, flex: '0 0 auto' }
  } />;
}

function Eyebrow({ children, locale, dim = false }: { children: ReactNode; locale: Locale; dim?: boolean }) {
  return <Typography sx={{
    fontSize: 9.5,
    lineHeight: 1.15,
    color: dim ? muted : graphite,
    fontWeight: 700,
    letterSpacing: locale === 'fa' ? 0 : '.11em',
    textTransform: locale === 'fa' ? 'none' : 'uppercase',
    direction: locale === 'fa' ? 'rtl' : 'ltr',
    fontVariantNumeric: 'tabular-nums',
  }}>{children}</Typography>;
}

function MetaPair({ title, value, locale, strong = false }: { title: string; value: ReactNode; locale: Locale; strong?: boolean }) {
  return <Box sx={{ minWidth: 0 }}>
    <Eyebrow locale={locale} dim>{title}</Eyebrow>
    <Typography sx={{ mt: .25, fontSize: strong ? 13.5 : 11.5, lineHeight: 1.2, fontWeight: strong ? 760 : 620, color: ink, direction: 'ltr', fontVariantNumeric: 'tabular-nums', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</Typography>
  </Box>;
}

function MonoSpark({ values = spark, height = 58, area = false, dots = false }: { values?: number[]; height?: number | string; area?: boolean; dots?: boolean }) {
  const geom = useMemo(() => {
    const lo = Math.min(...values);
    const hi = Math.max(...values);
    const r = Math.max(1, hi - lo);
    return values.map((v, i) => ({
      x: 3 + (i / Math.max(1, values.length - 1)) * 94,
      y: 36 - ((v - lo) / r) * 27,
    }));
  }, [values]);
  const points = geom.map(p => `${p.x},${p.y}`).join(' ');
  return <svg viewBox="0 0 100 40" preserveAspectRatio="none" width="100%" height={height} aria-hidden style={{ display: 'block' }}>
    <line x1="0" x2="100" y1="36" y2="36" stroke={faint} strokeWidth=".7" vectorEffect="non-scaling-stroke" />
    {[25, 50, 75].map(x => <line key={x} x1={x} x2={x} y1="34" y2="38" stroke={muted} strokeWidth=".7" vectorEffect="non-scaling-stroke" />)}
    {area && <polygon points={`3,36 ${points} 97,36`} fill={ink} opacity=".055" />}
    <polyline points={points} fill="none" stroke={ink} strokeWidth="1.45" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="square" />
    {dots && geom.filter((_, i) => i === geom.length - 1 || i === 0).map((p, i) => <circle key={i} cx={p.x} cy={p.y} r="1.45" fill={ink} />)}
  </svg>;
}

function TickScale({ pct, labels = true, vertical = false }: { pct: number; labels?: boolean; vertical?: boolean }) {
  const p = clamp(pct, 0, 100);
  if (vertical) return <Box sx={{ position: 'relative', height: '100%', minHeight: 95, width: 34, flex: '0 0 34px' }}>
    <Box sx={{ position: 'absolute', left: 16, top: 0, bottom: 0, width: '1px', bgcolor: faint }} />
    {[0, 25, 50, 75, 100].map(t => <Box key={t} sx={{ position: 'absolute', left: t % 50 === 0 ? 8 : 11, bottom: `calc(${t}% - .5px)`, width: t % 50 === 0 ? 16 : 10, height: '1px', bgcolor: t === 0 || t === 100 ? graphite : muted }} />)}
    <Box sx={{ position: 'absolute', left: 5, bottom: `calc(${p}% - 4px)`, width: 23, height: 8, bgcolor: ink }} />
  </Box>;
  return <Box sx={{ width: '100%' }}>
    <Box sx={{ position: 'relative', height: 17 }}>
      <Box sx={{ position: 'absolute', left: 0, right: 0, top: 8, height: '1px', bgcolor: faint }} />
      {[0, 25, 50, 75, 100].map(t => <Box key={t} sx={{ position: 'absolute', left: `${t}%`, top: t % 50 === 0 ? 4 : 6, width: '1px', height: t % 50 === 0 ? 9 : 5, bgcolor: t === 0 || t === 100 ? graphite : muted, transform: 'translateX(-.5px)' }} />)}
      <Box sx={{ position: 'absolute', left: `${p}%`, top: 2, width: 2, height: 13, bgcolor: ink, transform: 'translateX(-1px)' }} />
    </Box>
    {labels && <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: .1 }}><Typography sx={{ fontSize: 8.5, color: muted }}>0</Typography><Typography sx={{ fontSize: 8.5, color: muted }}>MAX</Typography></Box>}
  </Box>;
}

function Metric({ def, locale, size }: Props) {
  const p = profile(size);
  const value = n(def.mock.value, 0);
  const unit = s(def.mock.unit);
  const trend = n(def.mock.trend, 0);
  const vals = (def.mock.values as number[] | undefined) ?? spark;
  const max = n(def.mock.max, Math.max(Math.abs(value) * 1.3, 100));
  const pct = clamp((Math.abs(value) / Math.max(1, max)) * 100, 0, 100);
  const trendText = `${trend >= 0 ? '+' : '−'}${Math.abs(trend)}%`;

  if (p.compact) return <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', direction: 'ltr' }}>
    <Typography sx={{ fontSize: 40, lineHeight: 1.12, letterSpacing: '-.065em', fontWeight: 470, color: ink, fontVariantNumeric: 'tabular-nums' }}>
      {value}<Box component="span" sx={{ ml: .55, fontSize: 12, color: graphite, letterSpacing: 0, fontWeight: 620 }}>{unit}</Box>
    </Typography>
    <Box sx={{ mt: 1.55, display: 'flex', alignItems: 'center', gap: .8 }}><Box sx={{ width: 20, height: 2, bgcolor: ink }} /><Typography sx={{ fontSize: 10, color: trend >= 0 ? ink : warning, fontWeight: 750 }}>{trendText}</Typography><Typography sx={{ fontSize: 9, color: muted }}>24H</Typography></Box>
  </Box>;

  if (p.wide && !p.large) return <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: 'minmax(112px,.75fr) 1.35fr', gap: 1.5, direction: 'ltr', alignItems: 'stretch' }}>
    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
      <Eyebrow locale={locale} dim>{l(locale, 'live reading', 'مقدار زنده')}</Eyebrow>
      <Typography sx={{ mt: .55, fontSize: 36, lineHeight: 1.12, letterSpacing: '-.06em', fontWeight: 470, color: ink, fontVariantNumeric: 'tabular-nums' }}>{value}<Box component="span" sx={{ ml: .5, fontSize: 11.5, color: graphite, fontWeight: 650, letterSpacing: 0 }}>{unit}</Box></Typography>
      <Typography sx={{ mt: 1, fontSize: 10, color: trend >= 0 ? graphite : warning, fontWeight: 750 }}>{trendText} / 24H</Typography>
    </Box>
    <Box sx={{ borderLeft: `1px solid ${faint}`, pl: 1.3, display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}><MonoSpark values={vals} height={64} dots /></Box>
  </Box>;

  return <Box sx={{ height: '100%', display: 'grid', gridTemplateRows: 'auto auto 1fr auto', gap: 1, direction: 'ltr' }}>
    <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 1 }}>
      <Typography sx={{ fontSize: p.large ? 48 : 40, lineHeight: 1.12, letterSpacing: '-.065em', fontWeight: 460, color: ink, fontVariantNumeric: 'tabular-nums' }}>{value}<Box component="span" sx={{ ml: .6, fontSize: 12.5, color: graphite, fontWeight: 650, letterSpacing: 0 }}>{unit}</Box></Typography>
      <Box sx={{ textAlign: 'right' }}><Eyebrow locale={locale} dim>{l(locale, '24h delta', 'تغییر ۲۴ساعته')}</Eyebrow><Typography sx={{ mt: .25, fontSize: 12, fontWeight: 760, color: trend >= 0 ? ink : warning }}>{trendText}</Typography></Box>
    </Box>
    <TickScale pct={pct} labels={false} />
    <Box sx={{ minHeight: 0, display: 'flex', alignItems: 'stretch', pt: .35 }}><MonoSpark values={vals} height={p.large ? '100%' : 62} area dots /></Box>
    {p.roomy && <><MonoRule /><Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 1 }}><MetaPair locale={locale} title={l(locale, 'min', 'کمینه')} value={`${Math.round(value * .88 * 10) / 10} ${unit}`} /><MetaPair locale={locale} title={l(locale, 'mean', 'میانگین')} value={`${Math.round(value * .96 * 10) / 10} ${unit}`} /><MetaPair locale={locale} title={l(locale, 'peak', 'بیشینه')} value={`${Math.round(value * 1.08 * 10) / 10} ${unit}`} /></Box></>}
  </Box>;
}

function Gauge({ def, locale, size }: Props) {
  const p = profile(size);
  const value = n(def.mock.value, 68);
  const max = n(def.mock.max, 100);
  const unit = s(def.mock.unit);
  const pct = clamp((value / Math.max(1, max)) * 100, 0, 100);
  const warn = pct >= 72;
  const critical = pct >= 88;
  const state = critical ? l(locale, 'HIGH', 'بالا') : warn ? l(locale, 'WATCH', 'مراقبت') : l(locale, 'NORMAL', 'عادی');
  const stateColor = critical ? danger : warn ? warning : ink;
  const headroom = Math.max(0, max - value);

  if (p.compact) return <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: '1fr 36px', gap: 1, direction: 'ltr', alignItems: 'center' }}>
    <Box><Typography sx={{ fontSize: 34, lineHeight: 1.12, letterSpacing: '-.055em', fontWeight: 480, fontVariantNumeric: 'tabular-nums' }}>{value}<Box component="span" sx={{ fontSize: 11, ml: .45, color: graphite, fontWeight: 650, letterSpacing: 0 }}>{unit}</Box></Typography><Typography sx={{ mt: .8, fontSize: 9.5, color: stateColor, fontWeight: 800, letterSpacing: '.08em' }}>{state}</Typography></Box>
    <TickScale pct={pct} labels={false} vertical />
  </Box>;

  if (p.large && !p.wide) return <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: '1fr 48px', gridTemplateRows: 'auto 1fr auto', columnGap: 1.5, rowGap: 1.2, direction: 'ltr' }}>
    <Box sx={{ minWidth: 0 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 1 }}>
        <Typography sx={{ fontSize: 50, lineHeight: 1.12, letterSpacing: '-.065em', fontWeight: 460, fontVariantNumeric: 'tabular-nums' }}>{value}<Box component="span" sx={{ fontSize: 12, ml: .55, color: graphite, fontWeight: 650, letterSpacing: 0 }}>{unit}</Box></Typography>
        <Box sx={{ textAlign: 'right' }}><Eyebrow locale={locale} dim>{l(locale, 'range', 'بازه')}</Eyebrow><Typography sx={{ mt: .2, fontSize: 11.5, color: graphite, fontWeight: 700 }}>0 — {max}</Typography></Box>
      </Box>
    </Box>
    <Box sx={{ gridColumn: 2, gridRow: '1 / span 2', minHeight: 0, py: .4 }}><TickScale pct={pct} labels={false} vertical /></Box>
    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 0 }}>
      <Eyebrow locale={locale} dim>{l(locale, 'operating state', 'وضعیت کاری')}</Eyebrow>
      <Typography sx={{ mt: .45, fontSize: 22, fontWeight: 780, color: stateColor }}>{state}</Typography>
      <Typography sx={{ mt: .5, fontSize: 10, color: muted }}>{Math.round(pct)}% {l(locale, 'of configured range', 'از بازه تنظیم‌شده')}</Typography>
      <Box sx={{ mt: 1.5, display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: .45 }}>
        {[0, 1, 2, 3, 4].map(i => <Box key={i} sx={{ height: 9, bgcolor: i < Math.ceil(pct / 20) ? (critical && i === 4 ? danger : warn && i >= 3 ? warning : ink) : faint }} />)}
      </Box>
    </Box>
    <Box sx={{ gridColumn: '1 / -1', borderTop: `1px solid ${faint}`, pt: 1, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1 }}>
      <MetaPair locale={locale} title={l(locale, 'warn at', 'حد هشدار')} value={`${Math.round(max * .72)} ${unit}`} />
      <MetaPair locale={locale} title={l(locale, 'limit', 'حد نهایی')} value={`${max} ${unit}`} />
      <MetaPair locale={locale} title={l(locale, 'headroom', 'حاشیه')} value={`${Math.round(headroom * 10) / 10} ${unit}`} />
    </Box>
  </Box>;

  return <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', direction: 'ltr' }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 1 }}>
      <Typography sx={{ fontSize: 38, lineHeight: 1.12, letterSpacing: '-.06em', fontWeight: 470, fontVariantNumeric: 'tabular-nums' }}>{value}<Box component="span" sx={{ fontSize: 12, ml: .55, color: graphite, fontWeight: 650, letterSpacing: 0 }}>{unit}</Box></Typography>
      <Box sx={{ textAlign: 'right' }}><Eyebrow locale={locale} dim>{l(locale, 'range', 'بازه')}</Eyebrow><Typography sx={{ mt: .2, fontSize: 11.5, color: graphite, fontWeight: 700 }}>0 — {max}</Typography></Box>
    </Box>
    <Box sx={{ mt: 1.6 }}><TickScale pct={pct} /></Box>
    <Box sx={{ mt: .9, display: 'grid', gridTemplateColumns: '1fr auto', gap: 1, alignItems: 'end' }}>
      <Box><Eyebrow locale={locale} dim>{l(locale, 'operating state', 'وضعیت کاری')}</Eyebrow><Typography sx={{ mt: .35, fontSize: 12.5, fontWeight: 780, color: stateColor }}>{state}</Typography></Box>
      <Typography sx={{ fontSize: 10, color: muted }}>{Math.round(pct)}%</Typography>
    </Box>
  </Box>;
}

function Battery({ def, locale, size }: Props) {
  const p = profile(size);
  const value = clamp(n(def.mock.value, 76), 0, 100);
  const voltage = s(def.mock.voltage, '3.94 V');
  const remaining = s(def.mock.remaining, '8h 42m');
  const low = value < 25;

  const terminalW = p.large ? 8 : 6;
  const shape = <Box sx={{ position: 'relative', width: '100%', maxWidth: p.compact ? 104 : p.large ? 340 : 170, height: p.compact ? 42 : p.large ? 80 : 54, pr: `${terminalW}px`, boxSizing: 'border-box' }}>
    <Box sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, right: `${terminalW}px`, border: `1.5px solid ${ink}`, p: p.large ? '6px' : '4px', bgcolor: '#fff', boxSizing: 'border-box' }}>
      <Box sx={{ height: '100%', width: `${value}%`, bgcolor: low ? danger : ink }} />
    </Box>
    <Box sx={{ position: 'absolute', right: 0, top: '31%', width: `${terminalW}px`, height: '38%', bgcolor: ink }} />
  </Box>;

  if (p.compact) return <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', direction: 'ltr' }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><Typography sx={{ fontSize: 32, lineHeight: 1.12, fontWeight: 500, letterSpacing: '-.05em' }}>{value}%</Typography><Typography sx={{ fontSize: 9.5, color: low ? danger : graphite, fontWeight: 750 }}>{low ? 'LOW' : voltage}</Typography></Box>
    <Box sx={{ mt: 1.25 }}>{shape}</Box>
  </Box>;

  if (p.large) return <Box sx={{ height: '100%', display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: 1.2, direction: 'ltr' }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}><Typography sx={{ fontSize: 48, lineHeight: 1.12, fontWeight: 460, letterSpacing: '-.06em' }}>{value}%</Typography><Eyebrow locale={locale} dim>{low ? l(locale, 'charge soon', 'نیاز به شارژ') : l(locale, 'battery reserve', 'ذخیره باتری')}</Eyebrow></Box>
    <Box sx={{ minHeight: 0, display: 'grid', alignContent: 'center', justifyItems: 'start', gap: 1.1 }}>
      {shape}
      <Box sx={{ width: '100%', maxWidth: 340, display: 'flex', justifyContent: 'space-between' }}><Typography sx={{ fontSize: 8.5, color: muted }}>0</Typography><Typography sx={{ fontSize: 8.5, color: muted }}>50</Typography><Typography sx={{ fontSize: 8.5, color: muted }}>100%</Typography></Box>
    </Box>
    <Box sx={{ borderTop: `1px solid ${faint}`, pt: 1, display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1 }}><MetaPair locale={locale} title={l(locale, 'voltage', 'ولتاژ')} value={voltage} strong /><MetaPair locale={locale} title={l(locale, 'estimated', 'زمان باقی‌مانده')} value={remaining} strong /><MetaPair locale={locale} title={l(locale, 'health', 'سلامت')} value="94%" /><MetaPair locale={locale} title={l(locale, 'cycles', 'چرخه')} value="182" /></Box>
  </Box>;

  return <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: p.wide ? '1.1fr .9fr' : '1fr', gap: 1.4, alignItems: 'center', direction: 'ltr' }}>
    <Box sx={{ minWidth: 0 }}><Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}><Typography sx={{ fontSize: 36, lineHeight: 1.12, fontWeight: 470, letterSpacing: '-.055em' }}>{value}%</Typography><Eyebrow locale={locale} dim>{low ? l(locale, 'charge soon', 'نیاز به شارژ') : l(locale, 'battery', 'باتری')}</Eyebrow></Box><Box sx={{ mt: 1.3 }}>{shape}</Box></Box>
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 1, borderLeft: p.wide ? `1px solid ${faint}` : 'none', pl: p.wide ? 1.4 : 0 }}><MetaPair locale={locale} title={l(locale, 'voltage', 'ولتاژ')} value={voltage} strong /><MetaPair locale={locale} title={l(locale, 'estimated', 'زمان باقی‌مانده')} value={remaining} strong /></Box>
  </Box>;
}

function Signal({ def, locale, size }: Props) {
  const p = profile(size);
  const raw = n(def.mock.value, -72);
  const value = raw <= 0 ? clamp(((raw + 110) / 60) * 100, 0, 100) : clamp(raw, 0, 100);
  const dbm = s(def.mock.dbm, raw <= 0 ? `${raw} dBm` : '-81 dBm');
  const network = s(def.mock.network, 'LTE · RSRP');
  const operator = s(def.mock.operator, network.split('·')[0].trim() || 'LTE');
  const barsOn = Math.max(1, Math.round(value / 20));
  const signalHistory = [-96, -91, -88, -84, -86, -80, -77, -75, -78, raw <= 0 ? raw : -72];
  const barVisual = <Box sx={{ height: p.compact ? 42 : p.large ? 82 : 58, display: 'flex', alignItems: 'end', gap: p.compact ? .45 : p.large ? .8 : .6, direction: 'ltr' }}>{[1, 2, 3, 4, 5].map(i => <Box key={i} sx={{ width: p.compact ? 6 : p.large ? 11 : 8, height: `${19 + i * 15}%`, bgcolor: i <= barsOn ? ink : faint }} />)}</Box>;

  if (p.compact) return <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', gap: 1, direction: 'ltr' }}><Box><Typography sx={{ fontSize: 32, fontWeight: 490, lineHeight: 1.12, letterSpacing: '-.05em' }}>{Math.round(value)}%</Typography><Typography sx={{ mt: .8, fontSize: 9.5, color: graphite, fontWeight: 700 }}>{dbm}</Typography></Box>{barVisual}</Box>;

  if (p.large) return <Box sx={{ height: '100%', display: 'grid', gridTemplateRows: 'auto auto 1fr auto', gap: 1, direction: 'ltr' }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 1 }}><Box><Typography sx={{ fontSize: 46, fontWeight: 470, lineHeight: 1.12, letterSpacing: '-.06em' }}>{Math.round(value)}%</Typography><Typography sx={{ mt: .6, fontSize: 10, color: graphite, fontWeight: 700 }}>{dbm}</Typography></Box><Box sx={{ display: 'flex', alignItems: 'end', gap: 1.1 }}><Typography sx={{ pb: .25, fontSize: 10, fontWeight: 800, color: graphite }}>{operator}</Typography>{barVisual}</Box></Box>
    <TickScale pct={value} labels={false} />
    <Box sx={{ minHeight: 0, display: 'grid', gridTemplateRows: 'auto 1fr', gap: .5 }}><Eyebrow locale={locale} dim>{l(locale, 'signal history', 'تاریخچه سیگنال')}</Eyebrow><Box sx={{ minHeight: 0 }}><MonoSpark values={signalHistory} height="100%" dots /></Box></Box>
    <Box sx={{ borderTop: `1px solid ${faint}`, pt: 1, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1 }}><MetaPair locale={locale} title="RSSI" value={dbm} /><MetaPair locale={locale} title="SINR" value="18 dB" /><MetaPair locale={locale} title="RSRP" value="-96 dBm" /></Box>
  </Box>;

  return <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 1.8, alignItems: 'center', direction: 'ltr' }}>
    {barVisual}
    <Box sx={{ minWidth: 0 }}><Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}><Typography sx={{ fontSize: 34, fontWeight: 480, lineHeight: 1.12, letterSpacing: '-.05em' }}>{Math.round(value)}%</Typography><Typography sx={{ fontSize: 10, fontWeight: 800, color: graphite }}>{operator}</Typography></Box><Box sx={{ mt: 1 }}><TickScale pct={value} labels={false} /></Box><Box sx={{ mt: 1, display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 1 }}><MetaPair locale={locale} title="RSSI" value={dbm} /> <MetaPair locale={locale} title="SINR" value="18 dB" /></Box></Box>
  </Box>;
}

function Tank({ def, locale, size }: Props) {
  const p = profile(size);
  const value = clamp(n(def.mock.value, 63), 0, 100);
  const unit = s(def.mock.unit, '%');
  const liters = s(def.mock.liters, `${Math.round(value * 20)} L`);
  const isSoil = def.id === 'soil-moisture';
  const tank = <Box sx={{ position: 'relative', width: p.compact ? 62 : p.tall ? 90 : 100, height: p.compact ? 72 : p.tall ? 150 : 106, borderLeft: `2px solid ${ink}`, borderRight: `2px solid ${ink}`, borderBottom: `2px solid ${ink}`, borderTop: `1px solid ${faint}`, overflow: 'hidden', flex: '0 0 auto' }}>
    <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: `${value}%`, bgcolor: ink }} />
    {[25, 50, 75].map(v => <Box key={v} sx={{ position: 'absolute', top: `${100 - v}%`, left: 0, width: 10, height: '1px', bgcolor: '#fff', mixBlendMode: 'difference' }} />)}
  </Box>;

  if (p.compact) return <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 1.2, alignItems: 'center', direction: 'ltr' }}>{tank}<Box><Typography sx={{ fontSize: 31, fontWeight: 480, lineHeight: 1.12, letterSpacing: '-.05em' }}>{value}{unit}</Typography><Typography sx={{ mt: .8, fontSize: 9, color: graphite, fontWeight: 720 }}>{isSoil ? l(locale, 'MOISTURE', 'رطوبت') : l(locale, 'LEVEL', 'سطح')}</Typography></Box></Box>;
  return <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: p.tall ? '1fr' : 'auto 1fr', gridTemplateRows: p.tall ? '1fr auto' : '1fr', gap: 1.4, alignItems: 'center', justifyItems: p.tall ? 'center' : 'stretch', direction: 'ltr' }}>
    {tank}
    <Box sx={{ width: '100%', minWidth: 0 }}><Typography sx={{ fontSize: p.tall ? 37 : 40, fontWeight: 470, lineHeight: 1.12, letterSpacing: '-.055em' }}>{value}<Box component="span" sx={{ fontSize: 12, ml: .45, color: graphite, fontWeight: 650 }}>{unit}</Box></Typography><Typography sx={{ mt: .7, fontSize: 10, color: graphite, fontWeight: 760 }}>{value < 20 ? l(locale, 'LOW LEVEL', 'سطح پایین') : value > 88 ? l(locale, 'NEAR FULL', 'نزدیک پر') : l(locale, 'IN RANGE', 'در محدوده')}</Typography>{!p.tall && <Box sx={{ mt: 1.1 }}><TickScale pct={value} labels={false} /></Box>}<Box sx={{ mt: 1.2, display: 'grid', gridTemplateColumns: p.roomy ? 'repeat(2,1fr)' : '1fr', gap: 1 }}><MetaPair locale={locale} title={l(locale, isSoil ? 'field estimate' : 'volume', isSoil ? 'برآورد خاک' : 'حجم')} value={isSoil ? 'Optimal' : liters} />{p.roomy && <MetaPair locale={locale} title={l(locale, 'change / 1h', 'تغییر یک‌ساعته')} value="−1.8%" />}</Box></Box>
  </Box>;
}

function BooleanStatus({ def, locale, size }: Props) {
  const p = profile(size);
  const [on, setOn] = useState(Boolean(def.mock.value));
  const label = def.id === 'device-status' ? (on ? l(locale, 'ONLINE', 'آنلاین') : l(locale, 'OFFLINE', 'آفلاین')) : (on ? 'ON' : 'OFF');
  const stateSegments = on ? [ink, ink, ink, ink, ink, ink, ink, ink] : [muted, muted, faint, faint, muted, faint, faint, muted];

  if (p.large) return <Box onClick={() => setOn(v => !v)} role="button" tabIndex={0} sx={{ height: '100%', cursor: 'pointer', userSelect: 'none', display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: 1.2, direction: locale === 'fa' ? 'rtl' : 'ltr' }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 1 }}><Box><Eyebrow locale={locale} dim>{l(locale, 'device state', 'وضعیت دستگاه')}</Eyebrow><Typography sx={{ mt: .45, fontSize: 46, lineHeight: 1.12, fontWeight: 470, letterSpacing: locale === 'fa' ? 0 : '-.055em', color: ink }}>{label}</Typography></Box><Box sx={{ width: 24, height: 24, border: `1px solid ${ink}`, bgcolor: on ? ink : '#fff' }} /></Box>
    <Box sx={{ minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}><Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><Eyebrow locale={locale} dim>{l(locale, 'state history · 15 min', 'تاریخچه وضعیت · ۱۵ دقیقه')}</Eyebrow><Typography sx={{ fontSize: 9, color: muted }}>{l(locale, 'click to toggle', 'برای تغییر کلیک کنید')}</Typography></Box><Box sx={{ mt: 1, display: 'grid', gridTemplateColumns: 'repeat(8,1fr)', gap: .45 }}>{stateSegments.map((c,i)=><Box key={i} sx={{ height: 14, bgcolor: c }} />)}</Box></Box>
    <Box sx={{ borderTop: `1px solid ${faint}`, pt: 1, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1 }}><MetaPair locale={locale} title={l(locale, 'state since', 'شروع وضعیت')} value="09:31" /><MetaPair locale={locale} title={l(locale, 'uptime', 'آپ‌تایم')} value="14d 8h" /><MetaPair locale={locale} title={l(locale, 'packets', 'بسته‌ها')} value="1,284" /></Box>
  </Box>;

  return <Box onClick={() => setOn(v => !v)} role="button" tabIndex={0} sx={{ height: '100%', cursor: 'pointer', userSelect: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 1 }}><Typography sx={{ fontSize: p.compact ? 29 : 38, lineHeight: 1.12, fontWeight: 480, letterSpacing: '-.045em', color: ink }}>{label}</Typography><Box sx={{ width: p.compact ? 14 : 20, height: p.compact ? 14 : 20, border: `1px solid ${ink}`, bgcolor: on ? ink : '#fff' }} /></Box>
    <Box sx={{ mt: 1.3 }}><MonoRule strong={on} /></Box>
    <Typography sx={{ mt: .75, fontSize: 9.5, color: muted }}>{l(locale, 'click to toggle mock state', 'برای تغییر وضعیت کلیک کنید')}</Typography>
  </Box>;
}

function Alarm({ def, locale, size }: Props) {
  const p = profile(size);
  const active = Boolean(def.mock.value);
  const severity = s(def.mock.severity, 'warning');
  const isCritical = severity === 'critical';
  const tone = active ? (isCritical ? danger : warning) : good;
  const Icon = def.icon;
  const code = def.id === 'fire-alarm' ? 'FIRE' : def.id === 'smoke-alarm' ? 'SMOKE' : 'LEAK';
  const sensorState = s(def.mock.status, active ? 'Warning' : 'Armed');

  if (p.large) return <Box sx={{ height: '100%', display: 'grid', gridTemplateRows: '1fr auto', gap: 1.2, direction: locale === 'fa' ? 'rtl' : 'ltr' }}>
    <Box sx={{ minHeight: 0, display: 'grid', gridTemplateColumns: '1.12fr .88fr', gap: 1.6, alignItems: 'center' }}>
      <Box sx={{ minWidth: 0 }}><Eyebrow locale={locale} dim>{code}</Eyebrow><Typography sx={{ mt: .5, fontSize: 46, lineHeight: 1.12, letterSpacing: locale === 'fa' ? 0 : '-.055em', fontWeight: 490, color: active ? tone : ink }}>{active ? l(locale, 'ALARM', 'هشدار') : l(locale, 'SAFE', 'ایمن')}</Typography><Box sx={{ mt: 1.15, display: 'flex', alignItems: 'center', gap: .7 }}><Box sx={{ width: 28, height: '2px', bgcolor: tone }} /><Typography sx={{ fontSize: 9.5, fontWeight: 780, color: tone }}>{active ? l(locale, 'ACTION REQUIRED', 'نیازمند اقدام') : l(locale, 'MONITORING', 'پایش فعال')}</Typography></Box></Box>
      <Box sx={{ height: '72%', minHeight: 120, display: 'grid', placeItems: 'center', borderLeft: locale === 'fa' ? 'none' : `1px solid ${faint}`, borderRight: locale === 'fa' ? `1px solid ${faint}` : 'none', color: tone }}><Icon sx={{ fontSize: 76 }} /></Box>
    </Box>
    <Box sx={{ borderTop: `1px solid ${faint}`, pt: 1, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1 }}><MetaPair locale={locale} title={l(locale, 'last test', 'آخرین تست')} value="08:00" /><MetaPair locale={locale} title={l(locale, 'zone', 'ناحیه')} value="A-04" /><MetaPair locale={locale} title={l(locale, 'sensor state', 'وضعیت سنسور')} value={sensorState} /></Box>
  </Box>;

  return <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: p.compact ? '1fr auto' : '1fr auto', gap: 1.2, alignItems: 'center', direction: locale === 'fa' ? 'rtl' : 'ltr' }}>
    <Box sx={{ minWidth: 0 }}><Eyebrow locale={locale} dim>{code}</Eyebrow><Typography sx={{ mt: .4, fontSize: p.compact ? 28 : 37, lineHeight: 1.12, letterSpacing: locale === 'fa' ? 0 : '-.045em', fontWeight: 500, color: active ? tone : ink }}>{active ? l(locale, 'ALARM', 'هشدار') : l(locale, 'SAFE', 'ایمن')}</Typography><Box sx={{ mt: 1.05, display: 'flex', alignItems: 'center', gap: .7 }}><Box sx={{ width: 22, height: '2px', bgcolor: tone }} /><Typography sx={{ fontSize: 9.5, fontWeight: 750, color: tone }}>{active ? l(locale, 'ACTION REQUIRED', 'نیازمند اقدام') : l(locale, 'MONITORING', 'پایش فعال')}</Typography></Box></Box>
    <Box sx={{ width: p.compact ? 52 : 66, height: p.compact ? 62 : 78, display: 'grid', placeItems: 'center', borderLeft: locale === 'fa' ? 'none' : `1px solid ${faint}`, borderRight: locale === 'fa' ? `1px solid ${faint}` : 'none', color: tone }}><Icon sx={{ fontSize: p.compact ? 34 : 42 }} /></Box>
  </Box>;
}

function ChartHeader({ def, locale }: Pick<Props, 'def' | 'locale'>) {
  return <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: 1, direction: 'ltr' }}><Box><Eyebrow locale={locale} dim>{l(locale, 'latest', 'آخرین')}</Eyebrow><Typography sx={{ mt: .2, fontSize: 17, lineHeight: 1.12, fontWeight: 650, color: ink, fontVariantNumeric: 'tabular-nums' }}>{s(def.mock.summary, `${s(def.mock.value)} ${s(def.mock.unit)}`)}</Typography></Box><Typography sx={{ fontSize: 9, color: muted }}>−24H · NOW</Typography></Box>;
}

function LineChart({ def, locale, size }: Props) {
  const p = profile(size);
  const vals = (def.mock.values as number[] | undefined) ?? (def.visual === 'area' ? spark2 : spark);
  return <Box sx={{ height: '100%', display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: .8, direction: 'ltr' }}>
    <ChartHeader def={def} locale={locale} />
    <Box sx={{ minHeight: 0, display: 'flex', alignItems: 'stretch', pt: p.large ? .4 : 0 }}><MonoSpark values={vals} height={p.large ? '100%' : p.wide ? 82 : 96} area={def.visual === 'area'} dots /></Box>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Eyebrow locale={locale} dim>{def.visual === 'area' ? l(locale, 'cumulative profile', 'پروفایل تجمعی') : l(locale, 'sample interval · 2h', 'فاصله نمونه · ۲ ساعت')}</Eyebrow>{p.large && <Typography sx={{ fontSize: 9, color: graphite }}>MIN {Math.min(...vals)} · MAX {Math.max(...vals)}</Typography>}</Box>
  </Box>;
}

function BarChart({ def, locale, size }: Props) {
  const p = profile(size);
  const vals = (def.mock.values as number[] | undefined) ?? bars;
  const max = Math.max(...vals, 1);
  return <Box sx={{ height: '100%', display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: 1, direction: 'ltr' }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><Typography sx={{ fontSize: 15, fontWeight: 650 }}>{l(locale, 'Weekly total', 'مجموع هفتگی')}</Typography><Typography sx={{ fontSize: 10, color: muted }}>{vals.reduce((a, b) => a + b, 0)}</Typography></Box>
    <Box sx={{ minHeight: 0, display: 'flex', alignItems: 'end', gap: p.large ? 1.1 : .65, borderBottom: `1px solid ${faint}`, pb: .2 }}>{vals.map((v, i) => <Box key={i} sx={{ flex: 1, height: `${Math.max(8, (v / max) * 100)}%`, minHeight: 7, bgcolor: i === vals.indexOf(max) ? ink : i % 2 ? '#70757d' : '#b5bac1' }} />)}</Box>
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>{['M','T','W','T','F','S','S'].map((d, i) => <Typography key={`${d}-${i}`} sx={{ fontSize: 8.5, color: muted, flex: 1, textAlign: 'center' }}>{d}</Typography>)}</Box>
  </Box>;
}

function Histogram({ locale, size }: Props) {
  const p = profile(size);
  const vals = [12, 28, 48, 72, 94, 76, 58, 39, 22, 10];
  return <Box sx={{ height: '100%', display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: .8, direction: 'ltr' }}><Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography sx={{ fontSize: 15, fontWeight: 650 }}>{l(locale, 'Distribution', 'توزیع')}</Typography><Typography sx={{ fontSize: 9, color: muted }}>N=1,284</Typography></Box><Box sx={{ minHeight: 0, display: 'flex', alignItems: 'end', gap: 2 / Math.max(1, p.w), borderBottom: `1px solid ${ink}` }}>{vals.map((v, i) => <Box key={i} sx={{ flex: 1, height: `${v}%`, bgcolor: i >= 4 && i <= 5 ? ink : '#8f949b' }} />)}</Box><Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography sx={{ fontSize: 8.5, color: muted }}>−3σ</Typography><Typography sx={{ fontSize: 8.5, color: ink, fontWeight: 700 }}>μ</Typography><Typography sx={{ fontSize: 8.5, color: muted }}>+3σ</Typography></Box></Box>;
}

function Donut({ def, locale, size }: Props) {
  const p = profile(size);
  const value = clamp(n(def.mock.value, 72), 0, 100);
  return <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: p.compact ? '1fr' : 'auto 1fr', gap: 1.5, alignItems: 'center', justifyItems: p.compact ? 'center' : 'stretch', direction: 'ltr' }}>
    <Box sx={{ width: p.compact ? 82 : p.large ? 126 : 98, height: p.compact ? 82 : p.large ? 126 : 98, borderRadius: '50%', position: 'relative', background: `conic-gradient(${ink} 0 ${value * 3.6}deg, ${faint} ${value * 3.6}deg 360deg)` }}><Box sx={{ position: 'absolute', inset: p.compact ? 8 : 11, borderRadius: '50%', bgcolor: '#fff', display: 'grid', placeItems: 'center' }}><Typography sx={{ fontSize: p.compact ? 20 : 25, fontWeight: 520, letterSpacing: '-.04em' }}>{value}%</Typography></Box></Box>
    {!p.compact && <Box><Eyebrow locale={locale} dim>{l(locale, 'capacity used', 'ظرفیت مصرف‌شده')}</Eyebrow><Typography sx={{ mt: .5, fontSize: p.large ? 22 : 15, fontWeight: 650 }}>{100 - value}% {l(locale, 'remaining', 'باقی‌مانده')}</Typography><Box sx={{ mt: 1.2 }}><MonoRule /></Box>{p.large && <Box sx={{ mt: 1.2, display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 1 }}><MetaPair locale={locale} title={l(locale, 'used', 'مصرف')} value={`${value} units`} /><MetaPair locale={locale} title={l(locale, 'free', 'آزاد')} value={`${100 - value} units`} /></Box>}</Box>}
  </Box>;
}

function Heatmap({ locale, size }: Props) {
  const p = profile(size);
  return <Box sx={{ height: '100%', display: 'grid', gridTemplateRows: '1fr auto', gap: .7, direction: 'ltr' }}><Box sx={{ minHeight: 0, display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gridTemplateRows: 'repeat(4,1fr)', gap: p.large ? 3 : 2 }}>{heat.flatMap((row, r) => row.map((v, c) => <Box key={`${r}-${c}`} sx={{ bgcolor: `rgba(17,19,24,${.08 + v * .82})`, minHeight: 8 }} />))}</Box><Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Eyebrow locale={locale} dim>{l(locale, 'intensity', 'شدت')}</Eyebrow><Box sx={{ display: 'flex', alignItems: 'center', gap: .45 }}><Typography sx={{ fontSize: 8.5, color: muted }}>LOW</Typography><Box sx={{ width: 38, height: 4, background: `linear-gradient(90deg,${faint},${ink})` }} /><Typography sx={{ fontSize: 8.5, color: muted }}>HIGH</Typography></Box></Box></Box>;
}

function Timeline({ locale, size }: Props) {
  const p = profile(size);
  const rows = [
    { name: 'PUMP-04', segs: [good, good, warning, good, danger], current: l(locale, 'ALARM', 'هشدار') },
    { name: 'VALVE-02', segs: [ink, good, good, good, good], current: l(locale, 'OPEN', 'باز') },
    { name: 'NODE-18', segs: [muted, muted, good, warning, warning], current: l(locale, 'WATCH', 'مراقبت') },
  ];

  if (p.large) return <Box sx={{ height: '100%', display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: 1, direction: 'ltr' }}>
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, borderBottom: `1px solid ${faint}`, pb: .8 }}><MetaPair locale={locale} title={l(locale, 'window', 'بازه')} value="12 h" /><MetaPair locale={locale} title={l(locale, 'transitions', 'تغییرها')} value="8" /><MetaPair locale={locale} title={l(locale, 'attention', 'نیازمند توجه')} value="1" /></Box>
    <Box sx={{ minHeight: 0, position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly', gap: .9 }}>
      {[25, 50, 75].map(x => <Box key={x} sx={{ position: 'absolute', top: 0, bottom: 0, left: `calc(70px + (100% - 132px) * ${x / 100})`, width: '1px', bgcolor: faint, opacity: .7 }} />)}
      {rows.map(row => <Box key={row.name} sx={{ position: 'relative', display: 'grid', gridTemplateColumns: '70px 1fr 56px', gap: .9, alignItems: 'center' }}><Typography sx={{ fontSize: 9, color: graphite, fontWeight: 760 }}>{row.name}</Typography><Box sx={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr 1fr 1.35fr .8fr', gap: 2 }}>{row.segs.map((c, i) => <Box key={i} sx={{ height: 16, bgcolor: c }} />)}</Box><Typography sx={{ fontSize: 8.5, color: row.current === l(locale, 'ALARM', 'هشدار') ? danger : graphite, fontWeight: 760, textAlign: 'right' }}>{row.current}</Typography></Box>)}
    </Box>
    <Box sx={{ display: 'grid', gridTemplateColumns: '70px 1fr 56px', gap: .9, alignItems: 'center' }}><Box /><Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography sx={{ fontSize: 8, color: muted }}>−12H</Typography><Typography sx={{ fontSize: 8, color: muted }}>−6H</Typography><Typography sx={{ fontSize: 8, color: muted }}>{l(locale, 'NOW', 'اکنون')}</Typography></Box><Box /></Box>
  </Box>;

  return <Box sx={{ height: '100%', display: 'grid', gridTemplateRows: '1fr auto', gap: .7, direction: 'ltr' }}><Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: .7 }}>{rows.map(row => <Box key={row.name} sx={{ display: 'grid', gridTemplateColumns: '52px 1fr', gap: .8, alignItems: 'center' }}><Typography sx={{ fontSize: 8.5, color: graphite, fontWeight: 700 }}>{row.name}</Typography><Box sx={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr 1fr 1.35fr .8fr', gap: 2 }}>{row.segs.map((c, i) => <Box key={i} sx={{ height: 9, bgcolor: c }} />)}</Box></Box>)}</Box><Box sx={{ display: 'flex', justifyContent: 'space-between', ml: '60px' }}><Typography sx={{ fontSize: 8, color: muted }}>−12H</Typography><Typography sx={{ fontSize: 8, color: muted }}>−6H</Typography><Typography sx={{ fontSize: 8, color: muted }}>{l(locale, 'NOW', 'اکنون')}</Typography></Box></Box>;
}

function MapVisual({ def, locale, size }: Props) {
  const p = profile(size);
  const route = def.visual === 'route';
  return <Box sx={{ height: '100%', display: 'grid', gridTemplateRows: p.large ? '1fr auto' : '1fr', gap: 1, direction: 'ltr' }}>
    <Box sx={{ minHeight: 0, position: 'relative', overflow: 'hidden', border: `1px solid ${faint}`, boxSizing: 'border-box', backgroundImage: `linear-gradient(${faint} 1px,transparent 1px),linear-gradient(90deg,${faint} 1px,transparent 1px)`, backgroundSize: p.large ? '28px 28px' : '22px 22px', bgcolor: '#fafafa' }}>
      <svg viewBox="0 0 520 240" width="100%" height="100%" preserveAspectRatio="none" aria-hidden style={{ display: 'block' }}>
        <path d="M18 166 C82 96 132 91 194 142 S322 213 502 70" fill="none" stroke={ink} strokeWidth={route ? 5 : 3.5} vectorEffect="non-scaling-stroke" />
        {[[122,112],[238,164],[374,171]].map(([x,y],i)=><g key={i}><circle cx={x} cy={y} r={i===2?8:6} fill="#fff" stroke={ink} strokeWidth="3" vectorEffect="non-scaling-stroke"/><circle cx={x} cy={y} r="2.8" fill={ink}/></g>)}
        {route && <><path d="M18 166 L60 132" stroke={ink} strokeWidth="1" strokeDasharray="3 3" vectorEffect="non-scaling-stroke"/><path d="M462 101 L502 70" stroke={ink} strokeWidth="1" strokeDasharray="3 3" vectorEffect="non-scaling-stroke"/></>}
      </svg>
      <Box sx={{ position: 'absolute', left: 8, top: 8, bgcolor: '#fff', borderLeft: `2px solid ${ink}`, px: .8, py: .45 }}><Eyebrow locale={locale}>{route ? l(locale, 'track · 12.4 km', 'مسیر · ۱۲.۴ کیلومتر') : l(locale, '3 devices', '۳ دستگاه')}</Eyebrow></Box>
      <Box sx={{ position: 'absolute', right: 7, bottom: 6, fontSize: 8.5, color: graphite, bgcolor: 'rgba(255,255,255,.86)', px: .5 }}>35.72 N / 51.33 E</Box>
    </Box>
    {p.large && <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1 }}><MetaPair locale={locale} title={route ? l(locale, 'distance', 'مسافت') : l(locale, 'online', 'آنلاین')} value={route ? '12.4 km' : '3 / 3'} /><MetaPair locale={locale} title={route ? l(locale, 'duration', 'مدت') : l(locale, 'radius', 'شعاع')} value={route ? '38 min' : '2.1 km'} /><MetaPair locale={locale} title={route ? l(locale, 'avg speed', 'سرعت میانگین') : l(locale, 'last fix', 'آخرین موقعیت')} value={route ? '19.6 km/h' : '09:44:12'} /></Box>}
  </Box>;
}

function Coordinates({ def, locale, size }: Props) {
  const p = profile(size);
  const items = [
    [l(locale, 'LATITUDE', 'عرض جغرافیایی'), s(def.mock.lat, '35.7219° N')],
    [l(locale, 'LONGITUDE', 'طول جغرافیایی'), s(def.mock.lng, '51.3347° E')],
    [l(locale, 'ACCURACY', 'دقت'), s(def.mock.accuracy, '4.2 m')],
  ];
  return <Box sx={{ height: '100%', display: 'grid', gridTemplateRows: `repeat(${items.length},1fr)`, borderTop: `1px solid ${ink}`, direction: 'ltr' }}>{items.map(([a,b],i)=><Box key={a} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, borderBottom: `1px solid ${i === items.length - 1 ? ink : faint}`, py: p.compact ? .35 : .7 }}><Typography sx={{ fontSize: 8.5, color: muted, fontWeight: 700, letterSpacing: '.08em' }}>{a}</Typography><Typography sx={{ fontSize: p.compact ? 11 : 13, color: ink, fontWeight: 690, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{b}</Typography></Box>)}</Box>;
}

function Compass({ def, locale, size }: Props) {
  const p = profile(size);
  const value = n(def.mock.value, 327);
  const dialSize = p.compact ? 92 : p.large ? 170 : 110;
  const dial = <Box sx={{ width: dialSize, height: dialSize, borderRadius: '50%', border: `1px solid ${ink}`, position: 'relative', flex: '0 0 auto' }}>
    {['N','E','S','W'].map((d,i)=><Typography key={d} sx={{ position:'absolute', fontSize:p.large?9.5:8.5, color:i===0?ink:muted, fontWeight:i===0?800:600, ...(i===0?{top:5,left:'50%',transform:'translateX(-50%)'}:i===1?{right:6,top:'50%',transform:'translateY(-50%)'}:i===2?{bottom:5,left:'50%',transform:'translateX(-50%)'}:{left:6,top:'50%',transform:'translateY(-50%)'}) }}>{d}</Typography>)}
    <svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden style={{ position: 'absolute', inset: 0, display: 'block' }}>
      <g transform={`rotate(${value} 50 50)`}>
        <line x1="50" y1="50" x2="50" y2="18" stroke={ink} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
        <path d="M50 13 L46.5 20 L53.5 20 Z" fill={ink} />
      </g>
      <circle cx="50" cy="50" r="2.6" fill="#fff" stroke={ink} strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
    </svg>
  </Box>;

  if (p.compact) return <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', direction: 'ltr' }}>{dial}</Box>;

  if (p.large) return <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: 'auto 1fr', gridTemplateRows: '1fr auto', columnGap: 1.8, rowGap: 1.2, alignItems: 'center', direction: 'ltr' }}>
    {dial}
    <Box sx={{ minWidth: 0 }}><Eyebrow locale={locale} dim>{l(locale, 'heading', 'جهت')}</Eyebrow><Typography sx={{ mt:.35,fontSize:48,fontWeight:460,lineHeight:1.12,letterSpacing:'-.06em' }}>{value}°</Typography><Typography sx={{ mt:.75,fontSize:11,color:graphite,fontWeight:760 }}>NNW</Typography><Box sx={{ mt: 1.3 }}><TickScale pct={(value / 360) * 100} labels={false} /></Box></Box>
    <Box sx={{ gridColumn: '1 / -1', borderTop: `1px solid ${faint}`, pt: 1, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1 }}><MetaPair locale={locale} title={l(locale,'magnetic variation','انحراف مغناطیسی')} value="+4.1°" /><MetaPair locale={locale} title={l(locale,'reference','مرجع')} value="MAG" /><MetaPair locale={locale} title={l(locale,'updated','به‌روزرسانی')} value="09:44:12" /></Box>
  </Box>;

  return <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 1.2, alignItems: 'center', direction: 'ltr' }}>{dial}<Box><Eyebrow locale={locale} dim>{l(locale, 'heading', 'جهت')}</Eyebrow><Typography sx={{ mt:.25,fontSize:32,fontWeight:480,lineHeight:1.12,letterSpacing:'-.05em' }}>{value}°</Typography><Typography sx={{ mt:.8,fontSize:10,color:graphite,fontWeight:700 }}>NNW</Typography></Box></Box>;
}

function ButtonControl({ def, locale, size }: Props) {
  const p = profile(size);
  const [state, setState] = useState<'idle'|'sent'>('idle');
  const press = () => { setState('sent'); window.setTimeout(() => setState('idle'), 900); };
  const transport = def.id === 'downlink' ? 'DOWNLINK' : 'RPC';

  if (p.large) return <Box sx={{ height: '100%', display: 'grid', gridTemplateRows: 'auto 1fr auto', gap: 1.2, direction: locale === 'fa' ? 'rtl' : 'ltr' }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}><Box><Eyebrow locale={locale} dim>{l(locale, 'command channel', 'کانال فرمان')}</Eyebrow><Typography sx={{ mt: .35, fontSize: 15, fontWeight: 720, color: ink }}>{transport}</Typography></Box><Typography sx={{ fontSize: 9.5, color: state === 'sent' ? good : muted, fontWeight: 760 }}>{state === 'sent' ? l(locale, 'ACKNOWLEDGED', 'تأیید شد') : l(locale, 'READY', 'آماده')}</Typography></Box>
    <Box sx={{ minHeight: 0, display: 'grid', placeItems: 'center' }}><Box sx={{ width: '100%', maxWidth: 280, textAlign: 'center' }}><Box component="button" onClick={press} sx={{ appearance:'none', border:`1px solid ${state==='sent'?ink:graphite}`, bgcolor:state==='sent'?ink:'#fff', color:state==='sent'?'#fff':ink, width:'100%', height:62, px:2.2, font:'inherit', fontSize:13, fontWeight:780, letterSpacing:locale==='fa'?0:'.07em', cursor:'pointer', borderRadius:0, transition:'.15s ease' }}>{state==='sent'?l(locale,'SENT ✓','ارسال شد ✓'):l(locale,'SEND COMMAND','ارسال فرمان')}</Box><Typography sx={{ mt:.9,fontSize:9.5,color:muted }}>{state==='sent'?l(locale,'mock acknowledgement received','تأیید آزمایشی دریافت شد'):l(locale,'ready · no pending action','آماده · فرمان معوق ندارد')}</Typography></Box></Box>
    <Box sx={{ borderTop: `1px solid ${faint}`, pt: 1, display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1 }}><MetaPair locale={locale} title={l(locale,'last command','آخرین فرمان')} value="09:41:08" /><MetaPair locale={locale} title={l(locale,'latency','تأخیر')} value="86 ms" /><MetaPair locale={locale} title={l(locale,'transport','انتقال')} value={transport} /></Box>
  </Box>;

  return <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: p.compact ? 'stretch' : 'center' }}>
    <Box component="button" onClick={press} sx={{ appearance:'none', border:`1px solid ${state==='sent'?ink:graphite}`, bgcolor:state==='sent'?ink:'#fff', color:state==='sent'?'#fff':ink, minWidth:p.compact?'100%':150, height:44, px:2.2, font: 'inherit', fontSize:12, fontWeight:760, letterSpacing:locale==='fa'?0:'.06em', cursor:'pointer', borderRadius:0, transition:'.15s ease' }}>{state==='sent'?l(locale,'SENT ✓','ارسال شد ✓'):l(locale,'SEND COMMAND','ارسال فرمان')}</Box>
    <Typography sx={{ mt:.8,fontSize:9.5,color:muted }}>{state==='sent'?l(locale,'mock acknowledgement received','تأیید آزمایشی دریافت شد'):l(locale,'ready · no pending action','آماده · فرمان معوق ندارد')}</Typography>
  </Box>;
}

function SwitchControl({ def, locale, size }: Props) {
  const p=profile(size); const [on,setOn]=useState(Boolean(def.mock.value));
  const locked=def.id==='door-lock'; const siren=def.id==='siren';
  const onText=locked?l(locale,'LOCKED','قفل'):siren?l(locale,'ACTIVE','فعال'):l(locale,'ON','روشن');
  const offText=locked?l(locale,'UNLOCKED','باز'):siren?l(locale,'STANDBY','آماده'):l(locale,'OFF','خاموش');
  const segments = on ? [ink, ink, ink, ink, graphite, ink] : [muted, faint, muted, faint, muted, faint];
  const toggle = <Box component="button" aria-pressed={on} onClick={()=>setOn(v=>!v)} sx={{appearance:'none',width:p.compact?52:p.large?82:68,height:p.compact?30:p.large?42:36,border:'none',borderBottom:`2px solid ${ink}`,bgcolor:'transparent',position:'relative',cursor:'pointer',p:0,borderRadius:0}}><Box sx={{position:'absolute',width:p.compact?18:p.large?26:22,height:p.compact?18:p.large?26:22,bgcolor:on?ink:'#fff',border:`1px solid ${ink}`,left:on?(p.compact?32:p.large?55:45):1,top:p.compact?4:p.large?6:5,transition:'left .18s ease'}}/></Box>;

  if (p.large) return <Box sx={{height:'100%',display:'grid',gridTemplateRows:'auto 1fr auto',gap:1.2,direction:locale==='fa'?'rtl':'ltr'}}>
    <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'end',gap:1}}><Box><Eyebrow locale={locale} dim>{l(locale,'output state','وضعیت خروجی')}</Eyebrow><Typography sx={{mt:.45,fontSize:44,fontWeight:470,lineHeight:1.12,letterSpacing:locale==='fa'?0:'-.055em'}}>{on?onText:offText}</Typography></Box>{toggle}</Box>
    <Box sx={{minHeight:0,display:'flex',flexDirection:'column',justifyContent:'center'}}><Box sx={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}><Eyebrow locale={locale} dim>{l(locale,'recent state','وضعیت اخیر')}</Eyebrow><Typography sx={{fontSize:9,color:muted}}>{l(locale,'click switch to change state','برای تغییر روی کلید کلیک کنید')}</Typography></Box><Box sx={{mt:1,display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:.5}}>{segments.map((c,i)=><Box key={i} sx={{height:15,bgcolor:c}}/>)}</Box></Box>
    <Box sx={{borderTop:`1px solid ${faint}`,pt:1,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1}}><MetaPair locale={locale} title={l(locale,'mode','حالت')} value="LOCAL" /><MetaPair locale={locale} title={l(locale,'changed','تغییر')} value="09:42" /><MetaPair locale={locale} title={l(locale,'source','منبع')} value="UI" /></Box>
  </Box>;

  return <Box sx={{height:'100%',display:'flex',flexDirection:'column',justifyContent:'center'}}>
    <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:1}}><Box><Eyebrow locale={locale} dim>{l(locale,'output state','وضعیت خروجی')}</Eyebrow><Typography sx={{mt:.35,fontSize:p.compact?27:36,fontWeight:480,lineHeight:1.12,letterSpacing:'-.04em'}}>{on?onText:offText}</Typography></Box>{toggle}</Box>
    <Box sx={{mt:1.3}}><MonoRule /></Box><Typography sx={{mt:.7,fontSize:9.5,color:muted}}>{l(locale,'click switch to change mock state','برای تغییر وضعیت روی کلید کلیک کنید')}</Typography>
  </Box>;
}

function SliderControl({ def, locale, size }: Props) {
  const p=profile(size); const [value,setValue]=useState(n(def.mock.value,65)); const unit=s(def.mock.unit,'%');
  const history=[clamp(value-18,0,100),clamp(value-11,0,100),clamp(value-14,0,100),clamp(value-6,0,100),clamp(value-9,0,100),clamp(value-3,0,100),value];
  const control=<><Box sx={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}><Typography sx={{fontSize:p.compact?28:p.large?44:36,fontWeight:480,lineHeight:1.12,letterSpacing:'-.045em'}}>{value}<Box component="span" sx={{fontSize:11,ml:.4,color:graphite,fontWeight:650}}>{unit}</Box></Typography><Typography sx={{fontSize:9.5,color:muted}}>0 — 100</Typography></Box><Box sx={{position:'relative',mt:1.5,height:24}}><Box sx={{position:'absolute',left:0,right:0,top:11,height:'1px',bgcolor:faint}}/><Box sx={{position:'absolute',left:0,top:10,height:3,width:`${value}%`,bgcolor:ink}}/><input aria-label="value" type="range" min={0} max={100} value={value} onChange={(e: ChangeEvent<HTMLInputElement>)=>setValue(Number(e.target.value))} style={{position:'absolute',inset:0,width:'100%',height:'24px',opacity:0,cursor:'pointer',margin:0}}/><Box sx={{position:'absolute',left:`${value}%`,top:5,width:13,height:13,bgcolor:'#fff',border:`2px solid ${ink}`,transform:'translateX(-50%)',pointerEvents:'none'}}/></Box><Box sx={{display:'flex',justifyContent:'space-between'}}><Eyebrow locale={locale} dim>{l(locale,'minimum','کمینه')}</Eyebrow><Eyebrow locale={locale} dim>{l(locale,'target','هدف')}</Eyebrow><Eyebrow locale={locale} dim>{l(locale,'maximum','بیشینه')}</Eyebrow></Box></>;

  if (p.large) return <Box sx={{height:'100%',display:'grid',gridTemplateRows:'auto 1fr auto',gap:1.2,direction:'ltr'}}><Box>{control}</Box><Box sx={{minHeight:0,display:'grid',gridTemplateRows:'auto 1fr',gap:.5,pt:.4}}><Eyebrow locale={locale} dim>{l(locale,'setpoint history','تاریخچه نقطه تنظیم')}</Eyebrow><Box sx={{minHeight:0}}><MonoSpark values={history} height="100%" dots /></Box></Box><Box sx={{borderTop:`1px solid ${faint}`,pt:1,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1}}><MetaPair locale={locale} title={l(locale,'output','خروجی')} value={`${value}${unit}`} /><MetaPair locale={locale} title={l(locale,'updated','به‌روزرسانی')} value="now" /><MetaPair locale={locale} title={l(locale,'source','منبع')} value="LOCAL" /></Box></Box>;

  return <Box sx={{height:'100%',display:'flex',flexDirection:'column',justifyContent:'center',direction:'ltr'}}>{control}</Box>;
}

function InputControl({ def, locale, size }: Props) {
  const p=profile(size); const [value,setValue]=useState(String(def.mock.value ?? '22.5')); const unit=s(def.mock.unit);
  const numeric=Number(value); const pct=Number.isFinite(numeric)?clamp(((numeric-16)/14)*100,0,100):0;
  const input=<><Eyebrow locale={locale} dim>{l(locale,'target value','مقدار هدف')}</Eyebrow><Box sx={{display:'flex',alignItems:'end',gap:.8,mt:.6,borderBottom:`1px solid ${ink}`,pb:.45}}><input aria-label="target value" value={value} onChange={(e: ChangeEvent<HTMLInputElement>)=>setValue(e.target.value)} style={{font:'inherit',fontSize:p.large?'38px':'27px',fontWeight:480,letterSpacing:'-.04em',color:ink,border:0,outline:0,background:'transparent',width:'100%',minWidth:0,padding:0,fontVariantNumeric:'tabular-nums'}}/><Typography sx={{fontSize:11,color:graphite,fontWeight:650,paddingBottom:'.2rem'}}>{unit}</Typography></Box><Typography sx={{mt:.75,fontSize:9.5,color:muted}}>{l(locale,'editable mock input','ورودی آزمایشی قابل ویرایش')}</Typography></>;

  if (p.large) return <Box sx={{height:'100%',display:'grid',gridTemplateRows:'auto 1fr auto',gap:1.2,direction:'ltr'}}><Box>{input}</Box><Box sx={{minHeight:0,display:'flex',flexDirection:'column',justifyContent:'center'}}><Box sx={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}><Eyebrow locale={locale} dim>{l(locale,'allowed range','بازه مجاز')}</Eyebrow><Typography sx={{fontSize:9,color:muted}}>16 — 30 {unit}</Typography></Box><Box sx={{mt:1}}><TickScale pct={pct} /></Box><Box sx={{mt:1.1,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:.7}}>{['21.5','22.0','22.5'].map((v,i)=><Box key={v} sx={{borderTop:`${i===2?2:1}px solid ${i===2?ink:faint}`,pt:.55}}><Typography sx={{fontSize:9,color:muted}}>T−{(2-i)*5}m</Typography><Typography sx={{mt:.15,fontSize:12,fontWeight:680,color:i===2?ink:graphite}}>{v}{unit}</Typography></Box>)}</Box></Box><Box sx={{borderTop:`1px solid ${faint}`,pt:1,display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:1}}><MetaPair locale={locale} title={l(locale,'allowed range','بازه مجاز')} value="16 — 30"/><MetaPair locale={locale} title={l(locale,'step','گام')} value="0.5"/></Box></Box>;

  return <Box sx={{height:'100%',display:'flex',flexDirection:'column',justifyContent:'center',direction:'ltr'}}>{input}</Box>;
}

function Thermostat({ def, locale, size }: Props) {
  const p=profile(size); const [target,setTarget]=useState(n(def.mock.value,22));
  const dialSize=p.compact?94:p.large?166:108;
  const dial=<Box sx={{width:dialSize,height:dialSize,border:`1px solid ${ink}`,borderRadius:'50%',display:'grid',placeItems:'center',position:'relative',flex:'0 0 auto'}}><Typography sx={{fontSize:p.compact?26:p.large?42:29,fontWeight:470,letterSpacing:'-.05em'}}>{target}°</Typography><Box sx={{position:'absolute',top:4,left:'50%',width:'1px',height:p.large?12:8,bgcolor:ink}}/><Box sx={{position:'absolute',bottom:4,left:'50%',width:'1px',height:p.large?12:8,bgcolor:ink}}/><Box sx={{position:'absolute',left:8,right:8,bottom:p.large?29:20,height:'2px',bgcolor:ink}}/></Box>;

  if (p.compact) return <Box sx={{height:'100%',display:'grid',placeItems:'center',direction:'ltr'}}>{dial}</Box>;

  if (p.large) return <Box sx={{height:'100%',display:'grid',gridTemplateRows:'1fr auto',gap:1.2,direction:'ltr'}}><Box sx={{minHeight:0,display:'grid',gridTemplateColumns:'auto 1fr',gap:1.8,alignItems:'center'}}>{dial}<Box><Eyebrow locale={locale} dim>{l(locale,'setpoint','نقطه تنظیم')}</Eyebrow><Typography sx={{mt:.45,fontSize:14,color:graphite}}>21.6°C {l(locale,'measured','اندازه‌گیری')}</Typography><Typography sx={{mt:.7,fontSize:10,color:target>21.6?warning:good,fontWeight:760}}>{target>21.6?'+':''}{(target-21.6).toFixed(1)}° {l(locale,'offset','اختلاف')}</Typography><Box sx={{mt:1.4,display:'flex',gap:.7}}>{[-1,1].map(delta=><Box key={delta} component="button" onClick={()=>setTarget(v=>clamp(v+delta,16,30))} sx={{appearance:'none',width:46,height:36,border:`1px solid ${ink}`,bgcolor:'#fff',color:ink,borderRadius:0,cursor:'pointer',fontSize:20,lineHeight:1}}>{delta<0?'−':'+'}</Box>)}</Box><Box sx={{mt:1.3}}><TickScale pct={((target-16)/14)*100} labels={false}/></Box></Box></Box><Box sx={{borderTop:`1px solid ${faint}`,pt:1,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1}}><MetaPair locale={locale} title={l(locale,'measured','اندازه‌گیری')} value="21.6 °C" /><MetaPair locale={locale} title={l(locale,'mode','حالت')} value="HEAT · AUTO" /><MetaPair locale={locale} title={l(locale,'range','بازه')} value="16 — 30 °C" /></Box></Box>;

  return <Box sx={{height:'100%',display:'grid',gridTemplateColumns:'auto 1fr',gap:1.3,alignItems:'center',direction:'ltr'}}>{dial}<Box><Eyebrow locale={locale} dim>{l(locale,'setpoint','نقطه تنظیم')}</Eyebrow><Typography sx={{mt:.4,fontSize:11,color:graphite}}>21.6°C {l(locale,'measured','اندازه‌گیری')}</Typography><Box sx={{mt:1.2,display:'flex',gap:.5}}>{[-1,1].map(delta=><Box key={delta} component="button" onClick={()=>setTarget(v=>clamp(v+delta,16,30))} sx={{appearance:'none',width:38,height:30,border:`1px solid ${ink}`,bgcolor:'#fff',color:ink,borderRadius:0,cursor:'pointer',fontSize:18,lineHeight:1}}>{delta<0?'−':'+'}</Box>)}</Box></Box></Box>;
}

function ColorControl({ locale, size }: Props) {
  const p=profile(size); const hues=['#ef4444','#f59e0b','#22c55e','#06b6d4','#6366f1','#d946ef']; const [color,setColor]=useState(hues[3]); const [brightness,setBrightness]=useState(72);
  return <Box sx={{height:'100%',display:'flex',flexDirection:'column',justifyContent:p.large?'space-between':'center',direction:'ltr'}}>
    <Box><Box sx={{height:p.large?68:25,border:`1px solid ${ink}`,boxSizing:'border-box',background:`linear-gradient(90deg,#fff,${color})`,position:'relative'}}><Box sx={{position:'absolute',left:`${brightness}%`,top:0,bottom:0,width:2,bgcolor:ink,transform:'translateX(-1px)'}}/></Box><Box sx={{mt:p.large?1.5:1.15,display:'flex',justifyContent:'space-between',gap:.7}}>{hues.map(c=><Box key={c} onClick={()=>setColor(c)} sx={{width:p.compact?18:p.large?28:22,height:p.compact?18:p.large?28:22,bgcolor:c,border:`${c===color?2:1}px solid ${c===color?ink:'#fff'}`,outline:`1px solid ${c===color?ink:faint}`,boxSizing:'border-box',cursor:'pointer'}}/>)}</Box><Box sx={{position:'relative',mt:p.large?1.6:1.25,height:20}}><Box sx={{position:'absolute',left:0,right:0,top:9,height:'1px',bgcolor:faint}}/><Box sx={{position:'absolute',left:0,top:8,width:`${brightness}%`,height:3,bgcolor:ink}}/><input type="range" aria-label="brightness" min={0} max={100} value={brightness} onChange={(e: ChangeEvent<HTMLInputElement>)=>setBrightness(Number(e.target.value))} style={{position:'absolute',inset:0,opacity:0,width:'100%',margin:0,cursor:'pointer'}}/><Box sx={{position:'absolute',left:`${brightness}%`,top:5,width:10,height:10,bgcolor:'#fff',border:`1px solid ${ink}`,transform:'translateX(-50%)'}}/></Box><Box sx={{display:'flex',justifyContent:'space-between'}}><Eyebrow locale={locale} dim>{l(locale,'brightness','روشنایی')}</Eyebrow><Typography sx={{fontSize:9.5,color:graphite}}>{brightness}%</Typography></Box></Box>
    {p.large&&<Box sx={{borderTop:`1px solid ${faint}`,pt:1,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1}}><MetaPair locale={locale} title={l(locale,'color','رنگ')} value={color.toUpperCase()} /><MetaPair locale={locale} title={l(locale,'brightness','روشنایی')} value={`${brightness}%`} /><MetaPair locale={locale} title={l(locale,'mode','حالت')} value="LOCAL" /></Box>}
  </Box>;
}

function DirectionControl({ locale, size }: Props) {
  const p=profile(size); const [active,setActive]=useState('•'); const keys=[['↑',2],['←',4],['•',5],['→',6],['↓',8]] as const;

  // A shallow 2x1 card cannot comfortably hold a full-size D-pad plus a footer.
  // Keep the semantic cross, but make the secondary context a side rail instead.
  if (p.wide && !p.large) {
    const cellW=32; const cellH=27;
    return <Box sx={{height:'100%',minHeight:0,display:'grid',gridTemplateColumns:'auto minmax(0,1fr)',gap:1.8,alignItems:'center',direction:'ltr'}}>
      <Box sx={{display:'grid',gridTemplateColumns:`repeat(3,${cellW}px)`,gridTemplateRows:`repeat(3,${cellH}px)`,gap:3}}>{keys.map(([k,pos])=><Box key={k} component="button" onClick={()=>setActive(k)} sx={{appearance:'none',gridColumn:((pos-1)%3)+1,gridRow:Math.floor((pos-1)/3)+1,border:`1px solid ${active===k?ink:faint}`,bgcolor:active===k?ink:'#fff',color:active===k?'#fff':ink,borderRadius:0,cursor:'pointer',fontSize:k==='•'?11:15,p:0}}>{k}</Box>)}</Box>
      <Box sx={{minWidth:0,borderLeft:`1px solid ${faint}`,pl:1.5}}><Eyebrow locale={locale} dim>{l(locale,'last command','آخرین فرمان')}</Eyebrow><Typography sx={{mt:.35,fontSize:26,lineHeight:1.12,fontWeight:520,color:ink}}>{active}</Typography><Typography sx={{mt:.65,fontSize:9.5,lineHeight:1.35,color:muted}}>{l(locale,'local directional step · 1×','گام جهت محلی · ۱×')}</Typography></Box>
    </Box>;
  }

  const cellW=p.large?58:36; const cellH=p.large?50:31;
  return <Box sx={{height:'100%',display:'grid',gridTemplateRows:'1fr auto',gap:p.large?1.2:.7,placeItems:'center',direction:'ltr'}}><Box sx={{display:'grid',gridTemplateColumns:`repeat(3,${cellW}px)`,gridTemplateRows:`repeat(3,${cellH}px)`,gap:p.large?4:3,alignSelf:'center'}}>{keys.map(([k,pos])=><Box key={k} component="button" onClick={()=>setActive(k)} sx={{appearance:'none',gridColumn:((pos-1)%3)+1,gridRow:Math.floor((pos-1)/3)+1,border:`1px solid ${active===k?ink:faint}`,bgcolor:active===k?ink:'#fff',color:active===k?'#fff':ink,borderRadius:0,cursor:'pointer',fontSize:k==='•'?12:p.large?20:17,p:0}}>{k}</Box>)}</Box>{p.large?<Box sx={{width:'100%',borderTop:`1px solid ${faint}`,pt:1,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1}}><MetaPair locale={locale} title={l(locale,'last command','آخرین فرمان')} value={active} /><MetaPair locale={locale} title={l(locale,'mode','حالت')} value="LOCAL" /><MetaPair locale={locale} title={l(locale,'step','گام')} value="1×" /></Box>:<Typography sx={{fontSize:9.5,lineHeight:1.12,color:muted,maxWidth:'100%',whiteSpace:'nowrap'}}>{l(locale,'last command','آخرین فرمان')}: <Box component="span" sx={{color:ink,fontWeight:800}}>{active}</Box></Typography>}</Box>;
}

function TableVisual({ locale, mode, size }: Props & { mode: TableMode }) {
  const p=profile(size);
  const rows = mode==='alarms'
    ? [['Fire sensor','Critical','09:42'],['Door open','Warning','09:17'],['Battery low','Info','08:51']]
    : mode==='logs'
      ? [['gateway-01','connected','09:44:21'],['pump-04','rpc ack','09:43:12'],['sensor-18','telemetry','09:42:08']]
      : mode==='events'
        ? [['Valve','Opened','09:41'],['Pump','Started','09:34'],['Mode','Auto','09:12']]
        : mode==='measurement-list'
          ? [['24.8 °C','09:44'],['24.6 °C','09:39'],['24.7 °C','09:34'],['24.4 °C','09:29']]
          : [['GW-01','Online','24.8 °C'],['Pump-04','Online','68%'],['Node-18','Sleep','3.8 V'],['Valve-02','Alert','Open']];
  const heads = mode==='measurement-list' ? [l(locale,'value','مقدار'),l(locale,'time','زمان')] : mode==='alarms' ? [l(locale,'source','منبع'),l(locale,'severity','شدت'),l(locale,'time','زمان')] : mode==='logs' ? [l(locale,'node','گره'),l(locale,'message','پیام'),l(locale,'time','زمان')] : mode==='events' ? [l(locale,'asset','تجهیز'),l(locale,'event','رویداد'),l(locale,'time','زمان')] : [l(locale,'device','دستگاه'),l(locale,'state','وضعیت'),l(locale,'value','مقدار')];
  const tone=(cell:string)=>cell==='Critical'||cell==='Alert'?danger:cell==='Warning'?warning:cell==='Online'||cell==='Opened'||cell==='Started'||cell==='connected'?good:graphite;
  return <Box sx={{height:'100%',display:'flex',flexDirection:'column',overflow:'hidden',direction:'ltr'}}>
    <Box sx={{display:'grid',gridTemplateColumns:`repeat(${heads.length},minmax(0,1fr))`,borderTop:`1px solid ${ink}`,borderBottom:`1px solid ${ink}`,py:.55}}>{heads.map((h,i)=><Typography key={h} sx={{fontSize:8.5,color:muted,fontWeight:800,letterSpacing:'.07em',textTransform:locale==='fa'?'none':'uppercase',textAlign:i===heads.length-1?'right':'left'}}>{h}</Typography>)}</Box>
    <Box sx={{flex:1,minHeight:0,display:'grid',gridTemplateRows:p.large?`repeat(${rows.length},minmax(0,1fr))`:'auto'}}>{rows.map((row,i)=><Box key={i} sx={{display:'grid',gridTemplateColumns:`repeat(${row.length},minmax(0,1fr))`,alignItems:'center',minHeight:p.large?0:29,py:p.large?.45:0,borderBottom:`1px solid ${faint}`,bgcolor:mode==='alarms'&&i===0?'#fbf1f0':'transparent'}}>{row.map((cell,j)=><Typography key={j} sx={{fontSize:p.large?12:10.5,fontWeight:j===0?700:550,color:j===1?tone(cell):j===0?ink:graphite,textAlign:j===row.length-1?'right':'left',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontVariantNumeric:'tabular-nums',pr:j===0?.5:0}}>{cell}</Typography>)}</Box>)}</Box>
    {p.large&&<Box sx={{pt:.8,display:'grid',gridTemplateColumns:'1fr auto 1fr',alignItems:'end',gap:1}}><Box><Eyebrow locale={locale} dim>{l(locale,`${rows.length} visible rows`,`${rows.length} ردیف`)}</Eyebrow><Typography sx={{mt:.25,fontSize:10.5,fontWeight:700,color:ink}}>{mode==='alarms'?l(locale,'1 needs action','۱ مورد نیازمند اقدام'):mode==='logs'?l(locale,'stream healthy','جریان سالم'):l(locale,'live dataset','داده زنده')}</Typography></Box><Box sx={{height:'22px',width:'1px',bgcolor:faint}}/><Box sx={{textAlign:'right'}}><Eyebrow locale={locale} dim>{l(locale,'updated','به‌روزرسانی')}</Eyebrow><Typography sx={{mt:.25,fontSize:10.5,fontWeight:700,color:ink,fontVariantNumeric:'tabular-nums'}}>09:44:21</Typography></Box></Box>}
  </Box>;
}

function Clock({ locale, size }: Props) {
  const p=profile(size);
  if(p.large) return <Box sx={{height:'100%',display:'grid',gridTemplateRows:'1fr auto',gap:1.2,direction:'ltr'}}><Box sx={{display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',textAlign:'center'}}><Eyebrow locale={locale} dim>{l(locale,'site time','زمان سایت')}</Eyebrow><Typography sx={{mt:.5,fontSize:76,fontWeight:330,lineHeight:1.12,letterSpacing:'-.075em',fontVariantNumeric:'tabular-nums'}}>09:44</Typography><Typography sx={{mt:.65,fontSize:13,color:graphite,fontVariantNumeric:'tabular-nums'}}>21 sec</Typography><Box sx={{mt:1.15,width:108,height:'2px',bgcolor:ink}}/><Typography sx={{mt:.85,fontSize:12,color:graphite}}>{locale==='fa'?'چهارشنبه، ۱۵ مهر ۱۴۰۵':'Wednesday · 07 Oct 2026'}</Typography></Box><Box sx={{borderTop:`1px solid ${faint}`,pt:.9,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1}}><MetaPair locale={locale} title="UTC" value="+03:30"/><MetaPair locale={locale} title={l(locale,'sync','همگام‌سازی')} value="NTP · OK"/><MetaPair locale={locale} title={l(locale,'drift','انحراف')} value="+4 ms"/></Box></Box>;
  return <Box sx={{height:'100%',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:p.compact?'flex-start':'center',textAlign:p.compact?'left':'center',direction:'ltr'}}><Typography sx={{fontSize:p.compact?37:48,fontWeight:350,lineHeight:1.12,letterSpacing:'-.065em',fontVariantNumeric:'tabular-nums'}}>09:44</Typography><Box sx={{mt:1,width:p.compact?42:62,height:'2px',bgcolor:ink}}/><Typography sx={{mt:.8,fontSize:10,color:graphite}}>{locale==='fa'?'چهارشنبه، ۱۵ مهر ۱۴۰۵':'Wednesday · 07 Oct 2026'}</Typography></Box>;
}

function TextVisual({ locale, size }: Props) {
  const p=profile(size);
  if(p.large) return <Box sx={{height:'100%',display:'grid',gridTemplateRows:'auto 1fr auto',gap:1.2,direction:locale==='fa'?'rtl':'ltr',textAlign:locale==='fa'?'right':'left'}}><Box><Eyebrow locale={locale} dim>{l(locale,'operator note','یادداشت اپراتور')}</Eyebrow><Typography sx={{mt:.5,fontSize:27,fontWeight:610,lineHeight:1.08,letterSpacing:locale==='fa'?0:'-.03em'}}>{locale==='fa'?'وضعیت اتاق سرور':'Server room status'}</Typography><Box sx={{mt:1,width:62,height:'2px',bgcolor:ink,ml:locale==='fa'?'auto':0}}/></Box><Typography sx={{alignSelf:'center',fontSize:14,color:graphite,lineHeight:1.9,maxWidth:'88%'}}>{locale==='fa'?'همه سنسورها در محدوده عادی هستند. آخرین بسته داده کمتر از یک دقیقه قبل دریافت شده است. هیچ هشدار تأییدنشده‌ای در صف وجود ندارد.':'All sensors are within their normal ranges. Latest telemetry was received less than a minute ago. No unacknowledged alerts are waiting in the queue.'}</Typography><Box sx={{borderTop:`1px solid ${faint}`,pt:.9,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:1}}><MetaPair locale={locale} title={l(locale,'reviewed','بازبینی')} value="09:44"/><MetaPair locale={locale} title={l(locale,'source','منبع')} value="ROOM-02"/><MetaPair locale={locale} title={l(locale,'status','وضعیت')} value={l(locale,'NORMAL','عادی')}/></Box></Box>;
  return <Box sx={{height:'100%',display:'flex',flexDirection:'column',justifyContent:p.compact?'center':'flex-start',direction:locale==='fa'?'rtl':'ltr',textAlign:locale==='fa'?'right':'left'}}><Typography sx={{fontSize:p.compact?17:20,fontWeight:620,lineHeight:1.12,letterSpacing:locale==='fa'?0:'-.02em'}}>{locale==='fa'?'وضعیت اتاق سرور':'Server room status'}</Typography><Box sx={{mt:1,width:54,height:'2px',bgcolor:ink,alignSelf:locale==='fa'?'flex-end':'flex-start'}}/><Typography sx={{mt:1,fontSize:11.5,color:graphite,lineHeight:1.65}}>{locale==='fa'?'همه سنسورها در محدوده عادی هستند. آخرین بسته داده کمتر از یک دقیقه قبل دریافت شده است.':'All sensors are within their normal ranges. Latest telemetry was received less than a minute ago.'}</Typography></Box>;
}

function ImageVisual({ locale, size }: Props) {
  const p=profile(size);
  return <Box sx={{height:'100%',minHeight:0,position:'relative',overflow:'hidden',boxSizing:'border-box',bgcolor:'#111318',backgroundImage:'radial-gradient(circle at 72% 26%,rgba(255,255,255,.16),transparent 20%),linear-gradient(140deg,#111318,#30343a)'}}><Box sx={{position:'absolute',inset:p.large?18:11,border:'1px solid rgba(255,255,255,.22)'}}/><Box sx={{position:'absolute',left:p.large?24:17,top:p.large?24:17,display:'flex',alignItems:'center',gap:.6}}><Box sx={{width:6,height:6,bgcolor:'#fff'}}/><Typography sx={{fontSize:9,color:'#fff',fontWeight:800,letterSpacing:'.12em'}}>LIVE</Typography></Box><svg viewBox="0 0 520 220" width="100%" height="100%" preserveAspectRatio="none" aria-hidden style={{ display: 'block' }}><path d="M70 180 L70 125 Q260 72 450 125 L450 180" fill="none" stroke="rgba(255,255,255,.48)" strokeWidth="1.2" vectorEffect="non-scaling-stroke"/><line x1="260" y1="104" x2="260" y2="118" stroke="rgba(255,255,255,.5)"/><line x1="253" y1="111" x2="267" y2="111" stroke="rgba(255,255,255,.5)"/></svg><Box sx={{position:'absolute',left:p.large?24:17,right:p.large?24:17,bottom:p.large?23:16,display:'flex',justifyContent:'space-between'}}><Typography sx={{fontSize:9,color:'#fff'}}>CAM-02 · 09:44:12</Typography><Typography sx={{fontSize:9,color:'rgba(255,255,255,.7)'}}>{l(locale,'1080p','1080p')}</Typography></Box></Box>;
}

function IframeVisual({ locale, size }: Props) {
  const p=profile(size);
  return <Box sx={{height:'100%',display:'grid',placeItems:'center',border:`1px solid ${faint}`,boxSizing:'border-box',backgroundImage:`linear-gradient(${faint} 1px,transparent 1px),linear-gradient(90deg,${faint} 1px,transparent 1px)`,backgroundSize:'24px 24px',textAlign:'center',px:2}}><Box sx={{bgcolor:'#fff',px:1.5,py:1}}><Typography sx={{fontSize:p.large?16:13,fontWeight:700}}>{l(locale,'External content','محتوای خارجی')}</Typography><Typography sx={{mt:.35,fontSize:9.5,color:muted}}>IFRAME · HTML · EMBED</Typography>{p.large&&<Typography sx={{mt:.8,fontSize:10,color:graphite}}>https://device-panel.local/</Typography>}</Box></Box>;
}

function Scada({ locale, size }: Props) {
  const p=profile(size);
  return <Box sx={{height:'100%',display:'grid',gridTemplateRows:'1fr auto',gap:.7,direction:'ltr'}}><Box sx={{minHeight:0,position:'relative'}}><svg viewBox="0 0 620 250" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-hidden style={{ display: 'block' }}>
    <rect x="18" y="58" width="122" height="128" fill="#fff" stroke={ink} strokeWidth="2"/><rect x="23" y="110" width="112" height="71" fill={ink}/><text x="79" y="90" textAnchor="middle" fill={ink} fontSize="13" fontWeight="700">TANK 01</text><text x="79" y="147" textAnchor="middle" fill="#fff" fontSize="25" fontWeight="700">63%</text>
    <line x1="140" y1="123" x2="250" y2="123" stroke={ink} strokeWidth="5"/><circle cx="292" cy="123" r="34" fill="#fff" stroke={ink} strokeWidth="2"/><circle cx="292" cy="123" r="7" fill={ink}/><text x="292" y="176" textAnchor="middle" fill={graphite} fontSize="11" fontWeight="700">PUMP · RUN</text>
    <line x1="326" y1="123" x2="445" y2="123" stroke={ink} strokeWidth="5"/><path d="M445 96 L480 123 L445 150 Z M515 96 L480 123 L515 150 Z" fill="#fff" stroke={ink} strokeWidth="2"/><line x1="515" y1="123" x2="598" y2="123" stroke={ink} strokeWidth="5"/><text x="480" y="176" textAnchor="middle" fill={graphite} fontSize="11" fontWeight="700">V-02 · OPEN</text>
    <circle cx="199" cy="123" r="5" fill="#fff" stroke={ink} strokeWidth="2"/><circle cx="390" cy="123" r="5" fill="#fff" stroke={ink} strokeWidth="2"/>
  </svg></Box><Box sx={{display:'grid',gridTemplateColumns:p.large?'repeat(4,1fr)':'repeat(3,1fr)',gap:1,borderTop:`1px solid ${ink}`,pt:.65}}><MetaPair locale={locale} title={l(locale,'tank','مخزن')} value="63%"/><MetaPair locale={locale} title={l(locale,'pump','پمپ')} value="RUN"/><MetaPair locale={locale} title={l(locale,'valve','شیر')} value="OPEN"/>{p.large&&<MetaPair locale={locale} title={l(locale,'flow','دبی')} value="18.4 L/min"/>}</Box></Box>;
}

export function MinimalVisualRenderer(props: Props) {
  const v=props.def.visual;
  if(v==='metric') return <Metric {...props}/>;
  if(v==='battery') return <Battery {...props}/>;
  if(v==='signal') return <Signal {...props}/>;
  if(v==='tank') return <Tank {...props}/>;
  if(v==='boolean') return <BooleanStatus {...props}/>;
  if(v==='alarm-indicator') return <Alarm {...props}/>;
  if(v==='gauge') return <Gauge {...props}/>;
  if(v==='line'||v==='area') return <LineChart {...props}/>;
  if(v==='bar') return <BarChart {...props}/>;
  if(v==='histogram') return <Histogram {...props}/>;
  if(v==='donut') return <Donut {...props}/>;
  if(v==='heatmap') return <Heatmap {...props}/>;
  if(v==='timeline') return <Timeline {...props}/>;
  if(v==='map'||v==='route') return <MapVisual {...props}/>;
  if(v==='coordinates') return <Coordinates {...props}/>;
  if(v==='compass') return <Compass {...props}/>;
  if(v==='button') return <ButtonControl {...props}/>;
  if(v==='switch') return <SwitchControl {...props}/>;
  if(v==='slider') return <SliderControl {...props}/>;
  if(v==='input') return <InputControl {...props}/>;
  if(v==='thermostat') return <Thermostat {...props}/>;
  if(v==='color') return <ColorControl {...props}/>;
  if(v==='direction') return <DirectionControl {...props}/>;
  if(v==='table'||v==='measurement-list'||v==='alarms'||v==='events'||v==='logs') return <TableVisual {...props} mode={v}/>;
  if(v==='clock') return <Clock {...props}/>;
  if(v==='text') return <TextVisual {...props}/>;
  if(v==='image') return <ImageVisual {...props}/>;
  if(v==='iframe') return <IframeVisual {...props}/>;
  if(v==='scada') return <Scada {...props}/>;
  return <Box sx={{height:'100%',display:'grid',placeItems:'center'}}><Typography sx={{fontSize:11,color:muted}}>No visual</Typography></Box>;
}
