import { useMemo, useState, type ReactNode } from 'react';
import {
  Box,
  Button,
  IconButton,
  Slider,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import Add from '@mui/icons-material/Add';
import Check from '@mui/icons-material/Check';
import Remove from '@mui/icons-material/Remove';
import PowerSettingsNew from '@mui/icons-material/PowerSettingsNew';
import type { Locale, WidgetDefinition, WidgetSize, WidgetThemeTokens } from '../core/types';
import { bars, heat, spark, spark2 } from '../data/mockData';

interface Props {
  def: WidgetDefinition;
  theme: WidgetThemeTokens;
  locale: Locale;
  size: WidgetSize;
}

type TableMode = 'table' | 'measurement-list' | 'alarms' | 'events' | 'logs';

const C = {
  blue: '#0A84FF',
  green: '#30D158',
  orange: '#FF9F0A',
  red: '#FF453A',
  purple: '#BF5AF2',
  cyan: '#64D2FF',
  label: '#1C1C1E',
  secondary: '#636366',
  tertiary: '#8E8E93',
  separator: 'rgba(60,60,67,.14)',
  fill: 'rgba(118,118,128,.10)',
  fillStrong: 'rgba(118,118,128,.16)',
  surface: 'rgba(255,255,255,.72)',
};

const n = (value: unknown, fallback = 0) => typeof value === 'number' ? value : fallback;
const s = (value: unknown, fallback = '') => typeof value === 'string' ? value : fallback;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function sizeProfile(size: WidgetSize) {
  const [w, h] = size.split('x').map(Number);
  const area = w * h;
  return {
    w,
    h,
    area,
    compact: w === 1 && h === 1,
    wide: w > h,
    tall: h > w,
    large: area >= 4,
    roomy: area >= 4 || w >= 3 || h >= 2,
    veryLarge: area >= 6,
  };
}

function localeText(locale: Locale, en: string, fa: string) {
  return locale === 'fa' ? fa : en;
}

function Sparkline({
  values = spark,
  color = C.blue,
  fill = false,
  height = 66,
  grid = false,
}: {
  values?: number[];
  color?: string;
  fill?: boolean;
  height?: number;
  grid?: boolean;
}) {
  const points = useMemo(() => {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(1, max - min);
    return values.map((v, i) => `${(i / Math.max(1, values.length - 1)) * 100},${36 - ((v - min) / range) * 27}`).join(' ');
  }, [values]);
  const last = points.split(' ').at(-1)?.split(',') ?? ['100', '20'];

  return <svg viewBox="0 0 100 42" preserveAspectRatio="none" width="100%" height={height} aria-hidden>
    {grid && <>
      <line x1="0" x2="100" y1="10" y2="10" stroke="rgba(60,60,67,.10)" strokeWidth=".45" />
      <line x1="0" x2="100" y1="24" y2="24" stroke="rgba(60,60,67,.10)" strokeWidth=".45" />
      <line x1="0" x2="100" y1="38" y2="38" stroke="rgba(60,60,67,.10)" strokeWidth=".45" />
    </>}
    {fill && <polygon points={`0,42 ${points} 100,42`} fill={color} opacity=".09" />}
    <polyline points={points} fill="none" stroke={color} strokeWidth="2.2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx={last[0]} cy={last[1]} r="1.8" fill="#fff" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
  </svg>;
}

function ValueText({ value, unit, compact = false, large = false }: { value: string | number; unit?: string; compact?: boolean; large?: boolean }) {
  return <Typography sx={{
    direction: 'ltr',
    fontSize: compact ? 35 : large ? 46 : 40,
    fontWeight: 720,
    lineHeight: .9,
    letterSpacing: '-.045em',
    color: C.label,
    fontVariantNumeric: 'tabular-nums',
  }}>
    {value}
    {!!unit && <Box component="span" sx={{ ml: .55, fontSize: compact ? 12 : 14, fontWeight: 620, letterSpacing: 0, color: C.tertiary }}>{unit}</Box>}
  </Typography>;
}

function MicroLabel({ children, tone = C.tertiary }: { children: ReactNode; tone?: string }) {
  return <Typography sx={{ fontSize: 10.5, lineHeight: 1.2, fontWeight: 650, color: tone, letterSpacing: .05 }}>{children}</Typography>;
}

function StatCell({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return <Box sx={{ minWidth: 0 }}>
    <MicroLabel>{label}</MicroLabel>
    <Typography sx={{ mt: .25, fontSize: 13.5, lineHeight: 1.1, fontWeight: 700, color: accent ?? C.label, direction: 'ltr', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</Typography>
  </Box>;
}

function SegmentedBar({ value, max = 100, tone = C.blue, segments = 10 }: { value: number; max?: number; tone?: string; segments?: number }) {
  const lit = Math.round(clamp(value / Math.max(1, max), 0, 1) * segments);
  return <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${segments},1fr)`, gap: .45 }}>
    {Array.from({ length: segments }).map((_, i) => <Box key={i} sx={{ height: 5, borderRadius: 1, bgcolor: i < lit ? tone : 'rgba(118,118,128,.14)' }} />)}
  </Box>;
}

function SectionDivider() {
  return <Box sx={{ height: '1px', bgcolor: C.separator }} />;
}

function Metric({ def, locale, size }: Props) {
  const p = sizeProfile(size);
  const value = n(def.mock.value, 24.8);
  const unit = s(def.mock.unit);
  const trend = n(def.mock.trend, 2.4);
  const values = (def.mock.values as number[] | undefined) ?? (trend >= 0 ? spark : spark2);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const trendTone = trend >= 0 ? C.green : C.orange;
  const trendText = `${trend >= 0 ? '↑' : '↓'} ${Math.abs(trend)}%`;

  if (p.compact) return <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 0, direction: 'ltr' }}>
    <Box>
      <ValueText value={value} unit={unit} compact />
      <Typography sx={{ mt: .8, fontSize: 11.5, fontWeight: 700, color: trendTone }}>{trendText}<Box component="span" sx={{ color: C.tertiary, fontWeight: 600 }}> · 24h</Box></Typography>
    </Box>
    <Box sx={{ mt: .8 }}><Sparkline values={values} color={C.blue} height={42} /></Box>
  </Box>;

  if (p.wide && !p.large) return <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: 'minmax(130px,.78fr) minmax(0,1.22fr)', gap: 2, alignItems: 'center', direction: 'ltr' }}>
    <Box sx={{ minWidth: 0 }}>
      <ValueText value={value} unit={unit} />
      <Typography sx={{ mt: .8, fontSize: 11.5, fontWeight: 700, color: trendTone }}>{trendText}<Box component="span" sx={{ color: C.tertiary, fontWeight: 600 }}> · {localeText(locale, 'since yesterday', 'نسبت به دیروز')}</Box></Typography>
    </Box>
    <Box sx={{ minWidth: 0 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: .25 }}><MicroLabel>{localeText(locale, '24 hour trend', 'روند ۲۴ ساعت')}</MicroLabel><MicroLabel>{`${min}–${max}`}</MicroLabel></Box>
      <Sparkline values={values} color={C.blue} height={72} grid />
    </Box>
  </Box>;

  return <Box sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', direction: locale === 'fa' ? 'rtl' : 'ltr' }}>
    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, direction: 'ltr' }}>
      <Box><ValueText value={value} unit={unit} large={p.large} /><Typography sx={{ mt: .8, fontSize: 11.5, fontWeight: 700, color: trendTone }}>{trendText} · 24h</Typography></Box>
      {p.roomy && <Box sx={{ textAlign: 'right' }}><MicroLabel>{localeText(locale, 'Updated now', 'به‌روزرسانی اکنون')}</MicroLabel><Typography sx={{ mt: .25, fontSize: 12, fontWeight: 650, color: C.secondary }}>{localeText(locale, 'Stable', 'پایدار')}</Typography></Box>}
    </Box>
    <Box sx={{ flex: 1, minHeight: p.large ? 112 : 78, mt: p.tall ? 2 : 1.2, display: 'flex', alignItems: 'flex-end' }}><Sparkline values={values} color={C.blue} height={p.large ? 126 : p.tall ? 108 : 82} grid fill /></Box>
    {p.roomy && <><SectionDivider /><Box sx={{ pt: 1.05, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1.2, direction: 'ltr' }}><StatCell label={localeText(locale, 'Low', 'کمینه')} value={`${min}${unit ? ` ${unit}` : ''}`} /><StatCell label={localeText(locale, 'Average', 'میانگین')} value={`${avg.toFixed(1)}${unit ? ` ${unit}` : ''}`} /><StatCell label={localeText(locale, 'High', 'بیشینه')} value={`${max}${unit ? ` ${unit}` : ''}`} /></Box></>}
  </Box>;
}

function Battery({ def, locale, size }: Props) {
  const p = sizeProfile(size);
  const value = clamp(n(def.mock.value, 76), 0, 100);
  const voltage = s(def.mock.voltage, '3.94 V');
  const remain = s(def.mock.remaining, '8h 42m');
  const tone = value < 20 ? C.red : value < 45 ? C.orange : C.green;

  const battery = <Box sx={{ position: 'relative', width: p.compact ? 108 : p.tall ? 112 : 126, height: p.compact ? 48 : 54, border: '2px solid rgba(28,28,30,.78)', borderRadius: '12px', p: .45, flex: '0 0 auto', '&:after': { content: '""', position: 'absolute', right: -7, top: '31%', width: 5, height: '38%', bgcolor: 'rgba(28,28,30,.72)', borderRadius: '0 3px 3px 0' } }}>
    <Box sx={{ height: '100%', width: `${Math.max(5, value)}%`, maxWidth: '100%', borderRadius: '7px', bgcolor: tone, transition: 'width .2s ease' }} />
  </Box>;

  if (p.compact) return <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1.2, direction: 'ltr' }}>
    <ValueText value={`${value}%`} compact />
    {battery}
    <MicroLabel>{remain} {localeText(locale, 'remaining', 'باقی‌مانده')}</MicroLabel>
  </Box>;

  return <Box sx={{ height: '100%', display: p.wide ? 'grid' : 'flex', gridTemplateColumns: p.wide ? 'auto 1fr' : undefined, flexDirection: p.wide ? undefined : 'column', alignItems: p.wide ? 'center' : 'stretch', justifyContent: 'center', gap: p.wide ? 2.2 : 1.5, direction: 'ltr' }}>
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: p.wide ? 'flex-start' : 'center', gap: 1 }}>{battery}<Typography sx={{ fontSize: 30, fontWeight: 720, lineHeight: 1, letterSpacing: '-.04em' }}>{value}%</Typography></Box>
    <Box sx={{ minWidth: 0 }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: p.large ? 'repeat(2,1fr)' : '1fr', gap: .9 }}><StatCell label={localeText(locale, 'Voltage', 'ولتاژ')} value={voltage} /><StatCell label={localeText(locale, 'Estimated', 'زمان تخمینی')} value={remain} /></Box>
      <Box sx={{ mt: 1.2 }}><SegmentedBar value={value} tone={tone} /></Box>
      {p.roomy && <Typography sx={{ mt: .95, fontSize: 11, color: C.tertiary }}>{value > 60 ? localeText(locale, 'Battery health looks normal', 'سلامت باتری عادی است') : localeText(locale, 'Consider charging soon', 'به‌زودی شارژ کنید')}</Typography>}
    </Box>
  </Box>;
}

function Signal({ def, locale, size }: Props) {
  const p = sizeProfile(size);
  const value = n(def.mock.value, -72);
  const barsOn = value > -60 ? 5 : value > -70 ? 4 : value > -80 ? 3 : value > -90 ? 2 : 1;
  const quality = barsOn >= 4 ? localeText(locale, 'Strong', 'قوی') : barsOn >= 3 ? localeText(locale, 'Good', 'خوب') : barsOn >= 2 ? localeText(locale, 'Fair', 'متوسط') : localeText(locale, 'Weak', 'ضعیف');
  const history = [-88, -82, -76, -72, -75, -69, -71, -68, -72, -70, -73, value];

  const barsView = <Box sx={{ height: p.compact ? 48 : 62, display: 'flex', alignItems: 'flex-end', gap: p.compact ? .65 : .8 }}>
    {[1, 2, 3, 4, 5].map(i => <Box key={i} sx={{ width: p.compact ? 9 : 11, height: 8 + i * (p.compact ? 7 : 9), borderRadius: '3px 3px 1px 1px', bgcolor: i <= barsOn ? C.blue : 'rgba(118,118,128,.16)' }} />)}
  </Box>;

  if (p.compact) return <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'center', gap: 1.3, direction: 'ltr' }}>{barsView}<Box><Typography sx={{ fontSize: 25, lineHeight: 1, fontWeight: 720 }}>{value}<Box component="span" sx={{ fontSize: 11.5, ml: .4, color: C.tertiary }}>dBm</Box></Typography><Typography sx={{ mt: .6, fontSize: 11.5, color: C.green, fontWeight: 700 }}>{quality}</Typography></Box></Box>;

  return <Box sx={{ height: '100%', display: p.wide ? 'grid' : 'flex', gridTemplateColumns: p.wide ? 'minmax(150px,.8fr) minmax(0,1.2fr)' : undefined, flexDirection: p.wide ? undefined : 'column', alignItems: p.wide ? 'center' : 'stretch', gap: 1.8, direction: 'ltr' }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4 }}>{barsView}<Box><ValueText value={value} unit="dBm" /><Typography sx={{ mt: .5, fontSize: 11.5, color: C.green, fontWeight: 700 }}>{quality} · {s(def.mock.network, 'LTE · RSRP')}</Typography></Box></Box>
    <Box sx={{ minWidth: 0, flex: 1 }}><Box sx={{ display: 'flex', justifyContent: 'space-between' }}><MicroLabel>{localeText(locale, 'Signal history', 'تاریخچه سیگنال')}</MicroLabel><MicroLabel>-95 … -55</MicroLabel></Box><Sparkline values={history} color={C.blue} height={p.large ? 104 : 72} grid />{p.roomy && <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1 }}><StatCell label="RSRP" value={`${value} dBm`} /><StatCell label="RSRQ" value="-9 dB" /><StatCell label="SINR" value="18 dB" /></Box>}</Box>
  </Box>;
}

function Tank({ def, locale, size }: Props) {
  const p = sizeProfile(size);
  const value = clamp(n(def.mock.value, 63), 0, 100);
  const liters = s(def.mock.liters, `${Math.round(value * 20)} L`);
  const tone = value < 18 ? C.orange : C.blue;
  const tankW = p.compact ? 68 : p.tall ? 108 : 88;
  const tankH = p.compact ? 92 : p.tall ? 174 : 126;
  const tank = <Box sx={{ width: tankW, height: tankH, border: '2px solid rgba(60,60,67,.30)', borderRadius: '17px 17px 13px 13px', p: .55, position: 'relative', overflow: 'hidden', bgcolor: 'rgba(255,255,255,.52)', boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.7)' }}>
    <Box sx={{ position: 'absolute', left: 5, right: 5, bottom: 5, height: `calc(${value}% - 5px)`, minHeight: 4, borderRadius: '10px 10px 8px 8px', bgcolor: `${tone}d9`, transition: 'height .25s ease', '&:before': { content: '""', position: 'absolute', left: -4, right: -4, top: -6, height: 12, borderRadius: '50%', bgcolor: tone, opacity: .95 } }} />
    {!p.compact && [25, 50, 75].map(mark => <Box key={mark} sx={{ position: 'absolute', right: 7, bottom: `calc(${mark}% - 1px)`, width: 7, height: 1, bgcolor: 'rgba(28,28,30,.24)' }} />)}
  </Box>;

  if (p.compact) return <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.3, direction: 'ltr' }}>{tank}<Box><ValueText value={`${value}%`} compact /><MicroLabel>{liters}</MicroLabel></Box></Box>;

  return <Box sx={{ height: '100%', display: p.tall ? 'flex' : 'grid', flexDirection: p.tall ? 'column' : undefined, gridTemplateColumns: p.tall ? undefined : 'auto 1fr', justifyContent: 'center', alignItems: 'center', gap: p.tall ? 1.5 : 2.1, direction: 'ltr' }}>{tank}<Box sx={{ width: p.tall ? '100%' : 'auto', minWidth: 0 }}><ValueText value={`${value}%`} large={p.large} /><Typography sx={{ mt: .55, fontSize: 13, fontWeight: 650, color: C.secondary }}>{liters}</Typography><Box sx={{ mt: 1.3, display: 'grid', gridTemplateColumns: p.large ? 'repeat(2,1fr)' : '1fr', gap: 1 }}><StatCell label={localeText(locale, 'Capacity', 'ظرفیت')} value="2,000 L" /><StatCell label={localeText(locale, 'Reserve', 'ذخیره')} value={`${100 - value}%`} /></Box>{p.roomy && <Box sx={{ mt: 1.2 }}><SegmentedBar value={value} tone={tone} segments={8} /></Box>}</Box></Box>;
}

function BooleanStatus({ def, locale, size }: Props) {
  const p = sizeProfile(size);
  const [on, setOn] = useState(Boolean(def.mock.value ?? true));
  const Icon = def.icon;
  const label = on ? localeText(locale, 'Active', 'فعال') : localeText(locale, 'Inactive', 'غیرفعال');
  const tone = on ? C.blue : C.tertiary;
  return <Box onClick={() => setOn(v => !v)} role="button" tabIndex={0} sx={{ height: '100%', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 1, userSelect: 'none', direction: locale === 'fa' ? 'rtl' : 'ltr' }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
      <Box sx={{ width: p.compact ? 46 : 54, height: p.compact ? 46 : 54, borderRadius: '15px', display: 'grid', placeItems: 'center', bgcolor: on ? tone : C.fillStrong, color: on ? '#fff' : C.secondary, transition: '.18s ease' }}><Icon sx={{ fontSize: p.compact ? 23 : 27 }} /></Box>
      {!p.compact && <Switch checked={on} onChange={(_, v) => setOn(v)} onClick={e => e.stopPropagation()} size="small" sx={{ mt: .2, '& .MuiSwitch-switchBase.Mui-checked': { color: '#fff' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: C.green, opacity: 1 }, '& .MuiSwitch-track': { bgcolor: '#C7C7CC', opacity: 1 } }} />}
    </Box>
    <Box><Typography sx={{ fontSize: p.compact ? 20 : 24, fontWeight: 720, lineHeight: 1, color: C.label }}>{label}</Typography><Typography sx={{ mt: .55, fontSize: 11.5, color: C.tertiary }}>{on ? localeText(locale, 'Tap to turn off', 'برای خاموش کردن بزنید') : localeText(locale, 'Tap to turn on', 'برای روشن کردن بزنید')}</Typography>{p.roomy && <Box sx={{ mt: 1.1 }}><SectionDivider /><Box sx={{ pt: .9, display: 'flex', justifyContent: 'space-between' }}><MicroLabel>{localeText(locale, 'State', 'وضعیت')}</MicroLabel><MicroLabel tone={on ? C.green : C.tertiary}>{on ? 'ON' : 'OFF'}</MicroLabel></Box></Box>}</Box>
  </Box>;
}

function Gauge({ def, locale, size }: Props) {
  const p = sizeProfile(size);
  const value = n(def.mock.value, 68);
  const max = n(def.mock.max, 100);
  const unit = s(def.mock.unit);
  const pct = clamp(value / Math.max(1, max), 0, 1);
  const warn = pct > .78;
  const danger = pct > .9;
  const tone = danger ? C.red : warn ? C.orange : C.blue;
  const status = danger ? localeText(locale, 'Critical', 'بحرانی') : warn ? localeText(locale, 'High', 'بالا') : localeText(locale, 'Normal', 'عادی');

  if (p.compact) return <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1.2, direction: 'ltr' }}><ValueText value={value} unit={unit} compact /><Box><SegmentedBar value={value} max={max} tone={tone} segments={12} /><Box sx={{ mt: .65, display: 'flex', justifyContent: 'space-between' }}><MicroLabel>0</MicroLabel><MicroLabel tone={tone}>{status}</MicroLabel><MicroLabel>{max}</MicroLabel></Box></Box></Box>;

  const angle = -120 + pct * 240;
  return <Box sx={{ height: '100%', display: p.wide && !p.large ? 'grid' : 'flex', gridTemplateColumns: p.wide && !p.large ? 'minmax(120px,.75fr) minmax(160px,1.25fr)' : undefined, flexDirection: p.wide && !p.large ? undefined : 'column', alignItems: 'center', justifyContent: 'center', gap: p.wide ? 1.3 : .8, direction: 'ltr' }}>
    <Box sx={{ minWidth: 0, alignSelf: p.wide && !p.large ? 'center' : 'stretch' }}><ValueText value={value} unit={unit} large={p.large} /><Typography sx={{ mt: .7, fontSize: 11.5, fontWeight: 700, color: tone }}>{status}</Typography>{p.roomy && <Typography sx={{ mt: .45, fontSize: 10.5, color: C.tertiary }}>{localeText(locale, 'Operating range', 'بازه کاری')} 0–{max} {unit}</Typography>}</Box>
    <Box sx={{ width: '100%', maxWidth: p.large ? 280 : 230, minWidth: 0 }}><svg viewBox="0 0 220 132" width="100%" aria-hidden style={{ display: 'block' }}>
      <path d="M30 110 A80 80 0 0 1 190 110" fill="none" stroke="rgba(118,118,128,.13)" strokeWidth="18" strokeLinecap="round" />
      <path d="M30 110 A80 80 0 0 1 190 110" fill="none" stroke={tone} strokeWidth="18" strokeLinecap="round" pathLength="100" strokeDasharray={`${pct * 100} 100`} />
      {[0, .25, .5, .75, 1].map((t, i) => {
        const a = (-180 + t * 180) * Math.PI / 180;
        const x1 = 110 + 68 * Math.cos(a), y1 = 110 + 68 * Math.sin(a);
        const x2 = 110 + 76 * Math.cos(a), y2 = 110 + 76 * Math.sin(a);
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(60,60,67,.36)" strokeWidth="2" strokeLinecap="round" />;
      })}
      <line x1="110" y1="110" x2={110 + 50 * Math.cos(angle * Math.PI / 180)} y2={110 + 50 * Math.sin(angle * Math.PI / 180)} stroke={C.label} strokeWidth="3" strokeLinecap="round" />
      <circle cx="110" cy="110" r="6" fill={C.label} />
    </svg></Box>
    {p.large && <Box sx={{ width: '100%', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, mt: .3 }}><StatCell label={localeText(locale, 'Low', 'کمینه')} value={`0 ${unit}`} /><StatCell label={localeText(locale, 'Current', 'فعلی')} value={`${value} ${unit}`} accent={tone} /><StatCell label={localeText(locale, 'Limit', 'حد')} value={`${max} ${unit}`} /></Box>}
  </Box>;
}

function chartSummary(def: WidgetDefinition) {
  if (typeof def.mock.summary === 'string') return def.mock.summary;
  const value = def.mock.value;
  const unit = s(def.mock.unit);
  if (typeof value === 'number') return `${value}${unit ? ` ${unit}` : ''}`;
  return def.visual === 'area' ? '18.7 kWh' : '24.8 °C';
}

function LineChartVisual({ def, locale, size }: Props) {
  const p = sizeProfile(size);
  const values = (def.mock.values as number[] | undefined) ?? (def.visual === 'area' ? spark2 : spark);
  const last = values.at(-1) ?? 0;
  const first = values[0] ?? last;
  const delta = first === 0 ? 0 : ((last - first) / Math.abs(first)) * 100;
  return <Box sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', direction: 'ltr' }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}><Box><Typography sx={{ fontSize: p.large ? 29 : 24, fontWeight: 720, lineHeight: 1, letterSpacing: '-.025em' }}>{chartSummary(def)}</Typography><Typography sx={{ mt: .55, fontSize: 11, fontWeight: 680, color: delta >= 0 ? C.green : C.orange }}>{delta >= 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(1)}% <Box component="span" sx={{ color: C.tertiary, fontWeight: 600 }}>· 24h</Box></Typography></Box><MicroLabel>{localeText(locale, 'Today', 'امروز')}</MicroLabel></Box>
    <Box sx={{ flex: 1, minHeight: p.large ? 130 : 94, mt: .6, display: 'flex', alignItems: 'flex-end' }}><Sparkline values={values} color={C.blue} fill={def.visual === 'area'} height={p.large ? 150 : p.tall ? 124 : 96} grid /></Box>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', color: C.tertiary, fontSize: 10, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}><span>00</span><span>06</span><span>12</span><span>18</span><span>24</span></Box>
    {p.large && <Box sx={{ mt: 1.05 }}><SectionDivider /><Box sx={{ pt: .95, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)' }}><StatCell label={localeText(locale, 'Minimum', 'کمینه')} value={`${Math.min(...values)}`} /><StatCell label={localeText(locale, 'Average', 'میانگین')} value={`${(values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)}`} /><StatCell label={localeText(locale, 'Maximum', 'بیشینه')} value={`${Math.max(...values)}`} /></Box></Box>}
  </Box>;
}

function BarVisual({ def, locale, size }: Props) {
  const p = sizeProfile(size);
  const values = (def.mock.values as number[] | undefined) ?? bars;
  const max = Math.max(...values);
  const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', direction: 'ltr' }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><Typography sx={{ fontSize: 16, fontWeight: 720 }}>{s(def.mock.summary, localeText(locale, 'Weekly total', 'مجموع هفتگی'))}</Typography><MicroLabel>7d</MicroLabel></Box>
    <Box sx={{ flex: 1, minHeight: p.large ? 150 : 105, mt: 1, display: 'flex', alignItems: 'flex-end', gap: p.large ? 1.05 : .75 }}>
      {values.map((v, i) => <Box key={i} sx={{ flex: 1, height: `${Math.max(8, v / max * 100)}%`, minHeight: 8, borderRadius: '5px 5px 2px 2px', bgcolor: i === values.length - 2 ? C.green : C.blue, opacity: i === values.length - 2 ? 1 : .36 + i * .08, position: 'relative' }}>{p.large && <Typography sx={{ position: 'absolute', bottom: '100%', left: '50%', transform: 'translateX(-50%)', mb: .35, fontSize: 9.5, color: C.tertiary }}>{v}</Typography>}</Box>)}
    </Box>
    <Box sx={{ mt: .55, display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', textAlign: 'center', fontSize: 9.5, color: C.tertiary }}>{labels.map((x, i) => <span key={i}>{x}</span>)}</Box>
  </Box>;
}

function Histogram({ locale, size }: Props) {
  const p = sizeProfile(size);
  const values = [2, 5, 9, 15, 20, 17, 12, 8, 4, 2];
  const max = Math.max(...values);
  return <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', direction: 'ltr' }}><Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography sx={{ fontSize: 16, fontWeight: 720 }}>{localeText(locale, 'Distribution', 'توزیع')}</Typography><MicroLabel>n=94</MicroLabel></Box><Box sx={{ flex: 1, minHeight: p.large ? 155 : 108, mt: 1, display: 'flex', alignItems: 'flex-end' }}>{values.map((v, i) => <Box key={i} sx={{ flex: 1, height: `${v / max * 100}%`, minHeight: 4, bgcolor: C.blue, opacity: .2 + v / max * .8, borderLeft: i === 0 ? 0 : '1px solid rgba(255,255,255,.65)' }} />)}</Box><Box sx={{ mt: .55, display: 'flex', justifyContent: 'space-between' }}><MicroLabel>Low</MicroLabel><MicroLabel>Median</MicroLabel><MicroLabel>High</MicroLabel></Box></Box>;
}

function Donut({ def, locale, size }: Props) {
  const p = sizeProfile(size);
  const value = clamp(n(def.mock.value, 72), 0, 100);
  const r = 42;
  const c = 2 * Math.PI * r;
  const diameter = p.large ? 176 : p.compact ? 130 : 150;
  return <Box sx={{ height: '100%', display: p.wide && !p.large ? 'grid' : 'flex', gridTemplateColumns: p.wide && !p.large ? 'auto 1fr' : undefined, flexDirection: p.wide && !p.large ? undefined : 'column', alignItems: 'center', justifyContent: 'center', gap: 1.6, direction: 'ltr' }}>
    <Box sx={{ width: diameter, height: diameter, flex: '0 0 auto' }}><svg viewBox="0 0 120 120" width="100%" height="100%"><circle cx="60" cy="60" r={r} fill="none" stroke="rgba(118,118,128,.12)" strokeWidth="12" /><circle cx="60" cy="60" r={r} fill="none" stroke={C.blue} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${c * value / 100} ${c}`} transform="rotate(-90 60 60)" /><text x="60" y="57" textAnchor="middle" dominantBaseline="middle" fill={C.label} fontSize="22" fontWeight="720">{value}%</text><text x="60" y="77" textAnchor="middle" fill={C.tertiary} fontSize="10.5">{localeText(locale, 'used', 'مصرف')}</text></svg></Box>
    {!p.compact && <Box sx={{ minWidth: p.wide ? 120 : 180, width: p.wide ? 'auto' : '100%' }}><Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: .6 }}><Box sx={{ display: 'flex', alignItems: 'center', gap: .7 }}><Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: C.blue }} /><MicroLabel>{localeText(locale, 'Used', 'مصرف‌شده')}</MicroLabel></Box><Typography sx={{ fontSize: 12, fontWeight: 700 }}>{value}%</Typography></Box><SectionDivider /><Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: .6 }}><Box sx={{ display: 'flex', alignItems: 'center', gap: .7 }}><Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'rgba(118,118,128,.18)' }} /><MicroLabel>{localeText(locale, 'Available', 'آزاد')}</MicroLabel></Box><Typography sx={{ fontSize: 12, fontWeight: 700 }}>{100 - value}%</Typography></Box></Box>}
  </Box>;
}

