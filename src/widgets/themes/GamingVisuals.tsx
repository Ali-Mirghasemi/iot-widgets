import { useMemo, useState, type ReactNode } from 'react';
import {
  Box,
  Button,
  IconButton,
  LinearProgress,
  Slider,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import type { Locale, WidgetDefinition, WidgetSize, WidgetThemeTokens } from '../core/types';
import { bars, heat, spark, spark2 } from '../data/mockData';

type VisualProps = {
  def: WidgetDefinition;
  theme: WidgetThemeTokens;
  locale: Locale;
  size: WidgetSize;
};

type FrameProps = VisualProps & {
  deviceName: string;
  locationLabel: string;
  status: string;
  lastSeen: string;
  onInfo: () => void;
  children: ReactNode;
};

const HUD = {
  bg0: '#020712',
  bg1: '#06111d',
  panel: '#081827',
  panel2: '#0a2030',
  fg: '#e7fbff',
  muted: '#7193a1',
  dim: '#416474',
  cyan: '#19f7ff',
  cyanSoft: '#0bbbc8',
  green: '#57f2b4',
  amber: '#ffc857',
  red: '#ff4d6d',
  magenta: '#ff4bb9',
  border: 'rgba(25,247,255,.24)',
  borderSoft: 'rgba(25,247,255,.12)',
};

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
    extraLarge: area >= 6,
    showSecondary: area >= 2,
    showHistory: area >= 2,
    showDetails: area >= 4 || h >= 2 || w >= 3,
  };
}

function statusTone(status: string) {
  const value = status.toLowerCase();
  if (value.includes('critical') || value.includes('alarm') || value.includes('warning')) return value.includes('critical') || value.includes('alarm') ? HUD.red : HUD.amber;
  if (value.includes('offline') || value.includes('sleep')) return HUD.dim;
  return HUD.green;
}

function HudLabel({ children, tone = HUD.muted, rtl = false }: { children: ReactNode; tone?: string; rtl?: boolean }) {
  return <Typography sx={{
    fontFamily: 'inherit',
    fontSize: 9.2,
    lineHeight: 1.1,
    letterSpacing: rtl ? 0 : 1.15,
    textTransform: rtl ? 'none' : 'uppercase',
    color: tone,
    direction: rtl ? 'rtl' : 'ltr',
  }}>{children}</Typography>;
}

function Readout({ value, unit, compact = false, tone = HUD.fg }: { value: ReactNode; unit?: ReactNode; compact?: boolean; tone?: string }) {
  return <Box sx={{ display: 'flex', alignItems: 'baseline', gap: .65, minWidth: 0, direction: 'ltr' }}>
    <Typography sx={{
      fontFamily: 'inherit',
      fontSize: compact ? 31 : 38,
      fontWeight: 760,
      letterSpacing: '.01em',
      lineHeight: .92,
      color: tone,
      whiteSpace: 'nowrap',
      fontVariantNumeric: 'tabular-nums',
      textShadow: tone === HUD.fg ? '0 0 22px rgba(25,247,255,.08)' : 'none',
    }}>{value}</Typography>
    {unit ? <Typography sx={{ fontFamily: 'inherit', fontSize: 10.5, color: HUD.cyan, fontWeight: 700, whiteSpace: 'nowrap' }}>{unit}</Typography> : null}
  </Box>;
}

