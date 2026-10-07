import { useMemo, useState } from 'react';
import { Box, Button, Slider, Switch, TextField, Typography } from '@mui/material';
import type { Locale, WidgetDefinition, WidgetSize, WidgetThemeTokens } from '../core/types';
import { bars, heat, spark } from '../data/mockData';

interface Props {
  def: WidgetDefinition;
  theme: WidgetThemeTokens;
  locale: Locale;
  size: WidgetSize;
}

type Profile = ReturnType<typeof profile>;

const n = (value: unknown, fallback = 0) => typeof value === 'number' ? value : fallback;
const s = (value: unknown, fallback = '') => typeof value === 'string' ? value : fallback;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function profile(size: WidgetSize) {
  const [w, h] = size.split('x').map(Number);
  const area = w * h;
  return {
    w,
    h,
    area,
    compact: area === 1,
    wide: w > h,
    tall: h > w,
    large: area >= 4,
    veryWide: w >= 3,
    showDetails: area >= 4 || w >= 3 || h >= 2,
  };
}

function label(locale: Locale, en: string, fa: string) {
  return locale === 'fa' ? fa : en;
}

function ToneBadge({ text, tone = 'accent', theme }: { text: string; tone?: 'accent' | 'success' | 'warning' | 'danger' | 'neutral'; theme: WidgetThemeTokens }) {
  const color = tone === 'success' ? '#16a34a' : tone === 'warning' ? '#d97706' : tone === 'danger' ? '#dc2626' : tone === 'neutral' ? theme.muted : theme.accent;
  return <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: .55, px: .9, py: .45, borderRadius: 1.5, bgcolor: `${color}10`, border: `1px solid ${color}20`, color }}>
    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: color }} />
    <Typography sx={{ fontSize: 10.5, fontWeight: 800, lineHeight: 1 }}>{text}</Typography>
  </Box>;
}

function StatBox({ label: title, value, theme, accent = false }: { label: string; value: string; theme: WidgetThemeTokens; accent?: boolean }) {
  return <Box sx={{ minWidth: 0, p: .95, borderRadius: 1.5, bgcolor: accent ? `${theme.accent}0c` : '#f8fafc', border: `1px solid ${accent ? `${theme.accent}20` : theme.border}` }}>
    <Typography sx={{ fontSize: 9.5, color: theme.muted, textTransform: 'uppercase', letterSpacing: .35 }}>{title}</Typography>
    <Typography sx={{ mt: .2, fontSize: 12.5, fontWeight: 800, color: accent ? theme.accent : theme.foreground, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</Typography>
  </Box>;
}

function Progress({ value, max = 100, theme, tone }: { value: number; max?: number; theme: WidgetThemeTokens; tone?: string }) {
  const pct = clamp((value / Math.max(1, max)) * 100, 0, 100);
  const color = tone ?? theme.accent;
  return <Box sx={{ height: 7, borderRadius: 1, bgcolor: '#edf0f5', overflow: 'hidden' }}>
    <Box sx={{ width: `${pct}%`, height: '100%', borderRadius: 1, bgcolor: color, transition: 'width .2s ease' }} />
  </Box>;
}

function ChartSvg({ values = spark, color, fill = false, minHeight = 60 }: { values?: number[]; color: string; fill?: boolean; minHeight?: number }) {
  const points = useMemo(() => {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(1, max - min);
    return values.map((v, i) => `${(i / Math.max(1, values.length - 1)) * 100},${36 - ((v - min) / range) * 28}`).join(' ');
  }, [values]);

  return <Box sx={{ position: 'relative', width: '100%', height: '100%', minHeight }}>
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" width="100%" height="100%" aria-hidden>
      {[10, 20, 30].map(y => <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="#e7eaf0" strokeWidth=".35" />)}
      {[20, 40, 60, 80].map(x => <line key={x} y1="2" y2="38" x1={x} x2={x} stroke="#f0f2f6" strokeWidth=".3" />)}
      {fill && <polygon points={`0,40 ${points} 100,40`} fill={color} opacity=".10" />}
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.8" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </Box>;
}

function MaterialMetric({ def, theme, locale, size }: Props) {
  const p = profile(size);
  const value = n(def.mock.value, 24.8);
  const unit = s(def.mock.unit);
  const trend = n(def.mock.trend, 2.4);
  const max = n(def.mock.max, Math.max(100, value * 1.35));
  const values = (def.mock.values as number[] | undefined) ?? spark;
  const positive = trend >= 0;
  const tone = positive ? 'success' : 'warning';

  if (p.compact) {
    return <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', direction: 'ltr', gap: .75 }}>
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: .55 }}>
          <Typography sx={{ fontSize: 36, lineHeight: .92, fontWeight: 850, letterSpacing: '-.05em' }}>{value}</Typography>
          <Typography sx={{ fontSize: 12, fontWeight: 750, color: theme.muted }}>{unit}</Typography>
        </Box>
        <Box sx={{ mt: .8 }}><ToneBadge text={`${positive ? '↑' : '↓'} ${Math.abs(trend)}% · 24h`} tone={tone} theme={theme} /></Box>
      </Box>
      <Progress value={value} max={max} theme={theme} />
    </Box>;
  }

  if (p.wide && !p.large) {
    return <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: 'minmax(132px,.85fr) minmax(0,1.4fr)', gap: 1.4, direction: 'ltr', alignItems: 'stretch' }}>
      <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <Typography sx={{ fontSize: 38, lineHeight: .92, fontWeight: 850, letterSpacing: '-.05em' }}>{value}<Box component="span" sx={{ ml: .55, fontSize: 13, color: theme.muted, fontWeight: 750 }}>{unit}</Box></Typography>
        <Box sx={{ mt: 1 }}><ToneBadge text={`${positive ? '↑' : '↓'} ${Math.abs(trend)}%`} tone={tone} theme={theme} /></Box>
        <Box sx={{ mt: 1.25 }}><Progress value={value} max={max} theme={theme} /></Box>
      </Box>
      <Box sx={{ minWidth: 0, borderLeft: `1px solid ${theme.border}`, pl: 1.35, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', color: theme.muted, mb: .2 }}>
          <Typography sx={{ fontSize: 10.5 }}>{label(locale, '24h trend', 'روند ۲۴ ساعت')}</Typography>
          <Typography sx={{ fontSize: 10.5 }}>now</Typography>
        </Box>
        <Box sx={{ flex: 1, minHeight: 0 }}><ChartSvg values={values} color={theme.accent} fill minHeight={52} /></Box>
      </Box>
    </Box>;
  }

  const minValue = Math.round(value * .82 * 10) / 10;
  const avgValue = Math.round(value * .96 * 10) / 10;
  const peakValue = Math.round(value * 1.12 * 10) / 10;
  return <Box sx={{ height: '100%', display: 'grid', gridTemplateRows: 'auto auto minmax(110px,1fr)', gap: 1.2, direction: 'ltr' }}>
    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
      <Box>
        <Typography sx={{ fontSize: 44, lineHeight: .9, fontWeight: 850, letterSpacing: '-.05em' }}>{value}<Box component="span" sx={{ ml: .6, fontSize: 14, color: theme.muted, fontWeight: 750 }}>{unit}</Box></Typography>
        <Box sx={{ mt: .9 }}><ToneBadge text={`${positive ? '↑' : '↓'} ${Math.abs(trend)}% · ${label(locale, 'vs previous 24h', 'نسبت به ۲۴ ساعت قبل')}`} tone={tone} theme={theme} /></Box>
      </Box>
      <Box sx={{ minWidth: 116 }}>
        <Typography sx={{ fontSize: 10.5, color: theme.muted, mb: .7 }}>{label(locale, 'Current range', 'بازه فعلی')}</Typography>
        <Progress value={value} max={max} theme={theme} />
      </Box>
    </Box>
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: .75 }}>
      <StatBox label={label(locale, 'Min', 'کمینه')} value={`${minValue}${unit}`} theme={theme} />
      <StatBox label={label(locale, 'Average', 'میانگین')} value={`${avgValue}${unit}`} theme={theme} accent />
      <StatBox label={label(locale, 'Peak', 'بیشینه')} value={`${peakValue}${unit}`} theme={theme} />
    </Box>
    <Box sx={{ minHeight: 0, border: `1px solid ${theme.border}`, borderRadius: 1.75, p: 1, bgcolor: '#fbfcff' }}>
      <ChartSvg values={values} color={theme.accent} fill minHeight={105} />
    </Box>
  </Box>;
}