function Heatmap({ locale, size }: Props) {
  const p = sizeProfile(size);
  const flat = heat.flat();
  return <Box sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', direction: 'ltr' }}><Box sx={{ display: 'flex', justifyContent: 'space-between', mb: .8 }}><Typography sx={{ fontSize: 15.5, fontWeight: 720 }}>{localeText(locale, 'Activity', 'شدت فعالیت')}</Typography><MicroLabel>{localeText(locale, 'Last 4 weeks', '۴ هفته اخیر')}</MicroLabel></Box><Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gridTemplateRows: 'repeat(4,1fr)', gap: p.large ? .75 : .55, minHeight: 0 }}>{flat.map((v, i) => <Box key={i} sx={{ minHeight: 14, borderRadius: '4px', bgcolor: `rgba(48,209,88,${.08 + v * .74})`, border: '1px solid rgba(60,60,67,.05)' }} />)}</Box><Box sx={{ mt: .7, display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', textAlign: 'center', fontSize: 9.5, color: C.tertiary }}><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></Box></Box>;
}

function TimelineVisual({ locale, size }: Props) {
  const p = sizeProfile(size);
  const rows = [
    { name: localeText(locale, 'Line 1', 'خط ۱'), segments: [C.green, C.green, C.orange, C.green, C.red] },
    { name: localeText(locale, 'Line 2', 'خط ۲'), segments: [C.green, C.green, C.green, C.tertiary, C.green] },
    { name: localeText(locale, 'Pump', 'پمپ'), segments: [C.tertiary, C.green, C.green, C.green, C.orange] },
  ];
  return <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: p.large ? 1.45 : 1.05, direction: 'ltr' }}>{rows.map((row, idx) => <Box key={idx} sx={{ display: 'grid', gridTemplateColumns: p.large ? '72px 1fr' : '56px 1fr', gap: 1, alignItems: 'center' }}><Typography sx={{ fontSize: 10.5, color: C.tertiary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.name}</Typography><Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: .45 }}>{row.segments.map((seg, i) => <Box key={i} sx={{ height: p.large ? 18 : 13, borderRadius: '3px', bgcolor: seg }} />)}</Box></Box>)}<Box sx={{ display: 'flex', justifyContent: 'space-between', pl: p.large ? '80px' : '64px', color: C.tertiary, fontSize: 9.5, mt: .15 }}><span>00</span><span>06</span><span>12</span><span>18</span><span>24</span></Box>{p.large && <Box sx={{ display: 'flex', gap: 1.2, pl: '80px', mt: .25 }}><LegendDot tone={C.green} label={localeText(locale, 'Running', 'فعال')} /><LegendDot tone={C.orange} label={localeText(locale, 'Warning', 'هشدار')} /><LegendDot tone={C.red} label={localeText(locale, 'Fault', 'خطا')} /></Box>}</Box>;
}