function TickRail({ value, max = 100, segments = 14, warnAt = .72, dangerAt = .88, height = 11 }: {
  value: number;
  max?: number;
  segments?: number;
  warnAt?: number;
  dangerAt?: number;
  height?: number;
}) {
  const pct = clamp(value / Math.max(1, max), 0, 1);
  const lit = Math.round(pct * segments);
  return <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${segments}, minmax(0,1fr))`, gap: .35, direction: 'ltr' }}>
    {Array.from({ length: segments }).map((_, i) => {
      const ratio = (i + 1) / segments;
      const color = ratio >= dangerAt ? HUD.red : ratio >= warnAt ? HUD.amber : HUD.cyan;
      const active = i < lit;
      return <Box key={i} sx={{
        height,
        background: active ? color : 'rgba(25,247,255,.07)',
        opacity: active ? .96 : 1,
        clipPath: 'polygon(0 0,82% 0,100% 50%,82% 100%,0 100%,12% 50%)',
        boxShadow: active ? `0 0 9px ${color}33` : 'inset 0 0 0 1px rgba(25,247,255,.04)',
      }} />;
    })}
  </Box>;
}

function HudSparkline({ values = spark, height = 64, fill = false, color = HUD.cyan, showDots = false }: {
  values?: number[];
  height?: number | string;
  fill?: boolean;
  color?: string;
  showDots?: boolean;
}) {
  const coords = useMemo(() => {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(1, max - min);
    return values.map((v, i) => ({
      x: (i / Math.max(1, values.length - 1)) * 100,
      y: 38 - ((v - min) / range) * 30,
    }));
  }, [values]);
  const points = coords.map(p => `${p.x},${p.y}`).join(' ');
  return <Box component="svg" viewBox="0 0 100 42" preserveAspectRatio="none" sx={{ width: '100%', height, display: 'block', overflow: 'visible' }} aria-hidden>
    {[8, 18, 28, 38].map(y => <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="rgba(25,247,255,.08)" strokeWidth=".45" />)}
    {[0, 20, 40, 60, 80, 100].map(x => <line key={x} x1={x} x2={x} y1="4" y2="40" stroke="rgba(25,247,255,.05)" strokeWidth=".35" />)}
    {fill && <polygon points={`0,40 ${points} 100,40`} fill={color} opacity=".085" />}
    <polyline points={points} fill="none" stroke={color} strokeWidth="1.8" vectorEffect="non-scaling-stroke" strokeLinejoin="miter" />
    {showDots && coords.map((p, i) => i % 2 === 0 ? <circle key={i} cx={p.x} cy={p.y} r=".8" fill={color} /> : null)}
  </Box>;
}

function MiniStat({ label, value, tone = HUD.fg, rtl = false }: { label: string; value: string; tone?: string; rtl?: boolean }) {
  return <Box sx={{ minWidth: 0, borderLeft: `1px solid ${HUD.borderSoft}`, pl: .8 }}>
    <HudLabel rtl={rtl}>{label}</HudLabel>
    <Typography sx={{ mt: .28, fontFamily: 'inherit', fontSize: 11.2, fontWeight: 720, color: tone, direction: rtl ? 'rtl' : 'ltr', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
  </Box>;
}

function Metric({ def, locale, size }: VisualProps) {
  const p = profile(size);
  const value = n(def.mock.value, 24.8);
  const unit = s(def.mock.unit);
  const trend = n(def.mock.trend, 0);
  const values = (def.mock.values as number[] | undefined) ?? spark;
  const max = n(def.mock.max, Math.max(100, Math.abs(value) * 1.35));
  const trendUp = trend >= 0;
  const trendTone = trendUp ? HUD.green : HUD.amber;
  const pct = clamp((Math.abs(value) / Math.max(1, max)) * 100, 0, 100);
  const status = Math.abs(trend) >= 8 ? 'WATCH' : 'NOMINAL';

  if (p.compact) return <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1, direction: 'ltr' }}>
    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: .8 }}>
      <Box><HudLabel>live input</HudLabel><Readout value={value} unit={unit} compact /></Box>
      <Box sx={{ textAlign: 'right', pt: .2 }}><HudLabel tone={trendTone}>{status}</HudLabel><Typography sx={{ mt: .45, fontSize: 10.5, color: trendTone, fontFamily: 'inherit', fontVariantNumeric: 'tabular-nums' }}>{trendUp ? '+' : '−'}{Math.abs(trend)}%</Typography></Box>
    </Box>
    <TickRail value={pct} max={100} segments={12} height={10} />
  </Box>;

  if (p.tall) return <Box sx={{ height: '100%', display: 'grid', gridTemplateRows: 'auto auto minmax(0,1fr) auto', gap: 1, direction: 'ltr' }}>
    <Box><HudLabel>sensor channel</HudLabel><Readout value={value} unit={unit} /></Box>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><HudLabel tone={trendTone}>{status}</HudLabel><Typography sx={{ fontFamily: 'inherit', fontSize: 10.5, color: trendTone }}>{trendUp ? '▲' : '▼'} {Math.abs(trend)}% / 24H</Typography></Box>
    <Box sx={{ minHeight: 0, display: 'flex', alignItems: 'center' }}><HudSparkline values={values} height="100%" fill /></Box>
    <TickRail value={pct} max={100} segments={10} height={14} />
  </Box>;

  return <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: p.large ? 'minmax(150px,.8fr) minmax(0,1.2fr)' : 'minmax(145px,.82fr) minmax(0,1.18fr)', gap: 1.35, direction: 'ltr' }}>
    <Box sx={{ minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: .95 }}>
      <HudLabel>live telemetry</HudLabel>
      <Readout value={value} unit={unit} />
      <Box sx={{ display: 'grid', gridTemplateColumns: p.large ? '1fr 1fr' : '1fr', gap: .75 }}>
        <MiniStat label="DELTA / 24H" value={`${trendUp ? '+' : '−'}${Math.abs(trend)}%`} tone={trendTone} />
        {p.large && <MiniStat label="STATE" value={status} tone={status === 'NOMINAL' ? HUD.green : HUD.amber} />}
      </Box>
      {p.large && <TickRail value={pct} max={100} segments={12} height={12} />}
    </Box>
    <Box sx={{ minWidth: 0, borderLeft: `1px solid ${HUD.borderSoft}`, pl: 1.15, display: 'grid', gridTemplateRows: 'auto minmax(0,1fr) auto', gap: .45 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><HudLabel>history</HudLabel><HudLabel tone={HUD.dim}>T−24H</HudLabel></Box>
      <Box sx={{ minHeight: 0, display: 'flex', alignItems: 'center' }}><HudSparkline values={values} height="100%" fill showDots={p.large} /></Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><HudLabel tone={HUD.dim}>00</HudLabel><HudLabel tone={HUD.dim}>12</HudLabel><HudLabel tone={HUD.dim}>NOW</HudLabel></Box>
    </Box>
  </Box>;
}

function Battery({ def, size }: VisualProps) {
  const p = profile(size);
  const value = clamp(n(def.mock.value, 76), 0, 100);
  const voltage = s(def.mock.voltage, '3.94 V');
  const remain = s(def.mock.remaining, '8h 42m');
  const tone = value < 20 ? HUD.red : value < 40 ? HUD.amber : HUD.cyan;
  const segments = p.tall ? 8 : 10;
  const lit = Math.round((value / 100) * segments);
  const pack = <Box sx={{
    width: p.tall ? 84 : '100%',
    height: p.tall ? 188 : 54,
    maxWidth: p.tall ? 84 : 260,
    border: `1px solid ${tone}88`,
    p: .6,
    position: 'relative',
    display: 'grid',
    gridTemplateColumns: p.tall ? '1fr' : `repeat(${segments},1fr)`,
    gridTemplateRows: p.tall ? `repeat(${segments},1fr)` : '1fr',
    gap: .45,
    '&:after': p.tall ? { content: '""', position: 'absolute', top: -6, left: '33%', width: '34%', height: 5, bgcolor: tone } : { content: '""', position: 'absolute', right: -6, top: '29%', width: 5, height: '42%', bgcolor: tone },
  }}>
    {Array.from({ length: segments }).map((_, i) => {
      const activeIndex = p.tall ? segments - 1 - i : i;
      const active = activeIndex < lit;
      return <Box key={i} sx={{ bgcolor: active ? tone : 'rgba(25,247,255,.06)', boxShadow: active ? `0 0 10px ${tone}33` : 'none' }} />;
    })}
  </Box>;

  if (p.compact) return <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: .9, direction: 'ltr' }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><Readout value={`${value}%`} compact tone={tone} /><HudLabel tone={tone}>PWR OK</HudLabel></Box>
    {pack}
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><HudLabel>{voltage}</HudLabel><HudLabel>{remain}</HudLabel></Box>
  </Box>;

  if (p.tall) return <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', direction: 'ltr' }}>
    <Box sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.05 }}>
      <Box><HudLabel>battery pack</HudLabel><Readout value={`${value}%`} tone={tone} /></Box>
      {pack}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.1, width: '100%' }}><MiniStat label="VOLT" value={voltage} /><MiniStat label="ETA" value={remain} /></Box>
    </Box>
  </Box>;

  return <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: 'minmax(145px,.8fr) minmax(0,1.2fr)', gap: 1.5, alignItems: 'center', direction: 'ltr' }}>
    <Box><HudLabel>energy reserve</HudLabel><Readout value={`${value}%`} tone={tone} /><Box sx={{ mt: 1 }}>{pack}</Box></Box>
    <Box sx={{ display: 'grid', gridTemplateRows: 'auto auto minmax(0,1fr)', gap: .9, minHeight: 0, borderLeft: `1px solid ${HUD.borderSoft}`, pl: 1.1 }}>
      <MiniStat label="PACK VOLTAGE" value={voltage} tone={tone} />
      <MiniStat label="REMAINING" value={remain} />
      {p.large && <Box sx={{ minHeight: 0 }}><HudLabel>discharge trace</HudLabel><HudSparkline values={spark2} height="100%" color={tone} /></Box>}
    </Box>
  </Box>;
}

function Signal({ def, size }: VisualProps) {
  const p = profile(size);
  const value = n(def.mock.value, -72);
  const network = s(def.mock.network, 'LTE · RSRP');
  const quality = value > -65 ? 5 : value > -75 ? 4 : value > -85 ? 3 : value > -95 ? 2 : 1;
  const tone = quality >= 4 ? HUD.green : quality >= 3 ? HUD.cyan : quality === 2 ? HUD.amber : HUD.red;
  const qualityText = quality >= 4 ? 'STRONG' : quality === 3 ? 'STABLE' : quality === 2 ? 'WEAK' : 'CRITICAL';
  const barsNode = <Box sx={{ display: 'flex', gap: .6, alignItems: 'flex-end', height: p.compact ? 48 : 64, direction: 'ltr' }}>
    {[1, 2, 3, 4, 5].map(i => <Box key={i} sx={{ width: p.compact ? 10 : 12, height: 7 + i * (p.compact ? 7 : 10), bgcolor: i <= quality ? tone : 'rgba(25,247,255,.07)', border: `1px solid ${i <= quality ? `${tone}77` : HUD.borderSoft}`, boxShadow: i <= quality ? `0 0 8px ${tone}2a` : 'none' }} />)}
  </Box>;

  if (p.compact) return <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: 'auto 1fr', alignItems: 'center', gap: 1.15, direction: 'ltr' }}>
    {barsNode}<Box><HudLabel tone={tone}>{qualityText}</HudLabel><Readout value={value} unit="dBm" compact /><HudLabel>{network}</HudLabel></Box>
  </Box>;

  return <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: p.tall ? '1fr' : 'minmax(145px,.75fr) minmax(0,1.25fr)', alignItems: 'center', gap: 1.25, direction: 'ltr' }}>
    <Box sx={{ display: 'flex', flexDirection: p.tall ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: 1.2 }}>
      {barsNode}
      <Box><HudLabel tone={tone}>{qualityText}</HudLabel><Readout value={value} unit="dBm" /><HudLabel>{network}</HudLabel></Box>
    </Box>
    {p.showSecondary && <Box sx={{ borderLeft: p.tall ? 'none' : `1px solid ${HUD.borderSoft}`, borderTop: p.tall ? `1px solid ${HUD.borderSoft}` : 'none', pl: p.tall ? 0 : 1.15, pt: p.tall ? 1 : 0, display: 'grid', gridTemplateRows: 'auto minmax(0,1fr) auto', minHeight: 0, height: p.tall ? 150 : '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><HudLabel>rf history</HudLabel><HudLabel tone={tone}>CELL 17</HudLabel></Box>
      <Box sx={{ minHeight: 0 }}><HudSparkline values={[54,58,51,62,65,61,69,66,72,68,74,71]} height="100%" color={tone} /></Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: .8 }}><MiniStat label="RSRQ" value="−9 dB" /><MiniStat label="SINR" value="18.4 dB" tone={tone} /></Box>
    </Box>}
  </Box>;
}

function Tank({ def, size }: VisualProps) {
  const p = profile(size);
  const value = clamp(n(def.mock.value, 63), 0, 100);
  const liters = s(def.mock.liters, '1,260 L');
  const tone = value < 20 ? HUD.amber : value > 92 ? HUD.red : HUD.cyan;
  const tank = <Box sx={{ width: p.compact ? 70 : 86, height: p.compact ? 92 : p.tall ? 160 : 122, position: 'relative', border: `1px solid ${HUD.cyan}66`, clipPath: 'polygon(10px 0,calc(100% - 10px) 0,100% 10px,100% calc(100% - 10px),calc(100% - 10px) 100%,10px 100%,0 calc(100% - 10px),0 10px)', background: 'rgba(25,247,255,.025)', overflow: 'hidden' }}>
    <Box sx={{ position: 'absolute', left: 5, right: 5, bottom: 5, height: `calc(${value}% - 5px)`, minHeight: value > 0 ? 3 : 0, background: `linear-gradient(180deg,${tone}55,${tone}bb)`, boxShadow: `0 0 20px ${tone}22` }} />
    {[25,50,75].map(mark => <Box key={mark} sx={{ position: 'absolute', left: 0, right: 0, bottom: `${mark}%`, borderTop: '1px dashed rgba(25,247,255,.13)' }} />)}
    <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}><Typography sx={{ fontFamily: 'inherit', fontSize: p.compact ? 18 : 21, fontWeight: 760, color: HUD.fg, textShadow: '0 1px 6px #020712' }}>{value}%</Typography></Box>
  </Box>;

  if (p.compact) return <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.15, direction: 'ltr' }}>
    {tank}<Box><HudLabel>level</HudLabel><Typography sx={{ fontFamily: 'inherit', fontSize: 16, fontWeight: 720 }}>{liters}</Typography><HudLabel tone={tone}>{value < 20 ? 'REFILL' : 'STABLE'}</HudLabel></Box>
  </Box>;

  if (p.tall) return <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.2, direction: 'ltr' }}>
    <Box sx={{ textAlign: 'center' }}><HudLabel>reservoir 01</HudLabel><Readout value={`${value}%`} tone={tone} /></Box>
    {tank}
    <Box sx={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: .8 }}><MiniStat label="VOLUME" value={liters} /><MiniStat label="INLET" value="18.4 L/m" tone={HUD.green} /></Box>
  </Box>;

  return <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: 'auto minmax(0,1fr)', gap: 1.4, alignItems: 'center', direction: 'ltr' }}>
    {tank}
    <Box sx={{ minWidth: 0, display: 'grid', gap: .9 }}><HudLabel>tank level / t01</HudLabel><Readout value={`${value}%`} tone={tone} /><TickRail value={value} max={100} segments={p.large ? 16 : 12} height={12} /><Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: .8 }}><MiniStat label="VOLUME" value={liters} /><MiniStat label="STATE" value={value < 20 ? 'LOW' : 'NOMINAL'} tone={tone} /></Box>{p.large && <HudSparkline values={[58,59,61,60,62,63,65,64,63,63,64,63]} height={58} color={tone} />}</Box>
  </Box>;
}

function BooleanStatus({ def, locale, size }: VisualProps) {
  const p = profile(size);
  const [on, setOn] = useState(Boolean(def.mock.value ?? true));
  const tone = on ? HUD.green : HUD.red;
  const label = on ? (locale === 'fa' ? 'فعال' : 'ACTIVE') : (locale === 'fa' ? 'غیرفعال' : 'INACTIVE');
  const rtl = locale === 'fa';
  const indicatorSize = p.compact ? 84 : p.large ? 122 : 96;
  const indicator = <Box onClick={() => setOn(v => !v)} sx={{ cursor: 'pointer', width: indicatorSize, height: indicatorSize, display: 'grid', placeItems: 'center', position: 'relative', clipPath: 'polygon(16% 0,84% 0,100% 16%,100% 84%,84% 100%,16% 100%,0 84%,0 16%)', bgcolor: `${tone}0b`, border: `1px solid ${tone}99`, boxShadow: on ? `0 0 28px ${tone}20` : 'none' }}><Box sx={{ width: p.large ? 48 : 38, height: p.large ? 48 : 38, border: `2px solid ${tone}`, position: 'relative', transform: 'rotate(45deg)', boxShadow: `0 0 15px ${tone}35`, '&:after': { content: '""', position: 'absolute', inset: p.large ? 11 : 9, bgcolor: tone } }} /></Box>;

  if (!p.large) return <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: p.compact || p.tall ? '1fr' : 'auto 1fr', placeItems: p.compact || p.tall ? 'center' : undefined, alignItems: 'center', gap: 1.35, direction: 'ltr' }}>{indicator}<Box sx={{ textAlign: p.compact || p.tall ? 'center' : 'left', minWidth: 0 }}><HudLabel tone={tone} rtl={rtl}>{label}</HudLabel>{!p.compact && <><Typography sx={{ mt: .45, fontFamily: 'inherit', fontSize: 20, fontWeight: 760, color: HUD.fg }}>{on ? 'SYS_READY' : 'SYS_HOLD'}</Typography><Typography sx={{ mt: .45, fontFamily: 'inherit', fontSize: 10.5, color: HUD.muted }}>{rtl ? 'برای تغییر وضعیت کلیک کنید' : 'Click to toggle mock state'}</Typography></>}</Box></Box>;

  return <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: 'auto minmax(0,1fr)', gap: 1.55, alignItems: 'center', direction: 'ltr' }}>
    <Box sx={{ display: 'grid', justifyItems: 'center', gap: .85 }}>{indicator}<HudLabel tone={tone}>{on ? 'INPUT / HIGH' : 'INPUT / LOW'}</HudLabel></Box>
    <Box sx={{ minWidth: 0, display: 'grid', gap: 1 }}><HudLabel tone={tone} rtl={rtl}>{label}</HudLabel><Readout value={on ? 'SYS_READY' : 'SYS_HOLD'} compact tone={tone} /><TickRail value={on ? 92 : 12} max={100} segments={16} height={12} /><Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: .7 }}><MiniStat label="UPTIME" value="18d 04h" tone={HUD.green} /><MiniStat label="FAULTS" value={on ? '0' : '1'} tone={on ? HUD.green : HUD.red} /><MiniStat label="MODE" value={on ? 'AUTO' : 'HOLD'} tone={tone} /></Box><Box><Box sx={{ display: 'flex', justifyContent: 'space-between' }}><HudLabel>state trace</HudLabel><HudLabel tone={HUD.dim}>15 MIN</HudLabel></Box><HudSparkline values={on ? [90,92,91,93,92,93,94,93,94,94,95,94] : [91,88,64,31,13,12,11,12,10,11,12,11]} height={58} color={tone} fill /></Box></Box>
  </Box>;
}

function ArcGauge({ value, max, unit, tone, compact, large = false }: { value: number; max: number; unit: string; tone: string; compact: boolean; large?: boolean }) {
  const pct = clamp(value / Math.max(1, max), 0, 1);
  const start = -220;
  const sweep = 260;
  const angle = start + sweep * pct;
  const rad = angle * Math.PI / 180;
  const needleX = 70 + Math.cos(rad) * 39;
  const needleY = 72 + Math.sin(rad) * 39;
  const circumference = 2 * Math.PI * 48;
  const visible = circumference * .72;
  return <Box sx={{ width: compact ? 138 : large ? 192 : 164, height: compact ? 118 : large ? 164 : 138, position: 'relative', direction: 'ltr' }}>
    <svg viewBox="0 0 140 118" width="100%" height="100%" aria-hidden>
      <circle cx="70" cy="72" r="48" fill="none" stroke="rgba(25,247,255,.08)" strokeWidth="7" strokeDasharray={`${visible} ${circumference}`} transform="rotate(145 70 72)" />
      <circle cx="70" cy="72" r="48" fill="none" stroke={tone} strokeWidth="7" strokeDasharray={`${visible * pct} ${circumference}`} transform="rotate(145 70 72)" />
      {Array.from({ length: 13 }).map((_, i) => { const a = (start + (sweep / 12) * i) * Math.PI / 180; const x1 = 70 + Math.cos(a) * 52; const y1 = 72 + Math.sin(a) * 52; const x2 = 70 + Math.cos(a) * 58; const y2 = 72 + Math.sin(a) * 58; return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(231,251,255,.38)" strokeWidth="1" />; })}
      <line x1="70" y1="72" x2={needleX} y2={needleY} stroke={HUD.fg} strokeWidth="2" /><circle cx="70" cy="72" r="4" fill={tone} /><text x="70" y="103" textAnchor="middle" fill={HUD.fg} fontSize="18" fontWeight="700">{value}</text><text x="70" y="114" textAnchor="middle" fill={HUD.muted} fontSize="7.5">{unit}</text>
    </svg>
  </Box>;
}

function Gauge({ def, size }: VisualProps) {
  const p = profile(size);
  const value = n(def.mock.value, 68);
  const max = n(def.mock.max, 100);
  const unit = s(def.mock.unit);
  const pct = clamp(value / Math.max(1, max), 0, 1);
  const tone = pct > .9 ? HUD.red : pct > .75 ? HUD.amber : HUD.cyan;
  const state = pct > .9 ? 'CRITICAL' : pct > .75 ? 'WATCH' : 'NOMINAL';

  if (p.compact) return <Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}><ArcGauge value={value} max={max} unit={unit} tone={tone} compact /></Box>;
  if (p.wide && !p.large) return <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: '145px 1fr', gap: 1.3, alignItems: 'center', direction: 'ltr' }}><Box><HudLabel tone={tone}>{state}</HudLabel><Readout value={value} unit={unit} /><Typography sx={{ mt: .5, fontFamily: 'inherit', fontSize: 10, color: HUD.muted }}>RANGE 0 — {max}</Typography></Box><Box sx={{ display: 'grid', gap: 1 }}><TickRail value={value} max={max} segments={18} height={18} /><Box sx={{ display: 'flex', justifyContent: 'space-between' }}><HudLabel tone={HUD.dim}>MIN</HudLabel><HudLabel tone={tone}>{Math.round(pct * 100)}%</HudLabel><HudLabel tone={HUD.dim}>MAX</HudLabel></Box></Box></Box>;

  return <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: p.tall ? '1fr' : p.large ? 'minmax(200px,.9fr) minmax(0,1.1fr)' : 'minmax(170px,.85fr) minmax(0,1.15fr)', alignItems: 'center', gap: 1.2, direction: 'ltr' }}><Box sx={{ display: 'grid', placeItems: 'center' }}><ArcGauge value={value} max={max} unit={unit} tone={tone} compact={false} large={p.large} /></Box><Box sx={{ minWidth: 0, height: p.large ? '100%' : 'auto', borderLeft: p.tall ? 'none' : `1px solid ${HUD.borderSoft}`, borderTop: p.tall ? `1px solid ${HUD.borderSoft}` : 'none', pl: p.tall ? 0 : 1.1, pt: p.tall ? 1 : 0, display: 'grid', gridTemplateRows: p.large ? 'auto auto auto minmax(0,1fr)' : undefined, alignContent: 'center', gap: 1 }}><Box sx={{ display: 'flex', justifyContent: 'space-between' }}><HudLabel tone={tone}>{state}</HudLabel><HudLabel>{Math.round(pct * 100)}% LOAD</HudLabel></Box><TickRail value={value} max={max} segments={16} height={13} /><Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: .8 }}><MiniStat label="LOW" value="0" /><MiniStat label="HIGH" value={String(max)} /></Box>{p.large && <Box sx={{ minHeight: 0 }}><Box sx={{ display: 'flex', justifyContent: 'space-between' }}><HudLabel>load trace</HudLabel><HudLabel tone={HUD.dim}>30 MIN</HudLabel></Box><HudSparkline values={[35,42,38,51,58,54,65,68,64,71,69,72]} height="100%" color={tone} fill /></Box>}</Box></Box>;
}

function LineChart({ def, size }: VisualProps) {
  const p = profile(size);
  const values = (def.mock.values as number[] | undefined) ?? spark;
  const summary = s(def.mock.summary, '24.8 °C');
  const change = values.length > 1 ? values[values.length - 1] - values[0] : 0;
  const tone = change >= 0 ? HUD.green : HUD.amber;
  return <Box sx={{ height: '100%', display: 'grid', gridTemplateRows: 'auto minmax(0,1fr) auto', gap: .55, direction: 'ltr' }}>
    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
      <Box><HudLabel>{def.visual === 'area' ? 'energy trace' : 'telemetry trace'}</HudLabel><Typography sx={{ mt: .18, fontFamily: 'inherit', fontSize: p.large ? 27 : 22, fontWeight: 760, color: HUD.fg }}>{summary}</Typography></Box>
      <Box sx={{ textAlign: 'right' }}><HudLabel tone={tone}>{change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(1)}</HudLabel><HudLabel tone={HUD.dim}>24H BUFFER</HudLabel></Box>
    </Box>
    <Box sx={{ minHeight: 0, borderTop: `1px solid ${HUD.borderSoft}`, borderBottom: `1px solid ${HUD.borderSoft}`, py: .45 }}><HudSparkline values={values} height="100%" fill={def.visual === 'area'} showDots={p.large} /></Box>
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', color: HUD.dim }}>
      {['00','06','12','18','NOW'].map((label, i) => <HudLabel key={label} tone={HUD.dim}><Box component="span" sx={{ display: 'block', textAlign: i === 0 ? 'left' : i === 4 ? 'right' : 'center' }}>{label}</Box></HudLabel>)}
    </Box>
  </Box>;
}

function BarChart({ def, size }: VisualProps) {
  const p = profile(size);
  const values = (def.mock.values as number[] | undefined) ?? bars;
  const max = Math.max(...values, 1);
  return <Box sx={{ height: '100%', display: 'grid', gridTemplateRows: 'auto minmax(0,1fr) auto', gap: .65, direction: 'ltr' }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Box><HudLabel>channel totals</HudLabel><Typography sx={{ fontFamily: 'inherit', fontSize: p.large ? 23 : 18, fontWeight: 730 }}>{s(def.mock.summary, '7 day output')}</Typography></Box><HudLabel tone={HUD.green}>SYNCED</HudLabel></Box>
    <Box sx={{ minHeight: 0, display: 'flex', alignItems: 'end', gap: p.large ? .9 : .6, borderBottom: `1px solid ${HUD.borderSoft}`, backgroundImage: 'repeating-linear-gradient(0deg,transparent 0 24%,rgba(25,247,255,.055) 25%)', px: .35 }}>
      {values.map((v, i) => <Box key={i} sx={{ flex: 1, minWidth: 0, height: `${Math.max(10, (v / max) * 94)}%`, background: i === values.length - 2 ? HUD.amber : HUD.cyan, opacity: .38 + (i / Math.max(1, values.length - 1)) * .58, clipPath: 'polygon(0 6px,6px 0,100% 0,100% 100%,0 100%)', boxShadow: i === values.length - 2 ? `0 0 14px ${HUD.amber}22` : 'none' }} />)}
    </Box>
    <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${values.length},1fr)`, gap: .6 }}>{values.map((_, i) => <HudLabel key={i} tone={HUD.dim}><Box component="span" sx={{ display: 'block', textAlign: 'center' }}>D{i + 1}</Box></HudLabel>)}</Box>
  </Box>;
}

