import { useMemo, useState } from 'react';
import { Box, Button, Slider, Switch, TextField, Typography } from '@mui/material';
import type { Locale, WidgetDefinition, WidgetSize, WidgetThemeTokens } from '../core/types';
import { bars, heat, spark, spark2 } from '../data/mockData';

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

function HistoryStrip({ values, theme, active = '#16a34a', warning = '#d97706', danger = '#dc2626' }: { values: number[]; theme: WidgetThemeTokens; active?: string; warning?: string; danger?: string }) {
  return <Box sx={{ display:'grid', gridTemplateColumns:`repeat(${values.length},minmax(0,1fr))`, gap:.38 }}>
    {values.map((v,i)=><Box key={i} sx={{ height:8, borderRadius:.65, bgcolor:v>=2?danger:v===1?warning:v===0?active:`${theme.muted}45` }} />)}
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
    return <Box sx={{ height:'100%', display:'grid', gridTemplateRows:'auto auto minmax(34px,1fr)', gap:.65, direction:'ltr' }}>
      <Box sx={{ display:'flex', alignItems:'baseline', gap:.55 }}>
        <Typography sx={{ fontSize:34, lineHeight:.94, fontWeight:850, letterSpacing:'-.05em' }}>{value}</Typography>
        <Typography sx={{ fontSize:12, fontWeight:750, color:theme.muted }}>{unit}</Typography>
      </Box>
      <Box><ToneBadge text={`${positive ? '↑' : '↓'} ${Math.abs(trend)}% · 24h`} tone={tone} theme={theme} /></Box>
      <Box sx={{ minHeight:0, mt:.1, borderTop:`1px solid ${theme.border}`, pt:.45 }}>
        <ChartSvg values={values} color={theme.accent} fill minHeight={34} />
      </Box>
    </Box>;
  }

  if (p.wide && !p.large) {
    return <Box sx={{ height:'100%', display:'grid', gridTemplateColumns:'minmax(132px,.85fr) minmax(0,1.4fr)', gap:1.4, direction:'ltr', alignItems:'stretch' }}>
      <Box sx={{ minWidth:0, display:'flex', flexDirection:'column', justifyContent:'center' }}>
        <Typography sx={{ fontSize:38, lineHeight:.92, fontWeight:850, letterSpacing:'-.05em' }}>{value}<Box component="span" sx={{ ml:.55, fontSize:13, color:theme.muted, fontWeight:750 }}>{unit}</Box></Typography>
        <Box sx={{ mt:1 }}><ToneBadge text={`${positive ? '↑' : '↓'} ${Math.abs(trend)}%`} tone={tone} theme={theme} /></Box>
        <Box sx={{ mt:1.05 }}><Progress value={value} max={max} theme={theme} /></Box>
      </Box>
      <Box sx={{ minWidth:0, borderLeft:`1px solid ${theme.border}`, pl:1.35, display:'flex', flexDirection:'column' }}>
        <Box sx={{ display:'flex', justifyContent:'space-between', color:theme.muted, mb:.2 }}>
          <Typography sx={{ fontSize:10.5 }}>{label(locale,'24h trend','روند ۲۴ ساعت')}</Typography>
          <Typography sx={{ fontSize:10.5 }}>now</Typography>
        </Box>
        <Box sx={{ flex:1, minHeight:0 }}><ChartSvg values={values} color={theme.accent} fill minHeight={52} /></Box>
      </Box>
    </Box>;
  }

  const minValue = Math.round(value * .82 * 10) / 10;
  const avgValue = Math.round(value * .96 * 10) / 10;
  const peakValue = Math.round(value * 1.12 * 10) / 10;
  return <Box sx={{ height:'100%', display:'grid', gridTemplateRows:'auto auto minmax(120px,1fr)', gap:1.15, direction:'ltr' }}>
    <Box sx={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:1 }}>
      <Box>
        <Typography sx={{ fontSize:44, lineHeight:.9, fontWeight:850, letterSpacing:'-.05em' }}>{value}<Box component="span" sx={{ ml:.6, fontSize:14, color:theme.muted, fontWeight:750 }}>{unit}</Box></Typography>
        <Box sx={{ mt:.9 }}><ToneBadge text={`${positive ? '↑' : '↓'} ${Math.abs(trend)}% · ${label(locale,'vs previous 24h','نسبت به ۲۴ ساعت قبل')}`} tone={tone} theme={theme} /></Box>
      </Box>
      <Box sx={{ minWidth:116 }}>
        <Typography sx={{ fontSize:10.5, color:theme.muted, mb:.7 }}>{label(locale,'Current range','بازه فعلی')}</Typography>
        <Progress value={value} max={max} theme={theme} />
      </Box>
    </Box>
    <Box sx={{ display:'grid', gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:.75 }}>
      <StatBox label={label(locale,'Min','کمینه')} value={`${minValue}${unit}`} theme={theme} />
      <StatBox label={label(locale,'Average','میانگین')} value={`${avgValue}${unit}`} theme={theme} accent />
      <StatBox label={label(locale,'Peak','بیشینه')} value={`${peakValue}${unit}`} theme={theme} />
    </Box>
    <Box sx={{ minHeight:0, border:`1px solid ${theme.border}`, borderRadius:1.5, p:1, bgcolor:'#fbfcff' }}>
      <ChartSvg values={values} color={theme.accent} fill minHeight={112} />
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
  const stateText = state === 'danger' ? label(locale,'Critical','بحرانی') : state === 'warning' ? label(locale,'Warning','هشدار') : label(locale,'Normal','عادی');

  if (p.compact) {
    return <Box sx={{ height:'100%', display:'grid', placeItems:'center', direction:'ltr' }}>
      <RadialGauge value={value} max={max} unit={unit} theme={theme} size={108} tone={tone}/>
    </Box>;
  }

  if (p.wide && !p.large) {
    return <Box sx={{ height:'100%', display:'grid', gridTemplateColumns:'118px minmax(0,1fr)', gap:1.3, alignItems:'center', direction:'ltr' }}>
      <RadialGauge value={value} max={max} unit={unit} theme={theme} size={108} tone={tone}/>
      <Box sx={{ minWidth:0 }}>
        <ToneBadge text={stateText} tone={state} theme={theme}/>
        <Box sx={{ mt:.85, display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
          <Typography sx={{ fontSize:10.5, color:theme.muted }}>{label(locale,'Operating range','محدوده عملکرد')}</Typography>
          <Typography sx={{ fontSize:11, fontWeight:800 }}>{Math.round(pct*100)}%</Typography>
        </Box>
        <Box sx={{ mt:.45 }}><Progress value={value} max={max} theme={theme} tone={tone}/></Box>
        <Box sx={{ mt:.55, display:'flex', justifyContent:'space-between', color:theme.muted }}><Typography sx={{fontSize:9.5}}>0</Typography><Typography sx={{fontSize:9.5}}>{max}{unit}</Typography></Box>
      </Box>
    </Box>;
  }

  const history = spark.map(v => Math.max(0, Math.min(max, (v / 100) * max)));
  return <Box sx={{ height:'100%', display:'grid', gridTemplateRows:'auto minmax(78px,1fr) auto', gap:1, direction:'ltr' }}>
    <Box sx={{ display:'grid', gridTemplateColumns:'160px minmax(0,1fr)', alignItems:'center', gap:1.4 }}>
      <Box sx={{ display:'grid', placeItems:'center' }}><RadialGauge value={value} max={max} unit={unit} theme={theme} size={154} tone={tone}/></Box>
      <Box sx={{ minWidth:0 }}>
        <ToneBadge text={stateText} tone={state} theme={theme}/>
        <Box sx={{ mt:.9, display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
          <Typography sx={{ fontSize:11, color:theme.muted }}>{label(locale,'Threshold usage','درصد از آستانه')}</Typography>
          <Typography sx={{ fontSize:25, fontWeight:850 }}>{Math.round(pct*100)}%</Typography>
        </Box>
        <Progress value={value} max={max} theme={theme} tone={tone}/>
        <Box sx={{ mt:.9, display:'grid', gridTemplateColumns:'1fr 1fr', gap:.7 }}>
          <StatBox label={label(locale,'Warning','هشدار')} value={`${Math.round(max*.75)}${unit}`} theme={theme}/>
          <StatBox label={label(locale,'Critical','بحرانی')} value={`${Math.round(max*.9)}${unit}`} theme={theme}/>
        </Box>
      </Box>
    </Box>
    <Box sx={{ minHeight:0, border:`1px solid ${theme.border}`, borderRadius:1.5, p:.85, bgcolor:'#fbfcff' }}>
      <Box sx={{ display:'flex', justifyContent:'space-between', mb:.3 }}><Typography sx={{ fontSize:9.8, color:theme.muted }}>{label(locale,'24h operating trend','روند ۲۴ ساعت')}</Typography><Typography sx={{ fontSize:9.8, color:theme.muted }}>24h</Typography></Box>
      <ChartSvg values={history} color={tone} fill minHeight={68}/>
    </Box>
    <Box sx={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:.7 }}>
      <StatBox label={label(locale,'Minimum','کمینه')} value={`0${unit}`} theme={theme}/>
      <StatBox label={label(locale,'Current','فعلی')} value={`${value}${unit}`} theme={theme} accent/>
      <StatBox label={label(locale,'Maximum','بیشینه')} value={`${max}${unit}`} theme={theme}/>
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

  if (p.compact) return <Box sx={{ height:'100%', display:'grid', placeItems:'center', direction:'ltr' }}><Box sx={{ textAlign:'center' }}><BatteryShape value={value} theme={theme} width={94} height={44}/><Typography sx={{ mt:.7, fontSize:26, fontWeight:850 }}>{value}%</Typography><Typography sx={{ fontSize:10.5, color:theme.muted }}>{voltage}</Typography></Box></Box>;

  if (p.wide && !p.large) return <Box sx={{ height:'100%', display:'grid', gridTemplateColumns:'150px 1fr', alignItems:'center', gap:1.5, direction:'ltr' }}><Box sx={{ display:'grid', placeItems:'center' }}><BatteryShape value={value} theme={theme}/></Box><Box><Typography sx={{ fontSize:34, lineHeight:1, fontWeight:850 }}>{value}%</Typography><Typography sx={{ mt:.4, fontSize:11, color:theme.muted }}>{voltage} · {remain}</Typography><Box sx={{ mt:.85 }}><ToneBadge text={value>40?label(locale,'Battery healthy','باتری سالم'):label(locale,'Charge soon','نیاز به شارژ')} tone={value>40?'success':'warning'} theme={theme}/></Box></Box></Box>;

  return <Box sx={{ height:'100%', display:'grid', gridTemplateRows:'auto minmax(84px,1fr) auto', gap:1, direction:'ltr' }}>
    <Box sx={{ display:'flex', alignItems:'center', justifyContent:'center', gap:2.2 }}><BatteryShape value={value} theme={theme} width={154} height={70}/><Box><Typography sx={{ fontSize:40, fontWeight:850, lineHeight:1 }}>{value}%</Typography><Typography sx={{ mt:.35, fontSize:11, color:theme.muted }}>{label(locale,'Estimated','زمان تقریبی')} {remain}</Typography></Box></Box>
    <Box sx={{ minHeight:0, border:`1px solid ${theme.border}`, borderRadius:1.25, p:.8, bgcolor:'#fbfcff' }}>
      <Box sx={{ display:'flex', justifyContent:'space-between', mb:.35 }}><Typography sx={{ fontSize:9.5, color:theme.muted }}>{label(locale,'Discharge trend','روند تخلیه')}</Typography><Typography sx={{ fontSize:9.5, color:theme.muted }}>24h</Typography></Box>
      <ChartSvg values={spark2} color={theme.accent} fill minHeight={62}/>
    </Box>
    <Box sx={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:.7 }}><StatBox label={label(locale,'Voltage','ولتاژ')} value={voltage} theme={theme} accent/><StatBox label={label(locale,'Health','سلامت')} value="Good" theme={theme}/><StatBox label={label(locale,'Cycles','چرخه')} value="148" theme={theme}/></Box>
  </Box>;
}

function MaterialSignal({ def, theme, locale, size }: Props) {
  const p = profile(size);
  const value = n(def.mock.value, -72);
  const barsOn = value > -60 ? 5 : value > -70 ? 4 : value > -80 ? 3 : value > -90 ? 2 : 1;
  const network = s(def.mock.network, 'LTE · RSRP');
  const quality = barsOn >= 4 ? label(locale,'Excellent','عالی') : barsOn === 3 ? label(locale,'Good','خوب') : label(locale,'Weak','ضعیف');
  const tone = barsOn >= 3 ? theme.accent : '#d97706';
  const Bars = ({ big = false }: { big?: boolean }) => <Box sx={{ display:'flex', alignItems:'end', gap:big?.8:.55, height:big?72:50 }}>{[1,2,3,4,5].map(i=><Box key={i} sx={{ width:big?12:9, height:7+i*(big?10:7), borderRadius:.7, bgcolor:i<=barsOn?tone:'#e5e7eb' }}/>)}</Box>;

  if (p.compact) return <Box sx={{ height:'100%', display:'grid', placeItems:'center', direction:'ltr' }}><Box sx={{ textAlign:'center' }}><Box sx={{ display:'grid', placeItems:'center' }}><Bars/></Box><Typography sx={{ mt:.55, fontSize:22, fontWeight:850 }}>{value} dBm</Typography><Typography sx={{ fontSize:10, color:theme.muted }}>{network}</Typography></Box></Box>;
  if (p.wide && !p.large) return <Box sx={{ height:'100%', display:'grid', gridTemplateColumns:'120px 1fr', gap:1.4, alignItems:'center', direction:'ltr' }}><Box sx={{ display:'grid', placeItems:'center' }}><Bars big/></Box><Box><Typography sx={{ fontSize:31, fontWeight:850 }}>{value} dBm</Typography><Typography sx={{ mt:.3, fontSize:11, color:theme.muted }}>{network}</Typography><Box sx={{ mt:.8 }}><ToneBadge text={quality} tone={barsOn>=3?'success':'warning'} theme={theme}/></Box></Box></Box>;

  const signalHistory=[-76,-74,-78,-70,-68,-72,-67,-65,-69,-66,-64,-67];
  return <Box sx={{ height:'100%', display:'grid', gridTemplateRows:'auto minmax(76px,1fr)', gap:1.05, direction:'ltr' }}>
    <Box sx={{ display:'grid', gridTemplateColumns:'150px minmax(0,1fr)', alignItems:'center', gap:1.4 }}>
      <Box sx={{ display:'grid', placeItems:'center' }}><Bars big/></Box>
      <Box><Typography sx={{ fontSize:36, fontWeight:850 }}>{value} dBm</Typography><Box sx={{ mt:.55 }}><ToneBadge text={quality} tone={barsOn>=3?'success':'warning'} theme={theme}/></Box><Box sx={{ mt:1, display:'grid', gridTemplateColumns:'1fr 1fr', gap:.7 }}><StatBox label="NETWORK" value="LTE" theme={theme}/><StatBox label="RSRQ" value="-10 dB" theme={theme}/><StatBox label="SINR" value="18 dB" theme={theme}/><StatBox label="CELL" value="B3" theme={theme}/></Box></Box>
    </Box>
    <Box sx={{ minHeight:0, border:`1px solid ${theme.border}`, borderRadius:1.5, p:.85, bgcolor:'#fbfcff' }}><Box sx={{ display:'flex', justifyContent:'space-between', mb:.3 }}><Typography sx={{ fontSize:9.8, color:theme.muted }}>{label(locale,'Signal stability','پایداری سیگنال')}</Typography><Typography sx={{ fontSize:9.8, color:theme.muted }}>24h</Typography></Box><ChartSvg values={signalHistory} color={tone} fill minHeight={66}/></Box>
  </Box>;
}


function MaterialTank({ def, theme, locale, size }: Props) {
  const p = profile(size);
  const value = clamp(n(def.mock.value, 63), 0, 100);
  const liters = s(def.mock.liters, '1,260 L');
  const TankShape = ({ width=68, height=94 }: { width?: number; height?: number }) => <Box sx={{ width, height, border:`2px solid ${theme.border}`, borderRadius:1.5, p:.4, display:'flex', alignItems:'end', bgcolor:'#fbfcff', overflow:'hidden', position:'relative', flex:'0 0 auto' }}><Box sx={{ width:'100%', height:`${value}%`, bgcolor:theme.accent, borderRadius:'4px 4px 7px 7px', position:'relative', '&::before':{content:'""',position:'absolute',left:0,right:0,top:-4,height:8,borderRadius:'50%',bgcolor:theme.accent} }}/></Box>;

  if (p.compact) return <Box sx={{ height:'100%', display:'grid', placeItems:'center', direction:'ltr' }}><Box sx={{ display:'flex', alignItems:'center', gap:1 }}><TankShape/><Box><Typography sx={{ fontSize:27, fontWeight:850 }}>{value}%</Typography><Typography sx={{ fontSize:10.5, color:theme.muted }}>{liters}</Typography></Box></Box></Box>;

  if (p.tall) return <Box sx={{ height:'100%', display:'grid', gridTemplateRows:'minmax(150px,1fr) auto auto', justifyItems:'center', gap:1, direction:'ltr' }}>
    <Box sx={{ display:'grid', placeItems:'center', minHeight:0 }}><TankShape width={96} height={178}/></Box>
    <Box sx={{ width:'100%', textAlign:'center' }}><Typography sx={{ fontSize:34, lineHeight:1, fontWeight:850 }}>{value}%</Typography><Typography sx={{ mt:.3, color:theme.muted, fontSize:11 }}>{liters}</Typography><Box sx={{ mt:.8, mx:'auto', width:'78%' }}><Progress value={value} theme={theme}/></Box></Box>
    <Box sx={{ width:'100%', display:'grid', gridTemplateColumns:'1fr 1fr', gap:.55 }}><StatBox label={label(locale,'Capacity','ظرفیت')} value="2,000 L" theme={theme}/><StatBox label={label(locale,'Free','خالی')} value="740 L" theme={theme}/></Box>
  </Box>;

  if (p.wide && !p.large) return <Box sx={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:1.8, direction:'ltr' }}><TankShape/><Box><Typography sx={{ fontSize:34, fontWeight:850 }}>{value}%</Typography><Typography sx={{ color:theme.muted, fontSize:11 }}>{liters}</Typography><Box sx={{ mt:.8, width:150 }}><Progress value={value} theme={theme}/></Box></Box></Box>;

  const trend=[72,70,69,67,65,66,64,63,61,62,63,63];
  return <Box sx={{ height:'100%', display:'grid', gridTemplateRows:'auto minmax(76px,1fr)', gap:1.05, direction:'ltr' }}>
    <Box sx={{ display:'grid', gridTemplateColumns:'130px 1fr', alignItems:'center', gap:1.5 }}><Box sx={{ display:'grid', placeItems:'center' }}><TankShape width={88} height={126}/></Box><Box><Typography sx={{ fontSize:40, lineHeight:1, fontWeight:850 }}>{value}%</Typography><Typography sx={{ mt:.35, color:theme.muted }}>{liters} {label(locale,'stored','موجود')}</Typography><Box sx={{ mt:.9 }}><Progress value={value} theme={theme}/></Box><Box sx={{ mt:.9, display:'grid', gridTemplateColumns:'1fr 1fr', gap:.7 }}><StatBox label={label(locale,'Capacity','ظرفیت')} value="2,000 L" theme={theme}/><StatBox label={label(locale,'Available','فضای خالی')} value="740 L" theme={theme}/></Box></Box></Box>
    <Box sx={{ minHeight:0, border:`1px solid ${theme.border}`, borderRadius:1.5, p:.85, bgcolor:'#fbfcff' }}><Box sx={{ display:'flex', justifyContent:'space-between', mb:.3 }}><Typography sx={{ fontSize:9.8, color:theme.muted }}>{label(locale,'Level trend','روند سطح')}</Typography><Typography sx={{ fontSize:9.8, color:theme.muted }}>24h</Typography></Box><ChartSvg values={trend} color={theme.accent} fill minHeight={66}/></Box>
  </Box>;
}