function LegendDot({ tone, label }: { tone: string; label: string }) {
  return <Box sx={{ display: 'flex', alignItems: 'center', gap: .45 }}><Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: tone }} /><MicroLabel>{label}</MicroLabel></Box>;
}

function MapVisual({ def, locale, size }: Props) {
  const p = sizeProfile(size);
  const isRoute = def.visual === 'route';
  return <Box sx={{ height: '100%', minHeight: 0, borderRadius: '14px', overflow: 'hidden', position: 'relative', border: '1px solid rgba(60,60,67,.12)', bgcolor: '#E9EEF3', direction: 'ltr' }}>
    <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#eef3f6,#e5eaef)' }} />
    <svg viewBox="0 0 520 300" preserveAspectRatio="none" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
      <path d="M-30 65 C80 15 120 130 225 95 S390 25 560 70" fill="none" stroke="rgba(255,255,255,.9)" strokeWidth="18" />
      <path d="M-20 210 C90 160 150 235 245 185 S385 140 545 205" fill="none" stroke="rgba(255,255,255,.82)" strokeWidth="13" />
      <path d="M35 -20 C95 70 40 170 120 330" fill="none" stroke="rgba(255,255,255,.72)" strokeWidth="10" />
      <path d="M430 -30 C370 60 445 160 395 330" fill="none" stroke="rgba(255,255,255,.68)" strokeWidth="9" />
      <path d="M25 225 C105 150 160 170 225 200 S355 230 485 125" fill="none" stroke={C.blue} strokeWidth={isRoute ? 5 : 3} strokeLinecap="round" opacity={isRoute ? .95 : .58} />
      {[[116,171],[226,200],[385,190]].map(([x,y],i)=><g key={i}><circle cx={x} cy={y} r={i===2?12:9} fill="rgba(10,132,255,.16)"/><circle cx={x} cy={y} r={i===2?6:4.5} fill={C.blue}/></g>)}
    </svg>
    <Box sx={{ position: 'absolute', top: 10, left: 10, right: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'none' }}><Box sx={{ px: .9, py: .55, borderRadius: '9px', bgcolor: 'rgba(255,255,255,.88)', boxShadow: '0 2px 8px rgba(15,23,42,.08)' }}><Typography sx={{ fontSize: 10.5, fontWeight: 700, color: C.label }}>{isRoute ? localeText(locale, '12.4 km route', 'مسیر ۱۲٫۴ کیلومتر') : localeText(locale, '3 devices', '۳ دستگاه')}</Typography></Box>{p.large && <Box sx={{ px: .8, py: .45, borderRadius: '8px', bgcolor: 'rgba(255,255,255,.84)' }}><MicroLabel>{localeText(locale, 'Live', 'زنده')}</MicroLabel></Box>}</Box>
    {p.large && <Box sx={{ position: 'absolute', left: 10, bottom: 10, right: 10, display: 'flex', gap: .8 }}><Box sx={{ px: .9, py: .55, borderRadius: '9px', bgcolor: 'rgba(255,255,255,.88)' }}><MicroLabel>{localeText(locale, 'Accuracy 4.2 m', 'دقت ۴٫۲ متر')}</MicroLabel></Box><Box sx={{ px: .9, py: .55, borderRadius: '9px', bgcolor: 'rgba(255,255,255,.88)' }}><MicroLabel>{localeText(locale, 'Updated now', 'به‌روزرسانی اکنون')}</MicroLabel></Box></Box>}
  </Box>;
}