function Histogram({ size }: VisualProps) {
  const p = profile(size);
  const values = [2,5,9,15,20,17,12,8,4,2];
  const max = 20;
  return <Box sx={{ height: '100%', display: 'grid', gridTemplateRows: 'auto minmax(0,1fr) auto', gap: .6, direction: 'ltr' }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Box><HudLabel>sample density</HudLabel><Typography sx={{ fontFamily: 'inherit', fontSize: p.large ? 23 : 18, fontWeight: 730 }}>DISTRIBUTION</Typography></Box><HudLabel tone={HUD.green}>N=94</HudLabel></Box>
    <Box sx={{ minHeight: 0, display: 'flex', alignItems: 'end', gap: .2, borderBottom: `1px solid ${HUD.borderSoft}`, backgroundImage: 'repeating-linear-gradient(0deg,transparent 0 24%,rgba(25,247,255,.055) 25%)' }}>
      {values.map((v, i) => <Box key={i} sx={{ flex: 1, height: `${Math.max(5, (v / max) * 96)}%`, bgcolor: i >= 4 && i <= 6 ? HUD.cyan : HUD.cyanSoft, opacity: .28 + (v / max) * .7 }} />)}
    </Box>
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><HudLabel tone={HUD.dim}>LOW</HudLabel><HudLabel tone={HUD.dim}>μ 24.6</HudLabel><HudLabel tone={HUD.dim}>HIGH</HudLabel></Box>
  </Box>;
}

function Donut({ def, size }: VisualProps) {
  const p = profile(size);
  const value = clamp(n(def.mock.value, 72), 0, 100);
  const segments = 24;
  const active = Math.round(value / 100 * segments);
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const gap = circumference / segments;
  const dash = gap * .58;
  const diameter = p.compact ? 126 : p.wide && !p.large ? 124 : p.large ? 178 : 150;
  const ring = <Box sx={{ position: 'relative', width: diameter, height: diameter }}><svg viewBox="0 0 120 120" width="100%" height="100%" aria-hidden><circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(25,247,255,.07)" strokeWidth="9" /><circle cx="60" cy="60" r={radius} fill="none" stroke={value > 85 ? HUD.amber : HUD.cyan} strokeWidth="9" strokeDasharray={`${dash} ${gap - dash}`} strokeDashoffset="0" transform="rotate(-90 60 60)" pathLength={circumference} opacity=".95" /><circle cx="60" cy="60" r="34" fill="rgba(25,247,255,.025)" stroke="rgba(25,247,255,.12)" /></svg><Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}><Box><Typography sx={{ fontFamily: 'inherit', fontSize: p.large ? 30 : 26, fontWeight: 760 }}>{value}%</Typography><HudLabel>UTIL</HudLabel></Box></Box><Box sx={{ position: 'absolute', left: '50%', top: 1, transform: 'translateX(-50%)', width: 2, height: 7, bgcolor: active > 0 ? HUD.cyan : HUD.dim }} /></Box>;
  if (p.compact || p.tall) return <Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}>{ring}</Box>;
  return <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: p.large ? 'minmax(185px,.85fr) minmax(0,1.15fr)' : 'auto 1fr', alignItems: 'center', gap: 1.35, direction: 'ltr' }}><Box sx={{ display: 'grid', placeItems: 'center' }}>{ring}</Box><Box sx={{ height: p.large ? '100%' : 'auto', display: 'grid', gridTemplateRows: p.large ? 'auto auto auto auto minmax(0,1fr)' : undefined, alignContent: 'center', gap: .9, minWidth: 0 }}><HudLabel>capacity matrix</HudLabel><MiniStat label="USED" value={`${value}%`} tone={value > 85 ? HUD.amber : HUD.cyan} /><MiniStat label="FREE" value={`${100 - value}%`} tone={HUD.green} />{p.large && <><TickRail value={value} max={100} segments={14} height={12} /><Box sx={{ minHeight: 0 }}><Box sx={{ display: 'flex', justifyContent: 'space-between' }}><HudLabel>utilization trace</HudLabel><HudLabel tone={HUD.dim}>6 H</HudLabel></Box><HudSparkline values={[58,61,59,63,66,68,67,71,70,73,72,72]} height="100%" fill /></Box></>}</Box></Box>;
}