function RadialGauge({ value, max, unit, theme, size, tone }: { value: number; max: number; unit: string; theme: WidgetThemeTokens; size: number; tone: string }) {
  const pct = clamp(value / Math.max(1, max), 0, 1);
  const r = 44;
  const c = 2 * Math.PI * r;
  return <Box sx={{ width: size, height: size, position: 'relative', flex: '0 0 auto' }}>
    <svg viewBox="0 0 120 120" width="100%" height="100%">
      <circle cx="60" cy="60" r={r} fill="none" stroke="#edf0f5" strokeWidth="10" />
      <circle cx="60" cy="60" r={r} fill="none" stroke={tone} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} transform="rotate(-90 60 60)" />
    </svg>
    <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}>
      <Box>
        <Typography sx={{ fontSize: size <= 112 ? 24 : 30, lineHeight: 1, fontWeight: 850 }}>{value}</Typography>
        <Typography sx={{ mt: .3, fontSize: 10.5, color: theme.muted }}>{unit}</Typography>
      </Box>
    </Box>
  </Box>;
}

function MaterialGauge({ def, theme, locale, size }: Props) {
  const p = profile(size);
  const value = n(def.mock.value, 68);
  const max = n(def.mock.max, 100);
  const unit = s(def.mock.unit);
  const pct = clamp(value / Math.max(1, max), 0, 1);
  const state = pct >= .9 ? 'danger' : pct >= .75 ? 'warning' : 'success';
  const tone = state === 'danger' ? '#dc2626' : state === 'warning' ? '#d97706' : theme.accent;
  const stateText = state === 'danger' ? label(locale, 'Critical', 'بحرانی') : state === 'warning' ? label(locale, 'Warning', 'هشدار') : label(locale, 'Normal', 'عادی');

  if (p.compact) {
    return <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', direction: 'ltr' }}>
      <RadialGauge value={value} max={max} unit={unit} theme={theme} size={116} tone={tone} />
    </Box>;
  }

  if (p.wide && !p.large) {
    return <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: '128px minmax(0,1fr)', gap: 1.6, alignItems: 'center', direction: 'ltr' }}>
      <RadialGauge value={value} max={max} unit={unit} theme={theme} size={120} tone={tone} />
      <Box sx={{ minWidth: 0 }}>
        <ToneBadge text={stateText} tone={state} theme={theme} />
        <Typography sx={{ mt: 1.1, fontSize: 10.5, color: theme.muted }}>{label(locale, 'Operating range', 'محدوده عملکرد')}</Typography>
        <Box sx={{ mt: .6 }}><Progress value={value} max={max} theme={theme} tone={tone} /></Box>
        <Box sx={{ mt: .7, display: 'flex', justifyContent: 'space-between', color: theme.muted }}><Typography sx={{ fontSize: 10 }}>0</Typography><Typography sx={{ fontSize: 10 }}>{max}{unit}</Typography></Box>
      </Box>
    </Box>;
  }

  return <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: 'minmax(160px,.9fr) minmax(0,1fr)', alignItems: 'center', gap: 2, direction: 'ltr' }}>
    <Box sx={{ display: 'grid', placeItems: 'center' }}><RadialGauge value={value} max={max} unit={unit} theme={theme} size={172} tone={tone} /></Box>
    <Box sx={{ minWidth: 0 }}>
      <ToneBadge text={stateText} tone={state} theme={theme} />
      <Typography sx={{ mt: 1.4, fontSize: 11, color: theme.muted }}>{label(locale, 'Threshold usage', 'درصد از آستانه')}</Typography>
      <Typography sx={{ mt: .25, fontSize: 26, fontWeight: 850 }}>{Math.round(pct * 100)}%</Typography>
      <Box sx={{ mt: .8 }}><Progress value={value} max={max} theme={theme} tone={tone} /></Box>
      <Box sx={{ mt: 1.2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: .75 }}>
        <StatBox label={label(locale, 'Warning', 'هشدار')} value={`${Math.round(max * .75)}${unit}`} theme={theme} />
        <StatBox label={label(locale, 'Critical', 'بحرانی')} value={`${Math.round(max * .9)}${unit}`} theme={theme} />
      </Box>
    </Box>
  </Box>;
}

function BatteryShape({ value, theme, width = 128, height = 58 }: { value: number; theme: WidgetThemeTokens; width?: number; height?: number }) {
  const level = value < 20 ? '#dc2626' : value < 45 ? '#d97706' : theme.accent;
  return <Box sx={{ width, height, border: `2px solid ${theme.foreground}`, borderRadius: 2, p: .5, position: 'relative', direction: 'ltr', '&::after': { content: '""', position: 'absolute', right: -7, top: '31%', width: 5, height: '38%', bgcolor: theme.foreground, borderRadius: '0 2px 2px 0' } }}>
    <Box sx={{ width: `${value}%`, height: '100%', bgcolor: level, borderRadius: 1.2 }} />
  </Box>;
}

function MaterialBattery({ def, theme, locale, size }: Props) {
  const p = profile(size);
  const value = clamp(n(def.mock.value, 76), 0, 100);
  const voltage = s(def.mock.voltage, '3.94 V');
  const remain = s(def.mock.remaining, '8h 42m');
  if (p.compact) return <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', direction: 'ltr' }}><Box sx={{ textAlign: 'center' }}><BatteryShape value={value} theme={theme} width={94} height={44} /><Typography sx={{ mt: .75, fontSize: 26, fontWeight: 850 }}>{value}%</Typography><Typography sx={{ fontSize: 10.5, color: theme.muted }}>{voltage}</Typography></Box></Box>;
  if (p.wide && !p.large) return <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: '150px 1fr', alignItems: 'center', gap: 1.6, direction: 'ltr' }}><Box sx={{ display: 'grid', placeItems: 'center' }}><BatteryShape value={value} theme={theme} /></Box><Box><Typography sx={{ fontSize: 34, lineHeight: 1, fontWeight: 850 }}>{value}%</Typography><Typography sx={{ mt: .45, fontSize: 11, color: theme.muted }}>{voltage} · {remain}</Typography><Box sx={{ mt: 1 }}><ToneBadge text={value > 40 ? label(locale, 'Battery healthy', 'باتری سالم') : label(locale, 'Charge soon', 'نیاز به شارژ')} tone={value > 40 ? 'success' : 'warning'} theme={theme} /></Box></Box></Box>;
  return <Box sx={{ height: '100%', display: 'grid', gridTemplateRows: '1fr auto', gap: 1.3, direction: 'ltr' }}><Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2.3 }}><BatteryShape value={value} theme={theme} width={164} height={76} /><Box><Typography sx={{ fontSize: 42, fontWeight: 850, lineHeight: 1 }}>{value}%</Typography><Typography sx={{ mt: .45, fontSize: 12, color: theme.muted }}>{label(locale, 'Estimated', 'زمان تقریبی')} {remain}</Typography></Box></Box><Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: .75 }}><StatBox label={label(locale, 'Voltage', 'ولتاژ')} value={voltage} theme={theme} accent /><StatBox label={label(locale, 'Health', 'سلامت')} value="Good" theme={theme} /><StatBox label={label(locale, 'Cycles', 'چرخه')} value="148" theme={theme} /></Box></Box>;
}

