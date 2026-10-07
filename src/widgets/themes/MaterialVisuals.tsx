import { useMemo, useState } from 'react';
import { Box, Button, Slider, TextField, Typography } from '@mui/material';
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

function HistoryStrip({ values, theme, active = '#16a34a', warning = '#d97706', danger = '#dc2626', height = 8 }: { values: number[]; theme: WidgetThemeTokens; active?: string; warning?: string; danger?: string; height?: number }) {
  return <Box sx={{ display:'grid', gridTemplateColumns:`repeat(${values.length},minmax(0,1fr))`, gap:.38 }}>
    {values.map((v,i)=><Box key={i} sx={{ height, borderRadius:.65, bgcolor:v>=2?danger:v===1?warning:v===0?active:`${theme.muted}45` }} />)}
  </Box>;
}

function StateHistoryPanel({ title, values, theme, active, warning, danger, rightText = '24h', footer }: { title: string; values: number[]; theme: WidgetThemeTokens; active?: string; warning?: string; danger?: string; rightText?: string; footer?: string }) {
  return <Box sx={{ minHeight:0, height:'100%', border:`1px solid ${theme.border}`, borderRadius:1.5, p:1, bgcolor:'#fbfcff', display:'grid', gridTemplateRows:'auto minmax(24px,1fr) auto', gap:.75 }}>
    <Box sx={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:1 }}><Typography sx={{fontSize:9.8,color:theme.muted}}>{title}</Typography><Typography sx={{fontSize:9.8,fontWeight:800,color:active ?? theme.muted}}>{rightText}</Typography></Box>
    <Box sx={{ alignSelf:'center' }}><HistoryStrip values={values} theme={theme} active={active} warning={warning} danger={danger} height={22}/></Box>
    <Box sx={{ display:'flex', justifyContent:'space-between', color:theme.muted }}><Typography sx={{fontSize:9}}>00:00</Typography><Typography sx={{fontSize:9}}>{footer ?? 'now'}</Typography></Box>
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
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" width="100%" height="100%" aria-hidden style={{display:'block'}}>
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
    return <Box sx={{ height:'100%', minHeight:0, overflow:'hidden', display:'grid', gridTemplateRows:'auto auto minmax(0,1fr)', gap:.45, direction:'ltr' }}>
      <Box sx={{ display:'flex', alignItems:'baseline', gap:.5, minHeight:0 }}>
        <Typography sx={{ fontSize:32, lineHeight:.9, fontWeight:850, letterSpacing:'-.05em' }}>{value}</Typography>
        <Typography sx={{ fontSize:11.5, fontWeight:750, color:theme.muted }}>{unit}</Typography>
      </Box>
      <Box sx={{ minHeight:0 }}><ToneBadge text={`${positive ? '↑' : '↓'} ${Math.abs(trend)}% · 24h`} tone={tone} theme={theme} /></Box>
      <Box sx={{ minHeight:0, overflow:'hidden', borderTop:`1px solid ${theme.border}`, pt:.35 }}>
        <ChartSvg values={values} color={theme.accent} fill minHeight={0} />
      </Box>
    </Box>;
  }

  if (p.wide && !p.large) {
    return <Box sx={{ height:'100%', minHeight:0, overflow:'hidden', display:'grid', gridTemplateColumns:'minmax(122px,.72fr) minmax(0,1.5fr)', gap:1.05, direction:'ltr', alignItems:'stretch' }}>
      <Box sx={{ minWidth:0, minHeight:0, display:'grid', alignContent:'center', gap:.65, pr:.15 }}>
        <Typography sx={{ fontSize:33, lineHeight:.9, fontWeight:850, letterSpacing:'-.05em', whiteSpace:'nowrap' }}>
          {value}<Box component="span" sx={{ ml:.5, fontSize:12, color:theme.muted, fontWeight:750 }}>{unit}</Box>
        </Typography>
        <Box><ToneBadge text={`${positive ? '↑' : '↓'} ${Math.abs(trend)}%`} tone={tone} theme={theme} /></Box>
        <Progress value={value} max={max} theme={theme} />
      </Box>
      <Box sx={{ minWidth:0, minHeight:0, overflow:'hidden', borderLeft:`1px solid ${theme.border}`, pl:1.05, display:'grid', gridTemplateRows:'auto minmax(0,1fr)', gap:.2 }}>
        <Box sx={{ display:'flex', justifyContent:'space-between', color:theme.muted }}>
          <Typography sx={{ fontSize:9.8 }}>{label(locale,'24h trend','روند ۲۴ ساعت')}</Typography>
          <Typography sx={{ fontSize:9.8 }}>{label(locale,'now','اکنون')}</Typography>
        </Box>
        <Box sx={{ minHeight:0, overflow:'hidden' }}><ChartSvg values={values} color={theme.accent} fill minHeight={0} /></Box>
      </Box>
    </Box>;
  }

  const minValue = Math.round(value * .82 * 10) / 10;
  const avgValue = Math.round(value * .96 * 10) / 10;
  const peakValue = Math.round(value * 1.12 * 10) / 10;
  return <Box sx={{ height:'100%', minHeight:0, overflow:'hidden', display:'grid', gridTemplateRows:'auto auto minmax(0,1fr)', gap:1.05, direction:'ltr' }}>
    <Box sx={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:1 }}>
      <Box>
        <Typography sx={{ fontSize:44, lineHeight:.9, fontWeight:850, letterSpacing:'-.05em' }}>{value}<Box component="span" sx={{ ml:.6, fontSize:14, color:theme.muted, fontWeight:750 }}>{unit}</Box></Typography>
        <Box sx={{ mt:.8 }}><ToneBadge text={`${positive ? '↑' : '↓'} ${Math.abs(trend)}% · ${label(locale,'vs previous 24h','نسبت به ۲۴ ساعت قبل')}`} tone={tone} theme={theme} /></Box>
      </Box>
      <Box sx={{ minWidth:116 }}>
        <Typography sx={{ fontSize:10.5, color:theme.muted, mb:.65 }}>{label(locale,'Current range','بازه فعلی')}</Typography>
        <Progress value={value} max={max} theme={theme} />
      </Box>
    </Box>
    <Box sx={{ display:'grid', gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:.7 }}>
      <StatBox label={label(locale,'Min','کمینه')} value={`${minValue}${unit}`} theme={theme} />
      <StatBox label={label(locale,'Average','میانگین')} value={`${avgValue}${unit}`} theme={theme} accent />
      <StatBox label={label(locale,'Peak','بیشینه')} value={`${peakValue}${unit}`} theme={theme} />
    </Box>
    <Box sx={{ minHeight:0, overflow:'hidden', border:`1px solid ${theme.border}`, borderRadius:1.5, p:.9, bgcolor:'#fbfcff' }}>
      <ChartSvg values={values} color={theme.accent} fill minHeight={0} />
    </Box>
  </Box>;
}

function RadialGauge({ value, max, unit, theme, size, tone }: { value: number; max: number; unit: string; theme: WidgetThemeTokens; size: number; tone: string }) {
  const pct = clamp(value / Math.max(1, max), 0, 1);
  const r = 44;
  const c = 2 * Math.PI * r;
  return <Box sx={{ width: size, height: size, position: 'relative', flex: '0 0 auto' }}>
    <svg viewBox="0 0 120 120" width="100%" height="100%" style={{display:'block'}}>
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
      <RadialGauge value={value} max={max} unit={unit} theme={theme} size={118} tone={tone}/>
    </Box>;
  }

  if (p.wide && !p.large) {
    return <Box sx={{ height:'100%', display:'grid', gridTemplateColumns:'126px minmax(0,1fr)', gap:1.3, alignItems:'center', direction:'ltr' }}>
      <RadialGauge value={value} max={max} unit={unit} theme={theme} size={116} tone={tone}/>
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
  return <Box sx={{ height:'100%', display:'grid', gridTemplateRows:'auto minmax(92px,1fr) auto', gap:1, direction:'ltr' }}>
    <Box sx={{ display:'grid', gridTemplateColumns:'164px minmax(0,1fr)', alignItems:'center', gap:1.4 }}>
      <Box sx={{ display:'grid', placeItems:'center' }}><RadialGauge value={value} max={max} unit={unit} theme={theme} size={158} tone={tone}/></Box>
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
      <ChartSvg values={history} color={tone} fill minHeight={80}/>
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
  return <Box sx={{ height:'100%', minHeight:0, overflow:'hidden', display:'grid', gridTemplateRows:'auto minmax(0,1fr)', gap:1.0, direction:'ltr' }}>
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

  if (p.tall) return <Box sx={{ height:'100%', display:'grid', gridTemplateRows:'auto minmax(122px,1fr) auto', gap:1, direction:'ltr' }}>
    <Box sx={{ textAlign:'center' }}><Typography sx={{ fontSize:35, lineHeight:1, fontWeight:850 }}>{value}%</Typography><Typography sx={{ mt:.3, color:theme.muted, fontSize:11 }}>{liters} {label(locale,'stored','موجود')}</Typography></Box>
    <Box sx={{ minHeight:0, display:'grid', gridTemplateColumns:'1fr 42px', alignItems:'center', justifyItems:'center', gap:.8, px:.5 }}>
      <TankShape width={84} height={136}/>
      <Box sx={{ height:136, display:'flex', flexDirection:'column', justifyContent:'space-between', color:theme.muted, textAlign:'right' }}><Typography sx={{fontSize:9}}>100%</Typography><Typography sx={{fontSize:9}}>50%</Typography><Typography sx={{fontSize:9}}>0%</Typography></Box>
    </Box>
    <Box sx={{ display:'grid', gap:.7 }}><Progress value={value} theme={theme}/><Box sx={{ width:'100%', display:'grid', gridTemplateColumns:'1fr 1fr', gap:.55 }}><StatBox label={label(locale,'Capacity','ظرفیت')} value="2,000 L" theme={theme}/><StatBox label={label(locale,'Free','خالی')} value="740 L" theme={theme}/></Box></Box>
  </Box>;

  if (p.wide && !p.large) return <Box sx={{ height:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:1.8, direction:'ltr' }}><TankShape/><Box><Typography sx={{ fontSize:34, fontWeight:850 }}>{value}%</Typography><Typography sx={{ color:theme.muted, fontSize:11 }}>{liters}</Typography><Box sx={{ mt:.8, width:150 }}><Progress value={value} theme={theme}/></Box></Box></Box>;

  const trend=[72,70,69,67,65,66,64,63,61,62,63,63];
  return <Box sx={{ height:'100%', minHeight:0, overflow:'hidden', display:'grid', gridTemplateRows:'auto minmax(0,1fr)', gap:1.0, direction:'ltr' }}>
    <Box sx={{ display:'grid', gridTemplateColumns:'130px 1fr', alignItems:'center', gap:1.5 }}><Box sx={{ display:'grid', placeItems:'center' }}><TankShape width={88} height={126}/></Box><Box><Typography sx={{ fontSize:40, lineHeight:1, fontWeight:850 }}>{value}%</Typography><Typography sx={{ mt:.35, color:theme.muted }}>{liters} {label(locale,'stored','موجود')}</Typography><Box sx={{ mt:.9 }}><Progress value={value} theme={theme}/></Box><Box sx={{ mt:.9, display:'grid', gridTemplateColumns:'1fr 1fr', gap:.7 }}><StatBox label={label(locale,'Capacity','ظرفیت')} value="2,000 L" theme={theme}/><StatBox label={label(locale,'Available','فضای خالی')} value="740 L" theme={theme}/></Box></Box></Box>
    <Box sx={{ minHeight:0, border:`1px solid ${theme.border}`, borderRadius:1.5, p:.85, bgcolor:'#fbfcff' }}><Box sx={{ display:'flex', justifyContent:'space-between', mb:.3 }}><Typography sx={{ fontSize:9.8, color:theme.muted }}>{label(locale,'Level trend','روند سطح')}</Typography><Typography sx={{ fontSize:9.8, color:theme.muted }}>24h</Typography></Box><ChartSvg values={trend} color={theme.accent} fill minHeight={0}/></Box>
  </Box>;
}