function Coordinates({ def, locale, size }: Props) {
  const p = sizeProfile(size);
  const rows = [
    ['Lat', s(def.mock.lat, '35.7219° N')],
    ['Lng', s(def.mock.lng, '51.3347° E')],
    [localeText(locale, 'Accuracy', 'دقت'), s(def.mock.accuracy, '4.2 m')],
  ];
  return <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', direction: locale === 'fa' ? 'rtl' : 'ltr' }}>
    <Box sx={{ borderTop: `1px solid ${C.separator}`, borderBottom: `1px solid ${C.separator}` }}>{rows.map((row, i) => <Box key={row[0]} sx={{ minHeight: p.compact ? 34 : 40, display: 'grid', gridTemplateColumns: 'minmax(68px,.55fr) minmax(0,1fr)', gap: 1, alignItems: 'center', borderTop: i ? `1px solid ${C.separator}` : 0 }}><Typography sx={{ fontSize: 11, color: C.tertiary, fontWeight: 600 }}>{row[0]}</Typography><Typography sx={{ direction: 'ltr', textAlign: locale === 'fa' ? 'left' : 'right', fontSize: p.compact ? 12 : 13.5, fontWeight: 700, color: C.label, fontVariantNumeric: 'tabular-nums', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row[1]}</Typography></Box>)}</Box>
    {p.roomy && <Box sx={{ mt: 1.2, display: 'flex', alignItems: 'center', gap: .8 }}><Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: C.green }} /><Typography sx={{ fontSize: 11, color: C.secondary }}>{localeText(locale, 'GPS fix · 9 satellites', 'GPS ثابت · ۹ ماهواره')}</Typography></Box>}
  </Box>;
}