function MaterialBoolean({ def, theme, locale, size }: Props) {
  const p = profile(size);
  const [on, setOn] = useState(Boolean(def.mock.value ?? true));
  const Icon = def.icon;
  const text = on ? label(locale,'Active','فعال') : label(locale,'Inactive','غیرفعال');
  const color = on ? '#16a34a' : '#64748b';
  const history = on ? [0,0,0,0,-1,0,0,0] : [-1,-1,-1,0,-1,-1,-1,-1];

  if (p.compact) return <Box sx={{ height:'100%', display:'grid', placeItems:'center' }}><Box onClick={()=>setOn(v=>!v)} sx={{ cursor:'pointer', textAlign:'center' }}><Box sx={{ width:60,height:60,mx:'auto',borderRadius:1.5,bgcolor:`${color}0c`,border:`1px solid ${color}20`,display:'grid',placeItems:'center' }}><Icon sx={{fontSize:28,color}}/></Box><Typography sx={{ mt:.65,fontSize:13,fontWeight:850,color }}>{text}</Typography></Box></Box>;

  if (!p.large) return <Box sx={{ height:'100%', display:'grid', gridTemplateColumns:'96px 1fr', alignItems:'center', gap:1.4 }}><Box onClick={()=>setOn(v=>!v)} sx={{cursor:'pointer',display:'grid',placeItems:'center'}}><Box sx={{ width:72,height:72,borderRadius:1.75,bgcolor:`${color}0c`,border:`1px solid ${color}20`,display:'grid',placeItems:'center' }}><Icon sx={{fontSize:32,color}}/></Box></Box><Box><ToneBadge text={text} tone={on?'success':'neutral'} theme={theme}/><Typography sx={{ mt:.75,fontSize:10.5,color:theme.muted }}>{label(locale,'Click state to toggle demo','برای تغییر وضعیت نمونه کلیک کنید')}</Typography></Box></Box>;

  return <Box sx={{ height:'100%', display:'grid', gridTemplateRows:'auto auto minmax(58px,1fr)', gap:1.05 }}>
    <Box sx={{ display:'grid', gridTemplateColumns:'112px 1fr', gap:1.4, alignItems:'center' }}><Box onClick={()=>setOn(v=>!v)} sx={{ cursor:'pointer', display:'grid', placeItems:'center' }}><Box sx={{ width:92,height:92,borderRadius:2,bgcolor:`${color}0c`,border:`1px solid ${color}20`,display:'grid',placeItems:'center' }}><Icon sx={{fontSize:44,color}}/></Box></Box><Box><ToneBadge text={text} tone={on?'success':'neutral'} theme={theme}/><Typography sx={{ mt:.7,fontSize:20,fontWeight:850 }}>{on?label(locale,'Device operating normally','دستگاه در حال کار عادی است'):label(locale,'Device is inactive','دستگاه غیرفعال است')}</Typography><Typography sx={{ mt:.35,fontSize:10.5,color:theme.muted }}>{label(locale,'Tap the state icon to toggle the demo.','برای تغییر وضعیت نمونه روی آیکون کلیک کنید.')}</Typography></Box></Box>
    <Box sx={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:.7 }}><StatBox label={label(locale,'Since','از زمان')} value="09:14" theme={theme}/><StatBox label={label(locale,'Uptime','آپ‌تایم')} value="18h 42m" theme={theme}/><StatBox label={label(locale,'Packets','بسته‌ها')} value="1,284" theme={theme} accent/></Box>
    <Box sx={{ alignSelf:'end', border:`1px solid ${theme.border}`, borderRadius:1.5, p:.9, bgcolor:'#fbfcff' }}><Box sx={{ display:'flex',justifyContent:'space-between',mb:.55 }}><Typography sx={{fontSize:9.8,color:theme.muted}}>{label(locale,'Recent availability','دسترس‌پذیری اخیر')}</Typography><Typography sx={{fontSize:9.8,fontWeight:800,color}}>98.7%</Typography></Box><HistoryStrip values={history} theme={theme} active={color}/></Box>
  </Box>;
}