function MaterialBoolean({ def, theme, locale, size }: Props) {
  const p = profile(size);
  const [on, setOn] = useState(Boolean(def.mock.value ?? true));
  const Icon = def.icon;
  const text = on ? label(locale,'Active','فعال') : label(locale,'Inactive','غیرفعال');
  const color = on ? '#16a34a' : '#64748b';
  const history = on ? [0,0,0,0,-1,0,0,0] : [-1,-1,-1,0,-1,-1,-1,-1];

  if (p.compact) return <Box sx={{ height:'100%', display:'grid', placeItems:'center' }}><Box onClick={()=>setOn(v=>!v)} sx={{ cursor:'pointer', textAlign:'center' }}><Box sx={{ width:66,height:66,mx:'auto',borderRadius:1.5,bgcolor:`${color}0c`,border:`1px solid ${color}20`,display:'grid',placeItems:'center' }}><Icon sx={{fontSize:31,color}}/></Box><Typography sx={{ mt:.65,fontSize:13,fontWeight:850,color }}>{text}</Typography></Box></Box>;

  if (!p.large) return <Box sx={{ height:'100%', display:'grid', gridTemplateColumns:'102px 1fr', alignItems:'center', gap:1.4 }}><Box onClick={()=>setOn(v=>!v)} sx={{cursor:'pointer',display:'grid',placeItems:'center'}}><Box sx={{ width:76,height:76,borderRadius:1.75,bgcolor:`${color}0c`,border:`1px solid ${color}20`,display:'grid',placeItems:'center' }}><Icon sx={{fontSize:35,color}}/></Box></Box><Box><ToneBadge text={text} tone={on?'success':'neutral'} theme={theme}/><Typography sx={{ mt:.75,fontSize:10.5,color:theme.muted }}>{label(locale,'Click state to toggle demo','برای تغییر وضعیت نمونه کلیک کنید')}</Typography></Box></Box>;

  return <Box sx={{ height:'100%', display:'grid', gridTemplateRows:'auto auto minmax(86px,1fr)', gap:1.05 }}>
    <Box sx={{ display:'grid', gridTemplateColumns:'112px 1fr', gap:1.4, alignItems:'center' }}><Box onClick={()=>setOn(v=>!v)} sx={{ cursor:'pointer', display:'grid', placeItems:'center' }}><Box sx={{ width:92,height:92,borderRadius:2,bgcolor:`${color}0c`,border:`1px solid ${color}20`,display:'grid',placeItems:'center' }}><Icon sx={{fontSize:44,color}}/></Box></Box><Box><ToneBadge text={text} tone={on?'success':'neutral'} theme={theme}/><Typography sx={{ mt:.7,fontSize:20,fontWeight:850 }}>{on?label(locale,'Device operating normally','دستگاه در حال کار عادی است'):label(locale,'Device is inactive','دستگاه غیرفعال است')}</Typography><Typography sx={{ mt:.35,fontSize:10.5,color:theme.muted }}>{label(locale,'Tap the state icon to toggle the demo.','برای تغییر وضعیت نمونه روی آیکون کلیک کنید.')}</Typography></Box></Box>
    <Box sx={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:.7 }}><StatBox label={label(locale,'Since','از زمان')} value="09:14" theme={theme}/><StatBox label={label(locale,'Uptime','آپ‌تایم')} value="18h 42m" theme={theme}/><StatBox label={label(locale,'Packets','بسته‌ها')} value="1,284" theme={theme} accent/></Box>
    <StateHistoryPanel title={label(locale,'Recent availability','دسترس‌پذیری اخیر')} values={history} theme={theme} active={color} rightText="98.7%" />
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

  if (p.compact) return <Box sx={{ height:'100%', display:'grid', placeItems:'center' }}><Box sx={{ textAlign:'center' }}><Box sx={{ width:70,height:70,mx:'auto',borderRadius:1.75,display:'grid',placeItems:'center',bgcolor:`${color}0c`,border:`1px solid ${color}20` }}><Icon sx={{fontSize:35,color}}/></Box><Typography sx={{ mt:.65,fontSize:12.5,fontWeight:850,color }}>{state}</Typography></Box></Box>;

  if (!p.large) return <Box sx={{ height:'100%', display:'grid', gridTemplateColumns:'108px 1fr', alignItems:'center', gap:1.4 }}><Box sx={{display:'grid',placeItems:'center'}}><Box sx={{ width:82,height:82,borderRadius:2,display:'grid',placeItems:'center',bgcolor:`${color}0c`,border:`1px solid ${color}20` }}><Icon sx={{fontSize:39,color}}/></Box></Box><Box><ToneBadge text={state} tone={tone} theme={theme}/><Typography sx={{ mt:.75,fontSize:11,color:theme.muted }}>{active?label(locale,'Immediate attention required','نیازمند بررسی فوری'):label(locale,'Sensor is reporting normal state','سنسور وضعیت عادی گزارش می‌کند')}</Typography></Box></Box>;

  const timeline = active ? [0,0,1,0,2,1,0,2] : [0,0,0,-1,0,0,0,0];
  return <Box sx={{ height:'100%', display:'grid', gridTemplateRows:'auto auto minmax(86px,1fr)', gap:1.05 }}>
    <Box sx={{ display:'grid', gridTemplateColumns:'112px 1fr', gap:1.4, alignItems:'center' }}><Box sx={{display:'grid',placeItems:'center'}}><Box sx={{ width:92,height:92,borderRadius:2,display:'grid',placeItems:'center',bgcolor:`${color}0c`,border:`1px solid ${color}20` }}><Icon sx={{fontSize:46,color}}/></Box></Box><Box><ToneBadge text={state} tone={tone} theme={theme}/><Typography sx={{ mt:.7,fontSize:20,fontWeight:850 }}>{active?label(locale,'Immediate attention required','نیازمند بررسی فوری'):label(locale,'Area is clear','محدوده در وضعیت عادی است')}</Typography><Typography sx={{ mt:.35,fontSize:10.5,color:theme.muted }}>{active?label(locale,'Review the alarm source and acknowledge after inspection.','منبع هشدار را بررسی و پس از بازدید تأیید کنید.'):label(locale,'No active safety condition is detected.','هیچ وضعیت ایمنی فعالی تشخیص داده نشده است.')}</Typography></Box></Box>
    <Box sx={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:.7 }}><StatBox label={label(locale,'Last event','آخرین رخداد')} value={active?'09:42':'Yesterday'} theme={theme}/><StatBox label={label(locale,'Zone','زون')} value="Floor 2" theme={theme}/><StatBox label={label(locale,'Severity','شدت')} value={active?severity.toUpperCase():'CLEAR'} theme={theme} accent/></Box>
    <StateHistoryPanel title={label(locale,'Recent event history','تاریخچه رخداد اخیر')} values={timeline} theme={theme} active="#16a34a" warning="#d97706" danger="#dc2626" rightText="24h" footer={label(locale,'now','اکنون')} />
  </Box>;
}

function MaterialLineChart({ def, theme, size, locale }: Props) {
  const p = profile(size);
  const values = (def.mock.values as number[] | undefined) ?? spark;
  const summary = s(def.mock.summary, '24.8 °C');
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((a,b)=>a+b,0) / Math.max(1, values.length);

  if (p.veryWide && !p.large) {
    return <Box sx={{ height:'100%', minHeight:0, overflow:'hidden', display:'grid', gridTemplateColumns:'146px minmax(0,1fr)', gap:1, direction:'ltr', alignItems:'stretch' }}>
      <Box sx={{ minWidth:0, minHeight:0, display:'grid', alignContent:'center', gap:.45 }}>
        <Typography sx={{ fontSize:25, fontWeight:850, lineHeight:.95, whiteSpace:'nowrap' }}>{summary}</Typography>
        <ToneBadge text="24h" tone="neutral" theme={theme}/>
        <Box sx={{ display:'flex', gap:.75, alignItems:'baseline', flexWrap:'wrap' }}>
          <Typography sx={{fontSize:9.2,color:theme.muted}}>{label(locale,'Min','کمینه')} <Box component="span" sx={{fontWeight:800,color:theme.foreground}}>{min.toFixed(1)}</Box></Typography>
          <Typography sx={{fontSize:9.2,color:theme.muted}}>{label(locale,'Avg','میانگین')} <Box component="span" sx={{fontWeight:800,color:theme.accent}}>{avg.toFixed(1)}</Box></Typography>
          <Typography sx={{fontSize:9.2,color:theme.muted}}>{label(locale,'Max','بیشینه')} <Box component="span" sx={{fontWeight:800,color:theme.foreground}}>{max.toFixed(1)}</Box></Typography>
        </Box>
      </Box>
      <Box sx={{ minWidth:0, minHeight:0, overflow:'hidden', borderLeft:`1px solid ${theme.border}`, pl:1, display:'grid', gridTemplateRows:'minmax(0,1fr) auto', gap:.25 }}>
        <Box sx={{ minHeight:0, overflow:'hidden' }}><ChartSvg values={values} color={theme.accent} fill={def.visual === 'area'} minHeight={0}/></Box>
        <Box sx={{ display:'flex', justifyContent:'space-between', color:theme.muted }}>{['00','06','12','18','24'].map(t=><Typography key={t} sx={{fontSize:8.5}}>{t}</Typography>)}</Box>
      </Box>
    </Box>;
  }

  return <Box sx={{ height:'100%', minHeight:0, overflow:'hidden', display:'grid', gridTemplateRows:'auto minmax(0,1fr) auto', gap:.55, direction:'ltr' }}>
    <Box sx={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:1 }}><Typography sx={{ fontSize:p.large?28:23, fontWeight:850 }}>{summary}</Typography><ToneBadge text="24h" tone="neutral" theme={theme}/></Box>
    <Box sx={{ minHeight:0, overflow:'hidden' }}><ChartSvg values={values} color={theme.accent} fill={def.visual === 'area'} minHeight={0}/></Box>
    <Box sx={{ display:'flex', justifyContent:'space-between', color:theme.muted }}>{['00','06','12','18','24'].map(t=><Typography key={t} sx={{fontSize:9.2}}>{t}</Typography>)}</Box>
  </Box>;
}