function Heatmap({ size }: VisualProps) {
  const p = profile(size);
  return <Box sx={{ height: '100%', display: 'grid', gridTemplateRows: 'auto minmax(0,1fr) auto', gap: .65, direction: 'ltr' }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><HudLabel>thermal/activity matrix</HudLabel><HudLabel tone={HUD.amber}>PEAK 92</HudLabel></Box>
    <Box sx={{ minHeight: 0, display: 'grid', gridTemplateColumns: 'repeat(7,minmax(0,1fr))', gridTemplateRows: 'repeat(4,minmax(0,1fr))', gap: p.large ? .6 : .38 }}>
      {heat.flat().map((v, i) => {
        const alpha = .08 + v * .82;
        const bg = v > .84 ? `rgba(255,200,87,${alpha})` : `rgba(25,247,255,${alpha})`;
        return <Box key={i} sx={{ minHeight: 0, bgcolor: bg, border: `1px solid ${v > .84 ? 'rgba(255,200,87,.55)' : 'rgba(25,247,255,.12)'}`, clipPath: 'polygon(3px 0,100% 0,100% calc(100% - 3px),calc(100% - 3px) 100%,0 100%,0 3px)' }} />;
      })}
    </Box>
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>{['M','T','W','T','F','S','S'].map((d, i) => <HudLabel key={`${d}-${i}`} tone={HUD.dim}><Box component="span" sx={{ display: 'block', textAlign: 'center' }}>{d}</Box></HudLabel>)}</Box>
  </Box>;
}

function Timeline({ size }: VisualProps) {
  const p = profile(size);
  const rows = [
    { name: 'LINE-01', values: [1,1,2,1,3,3,1,1,1,2] },
    { name: 'LINE-02', values: [1,1,1,1,1,0,0,1,1,1] },
    { name: 'PUMP-04', values: [0,0,1,1,1,1,1,1,2,1] },
    ...(p.large ? [{ name: 'VALVE-02', values: [1,1,1,1,2,2,1,1,1,1] }] : []),
  ];
  const color = (v: number) => v === 3 ? HUD.red : v === 2 ? HUD.amber : v === 1 ? HUD.green : HUD.dim;
  return <Box sx={{ height: '100%', display: 'grid', gridTemplateRows: 'auto minmax(0,1fr) auto', gap: .8, direction: 'ltr' }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><HudLabel>state history</HudLabel><HudLabel tone={HUD.green}>LIVE WINDOW</HudLabel></Box>
    <Box sx={{ minHeight: 0, display: 'grid', gridTemplateRows: `repeat(${rows.length},minmax(20px,1fr))`, gap: .55, alignContent: 'center' }}>
      {rows.map(row => <Box key={row.name} sx={{ display: 'grid', gridTemplateColumns: p.wide ? '68px 1fr' : '58px 1fr', gap: .65, alignItems: 'center', minHeight: 0 }}>
        <HudLabel tone={HUD.muted}>{row.name}</HudLabel>
        <Box sx={{ display: 'grid', gridTemplateColumns: `repeat(${row.values.length},1fr)`, gap: .24, height: '70%', minHeight: 12 }}>{row.values.map((v, i) => <Box key={i} sx={{ bgcolor: color(v), opacity: v === 0 ? .28 : .88, boxShadow: v >= 2 ? `0 0 8px ${color(v)}2a` : 'none' }} />)}</Box>
      </Box>)}
    </Box>
    <Box sx={{ display: 'grid', gridTemplateColumns: '68px repeat(5,1fr)', gap: .65 }}><span />{['00','06','12','18','24'].map(t => <HudLabel key={t} tone={HUD.dim}><Box component="span" sx={{ display: 'block', textAlign: 'center' }}>{t}</Box></HudLabel>)}</Box>
  </Box>;
}

function MapVisual({ def, size }: VisualProps) {
  const p = profile(size);
  const route = def.visual === 'route';
  return <Box sx={{ height: '100%', position: 'relative', overflow: 'hidden', border: `1px solid ${HUD.border}`, background: 'radial-gradient(circle at 52% 44%,rgba(25,247,255,.08),transparent 38%),#03101a', clipPath: 'polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)' }}>
    <Box sx={{ position: 'absolute', inset: 0, opacity: .55, backgroundImage: 'linear-gradient(rgba(25,247,255,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(25,247,255,.08) 1px,transparent 1px)', backgroundSize: p.large ? '34px 34px' : '28px 28px' }} />
    <Box sx={{ position: 'absolute', left: '50%', top: '50%', width: p.extraLarge ? 260 : 190, height: p.extraLarge ? 260 : 190, border: '1px solid rgba(25,247,255,.11)', borderRadius: '50%', transform: 'translate(-50%,-50%)', '&:before': { content: '""', position: 'absolute', inset: '24%', border: '1px solid rgba(25,247,255,.11)', borderRadius: '50%' } }} />
    <svg viewBox="0 0 360 220" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }} aria-hidden>
      <path d="M18 162 C70 118,104 126,150 155 S248 182,342 96" fill="none" stroke={route ? HUD.amber : HUD.cyan} strokeWidth="2.3" strokeDasharray={route ? '5 4' : undefined} />
      <path d="M24 72 C80 42,110 65,170 46 S276 54,340 36" fill="none" stroke="rgba(25,247,255,.12)" strokeWidth="1" />
      {[{x:80,y:127},{x:152,y:155},{x:251,y:164}].map((pt, i) => <g key={i}><circle cx={pt.x} cy={pt.y} r="11" fill="none" stroke="rgba(25,247,255,.18)"/><circle cx={pt.x} cy={pt.y} r="3.5" fill={i === 2 ? HUD.amber : HUD.cyan}/><line x1={pt.x-14} y1={pt.y} x2={pt.x+14} y2={pt.y} stroke="rgba(25,247,255,.18)"/><line x1={pt.x} y1={pt.y-14} x2={pt.x} y2={pt.y+14} stroke="rgba(25,247,255,.18)"/></g>)}
    </svg>
    <Box sx={{ position: 'absolute', left: 10, top: 9 }}><HudLabel tone={HUD.green}>GPS LOCK / 3D</HudLabel></Box>
    <Box sx={{ position: 'absolute', right: 10, top: 9, textAlign: 'right' }}><HudLabel tone={HUD.dim}>{route ? 'TRACK 12.4 KM' : 'FLEET / 03'}</HudLabel></Box>
    <Box sx={{ position: 'absolute', left: 10, bottom: 9, display: 'flex', gap: 1.5 }}><HudLabel>35.7219 N</HudLabel><HudLabel>51.3347 E</HudLabel></Box>
    {p.large && <Box sx={{ position: 'absolute', right: 9, bottom: 9, display: 'grid', gridTemplateColumns: 'auto auto', gap: .7, px: .8, py: .55, bgcolor: 'rgba(2,7,18,.72)', border: `1px solid ${HUD.borderSoft}` }}><HudLabel tone={HUD.dim}>ACC</HudLabel><HudLabel tone={HUD.green}>4.2 M</HudLabel><HudLabel tone={HUD.dim}>HDOP</HudLabel><HudLabel>0.8</HudLabel></Box>}
  </Box>;
}

function Coordinates({ def, locale, size }: VisualProps) {
  const p = profile(size);
  const lat = s(def.mock.lat, '35.7219° N');
  const lng = s(def.mock.lng, '51.3347° E');
  const accuracy = s(def.mock.accuracy, '4.2 m');
  const rtl = locale === 'fa';

  if (p.large) return <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(150px,.8fr)', gap: 1.2, direction: 'ltr' }}>
    <Box sx={{ minWidth: 0, display: 'grid', gridTemplateRows: '1fr 1fr auto', gap: .75 }}>
      {[['LAT', lat], ['LON', lng]].map(([label, value]) => <Box key={label} sx={{ minHeight: 0, px: 1.1, py: .8, borderLeft: `2px solid ${HUD.cyan}`, background: 'linear-gradient(90deg,rgba(25,247,255,.075),rgba(25,247,255,.015))', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <HudLabel>{label} / WGS84</HudLabel>
        <Typography sx={{ mt: .35, fontFamily: 'inherit', fontSize: 25, lineHeight: 1, fontWeight: 760, color: HUD.fg, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{value}</Typography>
      </Box>)}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: .75 }}><MiniStat label={rtl ? 'دقت' : 'ACCURACY'} value={accuracy} tone={HUD.green} rtl={rtl} /><MiniStat label="FIX" value="3D / 12 SAT" tone={HUD.cyan} /></Box>
    </Box>
    <Box sx={{ minWidth: 0, position: 'relative', border: `1px solid ${HUD.borderSoft}`, background: 'radial-gradient(circle,rgba(25,247,255,.07),transparent 58%)', overflow: 'hidden' }}>
      <Box sx={{ position: 'absolute', inset: '13%', border: `1px solid ${HUD.borderSoft}`, borderRadius: '50%', '&:before': { content: '""', position: 'absolute', inset: '26%', border: `1px solid ${HUD.borderSoft}`, borderRadius: '50%' }, '&:after': { content: '""', position: 'absolute', left: '50%', top: -18, bottom: -18, borderLeft: `1px solid ${HUD.borderSoft}` } }} />
      <Box sx={{ position: 'absolute', left: -18, right: -18, top: '50%', borderTop: `1px solid ${HUD.borderSoft}` }} />
      <Box sx={{ position: 'absolute', left: '50%', top: '50%', width: 12, height: 12, transform: 'translate(-50%,-50%) rotate(45deg)', bgcolor: HUD.cyan, boxShadow: `0 0 16px ${HUD.cyan}66` }} />
      <Box sx={{ position: 'absolute', left: 9, top: 8 }}><HudLabel tone={HUD.green}>GPS LOCK</HudLabel></Box>
      <Box sx={{ position: 'absolute', right: 9, bottom: 8 }}><HudLabel tone={HUD.dim}>HDOP 0.8</HudLabel></Box>
    </Box>
  </Box>;

  const rows = [['LAT', lat], ['LON', lng], [rtl ? 'دقت' : 'ACC', accuracy]];
  return <Box sx={{ height: '100%', display: 'grid', gridTemplateRows: `repeat(${rows.length},1fr)`, gap: p.compact ? .45 : .65, direction: 'ltr', alignContent: 'center' }}>
    {rows.map(([label, value], i) => <Box key={label} sx={{ minHeight: 0, display: 'grid', gridTemplateColumns: '46px 1fr auto', alignItems: 'center', gap: .7, px: p.compact ? .55 : .85, borderLeft: `2px solid ${i === 2 ? HUD.green : HUD.cyan}`, background: 'linear-gradient(90deg,rgba(25,247,255,.055),transparent)' }}>
      <HudLabel tone={i === 2 ? HUD.green : HUD.muted} rtl={rtl && i === 2}>{label}</HudLabel>
      <Typography sx={{ fontFamily: 'inherit', fontSize: p.compact ? 12 : 14.5, fontWeight: 710, color: HUD.fg, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value}</Typography>
      {!p.compact && <HudLabel tone={HUD.dim}>LOCK</HudLabel>}
    </Box>)}
  </Box>;
}

function Compass({ def, size }: VisualProps) {
  const p = profile(size);
  const value = n(def.mock.value, 327);
  const angle = value * Math.PI / 180;
  const x = 70 + Math.sin(angle) * 43;
  const y = 70 - Math.cos(angle) * 43;
  const cardinal = value >= 315 || value < 45 ? 'N' : value < 135 ? 'E' : value < 225 ? 'S' : 'W';
  const diameter = p.compact ? 132 : p.wide && !p.large ? 124 : p.large ? 188 : 154;
  const compass = <Box sx={{ width: diameter, height: diameter, position: 'relative' }}>
    <svg viewBox="0 0 140 140" width="100%" height="100%" aria-hidden>
      <circle cx="70" cy="70" r="57" fill="rgba(25,247,255,.025)" stroke="rgba(25,247,255,.28)" />
      <circle cx="70" cy="70" r="44" fill="none" stroke="rgba(25,247,255,.09)" />
      {Array.from({ length: 24 }).map((_, i) => { const a = i * 15 * Math.PI / 180; const major = i % 6 === 0; const r1 = major ? 49 : 52; const r2 = 57; return <line key={i} x1={70 + Math.sin(a) * r1} y1={70 - Math.cos(a) * r1} x2={70 + Math.sin(a) * r2} y2={70 - Math.cos(a) * r2} stroke={major ? HUD.fg : HUD.dim} strokeWidth={major ? 1.2 : .6} />; })}
      <line x1="70" y1="70" x2={x} y2={y} stroke={HUD.cyan} strokeWidth="3" />
      <circle cx="70" cy="70" r="4" fill={HUD.cyan} />
      <text x="70" y="17" fill={HUD.fg} textAnchor="middle" fontSize="9">N</text><text x="123" y="74" fill={HUD.muted} textAnchor="middle" fontSize="8">E</text><text x="70" y="129" fill={HUD.muted} textAnchor="middle" fontSize="8">S</text><text x="17" y="74" fill={HUD.muted} textAnchor="middle" fontSize="8">W</text>
    </svg>
    <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}><Box><Typography sx={{ mt: 2.8, fontFamily: 'inherit', fontSize: p.large ? 25 : 21, fontWeight: 760 }}>{value}°</Typography><HudLabel>{cardinal}</HudLabel></Box></Box>
  </Box>;

  if (p.compact || p.tall) return <Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}>{compass}</Box>;

  return <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: p.large ? 'minmax(190px,.9fr) minmax(0,1.1fr)' : 'auto 1fr', alignItems: 'center', gap: 1.5, direction: 'ltr' }}>
    <Box sx={{ display: 'grid', placeItems: 'center' }}>{compass}</Box>
    <Box sx={{ display: 'grid', gap: p.large ? 1.05 : .9, minWidth: 0 }}><HudLabel>heading solution</HudLabel><Readout value={`${value}°`} /><MiniStat label="CARDINAL" value={cardinal} tone={HUD.cyan} /><MiniStat label="MAG VAR" value="+2.1°" />{p.large && <><TickRail value={value} max={360} segments={18} height={11} /><Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: .8 }}><MiniStat label="COURSE" value="326.4°" /><MiniStat label="DRIFT" value="0.6°" tone={HUD.green} /></Box></>}</Box>
  </Box>;
}