function MaterialAlarm({ def, theme, locale, size }: Props) {
  const p = profile(size);
  const Icon = def.icon;
  const active = Boolean(def.mock.value);
  const severity = s(def.mock.severity, 'warning');
  const color = active ? (severity === 'critical' ? '#dc2626' : '#d97706') : '#16a34a';
  const state = active ? label(locale,'Alarm active','هشدار فعال') : label(locale,'Normal','عادی');
  const tone = active ? (severity === 'critical' ? 'danger' : 'warning') : 'success';

  if (p.compact) return <Box sx={{ height:'100%', display:'grid', placeItems:'center' }}><Box sx={{ textAlign:'center' }}><Box sx={{ width:64,height:64,mx:'auto',borderRadius:1.75,display:'grid',placeItems:'center',bgcolor:`${color}0c`,border:`1px solid ${color}20` }}><Icon sx={{fontSize:32,color}}/></Box><Typography sx={{ mt:.65,fontSize:12.5,fontWeight:850,color }}>{state}</Typography></Box></Box>;

  if (!p.large) return <Box sx={{ height:'100%', display:'grid', gridTemplateColumns:'104px 1fr', alignItems:'center', gap:1.4 }}><Box sx={{display:'grid',placeItems:'center'}}><Box sx={{ width:78,height:78,borderRadius:2,display:'grid',placeItems:'center',bgcolor:`${color}0c`,border:`1px solid ${color}20` }}><Icon sx={{fontSize:37,color}}/></Box></Box><Box><ToneBadge text={state} tone={tone} theme={theme}/><Typography sx={{ mt:.75,fontSize:11,color:theme.muted }}>{active?label(locale,'Immediate attention required','نیازمند بررسی فوری'):label(locale,'Sensor is reporting normal state','سنسور وضعیت عادی گزارش می‌کند')}</Typography></Box></Box>;

  const timeline = active ? [0,0,1,0,2,1,0,2] : [0,0,0,-1,0,0,0,0];
  return <Box sx={{ height:'100%', display:'grid', gridTemplateRows:'auto auto minmax(58px,1fr)', gap:1.05 }}>
    <Box sx={{ display:'grid', gridTemplateColumns:'112px 1fr', gap:1.4, alignItems:'center' }}><Box sx={{display:'grid',placeItems:'center'}}><Box sx={{ width:92,height:92,borderRadius:2,display:'grid',placeItems:'center',bgcolor:`${color}0c`,border:`1px solid ${color}20` }}><Icon sx={{fontSize:46,color}}/></Box></Box><Box><ToneBadge text={state} tone={tone} theme={theme}/><Typography sx={{ mt:.7,fontSize:20,fontWeight:850 }}>{active?label(locale,'Immediate attention required','نیازمند بررسی فوری'):label(locale,'Area is clear','محدوده در وضعیت عادی است')}</Typography><Typography sx={{ mt:.35,fontSize:10.5,color:theme.muted }}>{active?label(locale,'Review the alarm source and acknowledge after inspection.','منبع هشدار را بررسی و پس از بازدید تأیید کنید.'):label(locale,'No active safety condition is detected.','هیچ وضعیت ایمنی فعالی تشخیص داده نشده است.')}</Typography></Box></Box>
    <Box sx={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:.7 }}><StatBox label={label(locale,'Last event','آخرین رخداد')} value={active?'09:42':'Yesterday'} theme={theme}/><StatBox label={label(locale,'Zone','زون')} value="Floor 2" theme={theme}/><StatBox label={label(locale,'Severity','شدت')} value={active?severity.toUpperCase():'CLEAR'} theme={theme} accent/></Box>
    <Box sx={{ alignSelf:'end', border:`1px solid ${theme.border}`, borderRadius:1.5, p:.9, bgcolor:'#fbfcff' }}><Box sx={{ display:'flex',justifyContent:'space-between',mb:.55 }}><Typography sx={{fontSize:9.8,color:theme.muted}}>{label(locale,'Recent event history','تاریخچه رخداد اخیر')}</Typography><Typography sx={{fontSize:9.8,color:theme.muted}}>24h</Typography></Box><HistoryStrip values={timeline} theme={theme} active="#16a34a" warning="#d97706" danger="#dc2626"/></Box>
  </Box>;
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
  return <Box sx={{ height:'100%', display:'grid', gridTemplateRows:'minmax(0,1fr) auto', gap:.65 }}>
    <Box sx={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gridTemplateRows:`repeat(${heat.length},1fr)`, gap:p.large?.7:.45, minHeight:0 }}>
      {heat.flat().map((v,i)=>{
        const alpha = .10 + clamp(v,0,1) * .84;
        return <Box key={i} sx={{ minHeight:16, borderRadius:.6, bgcolor:`rgba(79,70,229,${alpha})`, border:'1px solid rgba(79,70,229,.10)' }}/>;
      })}
    </Box>
    <Box sx={{ display:'flex', justifyContent:'space-between', color:theme.muted }}>{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day=><Typography key={day} sx={{ fontSize:9 }}>{p.compact?day[0]:day}</Typography>)}</Box>
  </Box>;
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
  return <Box sx={{ height:'100%', borderRadius:1.25, overflow:'hidden', position:'relative', border:`1px solid ${theme.border}`, background:'#f7f8fb' }}>
    <svg viewBox="0 0 300 180" width="100%" height="100%" preserveAspectRatio="none" style={{position:'absolute',inset:0}}>
      <rect width="300" height="180" fill="#f7f8fb"/>
      <path d="M-15 45 C55 20 92 58 160 38 S255 24 322 56" fill="none" stroke="#dce4ed" strokeWidth="15"/>
      <path d="M36 -10 C65 48 34 94 75 196" fill="none" stroke="#e2e8f0" strokeWidth="10"/>
      <path d="M230 -10 C205 38 226 92 190 196" fill="none" stroke="#e5eaf1" strokeWidth="9"/>
      <path d="M-10 136 C55 110 106 132 158 113 S245 98 314 128" fill="none" stroke="#dfe6ee" strokeWidth="7"/>
      <path d="M10 125 C55 80 95 82 136 118 S224 156 290 92" fill="none" stroke={theme.accent} strokeWidth={p.large?4:3.2} strokeLinecap="round"/>
      {[{x:72,y:96},{x:134,y:118},{x:214,y:126}].map((pt,i)=><g key={i}><circle cx={pt.x} cy={pt.y} r="9" fill={theme.accent} opacity=".13"/><circle cx={pt.x} cy={pt.y} r="5" fill={theme.accent}/></g>)}
      {p.large&&<><text x="116" y="33" fill="#94a3b8" fontSize="8">Industrial Ave</text><text x="214" y="82" fill="#94a3b8" fontSize="8">North Rd</text></>}
    </svg>
    <Box sx={{ position:'absolute', left:10, bottom:10 }}><ToneBadge text="3 devices" tone="accent" theme={theme}/></Box>
    {p.large&&<Box sx={{ position:'absolute', right:10, top:10, px:.8, py:.45, borderRadius:1, bgcolor:'rgba(255,255,255,.88)', border:`1px solid ${theme.border}` }}><Typography sx={{ fontSize:9.5, color:theme.muted }}>12.4 km route</Typography></Box>}
  </Box>;
}