function Compass({ def, locale, size }: Props) {
  const p = sizeProfile(size);
  const value = n(def.mock.value, 327);
  const diameter = p.compact ? 128 : p.large ? 190 : 150;
  const compass = <Box sx={{ width: diameter, height: diameter, borderRadius: '50%', border: '1px solid rgba(60,60,67,.16)', position: 'relative', display: 'grid', placeItems: 'center', bgcolor: 'rgba(255,255,255,.38)', flex: '0 0 auto' }}>
    {['N','E','S','W'].map((d,i)=><Typography key={d} sx={{ position: 'absolute', fontSize: 10.5, fontWeight: d==='N'?800:650, color: d==='N'?C.red:C.tertiary, ...(i===0?{top:8}:i===1?{right:10}:i===2?{bottom:8}:{left:10}) }}>{d}</Typography>)}
    <Box sx={{ position: 'absolute', width: 2, height: diameter * .38, bgcolor: C.red, borderRadius: 99, transform: `rotate(${value}deg) translateY(-${diameter * .12}px)`, transformOrigin: '50% 65%' }} />
    <Box sx={{ textAlign: 'center' }}><Typography sx={{ fontSize: p.compact ? 27 : 32, fontWeight: 720, letterSpacing: '-.03em' }}>{value}°</Typography><MicroLabel>{localeText(locale, 'heading', 'جهت')}</MicroLabel></Box>
  </Box>;
  if (p.compact) return <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', direction: 'ltr' }}>{compass}</Box>;
  return <Box sx={{ height: '100%', display: p.wide ? 'grid' : 'flex', gridTemplateColumns: p.wide ? 'auto 1fr' : undefined, flexDirection: p.wide ? undefined : 'column', justifyContent: 'center', alignItems: 'center', gap: 1.6, direction: 'ltr' }}>{compass}<Box sx={{ textAlign: p.wide ? 'left' : 'center' }}><Typography sx={{ fontSize: 20, fontWeight: 720 }}>{localeText(locale, 'North-west', 'شمال‌غربی')}</Typography><Typography sx={{ mt: .5, fontSize: 11.5, color: C.tertiary }}>{localeText(locale, 'Magnetic heading', 'جهت مغناطیسی')}</Typography>{p.roomy && <Box sx={{ mt: 1.2, display: 'grid', gridTemplateColumns: p.wide ? '1fr' : 'repeat(2,1fr)', gap: .8 }}><StatCell label={localeText(locale, 'Accuracy', 'دقت')} value="±2°" /><StatCell label={localeText(locale, 'Bearing', 'سمت')} value={`${value}°`} /></Box>}</Box></Box>;
}

function ButtonControl({ def, locale, size }: Props) {
  const p = sizeProfile(size);
  const [sent, setSent] = useState(false);
  const Icon = def.icon;
  const fire = () => {
    setSent(true);
    window.setTimeout(() => setSent(false), 1300);
  };
  return <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1.15 }}>
    <Button onClick={fire} disableElevation sx={{ minHeight: p.compact ? 70 : p.tall ? 92 : 64, borderRadius: '16px', bgcolor: sent ? C.green : C.blue, color: '#fff', textTransform: 'none', fontWeight: 720, fontSize: p.compact ? 13 : 14, display: 'flex', flexDirection: p.compact ? 'column' : 'row', gap: .8, '&:hover': { bgcolor: sent ? C.green : '#0077E6' } }}><Box sx={{ width: 30, height: 30, borderRadius: '9px', display: 'grid', placeItems: 'center', bgcolor: 'rgba(255,255,255,.16)' }}>{sent ? <Check sx={{ fontSize: 19 }} /> : <Icon sx={{ fontSize: 19 }} />}</Box>{sent ? localeText(locale, 'Command sent', 'فرمان ارسال شد') : localeText(locale, 'Send command', 'ارسال فرمان')}</Button>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, direction: locale === 'fa' ? 'rtl' : 'ltr' }}><MicroLabel>{sent ? localeText(locale, 'Acknowledged locally', 'تأیید محلی') : localeText(locale, 'Ready', 'آماده')}</MicroLabel>{!p.compact && <MicroLabel>RPC</MicroLabel>}</Box>
    {p.roomy && <Box sx={{ mt: .3 }}><SectionDivider /><Box sx={{ pt: .9, display: 'flex', justifyContent: 'space-between' }}><MicroLabel>{localeText(locale, 'Last command', 'آخرین فرمان')}</MicroLabel><Typography sx={{ fontSize: 11, fontWeight: 700, color: C.secondary }}>09:42:18</Typography></Box></Box>}
  </Box>;
}

function SwitchControl({ def, locale, size }: Props) {
  const p = sizeProfile(size);
  const [checked, setChecked] = useState(true);
  const Icon = def.icon;
  return <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 1.2, direction: locale === 'fa' ? 'rtl' : 'ltr' }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1.2 }}><Box sx={{ width: p.compact ? 48 : 56, height: p.compact ? 48 : 56, borderRadius: '16px', display: 'grid', placeItems: 'center', bgcolor: checked ? C.green : C.fillStrong, color: checked ? '#fff' : C.secondary }}><Icon sx={{ fontSize: p.compact ? 23 : 28 }} /></Box><Switch checked={checked} onChange={(_, v) => setChecked(v)} sx={{ transform: p.compact ? 'scale(1.05)' : 'scale(1.18)', '& .MuiSwitch-switchBase.Mui-checked': { color: '#fff' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: C.green, opacity: 1 }, '& .MuiSwitch-track': { bgcolor: '#C7C7CC', opacity: 1 } }} /></Box>
    <Box><Typography sx={{ fontSize: p.compact ? 24 : 28, fontWeight: 720, lineHeight: 1 }}>{checked ? localeText(locale, 'On', 'روشن') : localeText(locale, 'Off', 'خاموش')}</Typography><Typography sx={{ mt: .55, fontSize: 11.5, color: C.tertiary }}>{checked ? localeText(locale, 'Output energized', 'خروجی فعال است') : localeText(locale, 'Output disabled', 'خروجی غیرفعال است')}</Typography></Box>
    {p.roomy && <Box><SectionDivider /><Box sx={{ pt: .9, display: 'flex', justifyContent: 'space-between' }}><MicroLabel>{localeText(locale, 'Control mode', 'حالت کنترل')}</MicroLabel><MicroLabel>Manual</MicroLabel></Box></Box>}
  </Box>;
}