function CommandButton({ locale, size }: VisualProps) {
  const p = profile(size);
  const [state, setState] = useState<'ready' | 'queued' | 'ack'>('ready');
  const send = () => { setState('queued'); window.setTimeout(() => setState('ack'), 650); window.setTimeout(() => setState('ready'), 1650); };
  const tone = state === 'ack' ? HUD.green : state === 'queued' ? HUD.amber : HUD.cyan;
  const primary = state === 'ack' ? (locale === 'fa' ? 'تأیید شد' : 'ACKNOWLEDGED') : state === 'queued' ? (locale === 'fa' ? 'در صف' : 'QUEUED') : (locale === 'fa' ? 'ارسال فرمان' : 'EXECUTE');
  const button = <Button onClick={send} disableRipple sx={{ width: '100%', minHeight: p.compact ? 62 : p.large ? 92 : 72, color: tone, fontFamily: 'inherit', fontSize: p.large ? 15 : p.compact ? 12 : 13, fontWeight: 760, letterSpacing: locale === 'fa' ? 0 : 1.4, border: `1px solid ${tone}99`, borderRadius: 0, clipPath: 'polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)', background: `linear-gradient(90deg,${tone}09,${tone}17,${tone}09)`, boxShadow: `inset 0 0 0 1px ${tone}12,0 0 24px ${tone}12`, '&:hover': { background: `linear-gradient(90deg,${tone}11,${tone}22,${tone}11)` } }}>{primary}</Button>;

  if (!p.large) return <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', direction: 'ltr' }}><Box sx={{ width: '100%', maxWidth: p.compact ? 175 : 320, textAlign: 'center' }}>{button}<Box sx={{ mt: .8, display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: .7, alignItems: 'center' }}><Box sx={{ height: 1, bgcolor: HUD.borderSoft }} /><HudLabel tone={tone}>{state === 'ready' ? 'RPC READY' : state === 'queued' ? 'TX / 01' : 'RX / OK'}</HudLabel><Box sx={{ height: 1, bgcolor: HUD.borderSoft }} /></Box></Box></Box>;

  return <Box sx={{ height: '100%', display: 'grid', gridTemplateRows: 'auto auto auto minmax(0,1fr)', gap: 1, direction: 'ltr' }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><Box><HudLabel>command channel / rpc-01</HudLabel><Typography sx={{ mt: .2, fontFamily: 'inherit', fontSize: 18, fontWeight: 740, color: HUD.fg }}>ACTUATOR EXECUTION</Typography></Box><HudLabel tone={tone}>{state === 'ready' ? 'ARMED' : state.toUpperCase()}</HudLabel></Box>
    {button}
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: .75 }}><MiniStat label="TARGET" value="NODE-04" /><MiniStat label="TIMEOUT" value="2.5 s" /><MiniStat label="LAST ACK" value={state === 'ack' ? 'NOW' : '09:42:18'} tone={state === 'ack' ? HUD.green : HUD.fg} /></Box>
    <Box sx={{ minHeight: 0, border: `1px solid ${HUD.borderSoft}`, p: .8, background: 'rgba(25,247,255,.018)', display: 'grid', alignContent: 'center', gap: .55 }}><Box sx={{ display: 'flex', justifyContent: 'space-between' }}><HudLabel>response bus</HudLabel><HudLabel tone={tone}>{state === 'queued' ? 'TX →' : state === 'ack' ? '← ACK' : 'IDLE'}</HudLabel></Box><TickRail value={state === 'ready' ? 36 : state === 'queued' ? 72 : 100} max={100} segments={18} height={9} /><HudLabel tone={HUD.dim}>{locale === 'fa' ? 'بازخورد محلی حالت Mock فعال است' : 'MOCK PATH / LOCAL FEEDBACK / CRC OK'}</HudLabel></Box>
  </Box>;
}

function SwitchControl({ def, locale, size }: VisualProps) {
  const p = profile(size);
  const [on, setOn] = useState(Boolean(def.mock.value ?? true));
  const tone = on ? HUD.green : HUD.red;
  const toggle = <Box onClick={() => setOn(v => !v)} sx={{ cursor: 'pointer', width: '100%', border: `1px solid ${tone}88`, bgcolor: `${tone}08`, p: .75, clipPath: 'polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)' }}>
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: p.compact ? 48 : p.large ? 78 : 58, gap: .5 }}><Box sx={{ display: 'grid', placeItems: 'center', bgcolor: on ? `${HUD.green}22` : 'transparent', border: `1px solid ${on ? `${HUD.green}99` : HUD.borderSoft}` }}><Typography sx={{ fontFamily: 'inherit', fontSize: p.large ? 14 : 11.5, fontWeight: 760, color: on ? HUD.green : HUD.dim }}>ON</Typography></Box><Box sx={{ display: 'grid', placeItems: 'center', bgcolor: !on ? `${HUD.red}18` : 'transparent', border: `1px solid ${!on ? `${HUD.red}99` : HUD.borderSoft}` }}><Typography sx={{ fontFamily: 'inherit', fontSize: p.large ? 14 : 11.5, fontWeight: 760, color: !on ? HUD.red : HUD.dim }}>OFF</Typography></Box></Box>
  </Box>;

  if (!p.large) return <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', direction: 'ltr' }}><Box sx={{ width: p.compact ? 166 : Math.min(260, p.wide ? 250 : 190) }}>{toggle}{!p.compact && <Box sx={{ mt: .7, display: 'flex', justifyContent: 'space-between' }}><HudLabel tone={tone}>{on ? 'OUTPUT ENERGIZED' : 'OUTPUT ISOLATED'}</HudLabel><HudLabel>{locale === 'fa' ? 'برای تغییر کلیک کنید' : 'TAP / TOGGLE'}</HudLabel></Box>}</Box></Box>;

  return <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: 'minmax(200px,.92fr) minmax(0,1.08fr)', gap: 1.25, direction: 'ltr' }}>
    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1 }}><HudLabel>digital output / do-04</HudLabel><Typography sx={{ fontFamily: 'inherit', fontSize: 28, lineHeight: 1, fontWeight: 760, color: tone }}>{on ? 'ENERGIZED' : 'ISOLATED'}</Typography>{toggle}<HudLabel tone={tone}>{locale === 'fa' ? 'برای تغییر وضعیت کلیک کنید' : 'CLICK PANEL TO TOGGLE OUTPUT'}</HudLabel></Box>
    <Box sx={{ minWidth: 0, borderLeft: `1px solid ${HUD.borderSoft}`, pl: 1.15, display: 'grid', gridTemplateRows: 'auto auto minmax(0,1fr)', gap: .85 }}><Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: .75 }}><MiniStat label="COIL" value={on ? '24.1 V' : '0.0 V'} tone={tone} /><MiniStat label="FEEDBACK" value={on ? 'CLOSED' : 'OPEN'} tone={tone} /></Box><TickRail value={on ? 82 : 8} max={100} segments={14} height={11} /><Box sx={{ minHeight: 0 }}><Box sx={{ display: 'flex', justifyContent: 'space-between' }}><HudLabel>output trace</HudLabel><HudLabel tone={HUD.dim}>60 SEC</HudLabel></Box><HudSparkline values={on ? [8,8,18,35,72,80,82,81,83,82,82,82] : [84,82,55,24,9,8,8,7,8,7,8,8]} height="100%" color={tone} fill /></Box></Box>
  </Box>;
}

function HudSlider({ def, locale, size }: VisualProps) {
  const p = profile(size);
  const [value, setValue] = useState(n(def.mock.value, 65));
  const unit = s(def.mock.unit, '%');
  return <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 1.1, direction: 'ltr', px: .4 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 1 }}><Box><HudLabel>{locale === 'fa' ? 'مقدار هدف' : 'COMMAND LEVEL'}</HudLabel><Readout value={value} unit={unit} compact={p.compact} /></Box><HudLabel tone={HUD.green}>ARMED</HudLabel></Box>
    <Slider min={0} max={100} value={value} onChange={(_, v) => setValue(v as number)} sx={{
      py: 1,
      color: HUD.cyan,
      '& .MuiSlider-rail': { height: 5, opacity: 1, bgcolor: 'rgba(25,247,255,.09)', borderRadius: 0 },
      '& .MuiSlider-track': { height: 5, border: 'none', borderRadius: 0, boxShadow: `0 0 12px ${HUD.cyan}22` },
      '& .MuiSlider-thumb': { width: 16, height: 24, borderRadius: 0, bgcolor: HUD.bg0, border: `1px solid ${HUD.cyan}`, '&:before': { boxShadow: 'none' } },
    }} />
    <TickRail value={value} max={100} segments={p.large ? 18 : 12} height={p.compact ? 8 : 10} />
    {p.large && <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: .8 }}><MiniStat label="MIN" value="0" /><MiniStat label="MAX" value="100" /></Box>}
  </Box>;
}

function InputControl({ def, locale, size }: VisualProps) {
  const p = profile(size);
  const [value, setValue] = useState(String(def.mock.value ?? '22.5'));
  const unit = s(def.mock.unit, '°C');
  const field = <TextField value={value} onChange={e => setValue(e.target.value)} size="small" fullWidth inputProps={{ dir: 'ltr' }} sx={{ '& .MuiOutlinedInput-root': { color: HUD.fg, fontFamily: 'inherit', borderRadius: 0, bgcolor: 'rgba(25,247,255,.025)', '& fieldset': { borderColor: HUD.border }, '&:hover fieldset': { borderColor: 'rgba(25,247,255,.5)' }, '&.Mui-focused fieldset': { borderColor: HUD.cyan } }, '& input': { fontSize: p.large ? 28 : p.compact ? 18 : 22, py: p.large ? 1.35 : undefined, fontWeight: 720, fontVariantNumeric: 'tabular-nums' } }} />;

  if (!p.large) return <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', direction: 'ltr' }}><Box sx={{ width: '100%', maxWidth: p.compact ? 180 : 320 }}><HudLabel>{locale === 'fa' ? 'ورودی دستی' : 'MANUAL SETPOINT'}</HudLabel><Box sx={{ mt: .8 }}>{field}</Box><Box sx={{ mt: .7, display: 'flex', justifyContent: 'space-between' }}><HudLabel tone={HUD.green}>VALID</HudLabel><HudLabel>{unit}</HudLabel></Box></Box></Box>;

  const numeric = Number(value);
  const valid = Number.isFinite(numeric);
  const pct = valid ? clamp(((numeric - 10) / 30) * 100, 0, 100) : 0;
  return <Box sx={{ height: '100%', display: 'grid', gridTemplateRows: 'auto auto auto minmax(0,1fr)', gap: 1, direction: 'ltr' }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}><Box><HudLabel>{locale === 'fa' ? 'ورودی دستی / محلی' : 'MANUAL SETPOINT / LOCAL'}</HudLabel><Typography sx={{ mt: .2, fontFamily: 'inherit', fontSize: 18, fontWeight: 740 }}>CONTROL REGISTER SP-01</Typography></Box><HudLabel tone={valid ? HUD.green : HUD.red}>{valid ? 'VALID' : 'INVALID'}</HudLabel></Box>
    {field}
    <Box><Box sx={{ display: 'flex', justifyContent: 'space-between' }}><HudLabel>10 {unit}</HudLabel><HudLabel tone={HUD.cyan}>{valid ? `${numeric.toFixed(1)} ${unit}` : '--'}</HudLabel><HudLabel>40 {unit}</HudLabel></Box><Box sx={{ mt: .6 }}><TickRail value={pct} max={100} segments={18} height={12} /></Box></Box>
    <Box sx={{ minHeight: 0, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: .75, alignContent: 'end' }}><MiniStat label="PREVIOUS" value={`21.8 ${unit}`} /><MiniStat label="DEADBAND" value={`±0.5 ${unit}`} /><MiniStat label="SOURCE" value="LOCAL" tone={HUD.green} /></Box>
  </Box>;
}