function MaterialCoordinates({ def, theme, locale, size }: Props) {
  const p = profile(size);
  const lat=s(def.mock.lat,'35.7219° N'); const lng=s(def.mock.lng,'51.3347° E'); const accuracy=s(def.mock.accuracy,'4.2 m');
  if (!p.large) return <Box sx={{ height:'100%', display:'grid', gridTemplateRows:'repeat(3,1fr)', gap:.6, alignContent:'center', direction:'ltr' }}><StatBox label="LAT" value={lat} theme={theme}/><StatBox label="LNG" value={lng} theme={theme}/><StatBox label={label(locale,'Accuracy','دقت')} value={accuracy} theme={theme} accent/></Box>;
  return <Box sx={{ height:'100%', display:'grid', gridTemplateColumns:'1fr 154px', gap:1.15, alignItems:'center', direction:'ltr' }}>
    <Box sx={{ display:'grid', gap:.7 }}><StatBox label="LATITUDE" value={lat} theme={theme}/><StatBox label="LONGITUDE" value={lng} theme={theme}/><StatBox label={label(locale,'Accuracy','دقت')} value={accuracy} theme={theme} accent/></Box>
    <Box sx={{ height:154, borderRadius:1.5, border:`1px solid ${theme.border}`, bgcolor:'#f7f8fb', position:'relative', overflow:'hidden' }}>
      <svg viewBox="0 0 154 154" width="100%" height="100%"><rect width="154" height="154" fill="#f7f8fb"/><path d="M-10 44 C38 22 72 56 166 28" fill="none" stroke="#dce4ed" strokeWidth="12"/><path d="M45 -8 C66 36 36 86 63 170" fill="none" stroke="#e2e8f0" strokeWidth="8"/><path d="M-8 120 C48 92 102 118 166 86" fill="none" stroke="#dfe6ee" strokeWidth="7"/><circle cx="91" cy="86" r="22" fill={theme.accent} opacity=".12"/><circle cx="91" cy="86" r="7" fill="#fff" stroke={theme.accent} strokeWidth="4"/></svg>
      <Box sx={{ position:'absolute', left:8, bottom:8, px:.65, py:.35, bgcolor:'rgba(255,255,255,.9)', border:`1px solid ${theme.border}`, borderRadius:1 }}><Typography sx={{ fontSize:9.5, color:theme.muted }}>± {accuracy}</Typography></Box>
    </Box>
  </Box>;
}

function MaterialCompass({ def, theme, size }: Props) {
  const p = profile(size);
  const value = n(def.mock.value,327);
  const dia = p.compact ? 112 : p.large ? 184 : 138;
  const pointerAngle = value - 90;
  const rad = pointerAngle * Math.PI / 180;
  const radius = dia * .36;
  const cx = dia / 2;
  const cy = dia / 2;
  const px = cx + Math.cos(rad) * radius;
  const py = cy + Math.sin(rad) * radius;
  return <Box sx={{ height:'100%',display:'grid',placeItems:'center',direction:'ltr' }}><Box sx={{ width:dia,height:dia,borderRadius:'50%',border:`1px solid ${theme.border}`,bgcolor:'#fbfcff',position:'relative',display:'grid',placeItems:'center',boxShadow:'inset 0 0 0 8px #fff' }}>
    {['N','E','S','W'].map((x,i)=><Typography key={x} sx={{ position:'absolute',fontSize:10.5,color:theme.muted,fontWeight:x==='N'?800:600,top:i===0?7:i===2?undefined:'50%',bottom:i===2?7:undefined,left:i===3?9:i===1?undefined:'50%',right:i===1?9:undefined,transform:i===0||i===2?'translateX(-50%)':i===1||i===3?'translateY(-50%)':undefined }}>{x}</Typography>)}
    <Box sx={{ position:'absolute',left:px-5,top:py-5,width:10,height:10,transform:`rotate(${value}deg)`,color:theme.accent }}><Box sx={{ width:0,height:0,borderLeft:'5px solid transparent',borderRight:'5px solid transparent',borderBottom:`10px solid ${theme.accent}` }}/></Box>
    <Box sx={{ width:p.large?86:72,height:p.large?58:50,borderRadius:1.5,bgcolor:'#fff',border:`1px solid ${theme.border}`,display:'grid',placeItems:'center',textAlign:'center',boxShadow:'0 4px 12px rgba(15,23,42,.04)' }}><Box><Typography sx={{fontSize:p.large?31:25,fontWeight:850,lineHeight:1}}>{value}°</Typography><Typography sx={{fontSize:9.5,color:theme.muted,mt:.25}}>heading</Typography></Box></Box>
  </Box></Box>;
}