function MaterialSignal({ def, theme, locale, size }: Props) {
  const p = profile(size);
  const value = n(def.mock.value, -72);
  const barsOn = value > -60 ? 5 : value > -70 ? 4 : value > -80 ? 3 : value > -90 ? 2 : 1;
  const network = s(def.mock.network, 'LTE · RSRP');
  const quality = barsOn >= 4 ? label(locale, 'Excellent', 'عالی') : barsOn === 3 ? label(locale, 'Good', 'خوب') : label(locale, 'Weak', 'ضعیف');
  const tone = barsOn >= 3 ? theme.accent : '#d97706';
  const Bars = ({ big = false }: { big?: boolean }) => <Box sx={{ display: 'flex', alignItems: 'end', gap: big ? .8 : .55, height: big ? 72 : 50 }}>{[1,2,3,4,5].map(i => <Box key={i} sx={{ width: big ? 12 : 9, height: 7 + i * (big ? 10 : 7), borderRadius: .7, bgcolor: i <= barsOn ? tone : '#e5e7eb' }} />)}</Box>;
  if (p.compact) return <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', direction: 'ltr' }}><Box sx={{ textAlign: 'center' }}><Box sx={{ display: 'grid', placeItems: 'center' }}><Bars /></Box><Typography sx={{ mt: .65, fontSize: 23, fontWeight: 850 }}>{value} dBm</Typography><Typography sx={{ fontSize: 10, color: theme.muted }}>{network}</Typography></Box></Box>;
  if (p.wide && !p.large) return <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: '120px 1fr', gap: 1.5, alignItems: 'center', direction: 'ltr' }}><Box sx={{ display: 'grid', placeItems: 'center' }}><Bars big /></Box><Box><Typography sx={{ fontSize: 31, fontWeight: 850 }}>{value} dBm</Typography><Typography sx={{ mt: .3, fontSize: 11, color: theme.muted }}>{network}</Typography><Box sx={{ mt: .9 }}><ToneBadge text={quality} tone={barsOn >= 3 ? 'success' : 'warning'} theme={theme} /></Box></Box></Box>;
  return <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: '170px 1fr', alignItems: 'center', gap: 2, direction: 'ltr' }}><Box sx={{ display: 'grid', placeItems: 'center' }}><Bars big /></Box><Box><Typography sx={{ fontSize: 38, fontWeight: 850 }}>{value} dBm</Typography><Box sx={{ mt: .75 }}><ToneBadge text={quality} tone={barsOn >= 3 ? 'success' : 'warning'} theme={theme} /></Box><Box sx={{ mt: 1.25, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: .75 }}><StatBox label="NETWORK" value="LTE" theme={theme} /><StatBox label="RSRQ" value="-10 dB" theme={theme} /><StatBox label="SINR" value="18 dB" theme={theme} /><StatBox label="CELL" value="B3" theme={theme} /></Box></Box></Box>;
}

function MaterialTank({ def, theme, locale, size }: Props) {
  const p = profile(size);
  const value = clamp(n(def.mock.value, 63), 0, 100);
  const liters = s(def.mock.liters, '1,260 L');
  const TankShape = ({ large = false }: { large?: boolean }) => <Box sx={{ width: large ? 100 : 70, height: large ? 142 : 98, border: `2px solid ${theme.border}`, borderRadius: 2, p: .45, display: 'flex', alignItems: 'end', bgcolor: '#fbfcff', overflow: 'hidden', position: 'relative' }}><Box sx={{ width: '100%', height: `${value}%`, bgcolor: theme.accent, borderRadius: '5px 5px 10px 10px', position: 'relative', '&::before': { content: '""', position: 'absolute', left: 0, right: 0, top: -4, height: 8, borderRadius: '50%', bgcolor: theme.accent } }} /></Box>;
  if (p.compact) return <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', direction: 'ltr' }}><Box sx={{ display: 'flex', alignItems: 'center', gap: 1.1 }}><TankShape /><Box><Typography sx={{ fontSize: 27, fontWeight: 850 }}>{value}%</Typography><Typography sx={{ fontSize: 10.5, color: theme.muted }}>{liters}</Typography></Box></Box></Box>;
  if (p.wide && !p.large) return <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, direction: 'ltr' }}><TankShape /><Box><Typography sx={{ fontSize: 34, fontWeight: 850 }}>{value}%</Typography><Typography sx={{ color: theme.muted, fontSize: 11 }}>{liters}</Typography><Box sx={{ mt: .9, width: 150 }}><Progress value={value} theme={theme} /></Box></Box></Box>;
  return <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: '150px 1fr', alignItems: 'center', gap: 2, direction: 'ltr' }}><Box sx={{ display: 'grid', placeItems: 'center' }}><TankShape large /></Box><Box><Typography sx={{ fontSize: 42, lineHeight: 1, fontWeight: 850 }}>{value}%</Typography><Typography sx={{ mt: .4, color: theme.muted }}>{liters} {label(locale, 'stored', 'موجود')}</Typography><Box sx={{ mt: 1.2 }}><Progress value={value} theme={theme} /></Box><Box sx={{ mt: 1.2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: .75 }}><StatBox label={label(locale, 'Capacity', 'ظرفیت')} value="2,000 L" theme={theme} /><StatBox label={label(locale, 'Available', 'فضای خالی')} value="740 L" theme={theme} /></Box></Box></Box>;
}

function MaterialBoolean({ def, theme, locale, size }: Props) {
  const p = profile(size);
  const [on, setOn] = useState(Boolean(def.mock.value ?? true));
  const Icon = def.icon;
  const text = on ? label(locale, 'Active', 'فعال') : label(locale, 'Inactive', 'غیرفعال');
  const color = on ? '#16a34a' : '#64748b';
  if (p.compact) return <Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}><Box onClick={() => setOn(v => !v)} sx={{ cursor: 'pointer', textAlign: 'center' }}><Box sx={{ width: 64, height: 64, mx: 'auto', borderRadius: 2, bgcolor: `${color}10`, border: `1px solid ${color}20`, display: 'grid', placeItems: 'center' }}><Icon sx={{ fontSize: 30, color }} /></Box><Typography sx={{ mt: .8, fontSize: 13, fontWeight: 850, color }}>{text}</Typography></Box></Box>;
  return <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: p.large ? '150px 1fr' : '100px 1fr', alignItems: 'center', gap: 1.5 }}><Box onClick={() => setOn(v => !v)} sx={{ cursor: 'pointer', display: 'grid', placeItems: 'center' }}><Box sx={{ width: p.large ? 94 : 76, height: p.large ? 94 : 76, borderRadius: 2.5, bgcolor: `${color}10`, border: `1px solid ${color}25`, display: 'grid', placeItems: 'center' }}><Icon sx={{ fontSize: p.large ? 44 : 34, color }} /></Box></Box><Box><ToneBadge text={text} tone={on ? 'success' : 'neutral'} theme={theme} />{p.large && <Box sx={{ mt: 1.25, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: .75 }}><StatBox label={label(locale, 'Since', 'از زمان')} value="09:14" theme={theme} /><StatBox label={label(locale, 'Uptime', 'آپ‌تایم')} value="18h 42m" theme={theme} /></Box>}<Typography sx={{ mt: 1, fontSize: 10.5, color: theme.muted }}>{label(locale, 'Click state to toggle demo', 'برای تغییر وضعیت نمونه کلیک کنید')}</Typography></Box></Box>;
}