function SliderControl({ def, locale, size }: Props) {
  const p = sizeProfile(size);
  const [value, setValue] = useState(n(def.mock.value, 65));
  const unit = s(def.mock.unit, '%');
  const min = 0, max = 100;
  if (p.tall) return <Box sx={{ height: '100%', display: 'grid', gridTemplateRows: 'auto 1fr auto', justifyItems: 'center', gap: 1.1, direction: 'ltr' }}><Box sx={{ textAlign: 'center' }}><ValueText value={value} unit={unit} /><MicroLabel>{localeText(locale, 'Set level', 'تنظیم سطح')}</MicroLabel></Box><Box sx={{ minHeight: 120, width: 76, borderRadius: '20px', bgcolor: C.fill, display: 'grid', placeItems: 'center', py: 1 }}><Slider orientation="vertical" min={min} max={max} value={value} onChange={(_, v) => setValue(v as number)} sx={{ height: '100%', color: C.blue, '& .MuiSlider-thumb': { width: 22, height: 22, bgcolor: '#fff', border: '1px solid rgba(60,60,67,.12)', boxShadow: '0 2px 8px rgba(0,0,0,.15)' }, '& .MuiSlider-rail': { opacity: .18 }, '& .MuiSlider-track': { border: 0 } }} /></Box><Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}><MicroLabel>0</MicroLabel><MicroLabel>100</MicroLabel></Box></Box>;
  return <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: p.compact ? 1.1 : 1.3, direction: 'ltr' }}><Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 1 }}><ValueText value={value} unit={unit} compact={p.compact} />{!p.compact && <MicroLabel>{localeText(locale, '0 to 100', '۰ تا ۱۰۰')}</MicroLabel>}</Box><Slider min={min} max={max} value={value} onChange={(_, v) => setValue(v as number)} sx={{ color: C.blue, px: .5, '& .MuiSlider-thumb': { width: 22, height: 22, bgcolor: '#fff', border: '1px solid rgba(60,60,67,.12)', boxShadow: '0 2px 8px rgba(0,0,0,.16)' }, '& .MuiSlider-track': { border: 0, height: 6 }, '& .MuiSlider-rail': { height: 6, opacity: .15 } }} />{p.roomy && <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1 }}><StatCell label={localeText(locale, 'Minimum', 'کمینه')} value="0" /><StatCell label={localeText(locale, 'Current', 'فعلی')} value={`${value}${unit}`} accent={C.blue} /><StatCell label={localeText(locale, 'Maximum', 'بیشینه')} value="100" /></Box>}</Box>;
}

function InputControl({ def, locale, size }: Props) {
  const p = sizeProfile(size);
  const initial = n(def.mock.value, 22.5);
  const [value, setValue] = useState(String(initial));
  const step = (delta: number) => {
    const next = (Number(value) || 0) + delta;
    setValue(String(Math.round(next * 10) / 10));
  };
  return <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1.15 }}><Typography sx={{ fontSize: 11, color: C.tertiary, fontWeight: 650, direction: locale === 'fa' ? 'rtl' : 'ltr' }}>{localeText(locale, 'Target value', 'مقدار هدف')}</Typography><Box sx={{ display: 'grid', gridTemplateColumns: '46px minmax(0,1fr) 46px', gap: .7, alignItems: 'center', direction: 'ltr' }}><IconButton onClick={() => step(-.5)} sx={{ width: 46, height: 46, borderRadius: '14px', bgcolor: C.fill, color: C.blue }}><Remove /></IconButton><TextField value={value} onChange={e => setValue(e.target.value)} size="small" inputProps={{ dir: 'ltr', style: { textAlign: 'center', fontWeight: 700, fontSize: p.compact ? 18 : 21 } }} sx={{ '& .MuiOutlinedInput-root': { height: 46, borderRadius: '14px', bgcolor: 'rgba(255,255,255,.48)' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: C.separator } }} /><IconButton onClick={() => step(.5)} sx={{ width: 46, height: 46, borderRadius: '14px', bgcolor: C.fill, color: C.blue }}><Add /></IconButton></Box>{p.roomy && <Box sx={{ display: 'flex', gap: .7, direction: 'ltr' }}>{[18, 22, 24, 26].map(v => <Button key={v} onClick={() => setValue(String(v))} sx={{ flex: 1, minWidth: 0, borderRadius: '11px', bgcolor: C.fill, color: C.secondary, fontWeight: 700, textTransform: 'none' }}>{v}</Button>)}</Box>}<MicroLabel>{localeText(locale, 'Changes are local in mock mode', 'تغییرات در حالت نمایشی محلی است')}</MicroLabel></Box>;
}

function Thermostat({ def, locale, size }: Props) {
  const p = sizeProfile(size);
  const [value, setValue] = useState(n(def.mock.value, 22));
  const current = 24.1;
  const adjust = (delta: number) => setValue(v => clamp(Math.round((v + delta) * 2) / 2, 16, 30));
  if (p.compact) return <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', direction: 'ltr' }}><Box><Typography sx={{ fontSize: 10.5, color: C.tertiary, fontWeight: 650 }}>SET TO</Typography><Typography sx={{ mt: .3, fontSize: 40, lineHeight: .95, fontWeight: 720, letterSpacing: '-.05em' }}>{value}°</Typography><Typography sx={{ mt: .6, fontSize: 11, color: C.tertiary }}>{localeText(locale, 'Room', 'اتاق')} {current}°</Typography></Box><Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: .7 }}><IconButton onClick={() => adjust(-.5)} sx={{ borderRadius: '13px', bgcolor: C.fill, color: C.blue }}><Remove /></IconButton><IconButton onClick={() => adjust(.5)} sx={{ borderRadius: '13px', bgcolor: C.fill, color: C.blue }}><Add /></IconButton></Box></Box>;
  return <Box sx={{ height: '100%', display: p.wide && !p.large ? 'grid' : 'flex', gridTemplateColumns: p.wide && !p.large ? '150px 1fr' : undefined, flexDirection: p.wide && !p.large ? undefined : 'column', justifyContent: 'center', gap: 1.5, direction: 'ltr' }}><Box><Typography sx={{ fontSize: 10.5, color: C.tertiary, fontWeight: 650 }}>{localeText(locale, 'SETPOINT', 'دمای هدف')}</Typography><Typography sx={{ mt: .3, fontSize: p.large ? 50 : 43, fontWeight: 720, lineHeight: .9, letterSpacing: '-.05em' }}>{value}°</Typography><Typography sx={{ mt: .7, fontSize: 12, color: C.secondary }}>{localeText(locale, 'Current', 'فعلی')} {current}°</Typography></Box><Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1 }}><Slider min={16} max={30} step={.5} value={value} onChange={(_, v) => setValue(v as number)} sx={{ color: C.orange, '& .MuiSlider-thumb': { width: 24, height: 24, bgcolor: '#fff', border: '1px solid rgba(60,60,67,.12)', boxShadow: '0 2px 8px rgba(0,0,0,.15)' }, '& .MuiSlider-track': { border: 0, height: 7 }, '& .MuiSlider-rail': { height: 7, opacity: .15 } }} /><Box sx={{ display: 'flex', justifyContent: 'space-between' }}><MicroLabel>16°</MicroLabel><MicroLabel>{localeText(locale, 'Comfort', 'آسایش')}</MicroLabel><MicroLabel>30°</MicroLabel></Box><Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: .8, mt: .35 }}><Button onClick={() => adjust(-.5)} sx={{ minWidth: 0, borderRadius: '12px', bgcolor: C.fill, color: C.blue }}><Remove /></Button><Button onClick={() => adjust(.5)} sx={{ minWidth: 0, borderRadius: '12px', bgcolor: C.fill, color: C.blue }}><Add /></Button></Box></Box>{p.large && <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1 }}><StatCell label={localeText(locale, 'Mode', 'حالت')} value="Heat" accent={C.orange} /><StatCell label={localeText(locale, 'Humidity', 'رطوبت')} value="46%" /><StatCell label={localeText(locale, 'Schedule', 'برنامه')} value="Home" /></Box>}</Box>;
}

function ColorControl({ locale, size }: Props) {
  const p = sizeProfile(size);
  const [hue, setHue] = useState(188);
  const [brightness, setBrightness] = useState(78);
  const [on, setOn] = useState(true);
  const preview = on ? `hsl(${hue} 82% ${Math.max(28, brightness / 1.6)}%)` : '#A1A1A6';
  const presets = [0, 35, 90, 150, 205, 275, 320];
  return <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: p.compact ? .8 : 1, direction: 'ltr' }}><Box onClick={() => setOn(v => !v)} sx={{ cursor: 'pointer', height: p.large ? 76 : p.compact ? 54 : 62, borderRadius: '16px', bgcolor: preview, position: 'relative', overflow: 'hidden', border: '1px solid rgba(60,60,67,.08)', boxShadow: on ? `0 8px 22px hsl(${hue} 70% 45% / .16)` : 'none' }}><Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(110deg,rgba(255,255,255,.24),transparent 46%)' }} /><Typography sx={{ position: 'absolute', left: 10, bottom: 8, fontSize: 10.5, fontWeight: 750, color: '#fff' }}>{on ? 'ON' : 'OFF'}</Typography><Typography sx={{ position: 'absolute', right: 10, bottom: 8, fontSize: 10.5, fontWeight: 650, color: 'rgba(255,255,255,.9)' }}>{brightness}%</Typography></Box><Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${presets.length},1fr)`, gap: .55 }}>{presets.map(v => <Box key={v} onClick={() => { setHue(v); setOn(true); }} sx={{ cursor: 'pointer', aspectRatio: '1', maxHeight: 24, borderRadius: '50%', bgcolor: `hsl(${v} 82% 55%)`, border: hue === v ? '2px solid #fff' : '2px solid transparent', boxShadow: hue === v ? `0 0 0 2px ${C.blue}` : 'none', justifySelf: 'center', width: p.compact ? 19 : 23 }} />)}</Box><Box><Box sx={{ display: 'flex', justifyContent: 'space-between' }}><MicroLabel>{localeText(locale, 'Color', 'رنگ')}</MicroLabel><MicroLabel>{hue}°</MicroLabel></Box><Slider min={0} max={360} value={hue} onChange={(_, v) => setHue(v as number)} size="small" sx={{ py: .55, color: C.blue }} /></Box>{!p.compact && <Box><Box sx={{ display: 'flex', justifyContent: 'space-between' }}><MicroLabel>{localeText(locale, 'Brightness', 'روشنایی')}</MicroLabel><MicroLabel>{brightness}%</MicroLabel></Box><Slider min={5} max={100} value={brightness} onChange={(_, v) => setBrightness(v as number)} size="small" sx={{ py: .55, color: C.orange }} /></Box>}</Box>;
}