function MaterialButton({ theme, locale, size }: Props) {
  const p=profile(size); const [sent,setSent]=useState(false);
  const trigger=()=>{setSent(true);setTimeout(()=>setSent(false),1100)};
  if (p.compact) return <Box sx={{ height:'100%',display:'grid',placeItems:'center' }}><Box sx={{ textAlign:'center' }}><Button variant="contained" onClick={trigger} sx={{ borderRadius:1.25,textTransform:'none',fontWeight:800,px:2.1,boxShadow:'none' }}>{label(locale,'Send command','ارسال فرمان')}</Button><Typography sx={{ mt:.7,fontSize:10.5,color:sent?'#16a34a':theme.muted }}>{sent?label(locale,'Queued','در صف ارسال'):label(locale,'Ready','آماده')}</Typography></Box></Box>;
  if (!p.large) return <Box sx={{ height:'100%',display:'grid',gridTemplateColumns:'1fr 142px',alignItems:'center',gap:1.4 }}><Box><Typography sx={{ fontSize:18,fontWeight:850 }}>{label(locale,'Device command','فرمان دستگاه')}</Typography><Typography sx={{ mt:.35,fontSize:11,color:theme.muted }}>{label(locale,'Send a predefined RPC/downlink action to this device.','ارسال فرمان از پیش تعریف‌شده به دستگاه.')}</Typography></Box><Box sx={{ textAlign:'center' }}><Button fullWidth variant="contained" onClick={trigger} sx={{ borderRadius:1.25,textTransform:'none',fontWeight:800,boxShadow:'none' }}>{label(locale,'Send command','ارسال فرمان')}</Button><Typography sx={{ mt:.6,fontSize:10.5,color:sent?'#16a34a':theme.muted }}>{sent?label(locale,'Command queued','فرمان در صف قرار گرفت'):label(locale,'Ready','آماده')}</Typography></Box></Box>;
  return <Box sx={{ height:'100%',display:'grid',gridTemplateRows:'auto auto minmax(74px,1fr) auto',gap:1 }}>
    <Box><Typography sx={{ fontSize:22,fontWeight:850 }}>{label(locale,'Device command','فرمان دستگاه')}</Typography><Typography sx={{ mt:.35,fontSize:11,color:theme.muted }}>{label(locale,'Send a predefined RPC/downlink action to this device.','ارسال فرمان از پیش تعریف‌شده به دستگاه.')}</Typography></Box>
    <Box sx={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:.7 }}><StatBox label="TARGET" value="Device" theme={theme}/><StatBox label="TIMEOUT" value="5 sec" theme={theme}/><StatBox label="METHOD" value="RPC" theme={theme} accent/></Box>
    <Box sx={{ minHeight:0,border:`1px solid ${theme.border}`,borderRadius:1.5,p:1,bgcolor:'#fbfcff',display:'grid',gridTemplateColumns:'1fr auto',alignItems:'center',gap:1 }}><Box><Typography sx={{fontSize:10,color:theme.muted}}>{label(locale,'Last execution','آخرین اجرا')}</Typography><Typography sx={{mt:.25,fontSize:14,fontWeight:850}}>09:41:32 · ACK</Typography><Typography sx={{mt:.25,fontSize:10,color:theme.muted}}>{label(locale,'Round trip 182 ms','زمان رفت‌وبرگشت ۱۸۲ ms')}</Typography></Box><ToneBadge text={sent?label(locale,'Queued','در صف'):label(locale,'Ready','آماده')} tone={sent?'success':'neutral'} theme={theme}/></Box>
    <Button fullWidth variant="contained" onClick={trigger} sx={{ height:42,borderRadius:1.25,textTransform:'none',fontWeight:850,boxShadow:'none' }}>{sent?label(locale,'Queued','در صف'):label(locale,'Send command','ارسال فرمان')}</Button>
  </Box>;
}


function MaterialSwitch({ def, theme, locale, size }: Props) {
  const p=profile(size); const [checked,setChecked]=useState(Boolean(def.mock.value ?? true));
  const semantic = def.id === 'door-lock'
    ? { on:label(locale,'Locked','قفل'), off:label(locale,'Unlocked','باز'), action:label(locale,'Door access','دسترسی درب'), running:label(locale,'Secured','ایمن') }
    : def.id === 'siren'
      ? { on:label(locale,'Beacon active','چراغ هشدار فعال'), off:label(locale,'Beacon standby','چراغ هشدار آماده'), action:label(locale,'Safety output','خروجی ایمنی'), running:label(locale,'Attention','هشدار') }
      : { on:label(locale,'Output enabled','خروجی فعال'), off:label(locale,'Output disabled','خروجی غیرفعال'), action:label(locale,'Relay output','خروجی رله'), running:label(locale,'Running','در حال کار') };
  const stateText = checked ? semantic.on : semantic.off;
  if(p.compact) return <Box sx={{ height:'100%',display:'grid',placeItems:'center' }}><Box sx={{ textAlign:'center' }}><Switch checked={checked} onChange={(_,v)=>setChecked(v)} sx={{ transform:'scale(1.22)','& .MuiSwitch-switchBase.Mui-checked':{color:theme.accent},'& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':{backgroundColor:theme.accent} }}/><Typography sx={{ mt:.5,fontSize:14.5,fontWeight:850,color:checked?theme.accent:theme.muted }}>{stateText}</Typography></Box></Box>;
  if(!p.large) return <Box sx={{ height:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',gap:1.4 }}><Box><Typography sx={{ fontSize:20,fontWeight:850 }}>{stateText}</Typography><Typography sx={{ mt:.3,fontSize:11,color:theme.muted }}>{semantic.action}</Typography></Box><Switch checked={checked} onChange={(_,v)=>setChecked(v)} sx={{ transform:'scale(1.35)','& .MuiSwitch-switchBase.Mui-checked':{color:theme.accent},'& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':{backgroundColor:theme.accent} }}/></Box>;
  return <Box sx={{ height:'100%',display:'grid',gridTemplateRows:'auto auto minmax(62px,1fr)',gap:1.05 }}>
    <Box sx={{ display:'flex',alignItems:'center',justifyContent:'space-between',gap:2 }}><Box><Typography sx={{fontSize:26,fontWeight:850}}>{stateText}</Typography><Typography sx={{mt:.3,fontSize:11,color:theme.muted}}>{semantic.action}</Typography><Box sx={{mt:.8}}><ToneBadge text={checked?semantic.running:label(locale,'Stopped','متوقف')} tone={checked?'success':'neutral'} theme={theme}/></Box></Box><Switch checked={checked} onChange={(_,v)=>setChecked(v)} sx={{ transform:'scale(1.7)','& .MuiSwitch-switchBase.Mui-checked':{color:theme.accent},'& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':{backgroundColor:theme.accent} }}/></Box>
    <Box sx={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:.7}}><StatBox label={label(locale,'Last change','آخرین تغییر')} value="09:42" theme={theme}/><StatBox label={label(locale,'Source','منبع')} value="Dashboard" theme={theme}/><StatBox label={label(locale,'State','وضعیت')} value={checked?'ON':'OFF'} theme={theme} accent/></Box>
    <Box sx={{ alignSelf:'end',border:`1px solid ${theme.border}`,borderRadius:1.5,p:.9,bgcolor:'#fbfcff' }}><Box sx={{display:'flex',justifyContent:'space-between',mb:.55}}><Typography sx={{fontSize:9.8,color:theme.muted}}>{label(locale,'Recent state history','تاریخچه وضعیت اخیر')}</Typography><Typography sx={{fontSize:9.8,color:theme.muted}}>24h</Typography></Box><HistoryStrip values={checked?[0,0,0,-1,0,0,0,0]:[-1,-1,0,-1,-1,-1,0,-1]} theme={theme} active={theme.accent}/></Box>
  </Box>;
}


function MaterialSlider({ def, theme, locale, size }: Props) {
  const p=profile(size); const [value,setValue]=useState(n(def.mock.value,65)); const unit=s(def.mock.unit,'%');
  if(!p.large) return <Box sx={{ height:'100%',display:'flex',flexDirection:'column',justifyContent:'center',gap:1,direction:'ltr' }}><Box sx={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}><Typography sx={{fontSize:31,fontWeight:850}}>{value}<Box component="span" sx={{ml:.4,fontSize:13,color:theme.muted}}>{unit}</Box></Typography><Typography sx={{fontSize:10.5,color:theme.muted}}>0 — 100</Typography></Box><Slider value={value} onChange={(_,v)=>setValue(v as number)} sx={{color:theme.accent,'& .MuiSlider-thumb':{width:18,height:18,boxShadow:`0 0 0 5px ${theme.accent}12`}}}/></Box>;
  return <Box sx={{ height:'100%',display:'grid',gridTemplateRows:'auto auto minmax(58px,1fr)',gap:1.05,direction:'ltr' }}>
    <Box><Box sx={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}><Typography sx={{fontSize:38,fontWeight:850}}>{value}<Box component="span" sx={{ml:.4,fontSize:13,color:theme.muted}}>{unit}</Box></Typography><Typography sx={{fontSize:10.5,color:theme.muted}}>0 — 100</Typography></Box><Slider value={value} onChange={(_,v)=>setValue(v as number)} sx={{color:theme.accent,'& .MuiSlider-thumb':{width:18,height:18,boxShadow:`0 0 0 5px ${theme.accent}12`}}}/></Box>
    <Box sx={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:.75}}><StatBox label={label(locale,'Low','کم')} value="0" theme={theme}/><StatBox label={label(locale,'Current','فعلی')} value={`${value}${unit}`} theme={theme} accent/><StatBox label={label(locale,'High','زیاد')} value="100" theme={theme}/></Box>
    <Box sx={{ alignSelf:'end',border:`1px solid ${theme.border}`,borderRadius:1.5,p:.9,bgcolor:'#fbfcff' }}><Typography sx={{fontSize:9.8,color:theme.muted,mb:.55}}>{label(locale,'Output profile','پروفایل خروجی')}</Typography><ChartSvg values={[42,45,50,55,58,62,value,value,value]} color={theme.accent} fill minHeight={50}/></Box>
  </Box>;
}