function MaterialAlarm({ def, theme, locale, size }: Props) {
  const p = profile(size);
  const Icon = def.icon;
  const active = Boolean(def.mock.value);
  const severity = s(def.mock.severity, 'warning');
  const color = active ? (severity === 'critical' ? '#dc2626' : '#d97706') : '#16a34a';
  const state = active ? label(locale, 'Alarm active', 'هشدار فعال') : label(locale, 'Normal', 'عادی');
  const tone = active ? (severity === 'critical' ? 'danger' : 'warning') : 'success';
  if (p.compact) return <Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}><Box sx={{ textAlign: 'center' }}><Box sx={{ width: 68, height: 68, mx: 'auto', borderRadius: 2.5, display: 'grid', placeItems: 'center', bgcolor: `${color}0d`, border: `1px solid ${color}25` }}><Icon sx={{ fontSize: 34, color }} /></Box><Typography sx={{ mt: .8, fontSize: 12.5, fontWeight: 850, color }}>{state}</Typography></Box></Box>;
  return <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: p.large ? '160px 1fr' : '110px 1fr', alignItems: 'center', gap: 1.6 }}><Box sx={{ display: 'grid', placeItems: 'center' }}><Box sx={{ width: p.large ? 104 : 82, height: p.large ? 104 : 82, borderRadius: 3, display: 'grid', placeItems: 'center', bgcolor: `${color}0d`, border: `1px solid ${color}25` }}><Icon sx={{ fontSize: p.large ? 50 : 38, color }} /></Box></Box><Box><ToneBadge text={state} tone={tone} theme={theme} />{p.large && <><Typography sx={{ mt: 1.2, fontSize: 11, color: theme.muted }}>{active ? label(locale, 'Immediate attention required', 'نیازمند بررسی فوری') : label(locale, 'Sensor is reporting normal state', 'سنسور وضعیت عادی گزارش می‌کند')}</Typography><Box sx={{ mt: 1.2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: .75 }}><StatBox label={label(locale, 'Last event', 'آخرین رخداد')} value={active ? '09:42' : 'Yesterday'} theme={theme} /><StatBox label={label(locale, 'Zone', 'زون')} value="Floor 2" theme={theme} /></Box></>}</Box></Box>;
}