function DirectionControl({ locale, size }: Props) {
  const p = sizeProfile(size);
  const [active, setActive] = useState('•');
  const keys = ['↑', '←', '•', '→', '↓'];
  const cell = p.compact ? 42 : p.large ? 58 : 50;
  return <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', direction: 'ltr' }}><Box><Box sx={{ display: 'grid', gridTemplateColumns: `repeat(3,${cell}px)`, gridTemplateRows: `repeat(3,${cell}px)`, gap: p.compact ? .45 : .65 }}>{keys.map((k, i) => { const pos = [2,4,5,6,8][i]; const chosen = active === k; return <Button key={k} onClick={() => setActive(k)} sx={{ gridColumn: ((pos - 1) % 3) + 1, gridRow: Math.floor((pos - 1) / 3) + 1, minWidth: 0, p: 0, borderRadius: p.compact ? '12px' : '15px', bgcolor: chosen ? C.blue : C.fill, color: chosen ? '#fff' : C.label, fontSize: k === '•' ? 16 : 20, '&:hover': { bgcolor: chosen ? C.blue : C.fillStrong } }}>{k}</Button>; })}</Box><Typography sx={{ mt: .85, textAlign: 'center', fontSize: 10.5, color: C.tertiary }}>{localeText(locale, 'Last command', 'آخرین فرمان')}: <Box component="span" sx={{ color: C.blue, fontWeight: 800 }}>{active}</Box></Typography></Box></Box>;
}

function statusTone(cell: string, mode: TableMode) {
  if (mode === 'alarms') return cell === 'Critical' ? C.red : cell === 'Warning' ? C.orange : C.blue;
  if (['Online','Started','Opened','connected'].includes(cell)) return C.green;
  if (cell === 'Alert') return C.red;
  if (cell === 'Sleep') return C.tertiary;
  return C.secondary;
}