function MaterialInput({ def, theme, locale, size }: Props) {
  const p=profile(size); const [value,setValue]=useState(String(def.mock.value??'22.5')); const [applied,setApplied]=useState(false);
  const unit=s(def.mock.unit,'');
  if(!p.large) return <Box sx={{ height:'100%',display:'flex',alignItems:'center',justifyContent:'center' }}><TextField value={value} onChange={e=>setValue(e.target.value)} label={label(locale,'Target value','مقدار هدف')} size="small" fullWidth inputProps={{dir:'ltr'}} sx={{ '& .MuiOutlinedInput-root':{borderRadius:1.25},'& .MuiOutlinedInput-notchedOutline':{borderColor:theme.border} }}/></Box>;
  return <Box sx={{ height:'100%',display:'grid',gridTemplateRows:'auto auto minmax(82px,1fr) auto',gap:1.05 }}>
    <Box sx={{ display:'grid',gridTemplateColumns:'1fr 120px',gap:.8,alignItems:'end' }}><TextField value={value} onChange={e=>{setValue(e.target.value);setApplied(false)}} label={label(locale,'Target value','مقدار هدف')} size="small" fullWidth inputProps={{dir:'ltr'}} sx={{ '& .MuiOutlinedInput-root':{borderRadius:1.25},'& .MuiOutlinedInput-notchedOutline':{borderColor:theme.border} }}/><Button variant="contained" onClick={()=>setApplied(true)} sx={{ height:40,borderRadius:1.25,textTransform:'none',fontWeight:800,boxShadow:'none' }}>{label(locale,'Apply','اعمال')}</Button></Box>
    <Box sx={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:.7 }}><StatBox label={label(locale,'Current','فعلی')} value={`${def.mock.value ?? '22.5'}${unit}`} theme={theme}/><StatBox label={label(locale,'Pending','در انتظار')} value={`${value}${unit}`} theme={theme} accent/><StatBox label={label(locale,'Allowed','مجاز')} value="16–30°C" theme={theme}/></Box>
    <Box sx={{ minHeight:0,border:`1px solid ${theme.border}`,borderRadius:1.5,bgcolor:'#fbfcff',overflow:'hidden' }}><Box sx={{px:1,py:.7,borderBottom:`1px solid ${theme.border}`,fontSize:10,color:theme.muted,fontWeight:800}}>{label(locale,'Recent changes','تغییرات اخیر')}</Box>{[['09:42','22.5°C','Dashboard'],['08:15','21.0°C','Schedule'],['06:00','20.0°C','Automation']].map((r,i)=><Box key={r[0]} sx={{display:'grid',gridTemplateColumns:'70px 1fr 1fr',gap:1,px:1,py:.8,borderBottom:i<2?`1px solid ${theme.border}`:'none'}}>{r.map((c,j)=><Typography key={j} sx={{fontSize:10.5,fontWeight:j===1?800:600,color:j===0?theme.muted:theme.foreground}}>{c}</Typography>)}</Box>)}</Box>
    <Typography sx={{fontSize:10.5,color:applied?'#16a34a':theme.muted}}>{applied?label(locale,'Command queued successfully','فرمان با موفقیت در صف قرار گرفت'):label(locale,'Enter a value, review it, then apply.','مقدار را وارد، بررسی و سپس اعمال کنید.')}</Typography>
  </Box>;
}


function MaterialThermostat({ def, theme, locale, size }: Props) {
  const p=profile(size); const [value,setValue]=useState(n(def.mock.value,22));
  if(p.compact) return <Box sx={{ height:'100%',display:'grid',placeItems:'center',direction:'ltr' }}><Box sx={{ width:112,height:112,borderRadius:'50%',border:`7px solid ${theme.accent}18`,display:'grid',placeItems:'center' }}><Box sx={{textAlign:'center'}}><Typography sx={{fontSize:31,fontWeight:850}}>{value}°</Typography><Typography sx={{fontSize:9.5,color:theme.muted}}>SET</Typography></Box></Box></Box>;
  if(!p.large) return <Box sx={{ height:'100%',display:'grid',gridTemplateColumns:'138px 1fr',alignItems:'center',gap:1.6,direction:'ltr' }}><Box sx={{width:128,height:128,borderRadius:'50%',border:`9px solid ${theme.accent}18`,display:'grid',placeItems:'center'}}><Box sx={{textAlign:'center'}}><Typography sx={{fontSize:33,fontWeight:850}}>{value}°</Typography><Typography sx={{fontSize:10,color:theme.muted}}>SETPOINT</Typography></Box></Box><Box><Typography sx={{fontSize:11,color:theme.muted}}>{label(locale,'Target temperature','دمای هدف')}</Typography><Slider min={16} max={30} value={value} onChange={(_,v)=>setValue(v as number)} sx={{color:theme.accent}}/></Box></Box>;
  return <Box sx={{ height:'100%',display:'grid',gridTemplateRows:'auto auto minmax(58px,1fr)',gap:1.05,direction:'ltr' }}>
    <Box sx={{display:'grid',gridTemplateColumns:'160px 1fr',alignItems:'center',gap:1.6}}><Box sx={{width:148,height:148,borderRadius:'50%',border:`9px solid ${theme.accent}18`,display:'grid',placeItems:'center'}}><Box sx={{textAlign:'center'}}><Typography sx={{fontSize:39,fontWeight:850}}>{value}°</Typography><Typography sx={{fontSize:10,color:theme.muted}}>SETPOINT</Typography></Box></Box><Box><Typography sx={{fontSize:11,color:theme.muted}}>{label(locale,'Target temperature','دمای هدف')}</Typography><Slider min={16} max={30} value={value} onChange={(_,v)=>setValue(v as number)} sx={{color:theme.accent}}/><Box sx={{mt:.8,display:'grid',gridTemplateColumns:'1fr 1fr',gap:.75}}><StatBox label={label(locale,'Room','اتاق')} value="24.8°C" theme={theme}/><StatBox label={label(locale,'Mode','حالت')} value="Auto" theme={theme} accent/></Box></Box></Box>
    <Box sx={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:.7}}><StatBox label={label(locale,'Heating','گرمایش')} value="OFF" theme={theme}/><StatBox label={label(locale,'Fan','فن')} value="AUTO" theme={theme}/><StatBox label={label(locale,'Humidity','رطوبت')} value="46%" theme={theme}/></Box>
    <Box sx={{alignSelf:'end',border:`1px solid ${theme.border}`,borderRadius:1.5,p:.9,bgcolor:'#fbfcff'}}><Typography sx={{fontSize:9.8,color:theme.muted,mb:.55}}>{label(locale,'Room temperature trend','روند دمای اتاق')}</Typography><ChartSvg values={[23.8,24,24.1,24.4,24.6,24.8,24.7,24.8]} color={theme.accent} fill minHeight={50}/></Box>
  </Box>;
}


function MaterialColor({ theme, locale, size }: Props) {
  const p=profile(size); const [hue,setHue]=useState(188); const [brightness,setBrightness]=useState(78); const [on,setOn]=useState(true); const presets=[0,36,120,188,265,315]; const preview=on?`hsl(${hue} 78% ${Math.max(28,brightness/1.75)}%)`:'#64748b';
  if(!p.large) return <Box sx={{ height:'100%',display:'grid',gridTemplateRows:p.compact?'52px auto auto':'70px auto auto auto',gap:.7,direction:'ltr' }}><Box onClick={()=>setOn(v=>!v)} sx={{ cursor:'pointer',borderRadius:1.5,background:preview,position:'relative',overflow:'hidden',border:`1px solid ${theme.border}` }}><Typography sx={{position:'absolute',left:8,bottom:6,fontSize:10,fontWeight:850,color:'#fff'}}>{on?'ON':'OFF'}</Typography><Typography sx={{position:'absolute',right:8,bottom:6,fontSize:10,color:'#fff'}}>{brightness}%</Typography></Box><Box sx={{display:'flex',justifyContent:'space-between',gap:.45}}>{presets.map(x=><Box key={x} onClick={()=>{setHue(x);setOn(true)}} sx={{cursor:'pointer',width:p.compact?20:25,height:p.compact?20:25,borderRadius:'50%',background:`hsl(${x} 82% 55%)`,border:hue===x?`2px solid ${theme.foreground}`:'2px solid transparent',boxShadow:hue===x?'0 0 0 2px #fff,0 0 0 3px #d1d5db':'none'}}/>)}</Box><Box><Typography sx={{fontSize:9.5,color:theme.muted}}>{label(locale,'Hue','رنگ')} · {hue}°</Typography><Slider min={0} max={360} value={hue} onChange={(_,v)=>setHue(v as number)} size="small" sx={{color:theme.accent,py:.45}}/></Box>{!p.compact&&<Box><Typography sx={{fontSize:9.5,color:theme.muted}}>{label(locale,'Brightness','روشنایی')}</Typography><Slider min={5} max={100} value={brightness} onChange={(_,v)=>setBrightness(v as number)} size="small" sx={{color:theme.accent2,py:.45}}/></Box>}</Box>;
  return <Box sx={{ height:'100%',display:'grid',gridTemplateRows:'110px auto auto auto',gap:1,direction:'ltr' }}>
    <Box onClick={()=>setOn(v=>!v)} sx={{cursor:'pointer',borderRadius:1.75,background:preview,position:'relative',overflow:'hidden',border:`1px solid ${theme.border}`,boxShadow:`inset 0 0 34px rgba(255,255,255,.12)`}}><Box sx={{position:'absolute',inset:0,background:'radial-gradient(circle at 25% 25%,rgba(255,255,255,.35),transparent 34%)'}}/><Typography sx={{position:'absolute',left:12,bottom:10,fontSize:12,fontWeight:850,color:'#fff'}}>{on?label(locale,'Light on','چراغ روشن'):label(locale,'Light off','چراغ خاموش')}</Typography><Typography sx={{position:'absolute',right:12,bottom:10,fontSize:12,fontWeight:800,color:'#fff'}}>{brightness}%</Typography></Box>
    <Box sx={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:.75}}>{presets.map(x=><Button key={x} onClick={()=>{setHue(x);setOn(true)}} sx={{minWidth:0,p:.5,borderRadius:1.25,border:hue===x?`2px solid ${theme.foreground}`:`1px solid ${theme.border}`,bgcolor:'#fff'}}><Box sx={{width:26,height:26,borderRadius:'50%',background:`hsl(${x} 82% 55%)`}}/></Button>)}</Box>
    <Box><Box sx={{display:'flex',justifyContent:'space-between'}}><Typography sx={{fontSize:10,color:theme.muted}}>{label(locale,'Hue','رنگ')}</Typography><Typography sx={{fontSize:10,fontWeight:800}}>{hue}°</Typography></Box><Slider min={0} max={360} value={hue} onChange={(_,v)=>setHue(v as number)} size="small" sx={{color:theme.accent}}/></Box>
    <Box><Box sx={{display:'flex',justifyContent:'space-between'}}><Typography sx={{fontSize:10,color:theme.muted}}>{label(locale,'Brightness','روشنایی')}</Typography><Typography sx={{fontSize:10,fontWeight:800}}>{brightness}%</Typography></Box><Slider min={5} max={100} value={brightness} onChange={(_,v)=>setBrightness(v as number)} size="small" sx={{color:theme.accent2}}/></Box>
  </Box>;
}