function Thermostat({ def, size }: VisualProps) {
  const p = profile(size);
  const [value, setValue] = useState(n(def.mock.value, 22));
  const pct = (value - 16) / 14;
  const tone = value >= 27 ? HUD.amber : value <= 18 ? HUD.cyan : HUD.green;
  const diameter = p.compact ? 124 : p.wide && !p.large ? 124 : p.tall ? 150 : p.large ? 160 : 136;
  return <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: p.compact || p.tall ? '1fr' : 'auto minmax(0,1fr)', placeItems: p.compact || p.tall ? 'center' : undefined, alignItems: 'center', gap: 1.25, direction: 'ltr' }}>
    <Box sx={{ width: diameter, height: diameter, borderRadius: '50%', position: 'relative', display: 'grid', placeItems: 'center', background: `conic-gradient(from -140deg,${tone} ${pct * 280}deg,rgba(25,247,255,.08) 0 280deg,transparent 280deg)`, '&:before': { content: '""', position: 'absolute', inset: 10, borderRadius: '50%', bgcolor: HUD.bg1, border: `1px solid ${HUD.borderSoft}` } }}>
      <Box sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}><HudLabel>setpoint</HudLabel><Typography sx={{ fontFamily: 'inherit', fontSize: p.compact ? 30 : 36, fontWeight: 760, color: tone }}>{value}°</Typography><HudLabel tone={tone}>AUTO</HudLabel></Box>
    </Box>
    {!p.compact && !p.tall && <Box sx={{ minWidth: 0 }}><HudLabel>thermal command</HudLabel><Slider min={16} max={30} value={value} onChange={(_, v) => setValue(v as number)} sx={{ mt: 1, color: tone, '& .MuiSlider-rail': { bgcolor: 'rgba(25,247,255,.09)', opacity: 1, borderRadius: 0 }, '& .MuiSlider-track': { border: 'none', borderRadius: 0 }, '& .MuiSlider-thumb': { width: 14, height: 22, borderRadius: 0, bgcolor: HUD.bg0, border: `1px solid ${tone}` } }} /><Box sx={{ display: 'flex', justifyContent: 'space-between' }}><HudLabel>16°</HudLabel><HudLabel tone={tone}>{value}°</HudLabel><HudLabel>30°</HudLabel></Box>{p.large && <Box sx={{ mt: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: .8 }}><MiniStat label="ROOM" value="24.8 °C" /><MiniStat label="MODE" value="HEAT" tone={tone} /></Box>}</Box>}
  </Box>;
}

function ColorControl({ locale, size }: VisualProps) {
  const p = profile(size);
  const [hue, setHue] = useState(188);
  const [brightness, setBrightness] = useState(78);
  const [on, setOn] = useState(true);
  const preview = on ? `hsl(${hue} 88% ${Math.max(28, brightness / 1.7)}%)` : '#172532';
  const presets = [0, 36, 120, 188, 265, 315];
  return <Box sx={{ height: '100%', display: 'grid', gridTemplateRows: 'auto auto auto', alignContent: 'center', gap: p.compact ? .7 : .9, direction: 'ltr' }}>
    <Box onClick={() => setOn(v => !v)} sx={{ cursor: 'pointer', height: p.compact ? 50 : p.large ? 76 : 58, position: 'relative', overflow: 'hidden', border: `1px solid ${on ? preview : HUD.border}`, background: preview, clipPath: 'polygon(8px 0,100% 0,100% calc(100% - 8px),calc(100% - 8px) 100%,0 100%,0 8px)', boxShadow: on ? `0 0 24px hsl(${hue} 85% 55% / .22)` : 'none' }}>
      <Box sx={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(90deg,rgba(2,7,18,.58),transparent 45%,rgba(2,7,18,.38))' }} />
      <Box sx={{ position: 'absolute', left: 9, bottom: 7 }}><HudLabel tone="#fff">{on ? 'LIGHT / ON' : 'LIGHT / OFF'}</HudLabel></Box><Box sx={{ position: 'absolute', right: 9, bottom: 7 }}><HudLabel tone="#fff">{brightness}%</HudLabel></Box>
    </Box>
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: .6 }}>{presets.map(v => <Box key={v} onClick={() => { setHue(v); setOn(true); }} sx={{ cursor: 'pointer', height: p.compact ? 17 : 22, bgcolor: `hsl(${v} 85% 55%)`, border: hue === v ? '2px solid #fff' : '1px solid rgba(255,255,255,.16)', boxShadow: hue === v ? `0 0 10px hsl(${v} 85% 55% / .45)` : 'none' }} />)}</Box>
    <Box sx={{ display: 'grid', gridTemplateRows: p.large ? 'auto auto' : 'auto', gap: .65 }}>
      <Box><Box sx={{ display: 'flex', justifyContent: 'space-between' }}><HudLabel>{locale === 'fa' ? 'رنگ' : 'HUE'}</HudLabel><HudLabel>{hue}°</HudLabel></Box><Slider min={0} max={360} value={hue} onChange={(_, v) => setHue(v as number)} size="small" sx={{ py: .55, color: HUD.cyan, '& .MuiSlider-rail': { bgcolor: 'rgba(25,247,255,.09)', opacity: 1 }, '& .MuiSlider-thumb': { width: 12, height: 18, borderRadius: 0, bgcolor: HUD.bg0, border: `1px solid ${HUD.cyan}` } }} /></Box>
      {p.large && <Box><Box sx={{ display: 'flex', justifyContent: 'space-between' }}><HudLabel>{locale === 'fa' ? 'روشنایی' : 'BRIGHTNESS'}</HudLabel><HudLabel>{brightness}%</HudLabel></Box><Slider min={5} max={100} value={brightness} onChange={(_, v) => setBrightness(v as number)} size="small" sx={{ py: .55, color: HUD.amber, '& .MuiSlider-rail': { bgcolor: 'rgba(255,200,87,.09)', opacity: 1 }, '& .MuiSlider-thumb': { width: 12, height: 18, borderRadius: 0, bgcolor: HUD.bg0, border: `1px solid ${HUD.amber}` } }} /></Box>}
    </Box>
  </Box>;
}

function DirectionControl({ locale, size }: VisualProps) {
  const p = profile(size);
  const [active, setActive] = useState('•');
  const keys = ['↑', '←', '•', '→', '↓'];
  const positions = [2,4,5,6,8];
  const pad = <Box sx={{ width: '100%' }}><Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gridTemplateRows: 'repeat(3,1fr)', gap: .45, aspectRatio: '1/1' }}>{keys.map((key, i) => { const pos = positions[i]; const selected = active === key; return <Button key={key} onClick={() => setActive(key)} disableRipple sx={{ gridColumn: ((pos - 1) % 3) + 1, gridRow: Math.floor((pos - 1) / 3) + 1, minWidth: 0, borderRadius: 0, border: `1px solid ${selected ? `${HUD.cyan}99` : HUD.borderSoft}`, color: selected ? HUD.cyan : HUD.muted, bgcolor: selected ? 'rgba(25,247,255,.11)' : 'rgba(25,247,255,.02)', fontSize: p.large ? (key === '•' ? 26 : 28) : key === '•' ? 20 : 22, '&:hover': { bgcolor: 'rgba(25,247,255,.09)' } }}>{key}</Button>; })}</Box></Box>;

  if (!p.large) return <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', direction: 'ltr' }}><Box sx={{ width: p.compact ? 142 : p.wide ? 124 : 176 }}>{pad}{!p.compact && <Box sx={{ mt: .65, display: 'flex', justifyContent: 'space-between' }}><HudLabel>{locale === 'fa' ? 'آخرین فرمان' : 'LAST CMD'}</HudLabel><HudLabel tone={HUD.cyan}>{active}</HudLabel></Box>}</Box></Box>;

  return <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: 'minmax(220px,.9fr) minmax(0,1.1fr)', gap: 1.3, direction: 'ltr', alignItems: 'center' }}>
    <Box sx={{ width: 220, maxWidth: '100%', justifySelf: 'center' }}>{pad}<Box sx={{ mt: .7, display: 'flex', justifyContent: 'space-between' }}><HudLabel>{locale === 'fa' ? 'آخرین فرمان' : 'LAST COMMAND'}</HudLabel><HudLabel tone={HUD.cyan}>{active === '•' ? 'HOLD' : active}</HudLabel></Box></Box>
    <Box sx={{ minWidth: 0, borderLeft: `1px solid ${HUD.borderSoft}`, pl: 1.15, display: 'grid', gap: 1 }}><HudLabel>ptz / motion vector</HudLabel><Readout value={active === '•' ? '0' : active === '←' || active === '→' ? '32' : '18'} unit="deg/s" compact /><TickRail value={active === '•' ? 0 : 62} max={100} segments={14} height={11} /><Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: .75 }}><MiniStat label="PAN" value={active === '←' ? '−32°' : active === '→' ? '+32°' : '0°'} /><MiniStat label="TILT" value={active === '↑' ? '+18°' : active === '↓' ? '−18°' : '0°'} /></Box><MiniStat label="MODE" value={active === '•' ? 'HOLD / BRAKE' : 'SLEW'} tone={active === '•' ? HUD.green : HUD.cyan} /></Box>
  </Box>;
}

function tableRows(mode: WidgetDefinition['visual']) {
  if (mode === 'alarms') return [['FIRE/01', 'Critical', '09:42'], ['DOOR/04', 'Warning', '09:17'], ['BATT/12', 'Info', '08:51']];
  if (mode === 'logs') return [['gateway-01', 'connected', '09:44:21'], ['pump-04', 'rpc ack', '09:43:12'], ['sensor-18', 'telemetry', '09:42:08']];
  if (mode === 'events') return [['VALVE-02', 'Opened', '09:41'], ['PUMP-04', 'Started', '09:34'], ['MODE', 'Auto', '09:12']];
  if (mode === 'measurement-list') return [['24.8 °C', 'OK', '09:44'], ['24.6 °C', 'OK', '09:39'], ['24.7 °C', 'OK', '09:34'], ['24.4 °C', 'OK', '09:29']];
  return [['GW-01', 'Online', '24.8 °C'], ['PUMP-04', 'Online', '68%'], ['NODE-18', 'Sleep', '3.8 V'], ['VALVE-02', 'Alert', 'Open']];
}

function cellTone(cell: string) {
  const low = cell.toLowerCase();
  if (low.includes('critical') || low.includes('alert')) return HUD.red;
  if (low.includes('warning')) return HUD.amber;
  if (['online','started','opened','connected','ok','auto'].includes(low)) return HUD.green;
  if (low.includes('sleep')) return HUD.dim;
  return HUD.muted;
}

function TableVisual({ def, size }: VisualProps) {
  const p = profile(size);
  const rows = tableRows(def.visual);
  const visible = rows.slice(0, p.large ? rows.length : 3);
  return <Box sx={{ height: '100%', display: 'grid', gridTemplateRows: 'auto minmax(0,1fr)', gap: .6, direction: 'ltr', overflow: 'hidden' }}>
    <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,.9fr) minmax(62px,.7fr)', gap: .6, px: .65 }}><HudLabel>CHANNEL</HudLabel><HudLabel>STATE</HudLabel><HudLabel>STAMP</HudLabel></Box>
    <Box sx={{ minHeight: 0, display: 'grid', gridTemplateRows: `repeat(${visible.length},minmax(0,1fr))`, gap: .38 }}>
      {visible.map((row, i) => {
        const tone = cellTone(row[1]);
        return <Box key={i} sx={{ minHeight: 0, display: 'grid', gridTemplateColumns: 'minmax(0,1.2fr) minmax(0,.9fr) minmax(62px,.7fr)', gap: .6, alignItems: 'center', px: .65, borderLeft: `2px solid ${tone}`, bgcolor: i === 0 && def.visual === 'alarms' ? 'rgba(255,77,109,.07)' : 'rgba(25,247,255,.018)', borderTop: `1px solid ${HUD.borderSoft}`, borderBottom: `1px solid ${HUD.borderSoft}` }}>
          <Typography sx={{ fontFamily: 'inherit', fontSize: p.large ? 12.2 : 11.2, fontWeight: 710, color: HUD.fg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row[0]}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: .5, minWidth: 0 }}><Box sx={{ width: 5, height: 5, bgcolor: tone, boxShadow: `0 0 8px ${tone}55`, flex: '0 0 auto' }} /><Typography sx={{ fontFamily: 'inherit', fontSize: p.large ? 11.5 : 10.6, color: tone, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row[1]}</Typography></Box>
          <Typography sx={{ fontFamily: 'inherit', fontSize: p.large ? 11.2 : 10.4, color: HUD.muted, fontVariantNumeric: 'tabular-nums', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row[2]}</Typography>
        </Box>;
      })}
    </Box>
  </Box>;
}