function MaterialBar({ def, theme, size, locale }: Props) {
  const p = profile(size);
  const values = (def.mock.values as number[] | undefined) ?? bars;
  const total = values.reduce((a,b)=>a+b,0);
  const max = Math.max(...values);
  const avg = total / Math.max(1, values.length);
  const dayLabels=['M','T','W','T','F','S','S'];

  const barsVisual = <Box sx={{ height:'100%', minHeight:0, overflow:'hidden', display:'grid', gridTemplateRows:'minmax(0,1fr) auto', gap:.35 }}>
    <Box sx={{ minHeight:0, display:'flex', alignItems:'end', gap:p.large?1:.65, px:.25 }}>{values.map((v,i)=><Box key={i} sx={{ flex:1,minWidth:0,height:`${Math.max(12,v)}%`,borderRadius:'4px 4px 1px 1px',bgcolor:i===values.length-2?theme.accent2:theme.accent,opacity:i===values.length-2?1:.72 }}/>)}</Box>
    <Box sx={{ display:'flex',justifyContent:'space-between',color:theme.muted }}>{dayLabels.map((x,i)=><Typography key={i} sx={{fontSize:8.5}}>{x}</Typography>)}</Box>
  </Box>;

  if (p.veryWide && !p.large) return <Box sx={{ height:'100%', minHeight:0, overflow:'hidden', display:'grid', gridTemplateColumns:'148px minmax(0,1fr)', gap:1, direction:'ltr' }}>
    <Box sx={{ minHeight:0, display:'grid', alignContent:'center', gap:.45 }}>
      <Typography sx={{fontSize:9.3,color:theme.muted,textTransform:'uppercase',letterSpacing:.3}}>{label(locale,'7 day total','مجموع ۷ روز')}</Typography>
      <Typography sx={{fontSize:25,fontWeight:850,lineHeight:.95}}>{Math.round(total)}</Typography>
      <Box sx={{display:'flex',gap:.85,flexWrap:'wrap'}}>
        <Typography sx={{fontSize:9.2,color:theme.muted}}>{label(locale,'Avg','میانگین')} <Box component="span" sx={{fontWeight:850,color:theme.foreground}}>{avg.toFixed(1)}</Box></Typography>
        <Typography sx={{fontSize:9.2,color:theme.muted}}>{label(locale,'Peak','بیشینه')} <Box component="span" sx={{fontWeight:850,color:theme.accent}}>{max}</Box></Typography>
      </Box>
    </Box>
    <Box sx={{ minWidth:0,minHeight:0,overflow:'hidden',borderLeft:`1px solid ${theme.border}`,pl:1 }}>{barsVisual}</Box>
  </Box>;

  return <Box sx={{ height:'100%',minHeight:0,overflow:'hidden',display:'grid',gridTemplateRows:'auto minmax(0,1fr)',gap:.55,direction:'ltr' }}><Box sx={{display:'flex',justifyContent:'space-between'}}><Typography sx={{fontSize:12,fontWeight:800}}>{s(def.mock.summary,'Weekly total')}</Typography><Typography sx={{fontSize:10,color:theme.muted}}>7d</Typography></Box>{barsVisual}</Box>;
}

function MaterialHistogram({ theme, size, locale }: Props) {
  const p = profile(size);
  const values = [2,5,9,15,20,17,12,8,4,2];
  const histogram = <Box sx={{ height:'100%',minHeight:0,overflow:'hidden',display:'flex',alignItems:'end',gap:.25 }}>{values.map((v,i)=><Box key={i} sx={{ flex:1,height:`${v*4.5}%`,minHeight:4,bgcolor:theme.accent,opacity:.26+(v/20)*.74,borderRadius:'3px 3px 0 0' }}/>)}</Box>;
  if (p.veryWide && !p.large) return <Box sx={{ height:'100%',minHeight:0,overflow:'hidden',display:'grid',gridTemplateColumns:'148px minmax(0,1fr)',gap:1,direction:'ltr' }}>
    <Box sx={{ minHeight:0,display:'grid',alignContent:'center',gap:.4 }}>
      <Typography sx={{fontSize:9.3,color:theme.muted,textTransform:'uppercase',letterSpacing:.3}}>{label(locale,'Distribution','توزیع')}</Typography>
      <Box sx={{display:'flex',alignItems:'baseline',gap:.45}}><Typography sx={{fontSize:25,fontWeight:850,lineHeight:.95}}>124</Typography><Typography sx={{fontSize:9.3,color:theme.muted}}>{label(locale,'samples','نمونه')}</Typography></Box>
      <Box sx={{display:'flex',gap:.85,flexWrap:'wrap'}}>
        <Typography sx={{fontSize:9.2,color:theme.muted}}>{label(locale,'Median','میانه')} <Box component="span" sx={{fontWeight:850,color:theme.foreground}}>12.4</Box></Typography>
        <Typography sx={{fontSize:9.2,color:theme.muted}}>{label(locale,'Peak bin','بازه پرتکرار')} <Box component="span" sx={{fontWeight:850,color:theme.accent}}>18–24</Box></Typography>
      </Box>
    </Box>
    <Box sx={{ minWidth:0,minHeight:0,overflow:'hidden',borderLeft:`1px solid ${theme.border}`,pl:1 }}>{histogram}</Box>
  </Box>;
  return <Box sx={{ height:'100%',minHeight:0,overflow:'hidden',display:'grid',gridTemplateRows:'auto minmax(0,1fr)',gap:.6,direction:'ltr' }}><Typography sx={{fontSize:12,fontWeight:800}}>{label(locale,'Distribution','توزیع')}</Typography>{histogram}</Box>;
}