function MaterialDirection({ theme, locale, size }: Props) {
  const p=profile(size); const [active,setActive]=useState('•'); const keys=['↑','←','•','→','↓']; const button=p.compact?38:p.large?68:46;
  const pad=<Box sx={{display:'grid',gridTemplateColumns:`repeat(3,${button}px)`,gridTemplateRows:`repeat(3,${button}px)`,gap:p.large?.8:.55}}>{keys.map((k,i)=>{const pos=[2,4,5,6,8][i];return <Button key={k} onClick={()=>setActive(k)} sx={{gridColumn:((pos-1)%3)+1,gridRow:Math.floor((pos-1)/3)+1,minWidth:0,width:button,height:button,p:0,borderRadius:1.25,border:`1px solid ${active===k?theme.accent:theme.border}`,color:active===k?'#fff':theme.foreground,bgcolor:active===k?theme.accent:'#fff','&:hover':{bgcolor:active===k?theme.accent:`${theme.accent}08`}}}>{k}</Button>})}</Box>;
  if(!p.large) return <Box sx={{height:'100%',display:'grid',placeItems:'center',direction:'ltr'}}><Box>{pad}{!p.compact&&<Typography sx={{mt:.7,textAlign:'center',fontSize:10,color:theme.muted}}>{label(locale,'Last command','آخرین فرمان')}: {active}</Typography>}</Box></Box>;
  return <Box sx={{height:'100%',display:'grid',gridTemplateColumns:'230px 1fr',gap:1.6,alignItems:'center',direction:'ltr'}}><Box sx={{display:'grid',placeItems:'center'}}>{pad}</Box><Box><ToneBadge text={label(locale,'PTZ / motion ready','کنترل حرکت آماده')} tone="success" theme={theme}/><Box sx={{mt:1,display:'grid',gap:.7}}><StatBox label={label(locale,'Last command','آخرین فرمان')} value={active} theme={theme} accent/><StatBox label={label(locale,'Speed','سرعت')} value="40%" theme={theme}/><StatBox label={label(locale,'Mode','حالت')} value="Momentary" theme={theme}/></Box><Box sx={{mt:1,border:`1px solid ${theme.border}`,borderRadius:1.5,p:.9,bgcolor:'#fbfcff'}}><Typography sx={{fontSize:9.8,color:theme.muted,mb:.55}}>{label(locale,'Command activity','فعالیت فرمان')}</Typography><HistoryStrip values={[0,-1,0,0,-1,0,0,0]} theme={theme} active={theme.accent}/></Box></Box></Box>;
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
  const baseRows = mode==='alarms' ? [['Fire sensor','Critical','09:42'],['Door open','Warning','09:17'],['Battery low','Info','08:51'],['Gas level','Warning','08:23'],['Pump overload','Critical','07:58'],['Signal weak','Info','07:21']]
    : mode==='logs' ? [['gateway-01','connected','09:44:21'],['pump-04','rpc ack','09:43:12'],['sensor-18','telemetry','09:42:08'],['valve-02','state sync','09:40:44'],['node-07','heartbeat','09:39:11'],['gw-01','route update','09:38:02'],['sensor-11','telemetry','09:37:48']]
    : mode==='events' ? [['Valve','Opened','09:41'],['Pump','Started','09:34'],['Mode','Auto','09:12'],['Fan','Speed 72%','09:02'],['Door','Locked','08:58'],['Valve','Closed','08:46']]
    : mode==='measurement-list' ? [['24.8 °C','09:44'],['24.6 °C','09:39'],['24.7 °C','09:34'],['24.4 °C','09:29'],['24.2 °C','09:24'],['24.5 °C','09:19'],['24.1 °C','09:14'],['23.9 °C','09:09']]
    : [['GW-01','Online','24.8 °C'],['Pump-04','Online','68%'],['Node-18','Sleep','3.8 V'],['Valve-02','Alert','Open'],['Node-07','Online','44%'],['Sensor-11','Online','742 ppm'],['Tracker-18','Online','-72 dBm'],['AHU-03','Online','72%']];
  const rows = p.large ? baseRows : baseRows.slice(0,4);
  const headers = mode==='measurement-list' ? [label(locale,'Reading','مقدار'),label(locale,'Time','زمان')] : mode==='table' ? [label(locale,'Device','دستگاه'),label(locale,'State','وضعیت'),label(locale,'Value','مقدار')] : [label(locale,'Item','مورد'),label(locale,'State','وضعیت'),label(locale,'Time','زمان')];
  return <Box sx={{ height:'100%',display:'grid',gridTemplateRows:p.large?'auto minmax(0,1fr) auto':'minmax(0,1fr)',gap:.65,direction:'ltr' }}>
    {p.large&&<Box sx={{display:'flex',gap:.7}}><ToneBadge text={`${rows.length} ${label(locale,'rows','ردیف')}`} tone="neutral" theme={theme}/>{mode==='alarms'&&<ToneBadge text="2 critical" tone="danger" theme={theme}/>}</Box>}
    <Box sx={{ minHeight:0,overflow:'hidden',border:`1px solid ${theme.border}`,borderRadius:1.25,bgcolor:'#fff',display:'grid',gridTemplateRows:p.large?`auto repeat(${rows.length},minmax(0,1fr))`:`repeat(${rows.length},minmax(0,1fr))` }}>
      {p.large&&<Box sx={{display:'grid',gridTemplateColumns:`repeat(${headers.length},minmax(0,1fr))`,gap:1,px:1,py:.65,bgcolor:'#f8fafc',borderBottom:`1px solid ${theme.border}`}}>{headers.map(h=><Typography key={h} sx={{fontSize:9.5,color:theme.muted,fontWeight:800,textTransform:'uppercase',letterSpacing:.25}}>{h}</Typography>)}</Box>}
      {rows.map((row,i)=><Box key={i} sx={{display:'grid',gridTemplateColumns:`repeat(${row.length},minmax(0,1fr))`,gap:1,minHeight:0,alignItems:'center',px:1,py:.45,borderBottom:i<rows.length-1?`1px solid ${theme.border}`:'none',bgcolor:mode==='alarms'&&['Critical'].includes(row[1])?'rgba(220,38,38,.03)':'#fff'}}>{row.map((cell,j)=><Typography key={j} sx={{fontSize:p.large?11.2:10.8,fontWeight:j===0?750:600,color:j===1?rowColor(cell,theme):j===0?theme.foreground:theme.muted,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{cell}</Typography>)}</Box>)}
    </Box>
    {p.large&&<Box sx={{display:'flex',justifyContent:'space-between'}}><Typography sx={{fontSize:10,color:theme.muted}}>{label(locale,'Latest data shown','آخرین داده‌ها نمایش داده شده‌اند')}</Typography><Typography sx={{fontSize:10,color:theme.muted}}>{label(locale,'Auto refresh','بروزرسانی خودکار')}</Typography></Box>}
  </Box>;
}


function MaterialClock({ theme, locale, size }: Props) {
  const p=profile(size);
  if(!p.large) return <Box sx={{height:'100%',display:'grid',placeItems:'center',textAlign:'center'}}><Box><Typography sx={{fontSize:p.compact?38:48,fontWeight:500,letterSpacing:'-.055em',direction:'ltr'}}>09:44</Typography><Typography sx={{mt:.35,fontSize:11,color:theme.muted}}>{locale==='fa'?'چهارشنبه، ۱۵ مهر ۱۴۰۵':'Wednesday, Oct 7'}</Typography></Box></Box>;
  return <Box sx={{height:'100%',display:'grid',gridTemplateRows:'1fr auto',gap:1.1}}>
    <Box sx={{display:'grid',placeItems:'center',textAlign:'center'}}><Box><Typography sx={{fontSize:62,fontWeight:450,letterSpacing:'-.06em',direction:'ltr'}}>09:44</Typography><Typography sx={{mt:.35,fontSize:14,fontWeight:750}}>{locale==='fa'?'چهارشنبه، ۱۵ مهر ۱۴۰۵':'Wednesday, October 7'}</Typography><Box sx={{mt:1}}><ToneBadge text="UTC +03:30" tone="neutral" theme={theme}/></Box></Box></Box>
    <Box sx={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:.7,direction:'ltr'}}><StatBox label={label(locale,'Timezone','منطقه زمانی')} value="Local" theme={theme}/><StatBox label={label(locale,'Sync','همگام‌سازی')} value="NTP OK" theme={theme} accent/><StatBox label={label(locale,'Drift','انحراف')} value="< 12 ms" theme={theme}/></Box>
  </Box>;
}


function MaterialText({ theme, locale, size }: Props) {
  const p=profile(size);
  if(!p.large) return <Box sx={{ height:'100%',display:'flex',flexDirection:'column',justifyContent:'center',direction:locale==='fa'?'rtl':'ltr',textAlign:locale==='fa'?'right':'left' }}><Typography sx={{ fontSize:19,fontWeight:850 }}>{label(locale,'Server room status','وضعیت اتاق سرور')}</Typography><Typography sx={{ mt:.8,fontSize:12,color:theme.muted,lineHeight:1.75 }}>{label(locale,'All sensors are within their normal ranges. Latest telemetry was received less than a minute ago.','همه سنسورها در محدوده عادی هستند. آخرین بسته داده کمتر از یک دقیقه قبل دریافت شده است.')}</Typography></Box>;
  const checks=[
    [label(locale,'Temperature','دما'),'24.8°C','#16a34a'],
    [label(locale,'Humidity','رطوبت'),'46%','#16a34a'],
    [label(locale,'Door','درب'),label(locale,'Closed','بسته'),'#16a34a'],
  ];
  return <Box sx={{ height:'100%',display:'grid',gridTemplateRows:'auto auto 1fr',gap:1.1,direction:locale==='fa'?'rtl':'ltr',textAlign:locale==='fa'?'right':'left' }}>
    <Box><Typography sx={{ fontSize:23,fontWeight:850 }}>{label(locale,'Server room status','وضعیت اتاق سرور')}</Typography><Typography sx={{ mt:.55,fontSize:12,color:theme.muted,lineHeight:1.75 }}>{label(locale,'All sensors are within their normal ranges. Latest telemetry was received less than a minute ago.','همه سنسورها در محدوده عادی هستند. آخرین بسته داده کمتر از یک دقیقه قبل دریافت شده است.')}</Typography></Box>
    <Box sx={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:.7,direction:'ltr' }}><StatBox label="SENSORS" value="12 online" theme={theme} accent/><StatBox label="LAST UPDATE" value="38 sec" theme={theme}/></Box>
    <Box sx={{ alignSelf:'end',border:`1px solid ${theme.border}`,borderRadius:1.25,overflow:'hidden',direction:'ltr' }}>{checks.map(([name,value,color],i)=><Box key={name} sx={{ display:'grid',gridTemplateColumns:'1fr auto',gap:1,alignItems:'center',px:1,py:.7,borderBottom:i<checks.length-1?`1px solid ${theme.border}`:'none' }}><Box sx={{ display:'flex',alignItems:'center',gap:.65 }}><Box sx={{ width:7,height:7,borderRadius:'50%',bgcolor:color }}/><Typography sx={{ fontSize:11,fontWeight:700 }}>{name}</Typography></Box><Typography sx={{ fontSize:11,fontWeight:800,color:theme.muted }}>{value}</Typography></Box>)}</Box>
  </Box>;
}