function MaterialLineChart({ def, theme, size }: Props) {
  const p = profile(size);
  const values = (def.mock.values as number[] | undefined) ?? spark;
  const summary = s(def.mock.summary, '24.8 °C');
  return <Box sx={{ height: '100%', display: 'grid', gridTemplateRows: 'auto minmax(0,1fr) auto', gap: .65, direction: 'ltr' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}><Typography sx={{ fontSize: p.large ? 28 : 23, fontWeight: 850 }}>{summary}</Typography><ToneBadge text="24h" tone="neutral" theme={theme} /></Box>
    <Box sx={{ minHeight: p.wide && !p.large ? 68 : p.large ? 150 : 100 }}><ChartSvg values={values} color={theme.accent} fill={def.visual === 'area'} minHeight={p.wide && !p.large ? 68 : p.large ? 150 : 100} /></Box>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', color: theme.muted }}><Typography sx={{ fontSize: 9.5 }}>00</Typography><Typography sx={{ fontSize: 9.5 }}>06</Typography><Typography sx={{ fontSize: 9.5 }}>12</Typography><Typography sx={{ fontSize: 9.5 }}>18</Typography><Typography sx={{ fontSize: 9.5 }}>24</Typography></Box>
  </Box>;
}

function MaterialBar({ def, theme, size }: Props) {
  const p = profile(size);
  const values = (def.mock.values as number[] | undefined) ?? bars;
  return <Box sx={{ height: '100%', display: 'grid', gridTemplateRows: 'auto minmax(0,1fr) auto', gap: .7, direction: 'ltr' }}><Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography sx={{ fontSize: 12, fontWeight: 800 }}>{s(def.mock.summary, 'Weekly total')}</Typography><Typography sx={{ fontSize: 10.5, color: theme.muted }}>7d</Typography></Box><Box sx={{ minHeight: p.large ? 150 : 82, display: 'flex', alignItems: 'end', gap: p.large ? 1 : .7, px: .3 }}>{values.map((v, i) => <Box key={i} sx={{ flex: 1, minWidth: 0, height: `${Math.max(12, v)}%`, borderRadius: '4px 4px 1px 1px', bgcolor: i === values.length - 2 ? theme.accent2 : theme.accent, opacity: i === values.length - 2 ? 1 : .72 }} />)}</Box><Box sx={{ display: 'flex', justifyContent: 'space-between', color: theme.muted }}>{['M','T','W','T','F','S','S'].map((x,i)=><Typography key={i} sx={{ fontSize: 9 }}>{x}</Typography>)}</Box></Box>;
}

function MaterialHistogram({ theme, size }: Props) {
  const p = profile(size);
  const values = [2,5,9,15,20,17,12,8,4,2];
  return <Box sx={{ height: '100%', display: 'grid', gridTemplateRows: 'auto minmax(0,1fr)', gap: .8, direction: 'ltr' }}><Typography sx={{ fontSize: 12, fontWeight: 800 }}>Distribution</Typography><Box sx={{ minHeight: p.large ? 150 : 88, display: 'flex', alignItems: 'end', gap: .25 }}>{values.map((v,i)=><Box key={i} sx={{ flex: 1, height: `${v*4.5}%`, minHeight: 4, bgcolor: theme.accent, opacity: .26 + (v/20)*.74, borderRadius: '3px 3px 0 0' }} />)}</Box></Box>;
}

function MaterialDonut({ def, theme, locale, size }: Props) {
  const p = profile(size);
  const value = n(def.mock.value, 72);
  const c = 2 * Math.PI * 42;
  const ring = <Box sx={{ width: p.compact ? 120 : p.large ? 166 : 138, height: p.compact ? 120 : p.large ? 166 : 138, position: 'relative' }}><svg viewBox="0 0 120 120" width="100%" height="100%"><circle cx="60" cy="60" r="42" fill="none" stroke="#edf0f5" strokeWidth="12"/><circle cx="60" cy="60" r="42" fill="none" stroke={theme.accent} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${c*value/100} ${c}`} transform="rotate(-90 60 60)"/></svg><Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}><Box><Typography sx={{ fontSize: 28, fontWeight: 850 }}>{value}%</Typography><Typography sx={{ fontSize: 10, color: theme.muted }}>{label(locale, 'Used', 'مصرف')}</Typography></Box></Box></Box>;
  if (!p.large) return <Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}>{ring}</Box>;
  return <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: '180px 1fr', alignItems: 'center', gap: 1.5 }}>{ring}<Box><StatBox label={label(locale, 'Used', 'مصرف')} value={`${value}%`} theme={theme} accent /><Box sx={{ mt: .75 }}><StatBox label={label(locale, 'Free', 'آزاد')} value={`${100-value}%`} theme={theme} /></Box></Box></Box>;
}

function MaterialHeatmap({ theme, size }: Props) {
  const p = profile(size);
  return <Box sx={{ height: '100%', display: 'grid', gridTemplateRows: 'minmax(0,1fr) auto', gap: .65 }}><Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gridTemplateRows: `repeat(${heat.length},1fr)`, gap: p.large ? .7 : .45, minHeight: 0 }}>{heat.flat().map((v,i)=><Box key={i} sx={{ minHeight: 16, borderRadius: .75, bgcolor: `rgba(79,70,229,${.08 + (v/100)*.78})`, border: '1px solid rgba(79,70,229,.08)' }} />)}</Box><Box sx={{ display: 'flex', justifyContent: 'space-between', color: theme.muted }}>{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day=><Typography key={day} sx={{ fontSize: 9 }}>{p.compact ? day[0] : day}</Typography>)}</Box></Box>;
}

function MaterialTimeline({ theme, size }: Props) {
  const p = profile(size);
  const rows = [
    { name: 'Line 1', segments: ['#16a34a','#16a34a','#d97706','#16a34a','#dc2626'] },
    { name: 'Line 2', segments: ['#16a34a','#16a34a','#16a34a','#64748b','#16a34a'] },
    { name: 'Pump', segments: ['#64748b','#16a34a','#16a34a','#16a34a','#d97706'] },
  ];
  return <Box sx={{ height: '100%', display: 'grid', gridTemplateRows: 'repeat(3,1fr) auto', gap: p.large ? 1.1 : .75, direction: 'ltr', alignItems: 'center' }}>{rows.map(row=><Box key={row.name} sx={{ display: 'grid', gridTemplateColumns: p.large ? '68px 1fr' : '52px 1fr', gap: .8, alignItems: 'center' }}><Typography sx={{ fontSize: 10, color: theme.muted }}>{row.name}</Typography><Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: .35 }}>{row.segments.map((seg,i)=><Box key={i} sx={{ height: p.large ? 22 : 15, borderRadius: .65, bgcolor: seg }} />)}</Box></Box>)}<Box sx={{ display: 'flex', justifyContent: 'space-between', color: theme.muted, pl: p.large ? '76px' : '60px' }}>{['00','06','12','18','24'].map(t=><Typography key={t} sx={{ fontSize: 9 }}>{t}</Typography>)}</Box></Box>;
}

function MaterialMap({ theme, size }: Props) {
  const p = profile(size);
  return <Box sx={{ height: '100%', borderRadius: 1.5, overflow: 'hidden', position: 'relative', border: `1px solid ${theme.border}`, background: '#f4f7fb' }}><Box sx={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(transparent 0 95%,rgba(148,163,184,.14) 95%),linear-gradient(90deg,transparent 0 95%,rgba(148,163,184,.14) 95%)', backgroundSize: p.large ? '42px 42px' : '34px 34px' }} /><svg viewBox="0 0 300 180" width="100%" height="100%" style={{ position:'absolute', inset:0 }}><path d="M10 125 C 55 80,95 82,136 118 S 224 156,290 92" fill="none" stroke={theme.accent} strokeWidth="4" strokeLinecap="round"/>{[{x:72,y:96},{x:134,y:118},{x:214,y:126}].map((pt,i)=><g key={i}><circle cx={pt.x} cy={pt.y} r="9" fill={theme.accent} opacity=".12"/><circle cx={pt.x} cy={pt.y} r="5" fill={theme.accent}/></g>)}</svg><Box sx={{ position:'absolute', left:10, bottom:10 }}><ToneBadge text="3 devices" tone="accent" theme={theme}/></Box></Box>;
}

function MaterialCoordinates({ def, theme, locale, size }: Props) {
  const p = profile(size);
  const lat = s(def.mock.lat,'35.7219° N'); const lng=s(def.mock.lng,'51.3347° E'); const accuracy=s(def.mock.accuracy,'4.2 m');
  if (!p.large) return <Box sx={{ height:'100%', display:'grid', gridTemplateRows:'repeat(3,1fr)', gap:.65, alignContent:'center', direction:'ltr' }}><StatBox label="LAT" value={lat} theme={theme}/><StatBox label="LNG" value={lng} theme={theme}/><StatBox label={label(locale,'Accuracy','دقت')} value={accuracy} theme={theme} accent/></Box>;
  return <Box sx={{ height:'100%', display:'grid', gridTemplateColumns:'1fr 128px', gap:1.25, alignItems:'center', direction:'ltr' }}><Box sx={{ display:'grid', gap:.75 }}><StatBox label="LATITUDE" value={lat} theme={theme}/><StatBox label="LONGITUDE" value={lng} theme={theme}/><StatBox label={label(locale,'Accuracy','دقت')} value={accuracy} theme={theme} accent/></Box><Box sx={{ height:128, borderRadius:2, border:`1px solid ${theme.border}`, bgcolor:'#f4f7fb', display:'grid', placeItems:'center', position:'relative', overflow:'hidden' }}><Box sx={{ position:'absolute', width:1, top:12,bottom:12,bgcolor:'#dbe2eb' }}/><Box sx={{ position:'absolute', height:1,left:12,right:12,bgcolor:'#dbe2eb' }}/><Box sx={{ width:18,height:18,borderRadius:'50%',bgcolor:`${theme.accent}18`,border:`4px solid ${theme.accent}` }}/></Box></Box>;
}

function MaterialCompass({ def, theme, size }: Props) {
  const p = profile(size);
  const value = n(def.mock.value,327);
  const dia = p.compact ? 116 : p.large ? 190 : 142;
  return <Box sx={{ height:'100%', display:'grid', placeItems:'center', direction:'ltr' }}><Box sx={{ width:dia,height:dia,borderRadius:'50%',border:`1px solid ${theme.border}`,bgcolor:'#fbfcff',position:'relative',display:'grid',placeItems:'center' }}>{['N','E','S','W'].map((x,i)=><Typography key={x} sx={{ position:'absolute', fontSize:10.5,color:theme.muted, top:i===0?8:i===2?undefined:'50%', bottom:i===2?8:undefined, left:i===3?10:i===1?undefined:'50%', right:i===1?10:undefined, transform:i===0||i===2?'translateX(-50%)':i===1||i===3?'translateY(-50%)':undefined }}>{x}</Typography>)}<Box sx={{ position:'absolute', width:3,height:dia*.34,borderRadius:2,bgcolor:theme.accent,transform:`rotate(${value}deg) translateY(-${dia*.11}px)`,transformOrigin:'50% 100%' }}/><Box sx={{ textAlign:'center' }}><Typography sx={{ fontSize:p.large?34:27,fontWeight:850 }}>{value}°</Typography><Typography sx={{ fontSize:10,color:theme.muted }}>heading</Typography></Box></Box></Box>;
}

function MaterialButton({ theme, locale, size }: Props) {
  const p=profile(size); const [sent,setSent]=useState(false);
  if (p.compact) return <Box sx={{ height:'100%',display:'grid',placeItems:'center' }}><Box sx={{ textAlign:'center' }}><Button variant="contained" onClick={()=>{setSent(true);setTimeout(()=>setSent(false),1100)}} sx={{ borderRadius:1.5,textTransform:'none',fontWeight:800,px:2.1,boxShadow:'none' }}>{label(locale,'Send command','ارسال فرمان')}</Button><Typography sx={{ mt:.8,fontSize:10.5,color:sent?'#16a34a':theme.muted }}>{sent?label(locale,'Queued','در صف ارسال'):label(locale,'Ready','آماده')}</Typography></Box></Box>;
  return <Box sx={{ height:'100%',display:'grid',gridTemplateColumns:p.large?'1fr 150px':'1fr 140px',alignItems:'center',gap:1.5 }}><Box><Typography sx={{ fontSize:18,fontWeight:850 }}>{label(locale,'Device command','فرمان دستگاه')}</Typography><Typography sx={{ mt:.4,fontSize:11,color:theme.muted }}>{label(locale,'Send a predefined RPC/downlink action to this device.','ارسال فرمان از پیش تعریف‌شده به دستگاه.')}</Typography>{p.large&&<Box sx={{ mt:1.2,display:'grid',gridTemplateColumns:'1fr 1fr',gap:.75 }}><StatBox label="TARGET" value="Device" theme={theme}/><StatBox label="TIMEOUT" value="5 sec" theme={theme}/></Box>}</Box><Box sx={{ textAlign:'center' }}><Button fullWidth variant="contained" onClick={()=>{setSent(true);setTimeout(()=>setSent(false),1100)}} sx={{ borderRadius:1.5,textTransform:'none',fontWeight:800,boxShadow:'none' }}>{label(locale,'Send command','ارسال فرمان')}</Button><Typography sx={{ mt:.7,fontSize:10.5,color:sent?'#16a34a':theme.muted }}>{sent?label(locale,'Command queued','فرمان در صف قرار گرفت'):label(locale,'Ready','آماده')}</Typography></Box></Box>;
}

function MaterialSwitch({ theme, locale, size }: Props) {
  const p=profile(size); const [checked,setChecked]=useState(true);
  if(p.compact) return <Box sx={{ height:'100%',display:'grid',placeItems:'center' }}><Box sx={{ textAlign:'center' }}><Switch checked={checked} onChange={(_,v)=>setChecked(v)} sx={{ transform:'scale(1.22)','& .MuiSwitch-switchBase.Mui-checked':{color:theme.accent},'& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':{backgroundColor:theme.accent} }}/><Typography sx={{ mt:.55,fontSize:15,fontWeight:850,color:checked?theme.accent:theme.muted }}>{checked?'ON':'OFF'}</Typography></Box></Box>;
  return <Box sx={{ height:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',gap:1.5 }}><Box><Typography sx={{ fontSize:p.large?25:20,fontWeight:850 }}>{checked?label(locale,'Output enabled','خروجی فعال'):label(locale,'Output disabled','خروجی غیرفعال')}</Typography><Typography sx={{ mt:.35,fontSize:11,color:theme.muted }}>{label(locale,'Tap switch to change device state','برای تغییر وضعیت کلید را بزنید')}</Typography>{p.large&&<Box sx={{ mt:1.2 }}><ToneBadge text={checked?label(locale,'Running','در حال کار'):label(locale,'Stopped','متوقف')} tone={checked?'success':'neutral'} theme={theme}/></Box>}</Box><Switch checked={checked} onChange={(_,v)=>setChecked(v)} sx={{ transform:p.large?'scale(1.55)':'scale(1.35)','& .MuiSwitch-switchBase.Mui-checked':{color:theme.accent},'& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':{backgroundColor:theme.accent} }}/></Box>;
}

function MaterialSlider({ def, theme, locale, size }: Props) {
  const p=profile(size); const [value,setValue]=useState(n(def.mock.value,65)); const unit=s(def.mock.unit,'%');
  return <Box sx={{ height:'100%',display:'flex',flexDirection:'column',justifyContent:'center',gap:p.large?1.4:1,direction:'ltr' }}><Box sx={{ display:'flex',justifyContent:'space-between',alignItems:'baseline' }}><Typography sx={{ fontSize:p.large?38:31,fontWeight:850 }}>{value}<Box component="span" sx={{ ml:.4,fontSize:13,color:theme.muted }}>{unit}</Box></Typography><Typography sx={{ fontSize:10.5,color:theme.muted }}>0 — 100</Typography></Box><Slider value={value} onChange={(_,v)=>setValue(v as number)} sx={{ color:theme.accent,'& .MuiSlider-thumb':{width:18,height:18,boxShadow:`0 0 0 5px ${theme.accent}12`} }}/>{p.large&&<Box sx={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:.75 }}><StatBox label={label(locale,'Low','کم')} value="0" theme={theme}/><StatBox label={label(locale,'Current','فعلی')} value={`${value}${unit}`} theme={theme} accent/><StatBox label={label(locale,'High','زیاد')} value="100" theme={theme}/></Box>}</Box>;
}

function MaterialInput({ def, theme, locale, size }: Props) {
  const p=profile(size); const [value,setValue]=useState(String(def.mock.value??'22.5'));
  return <Box sx={{ height:'100%',display:'flex',alignItems:'center',justifyContent:'center' }}><Box sx={{ width:'100%',maxWidth:p.large?360:undefined }}><TextField value={value} onChange={e=>setValue(e.target.value)} label={label(locale,'Target value','مقدار هدف')} size="small" fullWidth inputProps={{dir:'ltr'}} sx={{ '& .MuiOutlinedInput-root':{borderRadius:1.5},'& .MuiOutlinedInput-notchedOutline':{borderColor:theme.border} }}/>{p.large&&<Typography sx={{ mt:.8,fontSize:10.5,color:theme.muted }}>{label(locale,'Enter a value and press Enter in the production control.','در نسخه نهایی پس از ورود مقدار، فرمان ارسال می‌شود.')}</Typography>}</Box></Box>;
}

function MaterialThermostat({ def, theme, locale, size }: Props) {
  const p=profile(size); const [value,setValue]=useState(n(def.mock.value,22));
  if(p.compact) return <Box sx={{ height:'100%',display:'grid',placeItems:'center',direction:'ltr' }}><Box sx={{ width:116,height:116,borderRadius:'50%',border:`7px solid ${theme.accent}18`,display:'grid',placeItems:'center' }}><Box sx={{ textAlign:'center' }}><Typography sx={{ fontSize:31,fontWeight:850 }}>{value}°</Typography><Typography sx={{ fontSize:9.5,color:theme.muted }}>SET</Typography></Box></Box></Box>;
  return <Box sx={{ height:'100%',display:'grid',gridTemplateColumns:p.large?'170px 1fr':'138px 1fr',alignItems:'center',gap:1.6,direction:'ltr' }}><Box sx={{ width:p.large?150:128,height:p.large?150:128,borderRadius:'50%',border:`9px solid ${theme.accent}18`,display:'grid',placeItems:'center' }}><Box sx={{ textAlign:'center' }}><Typography sx={{ fontSize:p.large?39:33,fontWeight:850 }}>{value}°</Typography><Typography sx={{ fontSize:10,color:theme.muted }}>SETPOINT</Typography></Box></Box><Box><Typography sx={{ fontSize:11,color:theme.muted }}>{label(locale,'Target temperature','دمای هدف')}</Typography><Slider min={16} max={30} value={value} onChange={(_,v)=>setValue(v as number)} sx={{ color:theme.accent }}/>{p.large&&<Box sx={{ mt:1,display:'grid',gridTemplateColumns:'1fr 1fr',gap:.75 }}><StatBox label={label(locale,'Room','اتاق')} value="24.8°C" theme={theme}/><StatBox label={label(locale,'Mode','حالت')} value="Auto" theme={theme} accent/></Box>}</Box></Box>;
}

function MaterialColor({ theme, locale, size }: Props) {
  const p=profile(size); const [hue,setHue]=useState(188); const [brightness,setBrightness]=useState(78); const [on,setOn]=useState(true); const presets=[0,36,120,188,265,315]; const preview=on?`hsl(${hue} 78% ${Math.max(28,brightness/1.75)}%)`:'#64748b';
  return <Box sx={{ height:'100%',display:'grid',gridTemplateRows:p.compact?'52px auto auto':'70px auto auto auto',gap:.7,direction:'ltr' }}><Box onClick={()=>setOn(v=>!v)} sx={{ cursor:'pointer',borderRadius:1.5,background:preview,position:'relative',overflow:'hidden',border:`1px solid ${theme.border}` }}><Typography sx={{ position:'absolute',left:8,bottom:6,fontSize:10,fontWeight:850,color:'#fff' }}>{on?'ON':'OFF'}</Typography><Typography sx={{ position:'absolute',right:8,bottom:6,fontSize:10,color:'#fff' }}>{brightness}%</Typography></Box><Box sx={{ display:'flex',justifyContent:'space-between',gap:.45 }}>{presets.map(x=><Box key={x} onClick={()=>{setHue(x);setOn(true)}} sx={{ cursor:'pointer',width:p.compact?20:25,height:p.compact?20:25,borderRadius:'50%',background:`hsl(${x} 82% 55%)`,border:hue===x?`2px solid ${theme.foreground}`:'2px solid transparent',boxShadow:hue===x?'0 0 0 2px #fff,0 0 0 3px #d1d5db':'none' }}/>)}</Box><Box><Typography sx={{ fontSize:9.5,color:theme.muted }}>{label(locale,'Hue','رنگ')} · {hue}°</Typography><Slider min={0} max={360} value={hue} onChange={(_,v)=>setHue(v as number)} size="small" sx={{ color:theme.accent,py:.45 }}/></Box>{!p.compact&&<Box><Typography sx={{ fontSize:9.5,color:theme.muted }}>{label(locale,'Brightness','روشنایی')}</Typography><Slider min={5} max={100} value={brightness} onChange={(_,v)=>setBrightness(v as number)} size="small" sx={{ color:theme.accent2,py:.45 }}/></Box>}</Box>;
}

function MaterialDirection({ theme, locale, size }: Props) {
  const p=profile(size); const [active,setActive]=useState('•'); const keys=['↑','←','•','→','↓']; const button=p.compact?38:p.large?52:44;
  return <Box sx={{ height:'100%',display:'grid',placeItems:'center',direction:'ltr' }}><Box><Box sx={{ display:'grid',gridTemplateColumns:`repeat(3,${button}px)`,gridTemplateRows:`repeat(3,${button}px)`,gap:.55 }}>{keys.map((k,i)=>{const pos=[2,4,5,6,8][i]; return <Button key={k} onClick={()=>setActive(k)} sx={{ gridColumn:((pos-1)%3)+1,gridRow:Math.floor((pos-1)/3)+1,minWidth:0,width:button,height:button,p:0,borderRadius:1.5,border:`1px solid ${active===k?theme.accent:theme.border}`,color:active===k?'#fff':theme.foreground,bgcolor:active===k?theme.accent:'#fff','&:hover':{bgcolor:active===k?theme.accent:`${theme.accent}08`} }}>{k}</Button>})}</Box>{!p.compact&&<Typography sx={{ mt:.75,textAlign:'center',fontSize:10,color:theme.muted }}>{label(locale,'Last command','آخرین فرمان')}: {active}</Typography>}</Box></Box>;
}

function rowColor(cell: string, theme: WidgetThemeTokens) {
  if (['Critical','Alert'].includes(cell)) return '#dc2626';
  if (cell === 'Warning') return '#d97706';
  if (['Online','Started','Opened','connected'].includes(cell)) return '#16a34a';
  if (['Sleep','Info'].includes(cell)) return '#64748b';
  return theme.foreground;
}

function MaterialTable({ theme, locale, mode, size }: Props & { mode:'table'|'measurement-list'|'alarms'|'events'|'logs' }) {
  const p=profile(size);
  const rows = mode==='alarms' ? [['Fire sensor','Critical','09:42'],['Door open','Warning','09:17'],['Battery low','Info','08:51']]
    : mode==='logs' ? [['gateway-01','connected','09:44:21'],['pump-04','rpc ack','09:43:12'],['sensor-18','telemetry','09:42:08']]
    : mode==='events' ? [['Valve','Opened','09:41'],['Pump','Started','09:34'],['Mode','Auto','09:12']]
    : mode==='measurement-list' ? [['24.8 °C','09:44'],['24.6 °C','09:39'],['24.7 °C','09:34'],['24.4 °C','09:29']]
    : [['GW-01','Online','24.8 °C'],['Pump-04','Online','68%'],['Node-18','Sleep','3.8 V'],['Valve-02','Alert','Open']];
  return <Box sx={{ height:'100%',display:'grid',gridTemplateRows:p.large?'auto minmax(0,1fr) auto':'minmax(0,1fr)',gap:.8,direction:'ltr' }}>{p.large&&<Box sx={{ display:'flex',gap:.7 }}><ToneBadge text={`${rows.length} ${label(locale,'rows','ردیف')}`} tone="neutral" theme={theme}/>{mode==='alarms'&&<ToneBadge text="1 critical" tone="danger" theme={theme}/>}</Box>}<Box sx={{ minHeight:0,overflow:'hidden',border:`1px solid ${theme.border}`,borderRadius:1.5 }}>{rows.map((row,i)=><Box key={i} sx={{ display:'grid',gridTemplateColumns:`repeat(${row.length},minmax(0,1fr))`,gap:1,minHeight:p.large?44:36,alignItems:'center',px:1,py:.55,borderBottom:i<rows.length-1?`1px solid ${theme.border}`:'none',bgcolor:mode==='alarms'&&i===0?'rgba(220,38,38,.035)':'#fff' }}>{row.map((cell,j)=><Typography key={j} sx={{ fontSize:p.large?12:11,fontWeight:j===0?750:600,color:j===1?rowColor(cell,theme):j===0?theme.foreground:theme.muted,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{cell}</Typography>)}</Box>)}</Box>{p.large&&<Typography sx={{ fontSize:10,color:theme.muted }}>{label(locale,'Latest data shown','آخرین داده‌ها نمایش داده شده‌اند')}</Typography>}</Box>;
}

function MaterialClock({ theme, locale, size }: Props) {
  const p=profile(size);
  return <Box sx={{ height:'100%',display:'grid',placeItems:'center',textAlign:'center' }}><Box><Typography sx={{ fontSize:p.large?58:p.compact?38:48,fontWeight:500,letterSpacing:'-.055em',direction:'ltr' }}>09:44</Typography><Typography sx={{ mt:.35,fontSize:11,color:theme.muted }}>{locale==='fa'?'چهارشنبه، ۱۵ مهر ۱۴۰۵':'Wednesday, Oct 7'}</Typography>{p.large&&<Box sx={{ mt:1 }}><ToneBadge text="UTC +03:30" tone="neutral" theme={theme}/></Box>}</Box></Box>;
}

function MaterialText({ theme, locale, size }: Props) {
  const p=profile(size);
  return <Box sx={{ height:'100%',display:'flex',flexDirection:'column',justifyContent:p.large?'flex-start':'center',direction:locale==='fa'?'rtl':'ltr',textAlign:locale==='fa'?'right':'left' }}><Typography sx={{ fontSize:p.large?24:19,fontWeight:850 }}>{label(locale,'Server room status','وضعیت اتاق سرور')}</Typography><Typography sx={{ mt:1,fontSize:12,color:theme.muted,lineHeight:1.85 }}>{label(locale,'All sensors are within their normal ranges. Latest telemetry was received less than a minute ago.','همه سنسورها در محدوده عادی هستند. آخرین بسته داده کمتر از یک دقیقه قبل دریافت شده است.')}</Typography>{p.large&&<Box sx={{ mt:1.4,display:'grid',gridTemplateColumns:'1fr 1fr',gap:.75,direction:'ltr' }}><StatBox label="SENSORS" value="12 online" theme={theme} accent/><StatBox label="LAST UPDATE" value="38 sec" theme={theme}/></Box>}</Box>;
}

function MaterialImage({ theme, size }: Props) {
  const p=profile(size);
  return <Box sx={{ height:'100%',minHeight:0,borderRadius:1.5,position:'relative',overflow:'hidden',background:'linear-gradient(135deg,#0f172a,#1e293b 45%,#334155)',border:`1px solid ${theme.border}` }}><Box sx={{ position:'absolute',inset:0,background:'radial-gradient(circle at 70% 25%,rgba(255,255,255,.24),transparent 20%)' }}/><Box sx={{ position:'absolute',left:10,top:10 }}><ToneBadge text="LIVE" tone="danger" theme={theme}/></Box><Box sx={{ position:'absolute',left:'12%',right:'12%',bottom:'14%',height:p.large?'48%':'42%',border:'1px solid rgba(255,255,255,.38)',borderRadius:'48% 48% 10% 10%' }}/><Typography sx={{ position:'absolute',left:10,bottom:8,fontSize:9.5,color:'#fff',fontWeight:700 }}>Camera snapshot · 09:44:12</Typography></Box>;
}

function MaterialIframe({ theme, locale, size }: Props) {
  const p=profile(size);
  return <Box sx={{ height:'100%',border:`1px solid ${theme.border}`,borderRadius:1.5,overflow:'hidden',bgcolor:'#fbfcff',display:'grid',gridTemplateRows:'28px 1fr' }}><Box sx={{ px:1,display:'flex',alignItems:'center',gap:.45,borderBottom:`1px solid ${theme.border}`,bgcolor:'#f5f7fb' }}>{[0,1,2].map(i=><Box key={i} sx={{ width:6,height:6,borderRadius:'50%',bgcolor:i===0?'#ef4444':i===1?'#f59e0b':'#22c55e' }}/>)}</Box><Box sx={{ display:'grid',placeItems:'center',textAlign:'center',px:2 }}><Box><Typography sx={{ fontSize:p.large?18:14,fontWeight:850 }}>{label(locale,'External content','محتوای خارجی')}</Typography><Typography sx={{ mt:.4,fontSize:10.5,color:theme.muted }}>iframe / embedded app / HTML canvas</Typography></Box></Box></Box>;
}

function MaterialScada({ theme }: Props) {
  return <Box sx={{ height:'100%',minHeight:0,position:'relative',direction:'ltr' }}><svg viewBox="0 0 520 220" width="100%" height="100%"><rect x="15" y="55" width="110" height="105" rx="8" fill={`${theme.accent}0e`} stroke={theme.border}/><text x="70" y="102" textAnchor="middle" fill={theme.foreground} fontSize="14" fontWeight="700">TANK 01</text><text x="70" y="130" textAnchor="middle" fill={theme.accent} fontSize="24" fontWeight="800">63%</text><line x1="125" y1="108" x2="220" y2="108" stroke="#1f2937" strokeWidth="6"/><circle cx="250" cy="108" r="29" fill="#fff" stroke={theme.accent2} strokeWidth="3"/><text x="250" y="113" textAnchor="middle" fill={theme.foreground} fontSize="12" fontWeight="800">PUMP</text><line x1="279" y1="108" x2="375" y2="108" stroke="#1f2937" strokeWidth="6"/><rect x="375" y="68" width="120" height="80" rx="8" fill={`${theme.accent}0c`} stroke={theme.border}/><text x="435" y="102" textAnchor="middle" fill={theme.foreground} fontSize="13" fontWeight="700">VALVE V-02</text><text x="435" y="125" textAnchor="middle" fill={theme.accent} fontSize="13" fontWeight="800">OPEN</text></svg></Box>;
}

export function MaterialVisualRenderer(props: Props) {
  const v = props.def.visual;
  if (v === 'metric') return <MaterialMetric {...props} />;
  if (v === 'gauge') return <MaterialGauge {...props} />;
  if (v === 'battery') return <MaterialBattery {...props} />;
  if (v === 'signal') return <MaterialSignal {...props} />;
  if (v === 'tank') return <MaterialTank {...props} />;
  if (v === 'boolean') return <MaterialBoolean {...props} />;
  if (v === 'alarm-indicator') return <MaterialAlarm {...props} />;
  if (v === 'line' || v === 'area') return <MaterialLineChart {...props} />;
  if (v === 'bar') return <MaterialBar {...props} />;
  if (v === 'histogram') return <MaterialHistogram {...props} />;
  if (v === 'donut') return <MaterialDonut {...props} />;
  if (v === 'heatmap') return <MaterialHeatmap {...props} />;
  if (v === 'timeline') return <MaterialTimeline {...props} />;
  if (v === 'map' || v === 'route') return <MaterialMap {...props} />;
  if (v === 'coordinates') return <MaterialCoordinates {...props} />;
  if (v === 'compass') return <MaterialCompass {...props} />;
  if (v === 'button') return <MaterialButton {...props} />;
  if (v === 'switch') return <MaterialSwitch {...props} />;
  if (v === 'slider') return <MaterialSlider {...props} />;
  if (v === 'input') return <MaterialInput {...props} />;
  if (v === 'thermostat') return <MaterialThermostat {...props} />;
  if (v === 'color') return <MaterialColor {...props} />;
  if (v === 'direction') return <MaterialDirection {...props} />;
  if (v === 'table' || v === 'measurement-list' || v === 'alarms' || v === 'events' || v === 'logs') return <MaterialTable {...props} mode={v} />;
  if (v === 'clock') return <MaterialClock {...props} />;
  if (v === 'text') return <MaterialText {...props} />;
  if (v === 'image') return <MaterialImage {...props} />;
  if (v === 'iframe') return <MaterialIframe {...props} />;
  if (v === 'scada') return <MaterialScada {...props} />;
  return <Box sx={{ height:'100%',display:'grid',placeItems:'center',color:props.theme.muted }}><Typography sx={{ fontSize:12 }}>Unsupported material visual: {v}</Typography></Box>;
}