function TableVisual({ locale, mode, size }: Props & { mode: TableMode }) {
  const p = sizeProfile(size);
  const rows = mode === 'alarms'
    ? [['Fire sensor', 'Critical', '09:42'], ['Door open', 'Warning', '09:17'], ['Battery low', 'Info', '08:51']]
    : mode === 'logs'
      ? [['gateway-01', 'connected', '09:44:21'], ['pump-04', 'rpc ack', '09:43:12'], ['sensor-18', 'telemetry', '09:42:08']]
      : mode === 'events'
        ? [['Valve', 'Opened', '09:41'], ['Pump', 'Started', '09:34'], ['Mode', 'Auto', '09:12']]
        : mode === 'measurement-list'
          ? [['24.8 °C', '09:44'], ['24.6 °C', '09:39'], ['24.7 °C', '09:34'], ['24.4 °C', '09:29']]
          : [['GW-01', 'Online', '24.8 °C'], ['Pump-04', 'Online', '68%'], ['Node-18', 'Sleep', '3.8 V'], ['Valve-02', 'Alert', 'Open']];
  const headings = mode === 'measurement-list' ? [localeText(locale, 'Value', 'مقدار'), localeText(locale, 'Time', 'زمان')] : [localeText(locale, 'Item', 'مورد'), localeText(locale, 'State', 'وضعیت'), localeText(locale, 'Time / value', 'زمان / مقدار')];
  return <Box sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', direction: 'ltr', overflow: 'hidden' }}>
    {p.large && <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${headings.length},minmax(0,1fr))`, gap: 1, px: .5, pb: .7 }}>{headings.map(h => <MicroLabel key={h}>{h}</MicroLabel>)}</Box>}
    <Box sx={{ borderTop: `1px solid ${C.separator}`, borderBottom: `1px solid ${C.separator}`, overflow: 'hidden' }}>{rows.map((row, i) => <Box key={i} sx={{ minHeight: p.large ? 43 : 38, display: 'grid', gridTemplateColumns: `repeat(${row.length},minmax(0,1fr))`, gap: 1, alignItems: 'center', px: .55, borderTop: i ? `1px solid ${C.separator}` : 0, bgcolor: mode === 'alarms' && i === 0 ? 'rgba(255,69,58,.055)' : 'transparent' }}>{row.map((cell, j) => <Typography key={j} sx={{ fontSize: p.large ? 12.2 : 11.2, fontWeight: j === 0 ? 700 : 600, color: j === 1 ? statusTone(cell, mode) : j === 0 ? C.label : C.tertiary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{cell}</Typography>)}</Box>)}</Box>
    {p.roomy && <Box sx={{ mt: 'auto', pt: .9, display: 'flex', justifyContent: 'space-between' }}><MicroLabel>{rows.length} {localeText(locale, 'items', 'مورد')}</MicroLabel><MicroLabel>{localeText(locale, 'Updated now', 'به‌روز')}</MicroLabel></Box>}
  </Box>;
}

function Clock({ locale, size }: Props) {
  const p = sizeProfile(size);
  return <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: p.wide ? 'flex-start' : 'center', textAlign: p.wide ? 'left' : 'center', direction: locale === 'fa' ? 'rtl' : 'ltr' }}><Typography sx={{ direction: 'ltr', fontSize: p.compact ? 42 : p.large ? 66 : 52, fontWeight: 300, letterSpacing: '-.055em', lineHeight: .95, fontVariantNumeric: 'tabular-nums' }}>09:44</Typography><Typography sx={{ mt: .9, fontSize: p.compact ? 11.5 : 13, color: C.secondary, fontWeight: 560 }}>{localeText(locale, 'Wednesday, Oct 7', 'چهارشنبه، ۱۵ مهر ۱۴۰۵')}</Typography>{p.roomy && <Typography sx={{ mt: .6, fontSize: 10.5, color: C.tertiary }}>GMT +03:30 · {localeText(locale, 'Local site time', 'زمان محلی سایت')}</Typography>}</Box>;
}

function TextVisual({ locale, size }: Props) {
  const p = sizeProfile(size);
  const title = localeText(locale, 'Server room status', 'وضعیت اتاق سرور');
  const body = localeText(locale, 'All sensors are within their normal ranges. Latest telemetry was received less than a minute ago.', 'همه سنسورها در محدوده عادی هستند. آخرین بسته داده کمتر از یک دقیقه قبل دریافت شده است.');
  return <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: p.large ? 'flex-start' : 'center', direction: locale === 'fa' ? 'rtl' : 'ltr', textAlign: locale === 'fa' ? 'right' : 'left' }}><Typography sx={{ fontSize: p.compact ? 17 : p.large ? 24 : 20, lineHeight: 1.15, fontWeight: 720, color: C.label }}>{title}</Typography><Typography sx={{ mt: 1, fontSize: p.compact ? 11.3 : 12.5, color: C.secondary, lineHeight: 1.75, display: '-webkit-box', WebkitBoxOrient: 'vertical', WebkitLineClamp: p.compact ? 4 : p.large ? 8 : 5, overflow: 'hidden' }}>{body}</Typography>{p.roomy && <Box sx={{ mt: 'auto', pt: 1.2 }}><SectionDivider /><Box sx={{ pt: .9, display: 'flex', alignItems: 'center', gap: .65 }}><Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: C.green }} /><MicroLabel>{localeText(locale, 'Normal · updated now', 'عادی · به‌روز')}</MicroLabel></Box></Box>}</Box>;
}

function ImageVisual({ locale, size }: Props) {
  const p = sizeProfile(size);
  return <Box sx={{ height: '100%', minHeight: 0, borderRadius: '14px', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg,#111827,#1f2937 46%,#334155)' }}><Box sx={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 72% 30%,rgba(255,255,255,.22),transparent 22%), linear-gradient(180deg,transparent 58%,rgba(0,0,0,.42))' }} /><Box sx={{ position: 'absolute', left: 12, top: 11, display: 'flex', alignItems: 'center', gap: .55 }}><Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: C.red, boxShadow: '0 0 0 3px rgba(255,69,58,.18)' }} /><Typography sx={{ fontSize: 10.5, fontWeight: 750, color: '#fff' }}>LIVE</Typography></Box><Box sx={{ position: 'absolute', left: '11%', right: '11%', bottom: p.large ? '18%' : '15%', height: p.large ? '48%' : '42%', border: '1px solid rgba(255,255,255,.42)', borderRadius: '50% 50% 12% 12%', opacity: .72 }} />{p.large && <Box sx={{ position: 'absolute', right: 12, top: 10, px: .8, py: .4, borderRadius: '8px', bgcolor: 'rgba(0,0,0,.28)', color: '#fff' }}><MicroLabel tone="#fff">1080p · 18 fps</MicroLabel></Box>}<Typography sx={{ position: 'absolute', left: 12, bottom: 10, fontSize: 10.5, color: '#fff', fontWeight: 650 }}>{localeText(locale, 'Camera snapshot', 'تصویر دوربین')} · 09:44:12</Typography></Box>;
}

function IframeVisual({ locale, size }: Props) {
  const p = sizeProfile(size);
  return <Box sx={{ height: '100%', minHeight: 0, borderRadius: '14px', overflow: 'hidden', border: `1px solid ${C.separator}`, bgcolor: 'rgba(255,255,255,.46)', display: 'flex', flexDirection: 'column' }}><Box sx={{ height: 30, px: 1, display: 'flex', alignItems: 'center', gap: .55, bgcolor: 'rgba(118,118,128,.08)', borderBottom: `1px solid ${C.separator}` }}><Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#FF605C' }} /><Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#FFBD44' }} /><Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#00CA4E' }} /><Box sx={{ flex: 1, maxWidth: p.large ? 260 : 160, ml: .5, height: 14, borderRadius: '5px', bgcolor: 'rgba(118,118,128,.10)' }} /></Box><Box sx={{ flex: 1, minHeight: 0, display: 'grid', placeItems: 'center', textAlign: 'center', px: 2 }}><Box><Typography sx={{ fontSize: p.large ? 18 : 15, fontWeight: 720 }}>{localeText(locale, 'External content', 'محتوای خارجی')}</Typography><Typography sx={{ mt: .55, fontSize: 10.5, color: C.tertiary }}>iframe · HTML · embedded app</Typography></Box></Box></Box>;
}

function ScadaVisual({ locale, size }: Props) {
  const p = sizeProfile(size);
  const h = p.large ? 255 : 190;
  return <Box sx={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', direction: 'ltr' }}><Box sx={{ flex: 1, minHeight: h, position: 'relative' }}><svg viewBox="0 0 560 250" width="100%" height="100%">
    <rect x="18" y="52" width="120" height="136" rx="20" fill="rgba(10,132,255,.07)" stroke="rgba(10,132,255,.28)" />
    <rect x="30" y="102" width="96" height="74" rx="13" fill="rgba(10,132,255,.64)" />
    <text x="78" y="82" textAnchor="middle" fill={C.secondary} fontSize="12" fontWeight="650">TANK 01</text><text x="78" y="146" textAnchor="middle" fill="#fff" fontSize="25" fontWeight="720">63%</text>
    <line x1="138" y1="120" x2="230" y2="120" stroke="#4A4A4E" strokeWidth="7" strokeLinecap="round" />
    <circle cx="275" cy="120" r="34" fill="rgba(48,209,88,.09)" stroke={C.green} strokeWidth="3" /><circle cx="275" cy="120" r="8" fill={C.green} /><text x="275" y="169" textAnchor="middle" fill={C.secondary} fontSize="12" fontWeight="650">PUMP</text>
    <line x1="309" y1="120" x2="402" y2="120" stroke="#4A4A4E" strokeWidth="7" strokeLinecap="round" />
    <rect x="402" y="71" width="136" height="98" rx="18" fill="rgba(118,118,128,.08)" stroke="rgba(60,60,67,.18)" /><text x="470" y="107" textAnchor="middle" fill={C.secondary} fontSize="12" fontWeight="650">VALVE V-02</text><text x="470" y="138" textAnchor="middle" fill={C.blue} fontSize="16" fontWeight="720">OPEN</text>
  </svg></Box>{p.large && <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, mt: .5 }}><StatCell label={localeText(locale, 'Tank level', 'سطح مخزن')} value="63%" accent={C.blue} /><StatCell label={localeText(locale, 'Pump', 'پمپ')} value="RUNNING" accent={C.green} /><StatCell label={localeText(locale, 'Valve', 'شیر')} value="OPEN" accent={C.blue} /></Box>}</Box>;
}

function AlarmIndicator({ def, locale, size }: Props) {
  const p = sizeProfile(size);
  const Icon = def.icon;
  const active = Boolean(def.mock.value);
  const severity = s(def.mock.severity, 'warning');
  const critical = severity === 'critical';
  const tone = active ? (critical ? C.red : C.orange) : C.green;
  const label = active ? localeText(locale, critical ? 'Alarm active' : 'Attention', critical ? 'هشدار فعال' : 'نیاز به توجه') : localeText(locale, 'Normal', 'عادی');
  const detail = def.id === 'fire-alarm' ? localeText(locale, 'Fire panel armed', 'پنل حریق آماده است') : def.id === 'smoke-alarm' ? localeText(locale, 'Smoke detected', 'دود تشخیص داده شد') : localeText(locale, 'Area is dry', 'محیط خشک است');
  return <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 1.1, direction: locale === 'fa' ? 'rtl' : 'ltr' }}><Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}><Box sx={{ width: p.compact ? 54 : 64, height: p.compact ? 54 : 64, borderRadius: '18px', display: 'grid', placeItems: 'center', bgcolor: `${tone}18`, color: tone }}><Icon sx={{ fontSize: p.compact ? 29 : 34 }} /></Box><Box sx={{ display: 'flex', alignItems: 'center', gap: .55, mt: .4 }}><Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: tone, boxShadow: active ? `0 0 0 4px ${tone}18` : 'none' }} />{!p.compact && <MicroLabel tone={tone}>{active ? 'ACTIVE' : 'READY'}</MicroLabel>}</Box></Box><Box><Typography sx={{ fontSize: p.compact ? 21 : 28, fontWeight: 720, lineHeight: 1, color: tone }}>{label}</Typography><Typography sx={{ mt: .6, fontSize: 11.5, color: C.secondary }}>{detail}</Typography></Box>{p.roomy && <Box><SectionDivider /><Box sx={{ pt: .95, display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 1 }}><StatCell label={localeText(locale, 'Severity', 'شدت')} value={active ? severity.toUpperCase() : 'NORMAL'} accent={tone} /><StatCell label={localeText(locale, 'Last event', 'آخرین رخداد')} value={active ? '09:42' : 'Yesterday'} /></Box></Box>}</Box>;
}

export function IOSVisualRenderer(props: Props) {
  const v = props.def.visual;
  if (v === 'metric') return <Metric {...props} />;
  if (v === 'battery') return <Battery {...props} />;
  if (v === 'signal') return <Signal {...props} />;
  if (v === 'tank') return <Tank {...props} />;
  if (v === 'boolean') return <BooleanStatus {...props} />;
  if (v === 'gauge') return <Gauge {...props} />;
  if (v === 'line' || v === 'area') return <LineChartVisual {...props} />;
  if (v === 'bar') return <BarVisual {...props} />;
  if (v === 'histogram') return <Histogram {...props} />;
  if (v === 'donut') return <Donut {...props} />;
  if (v === 'heatmap') return <Heatmap {...props} />;
  if (v === 'timeline') return <TimelineVisual {...props} />;
  if (v === 'map' || v === 'route') return <MapVisual {...props} />;
  if (v === 'coordinates') return <Coordinates {...props} />;
  if (v === 'compass') return <Compass {...props} />;
  if (v === 'button') return <ButtonControl {...props} />;
  if (v === 'switch') return <SwitchControl {...props} />;
  if (v === 'slider') return <SliderControl {...props} />;
  if (v === 'input') return <InputControl {...props} />;
  if (v === 'thermostat') return <Thermostat {...props} />;
  if (v === 'color') return <ColorControl {...props} />;
  if (v === 'direction') return <DirectionControl {...props} />;
  if (v === 'table' || v === 'measurement-list' || v === 'alarms' || v === 'events' || v === 'logs') return <TableVisual {...props} mode={v} />;
  if (v === 'clock') return <Clock {...props} />;
  if (v === 'text') return <TextVisual {...props} />;
  if (v === 'image') return <ImageVisual {...props} />;
  if (v === 'iframe') return <IframeVisual {...props} />;
  if (v === 'scada') return <ScadaVisual {...props} />;
  if (v === 'alarm-indicator') return <AlarmIndicator {...props} />;
  return <Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}><PowerSettingsNew sx={{ color: C.tertiary }} /></Box>;
}