function Clock({ locale, size }: VisualProps) {
  const p = profile(size);
  const date = locale === 'fa' ? 'چهارشنبه، ۱۵ مهر ۱۴۰۵' : 'WED / 07 OCT 2026';
  if (!p.large) return <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', textAlign: 'center', direction: 'ltr' }}><Box><HudLabel tone={HUD.green}>UTC+03:30 / SYNC</HudLabel><Typography sx={{ mt: .25, fontFamily: 'inherit', fontSize: p.compact ? 40 : 52, lineHeight: 1, fontWeight: 620, letterSpacing: '.06em', color: HUD.fg, fontVariantNumeric: 'tabular-nums', textShadow: '0 0 22px rgba(25,247,255,.13)' }}>09:44</Typography><Typography sx={{ mt: .55, fontFamily: 'inherit', fontSize: 10.5, color: HUD.muted, direction: locale === 'fa' ? 'rtl' : 'ltr' }}>{date}</Typography></Box></Box>;
  return <Box sx={{ height: '100%', display: 'grid', gridTemplateRows: 'auto minmax(0,1fr) auto', gap: 1, direction: 'ltr' }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><HudLabel tone={HUD.green}>TIME SOURCE / NTP LOCK</HudLabel><HudLabel tone={HUD.dim}>STRATUM 2</HudLabel></Box>
    <Box sx={{ minHeight: 0, display: 'grid', placeItems: 'center', textAlign: 'center' }}><Box><Typography sx={{ fontFamily: 'inherit', fontSize: 76, lineHeight: .86, fontWeight: 620, letterSpacing: '.055em', color: HUD.fg, fontVariantNumeric: 'tabular-nums', textShadow: '0 0 26px rgba(25,247,255,.16)' }}>09:44<Typography component="span" sx={{ ml: .8, fontFamily: 'inherit', fontSize: 26, color: HUD.cyan, verticalAlign: 'top' }}>37</Typography></Typography><Typography sx={{ mt: 1, fontFamily: 'inherit', fontSize: 12, color: HUD.muted, direction: locale === 'fa' ? 'rtl' : 'ltr' }}>{date}</Typography></Box></Box>
    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: .75 }}><MiniStat label="ZONE" value="UTC+03:30" /><MiniStat label="OFFSET" value="+1.8 ms" tone={HUD.green} /><MiniStat label="DRIFT" value="0.4 ppm" tone={HUD.cyan} /></Box>
  </Box>;
}

function TextVisual({ locale, size }: VisualProps) {
  const p = profile(size);
  const rtl = locale === 'fa';
  const body = rtl ? 'همه سنسورها در محدوده عادی هستند. آخرین بسته داده کمتر از یک دقیقه قبل دریافت شده است.' : 'All sensors are within normal operating limits. Latest telemetry arrived less than one minute ago.';
  return <Box sx={{ height: '100%', display: 'grid', gridTemplateRows: 'auto minmax(0,1fr) auto', gap: .7, direction: rtl ? 'rtl' : 'ltr', textAlign: rtl ? 'right' : 'left' }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, direction: 'ltr' }}><HudLabel tone={HUD.green}>OPS NOTE / VERIFIED</HudLabel><HudLabel tone={HUD.dim}>09:43</HudLabel></Box>
    <Box sx={{ minHeight: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}><Typography sx={{ fontFamily: 'inherit', fontSize: p.compact ? 13.2 : p.large ? 18.5 : 14.5, fontWeight: 650, lineHeight: p.compact ? 1.45 : p.large ? 1.75 : 1.65, color: HUD.fg, overflow: 'hidden' }}>{body}</Typography>{p.large && <Box sx={{ mt: 1.4, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: .75, direction: 'ltr' }}><MiniStat label="SOURCE" value="EDGE-02" /><MiniStat label="AGE" value="42 sec" tone={HUD.green} /><MiniStat label="PRIORITY" value="INFO" tone={HUD.cyan} /></Box>}</Box>
    {!p.compact && <Box sx={{ borderTop: `1px solid ${HUD.borderSoft}`, pt: .55, direction: 'ltr', display: 'flex', justifyContent: 'space-between' }}><HudLabel tone={HUD.muted}>SERVER ROOM / STATUS SUMMARY</HudLabel>{p.large && <HudLabel tone={HUD.green}>CRC / VERIFIED</HudLabel>}</Box>}
  </Box>;
}

function ImageVisual({ size }: VisualProps) {
  const p = profile(size);
  return <Box sx={{ height: '100%', minHeight: 0, position: 'relative', overflow: 'hidden', background: 'radial-gradient(circle at 65% 25%,rgba(25,247,255,.16),transparent 21%),linear-gradient(145deg,#07111e,#102535 58%,#07111e)', border: `1px solid ${HUD.borderSoft}` }}>
    <Box sx={{ position: 'absolute', inset: 0, opacity: .36, backgroundImage: 'repeating-linear-gradient(0deg,transparent 0 4px,rgba(231,251,255,.06) 5px)' }} />
    <Box sx={{ position: 'absolute', left: '13%', right: '13%', bottom: '13%', height: '52%', border: '1px solid rgba(231,251,255,.32)', clipPath: 'polygon(8% 0,92% 0,100% 20%,100% 100%,0 100%,0 20%)' }} />
    <Box sx={{ position: 'absolute', left: '50%', top: '48%', width: p.large ? 74 : 54, height: p.large ? 74 : 54, transform: 'translate(-50%,-50%)', border: `1px solid ${HUD.cyan}77`, '&:before': { content: '""', position: 'absolute', left: '50%', top: -12, bottom: -12, borderLeft: `1px solid ${HUD.cyan}55` }, '&:after': { content: '""', position: 'absolute', top: '50%', left: -12, right: -12, borderTop: `1px solid ${HUD.cyan}55` } }} />
    <Box sx={{ position: 'absolute', left: 9, top: 8 }}><HudLabel tone={HUD.red}>● REC / LIVE</HudLabel></Box><Box sx={{ position: 'absolute', right: 9, top: 8 }}><HudLabel tone={HUD.green}>CAM-04</HudLabel></Box>
    <Box sx={{ position: 'absolute', left: 9, right: 9, bottom: 8, display: 'flex', justifyContent: 'space-between' }}><HudLabel>09:44:12</HudLabel><HudLabel tone={HUD.green}>1080P / 25FPS</HudLabel></Box>
  </Box>;
}

function IframeVisual({ locale, size }: VisualProps) {
  const p = profile(size);
  if (!p.large) return <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', border: `1px dashed ${HUD.border}`, background: 'rgba(25,247,255,.018)', textAlign: 'center', px: 2, clipPath: 'polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)' }}><Box><HudLabel tone={HUD.cyan}>EXT / SANDBOX</HudLabel><Typography sx={{ mt: .55, fontFamily: 'inherit', fontSize: p.compact ? 14 : 18, fontWeight: 700, color: HUD.fg }}>{locale === 'fa' ? 'محتوای خارجی' : 'EXTERNAL CONTENT'}</Typography><Typography sx={{ mt: .45, fontFamily: 'inherit', fontSize: 10.5, color: HUD.muted }}>iframe · embedded app · HTML canvas</Typography></Box></Box>;
  return <Box sx={{ height: '100%', display: 'grid', gridTemplateRows: 'auto minmax(0,1fr) auto', gap: .8, border: `1px dashed ${HUD.border}`, background: 'rgba(25,247,255,.014)', p: 1, clipPath: 'polygon(10px 0,100% 0,100% calc(100% - 10px),calc(100% - 10px) 100%,0 100%,0 10px)', direction: 'ltr' }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><HudLabel tone={HUD.cyan}>EXT / SANDBOX / FRAME-01</HudLabel><HudLabel tone={HUD.green}>CONNECTED</HudLabel></Box>
    <Box sx={{ minHeight: 0, position: 'relative', overflow: 'hidden', border: `1px solid ${HUD.borderSoft}`, backgroundImage: 'linear-gradient(rgba(25,247,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(25,247,255,.04) 1px,transparent 1px)', backgroundSize: '22px 22px', display: 'grid', placeItems: 'center', textAlign: 'center' }}><Box><HudLabel tone={HUD.cyan}>EMBED TARGET / 200 OK</HudLabel><Typography sx={{ mt: .55, fontFamily: 'inherit', fontSize: 24, fontWeight: 740, color: HUD.fg }}>{locale === 'fa' ? 'محتوای خارجی' : 'EXTERNAL CONTENT'}</Typography><Typography sx={{ mt: .45, fontFamily: 'inherit', fontSize: 10.5, color: HUD.muted }}>iframe · embedded app · HTML canvas</Typography></Box><Box sx={{ position: 'absolute', left: 8, bottom: 7 }}><HudLabel tone={HUD.dim}>SANDBOX: scripts forms</HudLabel></Box></Box>
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: .75 }}><MiniStat label="ORIGIN" value="REMOTE" /><MiniStat label="LATENCY" value="38 ms" tone={HUD.green} /><MiniStat label="TLS" value="OK / H2" tone={HUD.cyan} /></Box>
  </Box>;
}

function Scada({ size }: VisualProps) {
  const p = profile(size);
  return <Box sx={{ height: '100%', minHeight: 0, position: 'relative', direction: 'ltr', overflow: 'hidden', backgroundImage: 'linear-gradient(rgba(25,247,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(25,247,255,.045) 1px,transparent 1px)', backgroundSize: '28px 28px' }}>
    <svg viewBox="0 0 560 250" width="100%" height="100%" aria-hidden>
      <g>
        <rect x="22" y="64" width="112" height="132" fill="rgba(25,247,255,.035)" stroke="rgba(25,247,255,.55)" />
        <rect x="31" y="120" width="94" height="66" fill="rgba(25,247,255,.26)" />
        <line x1="31" x2="125" y1="120" y2="120" stroke={HUD.cyan} strokeWidth="2" />
        <text x="78" y="88" textAnchor="middle" fill={HUD.muted} fontSize="9">TANK-01</text>
        <text x="78" y="108" textAnchor="middle" fill={HUD.fg} fontSize="17" fontWeight="700">63%</text>
      </g>
      <line x1="134" y1="146" x2="222" y2="146" stroke={HUD.cyan} strokeWidth="5" />
      <circle cx="258" cy="146" r="31" fill="rgba(87,242,180,.05)" stroke={HUD.green} strokeWidth="2" />
      <path d="M244 146 L270 133 L270 159 Z" fill={HUD.green} opacity=".9" />
      <text x="258" y="105" textAnchor="middle" fill={HUD.muted} fontSize="9">PUMP-04</text>
      <text x="258" y="190" textAnchor="middle" fill={HUD.green} fontSize="9">RUN / 68%</text>
      <line x1="289" y1="146" x2="382" y2="146" stroke={HUD.cyan} strokeWidth="5" />
      <g transform="translate(383 116)">
        <path d="M0 30 L25 10 L50 30 L25 50 Z" fill="rgba(255,200,87,.07)" stroke={HUD.amber} strokeWidth="2" />
        <line x1="25" y1="4" x2="25" y2="56" stroke={HUD.amber} strokeWidth="2" />
        <text x="25" y="-8" textAnchor="middle" fill={HUD.muted} fontSize="9">V-02</text>
        <text x="25" y="76" textAnchor="middle" fill={HUD.amber} fontSize="9">OPEN</text>
      </g>
      <line x1="433" y1="146" x2="532" y2="146" stroke={HUD.cyan} strokeWidth="5" />
      <circle cx="532" cy="146" r="5" fill={HUD.cyan} />
      <text x="485" y="134" textAnchor="middle" fill={HUD.muted} fontSize="8">18.4 L/MIN</text>
      <text x="22" y="28" fill={HUD.green} fontSize="9">PROCESS LOOP // AUTO</text>
      {p.large && <><text x="420" y="30" fill={HUD.muted} fontSize="8">PRESS 2.6 BAR</text><text x="420" y="46" fill={HUD.muted} fontSize="8">TEMP 24.8 C</text></>}
    </svg>
  </Box>;
}