function MaterialDonut({ def, theme, locale, size }: Props) {
  const p = profile(size);
  const value = n(def.mock.value, 72);
  const c = 2 * Math.PI * 42;
  const ringSize = p.compact ? 118 : p.wide && !p.large ? 108 : p.large ? 156 : 138;
  const ring = <Box sx={{ width:ringSize, height:ringSize, position:'relative', flex:'0 0 auto' }}>
    <svg viewBox="0 0 120 120" width="100%" height="100%" style={{display:'block'}}>
      <circle cx="60" cy="60" r="42" fill="none" stroke="#edf0f5" strokeWidth="12"/>
      <circle cx="60" cy="60" r="42" fill="none" stroke={theme.accent} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${c*value/100} ${c}`} transform="rotate(-90 60 60)"/>
    </svg>
    <Box sx={{ position:'absolute', inset:0, display:'grid', placeItems:'center', textAlign:'center' }}>
      <Box><Typography sx={{ fontSize:p.compact?25:27,fontWeight:850 }}>{value}%</Typography><Typography sx={{ fontSize:9.5,color:theme.muted }}>{label(locale,'Used','مصرف')}</Typography></Box>
    </Box>
  </Box>;

  if (p.compact) return <Box sx={{ height:'100%', minHeight:0, overflow:'hidden', display:'grid', placeItems:'center' }}>{ring}</Box>;

  if (p.wide && !p.large) return <Box sx={{ height:'100%', minHeight:0, overflow:'hidden', display:'grid', gridTemplateColumns:'132px minmax(0,1fr)', gap:1.15, alignItems:'center', direction:'ltr' }}>
    <Box sx={{display:'grid',placeItems:'center'}}>{ring}</Box>
    <Box sx={{display:'grid',gap:.55}}>
      <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:1}}><Typography sx={{fontSize:9.5,color:theme.muted}}>{label(locale,'Used','مصرف')}</Typography><Typography sx={{fontSize:14,fontWeight:850,color:theme.accent}}>{value}%</Typography></Box>
      <Progress value={value} theme={theme}/>
      <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:1}}><Typography sx={{fontSize:9.5,color:theme.muted}}>{label(locale,'Free','آزاد')}</Typography><Typography sx={{fontSize:13,fontWeight:800}}>{100-value}%</Typography></Box>
    </Box>
  </Box>;

  if (!p.large) return <Box sx={{ height:'100%', minHeight:0, overflow:'hidden', display:'grid', placeItems:'center' }}>{ring}</Box>;

  return <Box sx={{ height:'100%', minHeight:0, overflow:'hidden', display:'grid', gridTemplateRows:'minmax(0,1fr) auto', gap:.95, direction:'ltr' }}>
    <Box sx={{ minHeight:0, display:'grid', gridTemplateColumns:'166px 1fr', alignItems:'center', gap:1.35 }}>
      <Box sx={{display:'grid',placeItems:'center'}}>{ring}</Box>
      <Box sx={{display:'grid',gap:.7}}><StatBox label={label(locale,'Used','مصرف')} value={`${value}%`} theme={theme} accent/><StatBox label={label(locale,'Free','آزاد')} value={`${100-value}%`} theme={theme}/><StatBox label={label(locale,'Total','کل')} value="100%" theme={theme}/></Box>
    </Box>
    <Box sx={{ border:`1px solid ${theme.border}`, borderRadius:1.5, p:.85, bgcolor:'#fbfcff' }}>
      <Box sx={{display:'flex',justifyContent:'space-between',mb:.6}}><Typography sx={{fontSize:9.6,color:theme.muted}}>{label(locale,'Allocation','تقسیم‌بندی')}</Typography><Typography sx={{fontSize:9.6,color:theme.muted}}>{label(locale,'3 groups','۳ گروه')}</Typography></Box>
      <Box sx={{display:'grid',gridTemplateColumns:'44% 28% 28%',height:9,borderRadius:1,overflow:'hidden',gap:.25}}><Box sx={{bgcolor:theme.accent}}/><Box sx={{bgcolor:theme.accent2}}/><Box sx={{bgcolor:'#cbd5e1'}}/></Box>
      <Box sx={{mt:.55,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:.7}}><Typography sx={{fontSize:9.2,color:theme.muted}}>{label(locale,'Primary 44%','اصلی ۴۴٪')}</Typography><Typography sx={{fontSize:9.2,color:theme.muted}}>{label(locale,'Aux 28%','کمکی ۲۸٪')}</Typography><Typography sx={{fontSize:9.2,color:theme.muted}}>{label(locale,'Other 28%','سایر ۲۸٪')}</Typography></Box>
    </Box>
  </Box>;
}

function MaterialHeatmap({ theme, size }: Props) {
  const p = profile(size);
  return <Box sx={{ height:'100%',display:'grid',gridTemplateRows:'minmax(0,1fr) auto',gap:.65 }}>
    <Box sx={{ minHeight:0,display:'grid',gridTemplateColumns:'repeat(7,1fr)',gridTemplateRows:`repeat(${heat.length},1fr)`,gap:p.large?.7:.45 }}>
      {heat.flat().map((v,i)=>{ const alpha=.10+clamp(v,0,1)*.84; return <Box key={i} sx={{minHeight:16,borderRadius:.6,bgcolor:`rgba(79,70,229,${alpha})`,border:'1px solid rgba(79,70,229,.10)'}}/>; })}
    </Box>
    <Box sx={{ display:'grid',gridTemplateColumns:'1fr auto',gap:1,alignItems:'end' }}>
      <Box sx={{display:'flex',justifyContent:'space-between',color:theme.muted}}>{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day=><Typography key={day} sx={{fontSize:9}}>{p.compact?day[0]:day}</Typography>)}</Box>
      {p.large&&<Box sx={{display:'flex',alignItems:'center',gap:.5}}><Typography sx={{fontSize:8.8,color:theme.muted}}>low</Typography><Box sx={{width:56,height:7,borderRadius:.8,background:'linear-gradient(90deg,rgba(79,70,229,.12),rgba(79,70,229,.92))'}}/><Typography sx={{fontSize:8.8,color:theme.muted}}>high</Typography></Box>}
    </Box>
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

function MaterialMap({ def, theme, size }: Props) {
  const p = profile(size);
  const isRoute = def.visual === 'route';
  const map = <Box sx={{ height:'100%',borderRadius:1.25,overflow:'hidden',position:'relative',border:`1px solid ${theme.border}`,background:'#f7f8fb' }}>
    <svg viewBox="0 0 300 180" width="100%" height="100%" preserveAspectRatio="none" style={{position:'absolute',inset:0,display:'block'}}>
      <rect width="300" height="180" fill="#f7f8fb"/>
      <path d="M-15 45 C55 20 92 58 160 38 S255 24 322 56" fill="none" stroke="#dce4ed" strokeWidth="15"/>
      <path d="M36 -10 C65 48 34 94 75 196" fill="none" stroke="#e2e8f0" strokeWidth="10"/>
      <path d="M230 -10 C205 38 226 92 190 196" fill="none" stroke="#e5eaf1" strokeWidth="9"/>
      <path d="M-10 136 C55 110 106 132 158 113 S245 98 314 128" fill="none" stroke="#dfe6ee" strokeWidth="7"/>
      {p.large&&<><rect x="96" y="60" width="34" height="22" rx="3" fill="#eef2f7"/><rect x="156" y="68" width="27" height="18" rx="3" fill="#eef2f7"/><rect x="235" y="105" width="32" height="21" rx="3" fill="#eef2f7"/></>}
      <path d="M10 125 C55 80 95 82 136 118 S224 156 290 92" fill="none" stroke={theme.accent} strokeWidth={p.large?4:3.2} strokeLinecap="round"/>
      {[{x:72,y:96},{x:134,y:118},{x:214,y:126}].map((pt,i)=><g key={i}><circle cx={pt.x} cy={pt.y} r="9" fill={theme.accent} opacity=".13"/><circle cx={pt.x} cy={pt.y} r="5" fill={theme.accent}/></g>)}
      {p.large&&<><text x="116" y="33" fill="#94a3b8" fontSize="8">Industrial Ave</text><text x="214" y="82" fill="#94a3b8" fontSize="8">North Rd</text></>}
    </svg>
    <Box sx={{position:'absolute',left:10,bottom:10}}><ToneBadge text="3 devices" tone="accent" theme={theme}/></Box>
    {p.large&&<Box sx={{position:'absolute',right:10,top:10,px:.8,py:.45,borderRadius:1,bgcolor:'rgba(255,255,255,.88)',border:`1px solid ${theme.border}`}}><Typography sx={{fontSize:9.5,color:theme.muted}}>12.4 km route</Typography></Box>}
  </Box>;

  if (p.h < 3) return map;
  return <Box sx={{height:'100%',display:'grid',gridTemplateRows:'minmax(0,1fr) auto',gap:.85,direction:'ltr'}}>{map}<Box sx={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:.7}}><StatBox label={isRoute?'DISTANCE':'DEVICES'} value={isRoute?'12.4 km':'3 online'} theme={theme} accent/><StatBox label={isRoute?'ETA':'UPDATED'} value={isRoute?'18 min':'38 sec'} theme={theme}/><StatBox label={isRoute?'AVG SPEED':'ZONE'} value={isRoute?'42 km/h':'Factory A'} theme={theme}/></Box></Box>;
}

function MaterialCoordinates({ def, theme, locale, size }: Props) {
  const p = profile(size);
  const lat=s(def.mock.lat,'35.7219° N'); const lng=s(def.mock.lng,'51.3347° E'); const accuracy=s(def.mock.accuracy,'4.2 m');
  if (p.compact) return <Box sx={{ height:'100%', display:'grid', gridTemplateRows:'repeat(3,1fr)', alignContent:'center', direction:'ltr', borderTop:`1px solid ${theme.border}`, borderBottom:`1px solid ${theme.border}` }}>
    {[['LAT',lat],['LNG',lng],[label(locale,'Accuracy','دقت'),accuracy]].map(([k,v],i)=><Box key={k} sx={{ display:'grid', gridTemplateColumns:'64px 1fr', alignItems:'center', gap:.8, px:.65, borderBottom:i<2?`1px solid ${theme.border}`:'none' }}><Typography sx={{fontSize:9,color:theme.muted,fontWeight:800,letterSpacing:.3}}>{k}</Typography><Typography sx={{fontSize:12,fontWeight:850,color:i===2?theme.accent:theme.foreground}}>{v}</Typography></Box>)}
  </Box>;
  if (p.wide && !p.large) return <Box sx={{ height:'100%', display:'grid', gridTemplateColumns:'1fr 1fr 112px', alignItems:'stretch', gap:.7, direction:'ltr' }}>
    <StatBox label="LATITUDE" value={lat} theme={theme}/><StatBox label="LONGITUDE" value={lng} theme={theme}/><Box sx={{border:`1px solid ${theme.accent}20`,borderRadius:1.5,bgcolor:`${theme.accent}0c`,display:'grid',placeItems:'center',textAlign:'center',px:.8}}><Box><Typography sx={{fontSize:9,color:theme.muted,fontWeight:800}}>{label(locale,'ACCURACY','دقت')}</Typography><Typography sx={{mt:.35,fontSize:15,fontWeight:850,color:theme.accent}}>{accuracy}</Typography><Typography sx={{mt:.2,fontSize:9,color:'#16a34a',fontWeight:800}}>GPS FIX</Typography></Box></Box>
  </Box>;
  if (!p.large) return <Box sx={{ height:'100%', display:'grid', gridTemplateRows:'repeat(3,1fr)', alignContent:'center', direction:'ltr' }}>
    {[['LAT',lat],['LNG',lng],[label(locale,'Accuracy','دقت'),accuracy]].map(([k,v],i)=><Box key={k} sx={{ display:'grid', gridTemplateColumns:'72px 1fr', alignItems:'center', gap:1, px:.8, borderBottom:i<2?`1px solid ${theme.border}`:'none' }}><Typography sx={{fontSize:9.5,color:theme.muted,fontWeight:800,letterSpacing:.3}}>{k}</Typography><Typography sx={{fontSize:12.5,fontWeight:850,color:i===2?theme.accent:theme.foreground}}>{v}</Typography></Box>)}
  </Box>;
  return <Box sx={{ height:'100%', display:'grid', gridTemplateRows:'minmax(0,1fr) auto', gap:1, direction:'ltr' }}>
    <Box sx={{ minHeight:0, borderRadius:1.5, border:`1px solid ${theme.border}`, bgcolor:'#f7f8fb', position:'relative', overflow:'hidden' }}>
      <svg viewBox="0 0 420 220" width="100%" height="100%" preserveAspectRatio="none" style={{display:'block'}}>
        <rect width="420" height="220" fill="#f7f8fb"/>
        <path d="M-20 58 C92 25 178 72 445 36" fill="none" stroke="#dce4ed" strokeWidth="18"/>
        <path d="M112 -20 C150 54 92 125 146 250" fill="none" stroke="#e2e8f0" strokeWidth="12"/>
        <path d="M332 -18 C290 54 330 132 278 246" fill="none" stroke="#e5eaf1" strokeWidth="11"/>
        <path d="M-18 175 C106 130 216 170 446 116" fill="none" stroke="#dfe6ee" strokeWidth="10"/>
        <circle cx="250" cy="126" r="34" fill={theme.accent} opacity=".10"/>
        <circle cx="250" cy="126" r="10" fill="#fff" stroke={theme.accent} strokeWidth="5"/>
        <text x="160" y="45" fill="#94a3b8" fontSize="11">Industrial Ave</text>
        <text x="298" y="104" fill="#94a3b8" fontSize="11">North Rd</text>
      </svg>
      <Box sx={{ position:'absolute', left:10, top:10 }}><ToneBadge text={label(locale,'GPS fixed','GPS متصل')} tone="success" theme={theme}/></Box>
      <Box sx={{ position:'absolute', right:10, bottom:10, px:.8, py:.45, bgcolor:'rgba(255,255,255,.92)', border:`1px solid ${theme.border}`, borderRadius:1 }}><Typography sx={{fontSize:9.5,color:theme.muted}}>± {accuracy}</Typography></Box>
    </Box>
    <Box sx={{ display:'grid', gridTemplateColumns:'1.15fr 1.15fr .8fr', gap:.7 }}><StatBox label="LATITUDE" value={lat} theme={theme}/><StatBox label="LONGITUDE" value={lng} theme={theme}/><StatBox label={label(locale,'Accuracy','دقت')} value={accuracy} theme={theme} accent/></Box>
  </Box>;
}

function MaterialCompass({ def, theme, locale, size }: Props) {
  const p = profile(size);
  const value = n(def.mock.value,327);
  const cardinal = value >= 337.5 || value < 22.5 ? 'N' : value < 67.5 ? 'NE' : value < 112.5 ? 'E' : value < 157.5 ? 'SE' : value < 202.5 ? 'S' : value < 247.5 ? 'SW' : value < 292.5 ? 'W' : 'NW';
  const CompassFace = ({dia}:{dia:number}) => {
    const pointerAngle=value-90; const rad=pointerAngle*Math.PI/180; const radius=dia*.36; const cx=dia/2; const cy=dia/2; const px=cx+Math.cos(rad)*radius; const py=cy+Math.sin(rad)*radius;
    return <Box sx={{ width:dia,height:dia,borderRadius:'50%',border:`1px solid ${theme.border}`,bgcolor:'#fbfcff',position:'relative',display:'grid',placeItems:'center',boxShadow:'inset 0 0 0 8px #fff' }}>
      <Box sx={{position:'absolute',inset:14,borderRadius:'50%',border:'1px dashed #d9deea'}}/>
      {['N','E','S','W'].map((x,i)=><Typography key={x} sx={{position:'absolute',fontSize:11,color:x==='N'?theme.accent:theme.muted,fontWeight:x==='N'?850:650,top:i===0?8:i===2?undefined:'50%',bottom:i===2?8:undefined,left:i===3?10:i===1?undefined:'50%',right:i===1?10:undefined,transform:i===0||i===2?'translateX(-50%)':i===1||i===3?'translateY(-50%)':undefined}}>{x}</Typography>)}
      <Box sx={{position:'absolute',left:px-6,top:py-6,width:12,height:12,transform:`rotate(${value}deg)`,color:theme.accent}}><Box sx={{width:0,height:0,borderLeft:'6px solid transparent',borderRight:'6px solid transparent',borderBottom:`12px solid ${theme.accent}`}}/></Box>
      <Box sx={{width:dia>180?96:72,height:dia>180?64:50,borderRadius:1.5,bgcolor:'#fff',border:`1px solid ${theme.border}`,display:'grid',placeItems:'center',textAlign:'center',boxShadow:'0 4px 12px rgba(15,23,42,.04)'}}><Box><Typography sx={{fontSize:dia>180?34:25,fontWeight:850,lineHeight:1}}>{value}°</Typography><Typography sx={{fontSize:9.5,color:theme.muted,mt:.25}}>{cardinal}</Typography></Box></Box>
    </Box>;
  };
  if(p.compact) return <Box sx={{height:'100%',display:'grid',placeItems:'center',direction:'ltr'}}><CompassFace dia={132}/></Box>;
  if(p.wide && !p.large) return <Box sx={{height:'100%',display:'grid',gridTemplateColumns:'142px minmax(0,1fr)',alignItems:'center',gap:1.15,direction:'ltr'}}><Box sx={{display:'grid',placeItems:'center'}}><CompassFace dia={128}/></Box><Box sx={{display:'grid',gap:.55,minWidth:0}}><Box sx={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:.55}}><StatBox label={label(locale,'Heading','جهت')} value={`${value}°`} theme={theme} accent/><StatBox label={label(locale,'Direction','جهت اصلی')} value={cardinal} theme={theme}/></Box><Box sx={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:.7,px:.9,py:.55,border:`1px solid ${theme.border}`,borderRadius:1.25,bgcolor:'#fbfcff'}}><ToneBadge text={label(locale,'GPS heading','جهت GPS')} tone="success" theme={theme}/><Typography sx={{fontSize:9.5,color:theme.muted,whiteSpace:'nowrap'}}>±2°</Typography></Box></Box></Box>;
  if(!p.large) return <Box sx={{height:'100%',display:'grid',placeItems:'center',direction:'ltr'}}><CompassFace dia={168}/></Box>;
  return <Box sx={{height:'100%',display:'grid',gridTemplateRows:'minmax(0,1fr) auto',gap:1,direction:'ltr'}}><Box sx={{minHeight:0,display:'grid',placeItems:'center'}}><CompassFace dia={252}/></Box><Box sx={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:.7}}><StatBox label={label(locale,'Heading','جهت')} value={`${value}°`} theme={theme} accent/><StatBox label={label(locale,'Direction','جهت اصلی')} value={cardinal} theme={theme}/><StatBox label={label(locale,'Accuracy','دقت')} value="±2°" theme={theme}/></Box></Box>;
}

function MaterialButton({ def, theme, locale, size }: Props) {
  const p=profile(size); const [sent,setSent]=useState(false); const Icon=def.icon;
  const trigger=()=>{setSent(true);setTimeout(()=>setSent(false),1100)};
  if (p.compact) return <Box sx={{ height:'100%',display:'grid',gridTemplateRows:'1fr auto',gap:.9 }}>
    <Box sx={{display:'grid',gridTemplateColumns:'54px 1fr',gap:1,alignItems:'center'}}><Box sx={{width:54,height:54,borderRadius:1.5,bgcolor:`${theme.accent}0c`,border:`1px solid ${theme.accent}20`,display:'grid',placeItems:'center',color:theme.accent}}><Icon sx={{fontSize:26}}/></Box><Box><ToneBadge text={sent?label(locale,'Queued','در صف'):label(locale,'Ready','آماده')} tone={sent?'success':'neutral'} theme={theme}/><Typography sx={{mt:.55,fontSize:10.5,color:theme.muted}}>RPC · 5s timeout</Typography></Box></Box>
    <Button fullWidth variant="contained" onClick={trigger} sx={{ height:36,borderRadius:1.25,textTransform:'none',fontWeight:800,boxShadow:'none' }}>{label(locale,'Send command','ارسال فرمان')}</Button>
  </Box>;
  if (!p.large) return <Box sx={{ height:'100%',display:'grid',gridTemplateColumns:'1fr 142px',alignItems:'center',gap:1.4 }}><Box><Typography sx={{ fontSize:18,fontWeight:850 }}>{label(locale,'Device command','فرمان دستگاه')}</Typography><Typography sx={{ mt:.35,fontSize:11,color:theme.muted }}>{label(locale,'Send a predefined RPC/downlink action to this device.','ارسال فرمان از پیش تعریف‌شده به دستگاه.')}</Typography></Box><Box sx={{ textAlign:'center' }}><Button fullWidth variant="contained" onClick={trigger} sx={{ borderRadius:1.25,textTransform:'none',fontWeight:800,boxShadow:'none' }}>{label(locale,'Send command','ارسال فرمان')}</Button><Typography sx={{ mt:.6,fontSize:10.5,color:sent?'#16a34a':theme.muted }}>{sent?label(locale,'Command queued','فرمان در صف قرار گرفت'):label(locale,'Ready','آماده')}</Typography></Box></Box>;
  return <Box sx={{ height:'100%',display:'grid',gridTemplateRows:'auto auto minmax(74px,1fr) auto',gap:1 }}>
    <Box><Typography sx={{ fontSize:22,fontWeight:850 }}>{label(locale,'Device command','فرمان دستگاه')}</Typography><Typography sx={{ mt:.35,fontSize:11,color:theme.muted }}>{label(locale,'Send a predefined RPC/downlink action to this device.','ارسال فرمان از پیش تعریف‌شده به دستگاه.')}</Typography></Box>
    <Box sx={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:.7 }}><StatBox label="TARGET" value="Device" theme={theme}/><StatBox label="TIMEOUT" value="5 sec" theme={theme}/><StatBox label="METHOD" value="RPC" theme={theme} accent/></Box>
    <Box sx={{ minHeight:0,border:`1px solid ${theme.border}`,borderRadius:1.5,p:1,bgcolor:'#fbfcff',display:'grid',gridTemplateColumns:'1fr auto',alignItems:'center',gap:1 }}><Box><Typography sx={{fontSize:10,color:theme.muted}}>{label(locale,'Last execution','آخرین اجرا')}</Typography><Typography sx={{mt:.25,fontSize:14,fontWeight:850}}>09:41:32 · ACK</Typography><Typography sx={{mt:.25,fontSize:10,color:theme.muted}}>{label(locale,'Round trip 182 ms','زمان رفت‌وبرگشت ۱۸۲ ms')}</Typography></Box><ToneBadge text={sent?label(locale,'Queued','در صف'):label(locale,'Ready','آماده')} tone={sent?'success':'neutral'} theme={theme}/></Box>
    <Button fullWidth variant="contained" onClick={trigger} sx={{ height:42,borderRadius:1.25,textTransform:'none',fontWeight:850,boxShadow:'none' }}>{sent?label(locale,'Queued','در صف'):label(locale,'Send command','ارسال فرمان')}</Button>
  </Box>;
}

function MaterialToggle({ checked, onChange, theme, scale = 'md' }: { checked: boolean; onChange: (value:boolean)=>void; theme: WidgetThemeTokens; scale?: 'sm'|'md'|'lg' }) {
  const dims = scale === 'lg' ? { w:64, h:36, knob:28, pad:4 } : scale === 'sm' ? { w:48, h:28, knob:20, pad:4 } : { w:54, h:30, knob:22, pad:4 };
  return <Box component="button" type="button" role="switch" aria-checked={checked} onClick={()=>onChange(!checked)} sx={{
    width:dims.w,height:dims.h,p:0,border:0,borderRadius:99,position:'relative',cursor:'pointer',outline:'none',flex:'0 0 auto',
    bgcolor:checked?theme.accent:'#cfd5df',transition:'background-color .18s ease',boxShadow:`inset 0 0 0 1px ${checked?theme.accent:theme.border}`,
    '&:focus-visible':{boxShadow:`0 0 0 3px ${theme.accent}22, inset 0 0 0 1px ${theme.accent}`}
  }}>
    <Box sx={{ position:'absolute',top:dims.pad,left:checked?dims.w-dims.knob-dims.pad:dims.pad,width:dims.knob,height:dims.knob,borderRadius:'50%',bgcolor:'#fff',boxShadow:'0 1px 4px rgba(15,23,42,.24)',transition:'left .18s ease' }}/>
  </Box>;
}

function MaterialSwitch({ def, theme, locale, size }: Props) {
  const p=profile(size); const [checked,setChecked]=useState(Boolean(def.mock.value ?? true)); const Icon=def.icon;
  const semantic = def.id === 'door-lock'
    ? { on:label(locale,'Locked','قفل'), off:label(locale,'Unlocked','باز'), action:label(locale,'Door access','دسترسی درب'), running:label(locale,'Secured','ایمن') }
    : def.id === 'siren'
      ? { on:label(locale,'Beacon active','چراغ هشدار فعال'), off:label(locale,'Beacon standby','چراغ هشدار آماده'), action:label(locale,'Safety output','خروجی ایمنی'), running:label(locale,'Attention','هشدار') }
      : { on:label(locale,'Output enabled','خروجی فعال'), off:label(locale,'Output disabled','خروجی غیرفعال'), action:label(locale,'Relay output','خروجی رله'), running:label(locale,'Running','در حال کار') };
  const stateText = checked ? semantic.on : semantic.off;
  if(p.compact) return <Box sx={{ height:'100%',display:'grid',gridTemplateRows:'1fr auto',gap:.7 }}>
    <Box sx={{display:'grid',gridTemplateColumns:'72px 1fr',alignItems:'center',gap:1}}><Box sx={{width:68,height:68,borderRadius:1.75,bgcolor:checked?`${theme.accent}0c`:'#f8fafc',border:`1px solid ${checked?`${theme.accent}22`:theme.border}`,display:'grid',placeItems:'center',color:checked?theme.accent:theme.muted}}><Icon sx={{fontSize:34}}/></Box><Box sx={{display:'grid',justifyItems:'end',gap:.4}}><MaterialToggle checked={checked} onChange={setChecked} theme={theme} scale="sm"/><ToneBadge text={checked?'ON':'OFF'} tone={checked?'success':'neutral'} theme={theme}/></Box></Box>
    <Box><Typography sx={{fontSize:15,fontWeight:850,color:checked?theme.accent:theme.foreground}}>{stateText}</Typography><Typography sx={{mt:.15,fontSize:10,color:theme.muted}}>{semantic.action}</Typography></Box>
  </Box>;
  if(!p.large) return <Box sx={{ height:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',gap:1.4 }}><Box><Typography sx={{ fontSize:20,fontWeight:850 }}>{stateText}</Typography><Typography sx={{ mt:.3,fontSize:11,color:theme.muted }}>{semantic.action}</Typography></Box><MaterialToggle checked={checked} onChange={setChecked} theme={theme}/></Box>;
  return <Box sx={{ height:'100%',display:'grid',gridTemplateRows:'auto auto minmax(86px,1fr)',gap:1.05 }}>
    <Box sx={{ display:'flex',alignItems:'center',justifyContent:'space-between',gap:2 }}><Box><Typography sx={{fontSize:26,fontWeight:850}}>{stateText}</Typography><Typography sx={{mt:.3,fontSize:11,color:theme.muted}}>{semantic.action}</Typography><Box sx={{mt:.8}}><ToneBadge text={checked?semantic.running:label(locale,'Stopped','متوقف')} tone={checked?'success':'neutral'} theme={theme}/></Box></Box><MaterialToggle checked={checked} onChange={setChecked} theme={theme} scale="lg"/></Box>
    <Box sx={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:.7}}><StatBox label={label(locale,'Last change','آخرین تغییر')} value="09:42" theme={theme}/><StatBox label={label(locale,'Source','منبع')} value="Dashboard" theme={theme}/><StatBox label={label(locale,'State','وضعیت')} value={checked?'ON':'OFF'} theme={theme} accent/></Box>
    <StateHistoryPanel title={label(locale,'Recent state history','تاریخچه وضعیت اخیر')} values={checked?[0,0,0,-1,0,0,0,0]:[-1,-1,0,-1,-1,-1,0,-1]} theme={theme} active={theme.accent} />
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
  if(p.compact) return <Box sx={{height:'100%',display:'grid',gridTemplateRows:'auto auto',gap:1,alignContent:'center'}}><Box sx={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}><Box><Typography sx={{fontSize:9.5,color:theme.muted}}>{label(locale,'Current','فعلی')}</Typography><Typography sx={{mt:.2,fontSize:18,fontWeight:850,direction:'ltr'}}>{def.mock.value ?? '22.5'}{unit}</Typography></Box><ToneBadge text={label(locale,'Setpoint','نقطه تنظیم')} tone="neutral" theme={theme}/></Box><TextField value={value} onChange={e=>setValue(e.target.value)} label={label(locale,'Target value','مقدار هدف')} size="small" fullWidth inputProps={{dir:'ltr'}} sx={{ '& .MuiOutlinedInput-root':{borderRadius:1.25},'& .MuiOutlinedInput-notchedOutline':{borderColor:theme.border} }}/></Box>;
  if(!p.large) return <Box sx={{ height:'100%',display:'grid',gridTemplateColumns:'1fr 104px',gap:1,alignItems:'center' }}><TextField value={value} onChange={e=>setValue(e.target.value)} label={label(locale,'Target value','مقدار هدف')} size="small" fullWidth inputProps={{dir:'ltr'}} sx={{ '& .MuiOutlinedInput-root':{borderRadius:1.25},'& .MuiOutlinedInput-notchedOutline':{borderColor:theme.border} }}/><Box><Typography sx={{fontSize:9.5,color:theme.muted}}>{label(locale,'Current','فعلی')}</Typography><Typography sx={{mt:.25,fontSize:18,fontWeight:850,direction:'ltr'}}>{def.mock.value ?? '22.5'}{unit}</Typography></Box></Box>;
  return <Box sx={{ height:'100%',display:'grid',gridTemplateRows:'auto auto minmax(82px,1fr) auto',gap:1.05 }}>
    <Box sx={{ display:'grid',gridTemplateColumns:'1fr 120px',gap:.8,alignItems:'end' }}><TextField value={value} onChange={e=>{setValue(e.target.value);setApplied(false)}} label={label(locale,'Target value','مقدار هدف')} size="small" fullWidth inputProps={{dir:'ltr'}} sx={{ '& .MuiOutlinedInput-root':{borderRadius:1.25},'& .MuiOutlinedInput-notchedOutline':{borderColor:theme.border} }}/><Button variant="contained" onClick={()=>setApplied(true)} sx={{ height:40,borderRadius:1.25,textTransform:'none',fontWeight:800,boxShadow:'none' }}>{label(locale,'Apply','اعمال')}</Button></Box>
    <Box sx={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:.7 }}><StatBox label={label(locale,'Current','فعلی')} value={`${def.mock.value ?? '22.5'}${unit}`} theme={theme}/><StatBox label={label(locale,'Pending','در انتظار')} value={`${value}${unit}`} theme={theme} accent/><StatBox label={label(locale,'Allowed','مجاز')} value="16–30°C" theme={theme}/></Box>
    <Box sx={{ minHeight:0,border:`1px solid ${theme.border}`,borderRadius:1.5,bgcolor:'#fbfcff',overflow:'hidden' }}><Box sx={{px:1,py:.7,borderBottom:`1px solid ${theme.border}`,fontSize:10,color:theme.muted,fontWeight:800}}>{label(locale,'Recent changes','تغییرات اخیر')}</Box>{[['09:42','22.5°C','Dashboard'],['08:15','21.0°C','Schedule'],['06:00','20.0°C','Automation']].map((r,i)=><Box key={r[0]} sx={{display:'grid',gridTemplateColumns:'70px 1fr 1fr',gap:1,px:1,py:.8,borderBottom:i<2?`1px solid ${theme.border}`:'none'}}>{r.map((c,j)=><Typography key={j} sx={{fontSize:10.5,fontWeight:j===1?800:600,color:j===0?theme.muted:theme.foreground}}>{c}</Typography>)}</Box>)}</Box>
    <Typography sx={{fontSize:10.5,color:applied?'#16a34a':theme.muted}}>{applied?label(locale,'Command queued successfully','فرمان با موفقیت در صف قرار گرفت'):label(locale,'Enter a value, review it, then apply.','مقدار را وارد، بررسی و سپس اعمال کنید.')}</Typography>
  </Box>;
}

function MaterialThermostat({ def, theme, locale, size }: Props) {
  const p=profile(size); const [value,setValue]=useState(n(def.mock.value,22));

  const dial = (dia:number) => <Box sx={{ width:dia,height:dia,borderRadius:'50%',border:`9px solid ${theme.accent}18`,boxShadow:`inset 0 0 0 1px ${theme.border}`,display:'grid',placeItems:'center',flex:'0 0 auto' }}><Box sx={{textAlign:'center'}}><Typography sx={{fontSize:dia>=130?34:30,fontWeight:850,lineHeight:1}}>{value}°</Typography><Typography sx={{fontSize:9.5,color:theme.muted,mt:.3}}>SETPOINT</Typography>{dia<130&&<Typography sx={{fontSize:9,color:theme.accent,fontWeight:800,mt:.25}}>AUTO</Typography>}</Box></Box>;

  if(p.compact) return <Box sx={{ height:'100%',minHeight:0,overflow:'hidden',display:'grid',placeItems:'center',direction:'ltr' }}>{dial(118)}</Box>;

  if(!p.large) return <Box sx={{ height:'100%',minHeight:0,overflow:'hidden',display:'grid',gridTemplateColumns:'132px minmax(0,1fr)',alignItems:'center',gap:1.3,direction:'ltr' }}><Box sx={{display:'grid',placeItems:'center'}}>{dial(122)}</Box><Box sx={{minWidth:0,minHeight:0,display:'grid',alignContent:'center'}}><Typography sx={{fontSize:10.5,color:theme.muted}}>{label(locale,'Target temperature','دمای هدف')}</Typography><Slider min={16} max={30} value={value} onChange={(_,v)=>setValue(v as number)} sx={{color:theme.accent,my:.15}}/><Box sx={{display:'flex',gap:.55,flexWrap:'wrap'}}><ToneBadge text="AUTO" tone="accent" theme={theme}/><ToneBadge text="24.8°C room" tone="neutral" theme={theme}/></Box></Box></Box>;

  return <Box sx={{ height:'100%',minHeight:0,overflow:'hidden',display:'grid',gridTemplateRows:'134px minmax(0,1fr)',gap:.95,direction:'ltr' }}>
    <Box sx={{ minHeight:0,display:'grid',gridTemplateColumns:'138px minmax(0,1fr)',gap:1.25,alignItems:'center' }}>
      <Box sx={{display:'grid',placeItems:'center'}}>{dial(126)}</Box>
      <Box sx={{minWidth:0,display:'grid',alignContent:'center',gap:.45}}>
        <Typography sx={{fontSize:10.5,color:theme.muted}}>{label(locale,'Target temperature','دمای هدف')}</Typography>
        <Slider min={16} max={30} value={value} onChange={(_,v)=>setValue(v as number)} sx={{color:theme.accent,my:.05}}/>
        <Box sx={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:.55}}>
          <StatBox label={label(locale,'Room','اتاق')} value="24.8°C" theme={theme}/>
          <StatBox label={label(locale,'Mode','حالت')} value="Auto" theme={theme} accent/>
          <StatBox label={label(locale,'Humidity','رطوبت')} value="46%" theme={theme}/>
        </Box>
      </Box>
    </Box>
    <Box sx={{ minHeight:0,overflow:'hidden',border:`1px solid ${theme.border}`,borderRadius:1.5,p:.85,bgcolor:'#fbfcff',display:'grid',gridTemplateRows:'auto minmax(0,1fr)',gap:.3 }}>
      <Box sx={{display:'flex',justifyContent:'space-between',gap:1}}><Typography sx={{fontSize:9.7,color:theme.muted}}>{label(locale,'Room temperature trend','روند دمای اتاق')}</Typography><Typography sx={{fontSize:9.7,color:theme.muted}}>24h</Typography></Box>
      <Box sx={{minHeight:0,overflow:'hidden'}}><ChartSvg values={[23.8,24,24.1,24.4,24.6,24.8,24.7,24.8]} color={theme.accent} fill minHeight={0}/></Box>
    </Box>
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
  const p=profile(size); const [active,setActive]=useState('•');
  const keys=['↑','←','•','→','↓'];

  const makePad = (button:number) => <Box sx={{display:'grid',gridTemplateColumns:`repeat(3,${button}px)`,gridTemplateRows:`repeat(3,${button}px)`,gap:.5}}>{keys.map((k,i)=>{const pos=[2,4,5,6,8][i];return <Button key={k} onClick={()=>setActive(k)} sx={{gridColumn:((pos-1)%3)+1,gridRow:Math.floor((pos-1)/3)+1,minWidth:0,width:button,height:button,p:0,borderRadius:1.15,border:`1px solid ${active===k?theme.accent:theme.border}`,color:active===k?'#fff':theme.foreground,bgcolor:active===k?theme.accent:'#fff',fontSize:button>=58?18:14,'&:hover':{bgcolor:active===k?theme.accent:`${theme.accent}08`}}}>{k}</Button>})}</Box>;

  if(p.compact) return <Box sx={{height:'100%',minHeight:0,overflow:'hidden',display:'grid',placeItems:'center',direction:'ltr'}}>{makePad(43)}</Box>;

  if(p.wide && !p.large) return <Box sx={{height:'100%',minHeight:0,overflow:'hidden',display:'grid',gridTemplateColumns:'132px minmax(0,1fr)',gap:1.15,alignItems:'center',direction:'ltr'}}>
    <Box sx={{display:'grid',placeItems:'center'}}>{makePad(36)}</Box>
    <Box sx={{minWidth:0,display:'grid',gap:.45,alignContent:'center'}}>
      <ToneBadge text={label(locale,'Motion ready','حرکت آماده')} tone="success" theme={theme}/>
      <Box sx={{display:'flex',justifyContent:'space-between',gap:1,alignItems:'baseline'}}><Typography sx={{fontSize:9.5,color:theme.muted}}>{label(locale,'Last command','آخرین فرمان')}</Typography><Typography sx={{fontSize:13,fontWeight:850,color:theme.accent}}>{active}</Typography></Box>
      <Box sx={{display:'flex',justifyContent:'space-between',gap:1,alignItems:'baseline'}}><Typography sx={{fontSize:9.5,color:theme.muted}}>{label(locale,'Speed','سرعت')}</Typography><Typography sx={{fontSize:11.5,fontWeight:800}}>40%</Typography></Box>
    </Box>
  </Box>;

  if(!p.large) return <Box sx={{height:'100%',minHeight:0,overflow:'hidden',display:'grid',placeItems:'center',direction:'ltr'}}><Box>{makePad(50)}<Typography sx={{mt:.55,textAlign:'center',fontSize:9.5,color:theme.muted}}>{label(locale,'Last command','آخرین فرمان')}: {active}</Typography></Box></Box>;

  return <Box sx={{height:'100%',minHeight:0,overflow:'hidden',display:'grid',gridTemplateColumns:'224px minmax(0,1fr)',gap:1.4,alignItems:'center',direction:'ltr'}}><Box sx={{display:'grid',placeItems:'center'}}>{makePad(64)}</Box><Box sx={{minWidth:0}}><ToneBadge text={label(locale,'PTZ / motion ready','کنترل حرکت آماده')} tone="success" theme={theme}/><Box sx={{mt:.8,display:'grid',gap:.6}}><StatBox label={label(locale,'Last command','آخرین فرمان')} value={active} theme={theme} accent/><StatBox label={label(locale,'Speed','سرعت')} value="40%" theme={theme}/><StatBox label={label(locale,'Mode','حالت')} value={label(locale,'Momentary','لحظه‌ای')} theme={theme}/></Box><Box sx={{mt:.8,border:`1px solid ${theme.border}`,borderRadius:1.5,p:.8,bgcolor:'#fbfcff'}}><Typography sx={{fontSize:9.6,color:theme.muted,mb:.45}}>{label(locale,'Command activity','فعالیت فرمان')}</Typography><HistoryStrip values={[0,-1,0,0,-1,0,0,0]} theme={theme} active={theme.accent}/></Box></Box></Box>;
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
  if(p.compact) return <Box sx={{height:'100%',display:'grid',placeItems:'center',textAlign:'center'}}><Box><Typography sx={{fontSize:40,fontWeight:500,letterSpacing:'-.055em',direction:'ltr'}}>09:44</Typography><Typography sx={{mt:.35,fontSize:10.5,color:theme.muted}}>{locale==='fa'?'چهارشنبه، ۱۵ مهر':'Wednesday, Oct 7'}</Typography></Box></Box>;
  if(p.wide && !p.large) return <Box sx={{height:'100%',display:'grid',gridTemplateColumns:'1fr 1fr',alignItems:'center',gap:1.5,direction:'ltr'}}><Box><Typography sx={{fontSize:50,fontWeight:480,letterSpacing:'-.06em'}}>09:44</Typography><Typography sx={{fontSize:10.5,color:theme.muted}}>UTC +03:30</Typography></Box><Box sx={{borderLeft:`1px solid ${theme.border}`,pl:1.5}}><Typography sx={{fontSize:15,fontWeight:850}}>{locale==='fa'?'چهارشنبه':'Wednesday'}</Typography><Typography sx={{mt:.3,fontSize:11,color:theme.muted}}>{locale==='fa'?'۱۵ مهر ۱۴۰۵':'October 7, 2026'}</Typography><Box sx={{mt:.8}}><ToneBadge text="NTP synced" tone="success" theme={theme}/></Box></Box></Box>;
  if(!p.large) return <Box sx={{height:'100%',display:'grid',placeItems:'center',textAlign:'center'}}><Box><Typography sx={{fontSize:48,fontWeight:500,letterSpacing:'-.055em',direction:'ltr'}}>09:44</Typography><Typography sx={{mt:.35,fontSize:11,color:theme.muted}}>{locale==='fa'?'چهارشنبه، ۱۵ مهر ۱۴۰۵':'Wednesday, Oct 7'}</Typography></Box></Box>;
  return <Box sx={{height:'100%',display:'grid',gridTemplateRows:'minmax(0,1fr) auto auto',gap:1.05,direction:'ltr'}}>
    <Box sx={{minHeight:0,display:'grid',gridTemplateColumns:'1.25fr .75fr',alignItems:'center',gap:1.6}}><Box><Typography sx={{fontSize:72,fontWeight:450,letterSpacing:'-.065em',lineHeight:.95}}>09:44</Typography><Typography sx={{mt:.65,fontSize:14,fontWeight:800}}>{locale==='fa'?'چهارشنبه، ۱۵ مهر ۱۴۰۵':'Wednesday, October 7'}</Typography><Typography sx={{mt:.35,fontSize:10.5,color:theme.muted}}>Local time · UTC +03:30</Typography></Box><Box sx={{borderLeft:`1px solid ${theme.border}`,pl:1.5,display:'grid',gap:.8}}><ToneBadge text="NTP synced" tone="success" theme={theme}/><Box><Typography sx={{fontSize:9.5,color:theme.muted}}>NEXT SYNC</Typography><Typography sx={{mt:.2,fontSize:15,fontWeight:850}}>10:00</Typography></Box><Box><Typography sx={{fontSize:9.5,color:theme.muted}}>DAY</Typography><Typography sx={{mt:.2,fontSize:15,fontWeight:850}}>280 / 365</Typography></Box></Box></Box>
    <Box sx={{border:`1px solid ${theme.border}`,borderRadius:1.5,p:.9,bgcolor:'#fbfcff'}}><Box sx={{display:'flex',justifyContent:'space-between',mb:.55}}><Typography sx={{fontSize:9.8,color:theme.muted}}>{label(locale,'Day progress','پیشرفت روز')}</Typography><Typography sx={{fontSize:9.8,fontWeight:800}}>40.6%</Typography></Box><Progress value={9.73} max={24} theme={theme}/><Box sx={{mt:.5,display:'flex',justifyContent:'space-between',color:theme.muted}}><Typography sx={{fontSize:9}}>00</Typography><Typography sx={{fontSize:9}}>12</Typography><Typography sx={{fontSize:9}}>24</Typography></Box></Box>
    <Box sx={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:.7}}><StatBox label={label(locale,'Timezone','منطقه زمانی')} value="Local" theme={theme}/><StatBox label={label(locale,'Sync','همگام‌سازی')} value="NTP OK" theme={theme} accent/><StatBox label={label(locale,'Drift','انحراف')} value="< 12 ms" theme={theme}/></Box>
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
  return <Box sx={{ height:'100%',display:'grid',gridTemplateRows:'auto auto minmax(0,1fr)',gap:1.1,direction:locale==='fa'?'rtl':'ltr',textAlign:locale==='fa'?'right':'left' }}>
    <Box><Typography sx={{ fontSize:23,fontWeight:850 }}>{label(locale,'Server room status','وضعیت اتاق سرور')}</Typography><Typography sx={{ mt:.55,fontSize:12,color:theme.muted,lineHeight:1.75 }}>{label(locale,'All sensors are within their normal ranges. Latest telemetry was received less than a minute ago.','همه سنسورها در محدوده عادی هستند. آخرین بسته داده کمتر از یک دقیقه قبل دریافت شده است.')}</Typography></Box>
    <Box sx={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:.7,direction:'ltr' }}><StatBox label="SENSORS" value="12 online" theme={theme} accent/><StatBox label="LAST UPDATE" value="38 sec" theme={theme}/></Box>
    <Box sx={{ minHeight:0,border:`1px solid ${theme.border}`,borderRadius:1.25,overflow:'hidden',direction:'ltr',display:'grid',gridTemplateRows:'repeat(3,1fr)' }}>{checks.map(([name,value,color],i)=><Box key={name} sx={{ display:'grid',gridTemplateColumns:'1fr auto',gap:1,alignItems:'center',px:1.15,minHeight:0,borderBottom:i<checks.length-1?`1px solid ${theme.border}`:'none',bgcolor:i===0?'#fbfcff':'#fff' }}><Box sx={{ display:'flex',alignItems:'center',gap:.7 }}><Box sx={{ width:8,height:8,borderRadius:'50%',bgcolor:color }}/><Box><Typography sx={{ fontSize:11.5,fontWeight:800 }}>{name}</Typography><Typography sx={{mt:.15,fontSize:9.5,color:theme.muted}}>{label(locale,'Within configured range','در محدوده تنظیم‌شده')}</Typography></Box></Box><Typography sx={{ fontSize:12,fontWeight:850,color:theme.foreground }}>{value}</Typography></Box>)}</Box>
  </Box>;
}

function MaterialImage({ theme, size }: Props) {
  const p=profile(size);
  return <Box sx={{ height:'100%',minHeight:0,borderRadius:1.5,position:'relative',overflow:'hidden',background:'linear-gradient(180deg,#172033 0%,#0f172a 62%,#0b1220 100%)',border:`1px solid ${theme.border}` }}>
    <svg viewBox="0 0 520 280" width="100%" height="100%" preserveAspectRatio="none" style={{position:'absolute',inset:0,display:'block'}}>
      <defs><linearGradient id="floorGlow" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1f2b42"/><stop offset="1" stopColor="#0b1220"/></linearGradient></defs>
      <rect width="520" height="280" fill="url(#floorGlow)"/>
      <path d="M0 205 L520 205" stroke="#42516b" strokeWidth="2" opacity=".55"/>
      {[60,130,200,270,340,410,480].map(x=><path key={x} d={`M260 205 L${x} 280`} stroke="#334155" strokeWidth="1" opacity=".55"/>)}
      {[225,245,262].map(y=><path key={y} d={`M0 ${y} L520 ${y}`} stroke="#334155" strokeWidth="1" opacity=".45"/>)}
      <rect x="34" y="68" width="118" height="124" rx="4" fill="#1e293b" stroke="#475569"/><rect x="368" y="58" width="118" height="134" rx="4" fill="#1e293b" stroke="#475569"/>
      {[86,118,150].map(y=><g key={y}><line x1="44" y1={y} x2="142" y2={y} stroke="#64748b" strokeWidth="3"/><line x1="378" y1={y-6} x2="476" y2={y-6} stroke="#64748b" strokeWidth="3"/></g>)}
      <rect x="222" y="118" width="76" height="80" rx="5" fill="#263449" stroke="#64748b"/><rect x="236" y="132" width="48" height="28" rx="3" fill="#334155"/>
      <rect x="208" y="105" width="106" height="106" rx="8" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="7 5" opacity=".9"/>
      {p.large&&<><rect x="50" y="78" width="86" height="22" rx="3" fill="none" stroke="#f59e0b" strokeWidth="1.5" opacity=".75"/><rect x="386" y="70" width="82" height="23" rx="3" fill="none" stroke="#38bdf8" strokeWidth="1.5" opacity=".7"/></>}
    </svg>
    <Box sx={{ position:'absolute',left:10,top:9 }}><ToneBadge text="LIVE" tone="danger" theme={theme}/></Box>
    <Box sx={{ position:'absolute',right:10,top:9,px:.75,py:.4,borderRadius:1,bgcolor:'rgba(15,23,42,.72)',border:'1px solid rgba(255,255,255,.12)' }}><Typography sx={{fontSize:9,color:'#e2e8f0',fontWeight:700}}>CAM-02 · 09:44:12</Typography></Box>
    {p.large&&<Box sx={{position:'absolute',left:'41%',top:'38%',px:.7,py:.3,borderRadius:.8,bgcolor:'rgba(34,197,94,.88)'}}><Typography sx={{fontSize:8.5,color:'#fff',fontWeight:800}}>MOTION · PERSON</Typography></Box>}
    <Box sx={{ position:'absolute',left:10,right:10,bottom:8,display:'flex',justifyContent:'space-between',alignItems:'center',gap:1 }}><Typography sx={{fontSize:9.5,color:'#fff',fontWeight:700}}>Warehouse aisle · Camera snapshot</Typography><Typography sx={{fontSize:9,color:'#cbd5e1'}}>1080p · 18 fps</Typography></Box>
  </Box>;
}

function MaterialIframe({ theme, locale, size }: Props) {
  const p=profile(size);
  const browserBar = <Box sx={{px:1,height:28,display:'flex',alignItems:'center',gap:.45,borderBottom:`1px solid ${theme.border}`,bgcolor:'#f5f7fb'}}>{[0,1,2].map(i=><Box key={i} sx={{width:6,height:6,borderRadius:'50%',bgcolor:i===0?'#ef4444':i===1?'#f59e0b':'#22c55e'}}/>)}<Typography sx={{ml:1,fontSize:9,color:theme.muted,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>embedded-app.local/dashboard</Typography></Box>;
  if(p.compact) return <Box sx={{ height:'100%',minHeight:0,border:`1px solid ${theme.border}`,borderRadius:1.5,overflow:'hidden',bgcolor:'#fbfcff',display:'grid',gridTemplateRows:'28px minmax(0,1fr)' }}>{browserBar}<Box sx={{minHeight:0,display:'grid',placeItems:'center',textAlign:'center',px:2}}><Box><Typography sx={{fontSize:14,fontWeight:850}}>{label(locale,'External content','محتوای خارجی')}</Typography><Typography sx={{mt:.35,fontSize:10,color:theme.muted}}>iframe / HTML canvas</Typography></Box></Box></Box>;
  if(p.wide && !p.large) return <Box sx={{height:'100%',minHeight:0,border:`1px solid ${theme.border}`,borderRadius:1.5,overflow:'hidden',bgcolor:'#fff',display:'grid',gridTemplateRows:'28px minmax(0,1fr)'}}>{browserBar}<Box sx={{minHeight:0,overflow:'hidden',p:.8,display:'grid',gridTemplateColumns:'108px minmax(0,1fr)',gap:.8}}><Box sx={{minHeight:0,display:'grid',alignContent:'start',gap:.45}}><ToneBadge text="LIVE" tone="success" theme={theme}/><Typography sx={{fontSize:11,fontWeight:850}}>{label(locale,'Operations','عملیات')}</Typography><Typography sx={{fontSize:9.3,color:theme.muted}}>18 online · 2 alarms</Typography></Box><Box sx={{minHeight:0,overflow:'hidden',border:`1px solid ${theme.border}`,borderRadius:1,p:.4,bgcolor:'#fbfcff'}}><ChartSvg values={[32,38,35,48,51,46,58,62,60,72,68,76]} color={theme.accent} fill minHeight={0}/></Box></Box></Box>;
  return <Box sx={{height:'100%',minHeight:0,overflow:'hidden',border:`1px solid ${theme.border}`,borderRadius:1.5,bgcolor:'#fff',display:'grid',gridTemplateRows:'28px minmax(0,1fr)'}}>
    {browserBar}
    <Box sx={{minHeight:0,overflow:'hidden',display:'grid',gridTemplateColumns:'72px minmax(0,1fr)'}}>
      <Box sx={{minHeight:0,overflow:'hidden',borderRight:`1px solid ${theme.border}`,bgcolor:'#f8fafc',p:.65,display:'grid',alignContent:'start',gap:.4}}>{['Overview','Devices','Rules','Logs'].map((x,i)=><Box key={x} sx={{px:.6,py:.45,borderRadius:.75,bgcolor:i===0?`${theme.accent}10`:'transparent',color:i===0?theme.accent:theme.muted,fontSize:8.7,fontWeight:i===0?800:650,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{x}</Box>)}</Box>
      <Box sx={{minWidth:0,minHeight:0,overflow:'hidden',p:.8,display:'grid',gridTemplateRows:'22px 48px minmax(0,1fr)',gap:.6}}>
        <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:1,minWidth:0}}><Typography sx={{fontSize:11.5,fontWeight:850,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{label(locale,'Embedded operations view','نمای عملیاتی جاسازی‌شده')}</Typography><ToneBadge text="LIVE" tone="success" theme={theme}/></Box>
        <Box sx={{display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gap:.5,minHeight:0}}><StatBox label="ONLINE" value="18" theme={theme} accent/><StatBox label="ALARMS" value="2" theme={theme}/><StatBox label="LATENCY" value="84 ms" theme={theme}/></Box>
        <Box sx={{minHeight:0,overflow:'hidden',border:`1px solid ${theme.border}`,borderRadius:1,p:.55,bgcolor:'#fbfcff'}}><ChartSvg values={[32,38,35,48,51,46,58,62,60,72,68,76]} color={theme.accent} fill minHeight={0}/></Box>
      </Box>
    </Box>
  </Box>;
}

function MaterialScada({ theme, size }: Props) {
  const p=profile(size);
  const main = <Box sx={{ minHeight:0,position:'relative',border:p.large?`1px solid ${theme.border}`:'none',borderRadius:p.large?1.5:0,bgcolor:p.large?'#fbfcff':'transparent',overflow:'hidden' }}><svg viewBox="0 0 560 220" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{display:'block'}}>
      <defs><marker id="flowArrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto"><path d="M0,0 L0,6 L6,3 z" fill={theme.accent}/></marker></defs>
      <rect x="18" y="48" width="126" height="128" rx="10" fill={`${theme.accent}0e`} stroke={theme.border}/><text x="81" y="91" textAnchor="middle" fill={theme.foreground} fontSize="15" fontWeight="700">TANK 01</text><text x="81" y="124" textAnchor="middle" fill={theme.accent} fontSize="28" fontWeight="800">63%</text><text x="81" y="147" textAnchor="middle" fill={theme.muted} fontSize="11">1,260 L</text>
      <line x1="144" y1="112" x2="224" y2="112" stroke="#1f2937" strokeWidth="7"/><line x1="165" y1="112" x2="212" y2="112" stroke={theme.accent} strokeWidth="2" markerEnd="url(#flowArrow)"/>
      <circle cx="260" cy="112" r="36" fill="#fff" stroke={theme.accent2} strokeWidth="4"/><text x="260" y="108" textAnchor="middle" fill={theme.foreground} fontSize="13" fontWeight="800">PUMP</text><text x="260" y="128" textAnchor="middle" fill="#16a34a" fontSize="10" fontWeight="800">RUNNING</text>
      <line x1="296" y1="112" x2="380" y2="112" stroke="#1f2937" strokeWidth="7"/><line x1="317" y1="112" x2="368" y2="112" stroke={theme.accent} strokeWidth="2" markerEnd="url(#flowArrow)"/>
      <rect x="380" y="64" width="154" height="96" rx="10" fill={`${theme.accent}0c`} stroke={theme.border}/><text x="457" y="103" textAnchor="middle" fill={theme.foreground} fontSize="14" fontWeight="700">VALVE V-02</text><text x="457" y="132" textAnchor="middle" fill={theme.accent} fontSize="15" fontWeight="800">OPEN · 82%</text>
      <text x="184" y="80" textAnchor="middle" fill={theme.muted} fontSize="10">18.4 L/min</text><text x="338" y="80" textAnchor="middle" fill={theme.muted} fontSize="10">2.6 bar</text>
      {p.large&&<><circle cx="162" cy="112" r="3" fill={theme.accent}/><circle cx="326" cy="112" r="3" fill={theme.accent}/><text x="81" y="193" textAnchor="middle" fill={theme.muted} fontSize="9">LEVEL SENSOR</text><text x="260" y="176" textAnchor="middle" fill={theme.muted} fontSize="9">MOTOR M-01</text><text x="457" y="178" textAnchor="middle" fill={theme.muted} fontSize="9">ACTUATOR</text></>}
    </svg></Box>;
  if(!p.large) return <Box sx={{height:'100%',direction:'ltr'}}>{main}</Box>;
  if(p.h>=3) return <Box sx={{height:'100%',minHeight:0,display:'grid',gridTemplateRows:'minmax(210px,.72fr) minmax(104px,.28fr) auto',gap:1,direction:'ltr'}}>
    {main}
    <Box sx={{minHeight:0,display:'grid',gridTemplateColumns:'1fr 1fr',gap:.8}}><Box sx={{border:`1px solid ${theme.border}`,borderRadius:1.5,p:.8,bgcolor:'#fbfcff',minHeight:0}}><Box sx={{display:'flex',justifyContent:'space-between',mb:.3}}><Typography sx={{fontSize:9.5,color:theme.muted}}>FLOW TREND</Typography><Typography sx={{fontSize:9.5,fontWeight:800}}>18.4 L/min</Typography></Box><ChartSvg values={[14,15,15.8,16.2,17.4,17,18.1,18.4]} color={theme.accent} fill minHeight={0}/></Box><Box sx={{border:`1px solid ${theme.border}`,borderRadius:1.5,p:.8,bgcolor:'#fbfcff',minHeight:0}}><Box sx={{display:'flex',justifyContent:'space-between',mb:.3}}><Typography sx={{fontSize:9.5,color:theme.muted}}>PRESSURE TREND</Typography><Typography sx={{fontSize:9.5,fontWeight:800}}>2.6 bar</Typography></Box><ChartSvg values={[2.1,2.2,2.25,2.4,2.35,2.5,2.55,2.6]} color={theme.accent2} fill minHeight={0}/></Box></Box>
    <Box sx={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:.7}}><StatBox label="FLOW" value="18.4 L/min" theme={theme} accent/><StatBox label="PRESSURE" value="2.6 bar" theme={theme}/><StatBox label="PUMP" value="1.82 A" theme={theme}/><StatBox label="VALVE" value="OPEN" theme={theme}/></Box>
  </Box>;
  return <Box sx={{ height:'100%',minHeight:0,display:'grid',gridTemplateRows:'minmax(0,1fr) auto',gap:1,direction:'ltr' }}>{main}<Box sx={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:.7}}><StatBox label="FLOW" value="18.4 L/min" theme={theme} accent/><StatBox label="PRESSURE" value="2.6 bar" theme={theme}/><StatBox label="PUMP" value="1.82 A" theme={theme}/><StatBox label="VALVE" value="OPEN" theme={theme}/></Box></Box>;
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