function MaterialImage({ theme, size }: Props) {
  const p=profile(size);
  return <Box sx={{ height:'100%',minHeight:0,borderRadius:1.5,position:'relative',overflow:'hidden',background:'linear-gradient(135deg,#0f172a,#1e293b 45%,#334155)',border:`1px solid ${theme.border}` }}><Box sx={{ position:'absolute',inset:0,background:'radial-gradient(circle at 70% 25%,rgba(255,255,255,.24),transparent 20%)' }}/><Box sx={{ position:'absolute',left:10,top:10 }}><ToneBadge text="LIVE" tone="danger" theme={theme}/></Box><Box sx={{ position:'absolute',left:'12%',right:'12%',bottom:'14%',height:p.large?'48%':'42%',border:'1px solid rgba(255,255,255,.38)',borderRadius:'48% 48% 10% 10%' }}/><Typography sx={{ position:'absolute',left:10,bottom:8,fontSize:9.5,color:'#fff',fontWeight:700 }}>Camera snapshot · 09:44:12</Typography></Box>;
}

function MaterialIframe({ theme, locale, size }: Props) {
  const p=profile(size);
  return <Box sx={{ height:'100%',border:`1px solid ${theme.border}`,borderRadius:1.5,overflow:'hidden',bgcolor:'#fbfcff',display:'grid',gridTemplateRows:'28px 1fr' }}><Box sx={{ px:1,display:'flex',alignItems:'center',gap:.45,borderBottom:`1px solid ${theme.border}`,bgcolor:'#f5f7fb' }}>{[0,1,2].map(i=><Box key={i} sx={{ width:6,height:6,borderRadius:'50%',bgcolor:i===0?'#ef4444':i===1?'#f59e0b':'#22c55e' }}/>)}</Box><Box sx={{ display:'grid',placeItems:'center',textAlign:'center',px:2 }}><Box><Typography sx={{ fontSize:p.large?18:14,fontWeight:850 }}>{label(locale,'External content','محتوای خارجی')}</Typography><Typography sx={{ mt:.4,fontSize:10.5,color:theme.muted }}>iframe / embedded app / HTML canvas</Typography></Box></Box></Box>;
}

function MaterialScada({ theme, size }: Props) {
  const p=profile(size);
  return <Box sx={{ height:'100%',minHeight:0,display:'grid',gridTemplateRows:p.large?'minmax(0,1fr) auto':'1fr',gap:1,direction:'ltr' }}>
    <Box sx={{ minHeight:0,position:'relative' }}><svg viewBox="0 0 620 260" width="100%" height="100%">
      <defs><marker id="flowArrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill={theme.accent}/></marker></defs>
      <rect x="25" y="62" width="130" height="128" rx="9" fill={`${theme.accent}0e`} stroke={theme.border}/><text x="90" y="111" textAnchor="middle" fill={theme.foreground} fontSize="15" fontWeight="700">TANK 01</text><text x="90" y="143" textAnchor="middle" fill={theme.accent} fontSize="26" fontWeight="800">63%</text><text x="90" y="164" textAnchor="middle" fill={theme.muted} fontSize="11">1,260 L</text>
      <line x1="155" y1="126" x2="248" y2="126" stroke="#1f2937" strokeWidth="7"/><line x1="175" y1="126" x2="228" y2="126" stroke={theme.accent} strokeWidth="2" markerEnd="url(#flowArrow)"/>
      <circle cx="285" cy="126" r="35" fill="#fff" stroke={theme.accent2} strokeWidth="4"/><text x="285" y="122" textAnchor="middle" fill={theme.foreground} fontSize="13" fontWeight="800">PUMP</text><text x="285" y="140" textAnchor="middle" fill="#16a34a" fontSize="10" fontWeight="800">RUNNING</text>
      <line x1="320" y1="126" x2="412" y2="126" stroke="#1f2937" strokeWidth="7"/><line x1="340" y1="126" x2="392" y2="126" stroke={theme.accent} strokeWidth="2" markerEnd="url(#flowArrow)"/>
      <rect x="412" y="78" width="138" height="96" rx="9" fill={`${theme.accent}0c`} stroke={theme.border}/><text x="481" y="116" textAnchor="middle" fill={theme.foreground} fontSize="14" fontWeight="700">VALVE V-02</text><text x="481" y="142" textAnchor="middle" fill={theme.accent} fontSize="14" fontWeight="800">OPEN · 82%</text>
      <text x="220" y="94" textAnchor="middle" fill={theme.muted} fontSize="10">18.4 L/min</text><text x="360" y="94" textAnchor="middle" fill={theme.muted} fontSize="10">2.6 bar</text>
    </svg></Box>
    {p.large&&<Box sx={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:.7}}><StatBox label="FLOW" value="18.4 L/min" theme={theme} accent/><StatBox label="PRESSURE" value="2.6 bar" theme={theme}/><StatBox label="PUMP" value="1.82 A" theme={theme}/><StatBox label="VALVE" value="OPEN" theme={theme}/></Box>}
  </Box>;
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