function AlarmIndicator({ def, locale, size }: VisualProps) {
  const p = profile(size);
  const active = Boolean(def.mock.value);
  const severity = s(def.mock.severity, 'warning');
  const isCritical = severity === 'critical';
  const tone = active ? (isCritical ? HUD.red : HUD.amber) : HUD.green;
  const Icon = def.icon;
  const label = active ? (locale === 'fa' ? 'هشدار فعال' : 'ALARM ACTIVE') : (locale === 'fa' ? 'وضعیت عادی' : 'NORMAL');
  const semantic = def.id === 'fire-alarm' ? 'FIRE LOOP' : def.id === 'smoke-alarm' ? 'SMOKE ZONE' : def.id === 'water-leak' ? 'LEAK PROBE' : 'ALARM LOOP';
  const rtl = locale === 'fa';
  const iconSize = p.compact ? 90 : p.large ? 128 : 104;
  const badge = <Box sx={{ width: iconSize, height: iconSize, position: 'relative', display: 'grid', placeItems: 'center', clipPath: 'polygon(50% 0,86% 12%,100% 50%,86% 88%,50% 100%,14% 88%,0 50%,14% 12%)', border: `1px solid ${tone}`, bgcolor: `${tone}0d`, boxShadow: active ? `0 0 34px ${tone}30` : `0 0 20px ${tone}0e` }}><Icon sx={{ fontSize: p.compact ? 39 : p.large ? 57 : 47, color: tone, filter: active ? `drop-shadow(0 0 8px ${tone}66)` : 'none' }} /><Box sx={{ position: 'absolute', left: 11, right: 11, bottom: 10, height: 3, background: `repeating-linear-gradient(90deg,${tone} 0 8%,transparent 8% 14%)`, opacity: .65 }} /></Box>;

  if (!p.large) return <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: p.compact || p.tall ? '1fr' : 'auto minmax(0,1fr)', placeItems: p.compact || p.tall ? 'center' : undefined, alignItems: 'center', gap: 1.3, direction: 'ltr' }}>{badge}<Box sx={{ textAlign: p.compact || p.tall ? 'center' : rtl ? 'right' : 'left', direction: rtl ? 'rtl' : 'ltr' }}><HudLabel tone={tone} rtl={rtl}>{label}</HudLabel>{!p.compact && <><Typography sx={{ mt: .35, fontFamily: 'inherit', fontSize: 18.5, fontWeight: 750, color: tone, direction: 'ltr' }}>{semantic}</Typography><Typography sx={{ mt: .45, fontFamily: 'inherit', fontSize: 10.4, color: HUD.muted }}>{active ? (rtl ? 'نیازمند بررسی اپراتور' : 'Operator attention required') : (rtl ? 'حلقه پایش آماده است' : 'Monitoring loop armed')}</Typography></>}</Box></Box>;

  return <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: 'auto minmax(0,1fr)', gap: 1.55, alignItems: 'center', direction: 'ltr' }}>
    <Box sx={{ display: 'grid', justifyItems: 'center', gap: .85 }}>{badge}<HudLabel tone={tone}>{active ? 'LATCHED / INPUT 01' : 'ARMED / INPUT 01'}</HudLabel></Box>
    <Box sx={{ minWidth: 0, display: 'grid', gap: 1, direction: rtl ? 'rtl' : 'ltr', textAlign: rtl ? 'right' : 'left' }}><Box><HudLabel tone={tone} rtl={rtl}>{label}</HudLabel><Typography sx={{ mt: .25, fontFamily: 'inherit', fontSize: 25, lineHeight: 1, fontWeight: 760, color: tone, direction: 'ltr' }}>{semantic}</Typography><Typography sx={{ mt: .55, fontFamily: 'inherit', fontSize: 11, color: HUD.muted }}>{active ? (rtl ? 'نیازمند بررسی اپراتور' : 'Operator attention required') : (rtl ? 'حلقه پایش آماده است' : 'Monitoring loop armed')}</Typography></Box><Box sx={{ direction: 'ltr' }}><TickRail value={active ? (isCritical ? 96 : 76) : 24} max={100} segments={16} height={12} /></Box><Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: .7, direction: 'ltr' }}><MiniStat label="ZONE" value="02 / A" /><MiniStat label="LAST TEST" value="08:30" tone={HUD.green} /><MiniStat label="LOOP" value={active ? 'TRIP' : 'READY'} tone={tone} /></Box><Box sx={{ direction: 'ltr' }}><Box sx={{ display: 'flex', justifyContent: 'space-between' }}><HudLabel>event trace</HudLabel><HudLabel tone={HUD.dim}>15 MIN</HudLabel></Box><HudSparkline values={active ? [8,9,8,10,9,11,35,62,91,94,93,95] : [11,10,12,11,10,11,12,11,10,11,10,11]} height={52} color={tone} fill /></Box></Box>
  </Box>;
}

function GamingVisualRenderer(props: VisualProps) {
  const v = props.def.visual;
  if (v === 'metric') return <Metric {...props} />;
  if (v === 'battery') return <Battery {...props} />;
  if (v === 'signal') return <Signal {...props} />;
  if (v === 'tank') return <Tank {...props} />;
  if (v === 'boolean') return <BooleanStatus {...props} />;
  if (v === 'gauge') return <Gauge {...props} />;
  if (v === 'line' || v === 'area') return <LineChart {...props} />;
  if (v === 'bar') return <BarChart {...props} />;
  if (v === 'histogram') return <Histogram {...props} />;
  if (v === 'donut') return <Donut {...props} />;
  if (v === 'heatmap') return <Heatmap {...props} />;
  if (v === 'timeline') return <Timeline {...props} />;
  if (v === 'map' || v === 'route') return <MapVisual {...props} />;
  if (v === 'coordinates') return <Coordinates {...props} />;
  if (v === 'compass') return <Compass {...props} />;
  if (v === 'button') return <CommandButton {...props} />;
  if (v === 'switch') return <SwitchControl {...props} />;
  if (v === 'slider') return <HudSlider {...props} />;
  if (v === 'input') return <InputControl {...props} />;
  if (v === 'thermostat') return <Thermostat {...props} />;
  if (v === 'color') return <ColorControl {...props} />;
  if (v === 'direction') return <DirectionControl {...props} />;
  if (v === 'table' || v === 'measurement-list' || v === 'alarms' || v === 'events' || v === 'logs') return <TableVisual {...props} />;
  if (v === 'clock') return <Clock {...props} />;
  if (v === 'text') return <TextVisual {...props} />;
  if (v === 'image') return <ImageVisual {...props} />;
  if (v === 'iframe') return <IframeVisual {...props} />;
  if (v === 'scada') return <Scada {...props} />;
  if (v === 'alarm-indicator') return <AlarmIndicator {...props} />;
  return <LinearProgress sx={{ color: HUD.cyan, bgcolor: 'rgba(25,247,255,.08)' }} />;
}

export function GamingFrame(props: FrameProps) {
  const p = profile(props.size);
  const Icon = props.def.icon;
  const title = props.locale === 'fa' ? props.def.titleFa : props.def.titleEn;
  const tone = statusTone(props.status);
  const titleRtl = props.locale === 'fa';
  const showMeta = !p.compact;
  const showFooter = p.h >= 2 || p.area >= 4;

  return <Box sx={{
    height: '100%',
    minHeight: 0,
    position: 'relative',
    overflow: 'hidden',
    color: HUD.fg,
    fontFamily: props.theme.fontFamily ?? '"Rajdhani", Inter, ui-sans-serif, system-ui, sans-serif',
    background: `radial-gradient(circle at 78% -20%,${props.theme.accent}16,transparent 42%),linear-gradient(160deg,${HUD.bg1},${HUD.bg0})`,
    clipPath: 'polygon(0 12px,12px 0,calc(100% - 22px) 0,100% 22px,100% calc(100% - 12px),calc(100% - 12px) 100%,18px 100%,0 calc(100% - 18px))',
    boxShadow: props.theme.shadow,
  }}>
    <Box sx={{ position: 'absolute', inset: 1, pointerEvents: 'none', clipPath: 'inherit', border: `1px solid ${HUD.border}` }} />
    <Box sx={{ position: 'absolute', left: 0, top: 0, width: 54, height: 2, bgcolor: HUD.cyan, boxShadow: `0 0 12px ${HUD.cyan}55` }} />
    <Box sx={{ position: 'absolute', right: 0, bottom: 0, width: 34, height: 2, bgcolor: tone, opacity: .7 }} />
    <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: .28, backgroundImage: 'linear-gradient(rgba(25,247,255,.028) 1px,transparent 1px),linear-gradient(90deg,rgba(25,247,255,.028) 1px,transparent 1px)', backgroundSize: '24px 24px' }} />
    <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: .045, backgroundImage: 'repeating-linear-gradient(0deg,transparent 0 4px,#fff 5px)' }} />

    <Box sx={{ height: '100%', minHeight: 0, position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ minHeight: p.compact ? 43 : 47, px: p.compact ? 1.05 : 1.25, pt: .75, pb: .55, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: .75, borderBottom: `1px solid ${HUD.borderSoft}`, direction: 'ltr' }}>
        <Box sx={{ minWidth: 0, flex: 1, display: 'flex', alignItems: 'center', gap: .75 }}>
          <Box sx={{ width: p.compact ? 25 : 29, height: p.compact ? 25 : 29, flex: '0 0 auto', display: 'grid', placeItems: 'center', color: HUD.cyan, border: `1px solid ${HUD.border}`, clipPath: 'polygon(5px 0,100% 0,100% calc(100% - 5px),calc(100% - 5px) 100%,0 100%,0 5px)', bgcolor: 'rgba(25,247,255,.035)' }}><Icon sx={{ fontSize: p.compact ? 15 : 17 }} /></Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontFamily: 'inherit', fontSize: p.compact ? 7.3 : 8.2, lineHeight: 1, letterSpacing: 1.1, color: HUD.dim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', direction: 'ltr' }}>SYS/{props.def.id.toUpperCase()}</Typography>
            <Typography sx={{ mt: .25, fontFamily: 'inherit', fontSize: p.compact ? 12.5 : 13.8, lineHeight: 1.05, fontWeight: 740, letterSpacing: titleRtl ? 0 : .25, color: HUD.fg, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', direction: titleRtl ? 'rtl' : 'ltr', textAlign: titleRtl ? 'right' : 'left' }}>{title}</Typography>
          </Box>
        </Box>
        <Tooltip title={props.locale === 'fa' ? 'اطلاعات' : 'Info'}><IconButton size="small" onClick={props.onInfo} sx={{ color: HUD.muted, width: 25, height: 25, borderRadius: 0, '&:hover': { color: HUD.cyan, bgcolor: 'rgba(25,247,255,.06)' } }}><InfoOutlined sx={{ fontSize: 15 }} /></IconButton></Tooltip>
      </Box>

      {showMeta && <Box sx={{ minHeight: 22, px: 1.25, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, borderBottom: `1px solid rgba(25,247,255,.06)`, direction: 'ltr' }}>
        <Box sx={{ minWidth: 0, display: 'flex', alignItems: 'center', gap: .55 }}><Box sx={{ width: 5, height: 5, bgcolor: tone, boxShadow: `0 0 8px ${tone}66`, flex: '0 0 auto' }} /><Typography sx={{ fontFamily: 'inherit', fontSize: 8.8, color: tone, letterSpacing: .85, whiteSpace: 'nowrap' }}>{props.status.toUpperCase()}</Typography></Box>
        <Typography sx={{ fontFamily: 'inherit', fontSize: 8.6, color: HUD.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textAlign: 'right' }}>{p.wide ? props.deviceName : props.locationLabel}</Typography>
      </Box>}

      <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', px: p.compact ? 1.05 : 1.25, py: p.compact ? .9 : 1.05 }}>{props.children}</Box>

      {showFooter && <Box sx={{ minHeight: 23, px: 1.25, pb: .45, pt: .25, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, borderTop: `1px solid rgba(25,247,255,.055)`, direction: 'ltr' }}>
        <Typography sx={{ fontFamily: 'inherit', fontSize: 8.2, color: HUD.dim, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>LOC/{props.locationLabel}</Typography>
        <Typography sx={{ fontFamily: 'inherit', fontSize: 8.2, color: HUD.dim, whiteSpace: 'nowrap' }}>GRID/{props.size} · {props.lastSeen}</Typography>
      </Box>}
    </Box>
  </Box>;
}
