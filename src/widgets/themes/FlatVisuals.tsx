import { useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import type { Locale, WidgetDefinition, WidgetSize, WidgetThemeTokens } from '../core/types';
import { bars, heat, spark } from '../data/mockData';

interface Props { def: WidgetDefinition; theme: WidgetThemeTokens; locale: Locale; size: WidgetSize; }

type Tone = 'normal' | 'active' | 'warning' | 'danger' | 'manual' | 'muted';

const C = {
  ink: '#243038',
  ink2: '#3f4b52',
  muted: '#68757d',
  line: '#cfd6d9',
  line2: '#e5e9ea',
  face: '#f5f7f7',
  face2: '#edf1f1',
  white: '#ffffff',
  active: '#0f766e',
  normal: '#567069',
  amber: '#b86f00',
  red: '#bb3b35',
  blue: '#456d8c',
};

const n = (value: unknown, fallback = 0) => typeof value === 'number' ? value : fallback;
const s = (value: unknown, fallback = '') => typeof value === 'string' ? value : fallback;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const tr = (locale: Locale, en: string, fa: string) => locale === 'fa' ? fa : en;

function profile(size: WidgetSize) {
  const [w, h] = size.split('x').map(Number);
  const area = w * h;
  return { w, h, area, compact: area === 1, small: area <= 2, large: area >= 4, xl: area >= 6, wide: w > h, tall: h > w };
}

function toneColor(tone: Tone) {
  if (tone === 'danger') return C.red;
  if (tone === 'warning') return C.amber;
  if (tone === 'manual') return C.blue;
  if (tone === 'active') return C.active;
  if (tone === 'muted') return C.muted;
  return C.normal;
}

function StateFlag({ text, tone = 'normal' }: { text: string; tone?: Tone }) {
  const color = toneColor(tone);
  return <Box sx={{ display:'inline-flex', alignItems:'stretch', minWidth:0, border:`1px solid ${C.line}`, bgcolor:C.white, height:22 }}>
    <Box sx={{ width:5, bgcolor:color }} />
    <Typography sx={{ px:.8, display:'flex', alignItems:'center', fontSize:9.5, fontWeight:900, lineHeight:1, letterSpacing:.4, color:C.ink, whiteSpace:'nowrap' }}>{text}</Typography>
  </Box>;
}

function Readout({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return <Box sx={{ minWidth:0, borderTop:`1px solid ${C.line}`, pt:.55 }}>
    <Typography sx={{ fontSize:8.5, fontWeight:800, color:C.muted, letterSpacing:.55, textTransform:'uppercase', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{label}</Typography>
    <Typography sx={{ mt:.15, fontSize:11.5, fontWeight:900, color:accent?C.active:C.ink, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', direction:'ltr' }}>{value}</Typography>
  </Box>;
}

function Segments({ value, max = 100, count = 12, tone = 'active', height = 12 }: { value:number; max?:number; count?:number; tone?:Tone; height?:number }) {
  const lit = Math.round(clamp(value / Math.max(1,max),0,1) * count);
  const color = toneColor(tone);
  return <Box sx={{ display:'grid', gridTemplateColumns:`repeat(${count},minmax(0,1fr))`, gap:'3px' }}>
    {Array.from({length:count}).map((_,i)=><Box key={i} sx={{ height, bgcolor:i<lit?color:C.line2, border:`1px solid ${i<lit?color:C.line}` }} />)}
  </Box>;
}

function TrendPlot({ values = spark, tone = 'active', fill = false, tall = false }: { values?:number[]; tone?:Tone; fill?:boolean; tall?:boolean }) {
  const color = toneColor(tone);
  const points = useMemo(() => {
    const min = Math.min(...values); const max = Math.max(...values); const range = Math.max(1,max-min);
    return values.map((v,i)=>`${8 + (i/Math.max(1,values.length-1))*88},${37 - ((v-min)/range)*26}`).join(' ');
  },[values]);
  return <Box sx={{ position:'relative', width:'100%', height:'100%', minHeight:tall?92:48, bgcolor:C.face, border:`1px solid ${C.line}`, overflow:'hidden' }}>
    <svg viewBox="0 0 104 44" preserveAspectRatio="none" width="100%" height="100%" aria-hidden>
      {[12,24,36].map(y=><line key={y} x1="0" x2="104" y1={y} y2={y} stroke={C.line2} strokeWidth=".55" />)}
      {[26,52,78].map(x=><line key={x} y1="0" y2="44" x1={x} x2={x} stroke={C.line2} strokeWidth=".45" />)}
      {fill && <polygon points={`8,42 ${points} 96,42`} fill={color} opacity=".10" />}
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.8" vectorEffect="non-scaling-stroke" strokeLinejoin="miter" />
      <line x1="8" x2="96" y1="38" y2="38" stroke={C.muted} strokeWidth=".45" />
    </svg>
    <Box sx={{ position:'absolute', left:5, top:3, fontSize:7.5, color:C.muted, fontWeight:800 }}>HI</Box>
    <Box sx={{ position:'absolute', left:5, bottom:2, fontSize:7.5, color:C.muted, fontWeight:800 }}>LO</Box>
  </Box>;
}

function ScaleBar({ value, max = 100, setpoint, tone = 'active' }: { value:number; max?:number; setpoint?:number; tone?:Tone }) {
  const pct=clamp(value/Math.max(1,max),0,1)*100; const set=clamp((setpoint ?? max*.7)/Math.max(1,max),0,1)*100; const color=toneColor(tone);
  return <Box sx={{ position:'relative', height:24, pt:'8px' }}>
    <Box sx={{ height:8, bgcolor:C.face2, border:`1px solid ${C.line}`, position:'relative', overflow:'hidden' }}><Box sx={{ width:`${pct}%`, height:'100%', bgcolor:color }} /></Box>
    <Box sx={{ position:'absolute', left:`${set}%`, top:2, width:1, height:20, bgcolor:C.ink, transform:'translateX(-.5px)' }} />
    <Box sx={{ position:'absolute', left:`calc(${set}% - 3px)`, top:0, width:0, height:0, borderLeft:'3px solid transparent', borderRight:'3px solid transparent', borderTop:`5px solid ${C.ink}` }} />
  </Box>;
}

function Metric({ def, locale, size }: Props) {
  const p=profile(size); const value=n(def.mock.value,24.8); const unit=s(def.mock.unit); const trend=n(def.mock.trend,0); const values=(def.mock.values as number[]|undefined)??spark;
  const trendTone:Tone = Math.abs(trend) > 8 ? 'warning' : 'active';
  const current=`${value}${unit ? ` ${unit}` : ''}`;
  if(p.compact) return <Box sx={{height:'100%',display:'grid',gridTemplateRows:'auto auto 1fr',gap:.7,direction:'ltr'}}>
    <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'start',gap:.6}}><Typography sx={{fontSize:31,fontWeight:950,lineHeight:.9,letterSpacing:'-.045em',color:C.ink}}>{value}<Box component="span" sx={{fontSize:10.5,ml:.45,color:C.muted,fontWeight:900}}>{unit}</Box></Typography><StateFlag text={Math.abs(trend)>8?'WATCH':'NORMAL'} tone={trendTone}/></Box>
    <Box sx={{display:'flex',alignItems:'center',justifyContent:'space-between'}}><Typography sx={{fontSize:9.5,fontWeight:900,color:toneColor(trendTone)}}>{trend>=0?'▲':'▼'} {Math.abs(trend)}%</Typography><Typography sx={{fontSize:8.5,color:C.muted}}>24H Δ</Typography></Box>
    <Segments value={Math.min(100,Math.abs(value))} tone={trendTone} height={7}/>
  </Box>;
  if(p.wide&&!p.large) return <Box sx={{height:'100%',display:'grid',gridTemplateColumns:'minmax(118px,.8fr) minmax(0,1.25fr)',gap:1.1,direction:'ltr'}}>
    <Box sx={{minWidth:0,display:'flex',flexDirection:'column',justifyContent:'center'}}><Typography sx={{fontSize:36,fontWeight:950,lineHeight:.9,letterSpacing:'-.05em',color:C.ink}}>{value}<Box component="span" sx={{fontSize:11.5,ml:.5,color:C.muted}}>{unit}</Box></Typography><Box sx={{mt:.9}}><StateFlag text={`${trend>=0?'▲':'▼'} ${Math.abs(trend)}% / 24H`} tone={trendTone}/></Box><Box sx={{mt:.65}}><ScaleBar value={Math.abs(value)} max={Math.max(100,Math.abs(value)*1.25)} tone={trendTone}/></Box></Box>
    <Box sx={{minWidth:0,display:'grid',gridTemplateRows:'auto 1fr',gap:.45}}><Box sx={{display:'flex',justifyContent:'space-between'}}><Typography sx={{fontSize:8.5,fontWeight:900,color:C.muted,letterSpacing:.5}}>PROCESS TREND</Typography><Typography sx={{fontSize:8.5,color:C.muted}}>NOW</Typography></Box><TrendPlot values={values} tone={trendTone}/></Box>
  </Box>;
  return <Box sx={{height:'100%',display:'grid',gridTemplateRows:'auto minmax(84px,1fr) auto',gap:1,direction:'ltr'}}>
    <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'end',gap:1}}><Box><Typography sx={{fontSize:39,fontWeight:950,lineHeight:.9,letterSpacing:'-.05em',color:C.ink}}>{value}<Box component="span" sx={{fontSize:12,ml:.55,color:C.muted}}>{unit}</Box></Typography><Typography sx={{mt:.55,fontSize:8.5,color:C.muted,fontWeight:800,letterSpacing:.5}}>{tr(locale,'CURRENT PROCESS VALUE','مقدار فعلی فرایند')}</Typography></Box><StateFlag text={Math.abs(trend)>8?'DEVIATION':'IN RANGE'} tone={trendTone}/></Box>
    <TrendPlot values={values} tone={trendTone} fill tall />
    <Box sx={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:.7}}><Readout label="CURRENT" value={current} accent/><Readout label="24H DELTA" value={`${trend>=0?'+':''}${trend}%`}/><Readout label="SAMPLE" value="2 min"/></Box>
  </Box>;
}

function Gauge({ def, locale, size }: Props) {
  const p=profile(size); const value=n(def.mock.value,68); const max=n(def.mock.max,100); const unit=s(def.mock.unit); const pct=clamp(value/max,0,1); const tone:Tone=pct>=.9?'danger':pct>=.75?'warning':'normal';
  const state=pct>=.9?tr(locale,'TRIP RANGE','محدوده خطر'):pct>=.75?tr(locale,'HIGH','بالا'):tr(locale,'NORMAL','عادی');
  if(p.compact) return <Box sx={{height:'100%',display:'grid',gridTemplateRows:'auto auto 1fr',gap:.7,direction:'ltr'}}><Box sx={{display:'flex',alignItems:'baseline',justifyContent:'space-between'}}><Typography sx={{fontSize:30,fontWeight:950,color:C.ink}}>{value}<Box component="span" sx={{fontSize:10,ml:.45,color:C.muted}}>{unit}</Box></Typography><Typography sx={{fontSize:9,fontWeight:900,color:toneColor(tone)}}>{state}</Typography></Box><Segments value={value} max={max} tone={tone} count={10} height={13}/><Box sx={{display:'flex',justifyContent:'space-between',alignItems:'end',color:C.muted}}><Typography sx={{fontSize:8}}>0</Typography><Typography sx={{fontSize:8}}>SET {Math.round(max*.7)}</Typography><Typography sx={{fontSize:8}}>{max}</Typography></Box></Box>;
  return <Box sx={{height:'100%',display:'grid',gridTemplateColumns:p.wide&&!p.large?'minmax(135px,.9fr) minmax(0,1.2fr)':'1fr',gridTemplateRows:p.large?'auto minmax(0,1fr) auto':undefined,gap:1,direction:'ltr'}}>
    <Box sx={{display:'flex',flexDirection:'column',justifyContent:'center',minWidth:0}}><Box sx={{display:'flex',justifyContent:'space-between',alignItems:'end'}}><Typography sx={{fontSize:p.large?40:35,fontWeight:950,lineHeight:.9,color:C.ink}}>{value}<Box component="span" sx={{fontSize:11,ml:.45,color:C.muted}}>{unit}</Box></Typography><StateFlag text={state} tone={tone}/></Box><Box sx={{mt:.8}}><Segments value={value} max={max} tone={tone} count={p.large?16:12} height={p.large?16:13}/></Box><Box sx={{display:'flex',justifyContent:'space-between',mt:.4,color:C.muted}}><Typography sx={{fontSize:8}}>0</Typography><Typography sx={{fontSize:8}}>SP {Math.round(max*.7)}</Typography><Typography sx={{fontSize:8}}>{max}</Typography></Box></Box>
    {(p.wide||p.large)&&<Box sx={{minWidth:0,display:'grid',gridTemplateRows:'auto 1fr',gap:.45}}><Typography sx={{fontSize:8.5,fontWeight:900,color:C.muted,letterSpacing:.45}}>DEVIATION / HISTORY</Typography><TrendPlot values={spark.map(v=>v/max*value+value*.35)} tone={tone} tall={p.large}/></Box>}
    {p.large&&<Box sx={{gridColumn:'1/-1',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:.65}}><Readout label="LOW" value={`${Math.round(max*.2)} ${unit}`}/><Readout label="SETPOINT" value={`${Math.round(max*.7)} ${unit}`} accent/><Readout label="HIGH" value={`${Math.round(max*.85)} ${unit}`}/><Readout label="UTIL" value={`${Math.round(pct*100)}%`}/></Box>}
  </Box>;
}

function Battery({ def, locale, size }: Props) {
  const p=profile(size); const value=n(def.mock.value,76); const voltage=s(def.mock.voltage,'3.94 V'); const remain=s(def.mock.remaining,'8h 42m'); const tone:Tone=value<20?'danger':value<35?'warning':'normal';
  const BatteryShape=({big=false}:{big?:boolean})=><Box sx={{display:'flex',alignItems:'center',gap:'3px',direction:'ltr'}}><Box sx={{width:big?176:126,height:big?66:46,border:`2px solid ${C.ink}`,p:'4px',display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:'3px',bgcolor:C.white}}>{Array.from({length:5}).map((_,i)=><Box key={i} sx={{bgcolor:i<Math.ceil(value/20)?toneColor(tone):C.line2}}/>)}</Box><Box sx={{width:6,height:big?28:20,bgcolor:C.ink}}/></Box>;
  if(p.compact) return <Box sx={{height:'100%',display:'grid',alignContent:'center',gap:.7,direction:'ltr'}}><Box sx={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}><Typography sx={{fontSize:30,fontWeight:950}}>{value}%</Typography><StateFlag text={value<35?'LOW':'BAT OK'} tone={tone}/></Box><BatteryShape/><Typography sx={{fontSize:9.5,color:C.muted,fontWeight:800}}>{voltage} · {remain}</Typography></Box>;
  if(p.large) return <Box sx={{height:'100%',minHeight:0,display:'grid',gridTemplateRows:'auto minmax(0,1fr) auto',gap:1,direction:'ltr'}}>
    <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'end',gap:1}}><Box><Typography sx={{fontSize:43,fontWeight:950,lineHeight:.9}}>{value}<Box component="span" sx={{fontSize:12,ml:.35,color:C.muted}}>%</Box></Typography><Typography sx={{mt:.45,fontSize:8.5,fontWeight:900,color:C.muted,letterSpacing:.5}}>PACK STATE OF CHARGE</Typography></Box><StateFlag text={value<35?'SERVICE SOON':'BATTERY HEALTHY'} tone={tone}/></Box>
    <Box sx={{minHeight:0,border:`1px solid ${C.line}`,bgcolor:C.face,display:'grid',gridTemplateRows:'1fr auto',placeItems:'center',p:1.1}}><BatteryShape big/><Box sx={{width:'100%',display:'grid',gridTemplateColumns:'repeat(10,1fr)',gap:3,alignSelf:'end'}}>{Array.from({length:10}).map((_,i)=><Box key={i} sx={{height:9,bgcolor:i<Math.round(value/10)?toneColor(tone):C.line2,border:`1px solid ${i<Math.round(value/10)?toneColor(tone):C.line}`}}/>)}</Box></Box>
    <Box sx={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:.65}}><Readout label={tr(locale,'PACK VOLTAGE','ولتاژ باتری')} value={voltage} accent/><Readout label={tr(locale,'EST. RUNTIME','زمان باقیمانده')} value={remain}/><Readout label="CYCLE" value="183"/><Readout label="HEALTH" value="94%"/></Box>
  </Box>;
  return <Box sx={{height:'100%',display:'grid',gridTemplateColumns:p.wide&&!p.large?'auto 1fr':'1fr',gap:1.2,alignItems:'center',direction:'ltr'}}><Box><Typography sx={{fontSize:p.large?42:36,fontWeight:950,lineHeight:.9}}>{value}<Box component="span" sx={{fontSize:12,ml:.35,color:C.muted}}>%</Box></Typography><Box sx={{mt:1}}><BatteryShape big={p.large}/></Box></Box><Box sx={{display:'grid',gridTemplateColumns:p.large?'repeat(2,1fr)':'1fr',gap:.8,alignContent:'center'}}><Readout label={tr(locale,'PACK VOLTAGE','ولتاژ باتری')} value={voltage} accent/><Readout label={tr(locale,'EST. RUNTIME','زمان باقیمانده')} value={remain}/>{p.large&&<><Readout label="CYCLE" value="183"/><Readout label="HEALTH" value="94%"/></>}</Box></Box>;
}

function Signal({ def, locale, size }: Props) {
  const p=profile(size); const value=n(def.mock.value,-72); const network=s(def.mock.network,'LTE · RSRP'); const quality=value>-80?4:value>-95?3:value>-105?2:1; const tone:Tone=quality>=3?'normal':quality===2?'warning':'danger';
  const barsUi=<Box sx={{height:p.large?82:54,display:'flex',alignItems:'end',gap:'5px',direction:'ltr'}}>{[1,2,3,4,5].map(i=><Box key={i} sx={{width:p.large?18:12,height:`${18+i*13}%`,bgcolor:i<=quality?toneColor(tone):C.line2,border:`1px solid ${i<=quality?toneColor(tone):C.line}`}}/>)}</Box>;
  if(p.compact) return <Box sx={{height:'100%',display:'grid',gridTemplateColumns:'auto 1fr',gap:1,alignItems:'center',direction:'ltr'}}>{barsUi}<Box><Typography sx={{fontSize:24,fontWeight:950}}>{value}<Box component="span" sx={{fontSize:9.5,ml:.4,color:C.muted}}>dBm</Box></Typography><Typography sx={{fontSize:8.5,fontWeight:900,color:C.muted}}>{network}</Typography></Box></Box>;
  if(p.large) return <Box sx={{height:'100%',minHeight:0,display:'grid',gridTemplateRows:'auto minmax(0,1fr) auto',gap:1,direction:'ltr'}}>
    <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'end'}}><Box><Typography sx={{fontSize:41,fontWeight:950,lineHeight:.9}}>{value}<Box component="span" sx={{fontSize:11,ml:.4,color:C.muted}}>dBm</Box></Typography><Typography sx={{mt:.45,fontSize:9,fontWeight:900,color:C.muted}}>{network}</Typography></Box><StateFlag text={quality>=3?'LINK GOOD':'WEAK LINK'} tone={tone}/></Box>
    <Box sx={{minHeight:0,border:`1px solid ${C.line}`,bgcolor:C.face,display:'grid',gridTemplateColumns:'120px 1fr',gap:1.2,alignItems:'center',p:1}}><Box sx={{display:'grid',placeItems:'center'}}>{barsUi}</Box><Box sx={{display:'grid',alignContent:'center',gap:.9}}><Box sx={{display:'flex',justifyContent:'space-between',fontSize:8.5,fontWeight:900,color:C.muted}}><span>NO SERVICE</span><span>EXCELLENT</span></Box><Segments value={quality} max={5} count={10} tone={tone} height={16}/><Typography sx={{fontSize:9,color:C.muted,lineHeight:1.5}}>Serving cell locked · packet path stable · no reselection in the last 15 min</Typography></Box></Box>
    <Box sx={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:.65}}><Readout label="RSRQ" value="-9 dB"/><Readout label="SINR" value="18 dB"/><Readout label={tr(locale,'CELL','سلول')} value="20431"/><Readout label="RAT" value="LTE B3" accent/></Box>
  </Box>;
  return <Box sx={{height:'100%',display:'grid',gridTemplateColumns:'auto minmax(0,1fr)',gap:1.3,alignItems:'center',direction:'ltr'}}>{barsUi}<Box sx={{minWidth:0}}><Box sx={{display:'flex',justifyContent:'space-between',alignItems:'end'}}><Typography sx={{fontSize:p.large?38:32,fontWeight:950}}>{value}<Box component="span" sx={{fontSize:10,ml:.4,color:C.muted}}>dBm</Box></Typography><StateFlag text={quality>=3?'LINK GOOD':'WEAK LINK'} tone={tone}/></Box><Typography sx={{mt:.4,fontSize:9,color:C.muted,fontWeight:900}}>{network}</Typography><Box sx={{mt:.8}}><Segments value={quality} max={5} count={5} tone={tone} height={10}/></Box>{p.large&&<Box sx={{mt:1,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:.65}}><Readout label="RSRQ" value="-9 dB"/><Readout label="SINR" value="18 dB"/><Readout label={tr(locale,'CELL','سلول')} value="20431"/></Box>}</Box></Box>;
}

function Tank({ def, locale, size }: Props) {
  const p=profile(size); const value=n(def.mock.value,63); const liters=s(def.mock.liters,'1,260 L'); const tone:Tone=value<15?'warning':value>90?'warning':'normal';
  const tank=<Box sx={{height:'100%',minHeight:p.tall?120:p.large?115:72,position:'relative',border:`2px solid ${C.ink}`,bgcolor:C.white,overflow:'hidden'}}><Box sx={{position:'absolute',left:0,right:0,bottom:0,height:`${value}%`,bgcolor:'#cbdedb',borderTop:`3px solid ${toneColor(tone)}`}}/>{[25,50,75].map(v=><Box key={v} sx={{position:'absolute',left:0,right:0,bottom:`${v}%`,borderTop:`1px dashed ${C.line}`}}/>)}<Box sx={{position:'absolute',inset:0,display:'grid',placeItems:'center'}}><Box sx={{textAlign:'center',bgcolor:'rgba(255,255,255,.82)',px:.6,py:.35,border:`1px solid ${C.line}`}}><Typography sx={{fontSize:p.tall?31:25,fontWeight:950,lineHeight:1}}>{value}%</Typography><Typography sx={{fontSize:8.5,fontWeight:900,color:C.muted}}>{liters}</Typography></Box></Box></Box>;
  if(p.compact) return tank;
  if(p.tall) return <Box sx={{height:'100%',display:'grid',gridTemplateRows:'1fr auto',gap:.8,direction:'ltr'}}>{tank}<Box sx={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:.6}}><Readout label={tr(locale,'LEVEL','سطح')} value={`${value}%`} accent/><Readout label="CAPACITY" value="2,000 L"/></Box></Box>;
  return <Box sx={{height:'100%',display:'grid',gridTemplateColumns:'minmax(92px,.8fr) minmax(0,1.2fr)',gap:1.1,direction:'ltr'}}>{tank}<Box sx={{display:'flex',flexDirection:'column',justifyContent:'center',minWidth:0}}><StateFlag text={value>90?'HIGH LEVEL':'LEVEL NORMAL'} tone={tone}/><Box sx={{mt:.9}}><ScaleBar value={value} max={100} setpoint={70} tone={tone}/></Box><Box sx={{mt:.6,display:'grid',gridTemplateColumns:p.large?'repeat(2,1fr)':'1fr',gap:.65}}><Readout label="VOLUME" value={liters} accent/><Readout label="CAPACITY" value="2,000 L"/>{p.large&&<><Readout label="INLET" value="18.4 L/min"/><Readout label="OUTLET" value="17.9 L/min"/></>}</Box></Box></Box>;
}

function BooleanStatus({ def, locale, size }: Props) {
  const p=profile(size); const on=Boolean(def.mock.value); const isLock=def.id==='door-lock'; const label=on?(isLock?tr(locale,'LOCKED','قفل'):tr(locale,'RUNNING','فعال')):(isLock?tr(locale,'UNLOCKED','باز'):tr(locale,'STOPPED','متوقف'));
  return <Box sx={{height:'100%',display:'grid',gridTemplateRows:p.large?'minmax(110px,1fr) auto':'1fr',gap:.8,direction:'ltr'}}><Box sx={{display:'grid',gridTemplateColumns:p.compact?'1fr':'minmax(92px,.65fr) 1fr',height:'100%',minHeight:0,border:`1px solid ${C.line}`}}><Box sx={{bgcolor:on?'#e0e9e7':C.face2,display:'grid',placeItems:'center',borderRight:`1px solid ${C.line}`}}><Typography sx={{fontSize:p.compact?22:26,fontWeight:950,color:on?C.active:C.muted}}>{on?'01':'00'}</Typography></Box>{!p.compact&&<Box sx={{display:'flex',flexDirection:'column',justifyContent:'center',px:1.1}}><Typography sx={{fontSize:18,fontWeight:950,color:C.ink}}>{label}</Typography><Typography sx={{mt:.3,fontSize:9,color:C.muted,fontWeight:800}}>{tr(locale,'DIGITAL INPUT / FEEDBACK','بازخورد ورودی دیجیتال')}</Typography></Box>}</Box>{p.large&&<Box sx={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:.6}}><Readout label="MODE" value="AUTO"/><Readout label="UPTIME" value="14h 22m"/><Readout label="LAST CHANGE" value="09:12"/></Box>}</Box>;
}

function AlarmIndicator({ def, locale, size }: Props) {
  const p=profile(size); const Icon=def.icon; const active=Boolean(def.mock.value); const severity=s(def.mock.severity,'warning'); const tone:Tone=active?(severity==='critical'?'danger':'warning'):'normal'; const state=active?tr(locale,'ALARM ACTIVE','هشدار فعال'):tr(locale,'NORMAL / ARMED','عادی / آماده');
  const trace=active?[18,20,22,20,24,28,48,86,100]:[18,20,19,21,20,22,19,21,20];
  if(p.large) return <Box sx={{height:'100%',minHeight:0,display:'grid',gridTemplateColumns:'118px minmax(0,1fr)',gridTemplateRows:'minmax(0,1fr) auto',gap:1,direction:locale==='fa'?'rtl':'ltr'}}>
    <Box sx={{display:'grid',placeItems:'center',bgcolor:active?`${toneColor(tone)}14`:C.face,border:`2px solid ${active?toneColor(tone):C.line}`,minHeight:0}}><Box sx={{textAlign:'center'}}><Icon sx={{fontSize:58,color:toneColor(tone)}}/><Typography sx={{mt:.6,fontSize:8.5,fontWeight:950,color:toneColor(tone),letterSpacing:.65}}>{active?'ACTIVE INPUT':'SUPERVISED'}</Typography></Box></Box>
    <Box sx={{minWidth:0,minHeight:0,display:'grid',gridTemplateRows:'auto auto minmax(76px,1fr)',alignContent:'stretch',gap:.75,borderTop:`1px solid ${C.line}`,pt:.75}}><StateFlag text={active?(severity==='critical'?'CRITICAL':'WARNING'):'SYSTEM NORMAL'} tone={tone}/><Box><Typography sx={{fontSize:27,fontWeight:950,color:active?toneColor(tone):C.ink,lineHeight:1.05}}>{state}</Typography><Typography sx={{mt:.45,fontSize:9.5,lineHeight:1.5,color:C.muted}}>{active?tr(locale,'Operator acknowledgement required. Verify the source before reset.','نیازمند بررسی و تأیید اپراتور است. پیش از بازنشانی منبع را بررسی کنید.'):tr(locale,'Loop supervision healthy. Input is armed and ready for event detection.','حلقه نظارت سالم است و ورودی برای تشخیص رویداد آماده است.')}</Typography></Box><Box sx={{minHeight:0,border:`1px solid ${C.line}`,bgcolor:C.face,p:.75,display:'grid',gridTemplateRows:'auto minmax(0,1fr)',gap:.55,direction:'ltr'}}><Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><Typography sx={{fontSize:8,fontWeight:950,color:C.muted,letterSpacing:.55}}>ALARM TRACE · 15 MIN</Typography><Typography sx={{fontSize:8,fontWeight:900,color:active?toneColor(tone):C.normal}}>{active?'EVENT DETECTED':'NO EVENTS'}</Typography></Box><Box sx={{minHeight:0,display:'grid',gridTemplateColumns:`repeat(${trace.length},1fr)`,gap:3,alignItems:'end',borderBottom:`1px solid ${C.line}`}}>{trace.map((v,i)=><Box key={i} sx={{height:`${v}%`,minHeight:4,bgcolor:active&&i>=trace.length-2?toneColor(tone):active&&i===trace.length-3?C.amber:C.normal,border:`1px solid ${active&&i>=trace.length-2?toneColor(tone):active&&i===trace.length-3?C.amber:C.normal}`}}/>)}</Box></Box></Box>
    <Box sx={{gridColumn:'1/-1',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:.6}}><Readout label="ZONE" value={def.id==='fire-alarm'?'Floor 2':'Server room'}/><Readout label="LOOP" value="L02 / 014"/><Readout label="LAST TEST" value="06:00"/><Readout label="STATE" value={active?'UNACK':'ARMED'} accent={!active}/></Box>
  </Box>;
  return <Box sx={{height:'100%',display:'grid',gridTemplateColumns:p.compact?'1fr':p.wide&&!p.large?'86px 1fr':'1fr',gridTemplateRows:p.large?'auto 1fr auto':undefined,gap:.8,direction:locale==='fa'?'rtl':'ltr'}}><Box sx={{display:'grid',placeItems:'center',bgcolor:active?`${toneColor(tone)}14`:C.face,border:`2px solid ${active?toneColor(tone):C.line}`,minHeight:p.compact?68:p.large?94:72}}><Icon sx={{fontSize:p.large?50:p.compact?37:42,color:toneColor(tone)}}/></Box><Box sx={{display:'flex',flexDirection:'column',justifyContent:'center',minWidth:0}}><StateFlag text={active?(severity==='critical'?'CRITICAL':'WARNING'):'SYSTEM NORMAL'} tone={tone}/><Typography sx={{mt:.55,fontSize:p.large?25:20,fontWeight:950,color:active?toneColor(tone):C.ink}}>{state}</Typography>{!p.compact&&<Typography sx={{mt:.35,fontSize:9.5,lineHeight:1.45,color:C.muted}}>{active?tr(locale,'Operator acknowledgement required.','نیازمند بررسی و تأیید اپراتور.'):tr(locale,'Loop supervision healthy.','حلقه نظارت در وضعیت سالم است.')}</Typography>}</Box>{p.large&&<Box sx={{gridColumn:'1/-1',display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:.6}}><Readout label="ZONE" value={def.id==='fire-alarm'?'Floor 2':'Server room'}/><Readout label="LOOP" value="L02 / 014"/><Readout label="LAST TEST" value="06:00"/></Box>}</Box>;
}
function LineChartVisual({ def, size }: Props) {
  const p=profile(size); const values=(def.mock.values as number[]|undefined)??spark; const summary=s(def.mock.summary,def.visual==='area'?'18.7 kWh':'24.8 °C'); const fill=def.visual==='area';
  return <Box sx={{height:'100%',minHeight:0,display:'grid',gridTemplateColumns:p.wide&&p.area<=3?'104px minmax(0,1fr)':'1fr',gridTemplateRows:p.large?'auto minmax(0,1fr) auto':undefined,gap:.8,direction:'ltr'}}><Box sx={{display:'flex',flexDirection:'column',justifyContent:'center',minWidth:0}}><Typography sx={{fontSize:p.large?31:24,fontWeight:950}}>{summary}</Typography><Typography sx={{mt:.25,fontSize:8.5,fontWeight:900,color:C.muted,letterSpacing:.55}}>LATEST SAMPLE</Typography>{!p.compact&&<Box sx={{mt:.7}}><StateFlag text="TREND STABLE" tone="normal"/></Box>}</Box><TrendPlot values={values} tone="active" fill={fill} tall={p.large}/>{p.large&&<Box sx={{gridColumn:'1/-1',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:.6}}><Readout label="MIN" value={fill?'17.8':'23.9'}/><Readout label="AVG" value={fill?'18.5':'24.4'}/><Readout label="MAX" value={fill?'19.3':'25.1'}/><Readout label="WINDOW" value="24 h"/></Box>}</Box>;
}

function BarVisual({ def, size }: Props) {
  const p=profile(size); const values=(def.mock.values as number[]|undefined)??bars; const max=Math.max(...values,1);
  return <Box sx={{height:'100%',display:'grid',gridTemplateRows:'minmax(0,1fr) auto',gap:.55,direction:'ltr'}}><Box sx={{minHeight:0,display:'flex',alignItems:'end',gap:p.large?8:5,borderLeft:`1px solid ${C.line}`,borderBottom:`1px solid ${C.line}`,p:'7px 8px 0',backgroundImage:`linear-gradient(${C.line2} 1px,transparent 1px)`,backgroundSize:'100% 25%'}}>{values.map((v,i)=><Box key={i} sx={{height:`${20+(v/max)*70}%`,flex:1,bgcolor:i===values.length-2?C.amber:i===values.length-1?C.ink2:'#86aaa4',border:`1px solid ${i===values.length-2?C.amber:C.line}`}}/>)}</Box><Box sx={{display:'flex',justifyContent:'space-between',fontSize:8,color:C.muted}}><span>00</span><span>12</span><span>24</span></Box></Box>;
}

function Histogram({ size }: Props) {
  const p=profile(size); const values=[10,24,48,77,100,82,56,34,17,7];
  return <Box sx={{height:'100%',display:'grid',gridTemplateRows:'auto minmax(0,1fr)',gap:.55,direction:'ltr'}}><Box sx={{display:'flex',justifyContent:'space-between'}}><Typography sx={{fontSize:9,fontWeight:900,color:C.muted}}>DISTRIBUTION</Typography><Typography sx={{fontSize:9,fontWeight:900,color:C.ink}}>N=248</Typography></Box><Box sx={{minHeight:p.large?125:70,display:'flex',alignItems:'end',gap:2,borderBottom:`1px solid ${C.ink2}`}}>{values.map((v,i)=><Box key={i} sx={{height:`${v}%`,flex:1,bgcolor:i>=3&&i<=5?C.active:'#a8bfbb'}}/>)}</Box></Box>;
}

function Donut({ def, locale, size }: Props) {
  const p=profile(size); const value=clamp(n(def.mock.value,72),0,100); const rest=100-value; const diameter=p.compact?78:p.large?132:104;
  const ring=<Box sx={{width:diameter,height:diameter,display:'grid',placeItems:'center',border:p.large?`1px solid ${C.line}`:'none',bgcolor:p.large?C.face:'transparent',p:p.large?.65:0}}><svg viewBox="0 0 100 100" width="100%" height="100%" aria-hidden>
    {Array.from({length:12}).map((_,i)=><line key={i} x1="50" y1="4" x2="50" y2="9" stroke={i<Math.round(value/100*12)?C.active:C.line} strokeWidth="2" transform={`rotate(${i*30} 50 50)`}/>) }
    <circle cx="50" cy="50" r="32" fill="#fff" stroke={C.line2} strokeWidth="13"/>
    <circle cx="50" cy="50" r="32" fill="none" stroke={C.active} strokeWidth="13" pathLength="100" strokeDasharray={`${value} ${rest}`} transform="rotate(-90 50 50)"/>
    <circle cx="50" cy="50" r="23" fill={C.white} stroke={C.line} strokeWidth=".7"/>
    <text x="50" y="49" textAnchor="middle" dominantBaseline="middle" fill={C.ink} fontSize="17" fontWeight="900">{Math.round(value)}%</text>
    <text x="50" y="63" textAnchor="middle" fill={C.muted} fontSize="6.2" fontWeight="800">USED</text>
  </svg></Box>;
  if(p.compact) return <Box sx={{height:'100%',display:'grid',placeItems:'center',direction:'ltr'}}>{ring}</Box>;
  return <Box sx={{height:'100%',minHeight:0,display:'grid',gridTemplateColumns:p.large?'minmax(132px,.85fr) minmax(0,1.15fr)':p.wide?'112px minmax(0,1fr)':'1fr',gridTemplateRows:p.large?'minmax(0,1fr) auto':undefined,gap:1,alignItems:'center',direction:'ltr'}}><Box sx={{display:'grid',placeItems:'center',minHeight:0}}>{ring}</Box><Box sx={{minWidth:0,display:'grid',alignContent:'center',gap:.75}}><StateFlag text={tr(locale,'CAPACITY USED','ظرفیت مصرف‌شده')} tone={value>88?'warning':'normal'}/><Box sx={{display:'grid',gridTemplateColumns:p.large?'1fr 1fr':'1fr',gap:.65}}><Readout label="USED" value={`${Math.round(value)}%`} accent/><Readout label="AVAILABLE" value={`${Math.round(rest)}%`}/>{p.large&&<><Readout label="FORECAST" value="81% / 18:00"/><Readout label="LIMIT" value="90%"/></>}</Box></Box>{p.large&&<Box sx={{gridColumn:'1/-1'}}><Segments value={value} max={100} count={10} tone={value>88?'warning':'active'} height={11}/></Box>}</Box>;
}
function Heatmap({ size }: Props) {
  const p=profile(size); const flat=heat.flat();
  return <Box sx={{height:'100%',display:'grid',gridTemplateRows:'auto minmax(0,1fr) auto',gap:.55,direction:'ltr'}}><Box sx={{display:'flex',justifyContent:'space-between'}}><Typography sx={{fontSize:8.5,fontWeight:900,color:C.muted}}>LOAD MATRIX</Typography><Typography sx={{fontSize:8.5,color:C.muted}}>LOW → HIGH</Typography></Box><Box sx={{minHeight:0,display:'grid',gridTemplateColumns:`repeat(${heat[0].length},1fr)`,gridTemplateRows:`repeat(${heat.length},1fr)`,gap:p.large?4:2}}>{flat.map((v,i)=>{const tone=v>84?C.amber:v>62?'#4f837b':v>38?'#8fb4ae':'#d6e1df'; const border=v>84?C.amber:v>62?'#416e68':v>38?'#759c96':C.line; return <Box key={i} sx={{bgcolor:tone,border:`1px solid ${border}`}}/>})}</Box><Box sx={{display:'flex',justifyContent:'space-between',fontSize:8,color:C.muted}}><span>MON</span><span>WED</span><span>FRI</span><span>SUN</span></Box></Box>;
}
function TimelineVisual({ size }: Props) {
  const p=profile(size); const rows=[['PUMP-01',['run','run','run','warn','run','run']],['VALVE-02',['run','run','off','off','run','alarm']],['FAN-03',['run','run','run','run','run','run']]];
  const color=(x:string)=>x==='alarm'?C.red:x==='warn'?C.amber:x==='off'?C.line:'#5c8d84';
  return <Box sx={{height:'100%',display:'grid',gridTemplateRows:'1fr auto',gap:.55,direction:'ltr'}}><Box sx={{display:'grid',gridTemplateRows:'repeat(3,1fr)',gap:p.large?8:5,alignContent:'center'}}>{rows.map(([name,states])=><Box key={name as string} sx={{display:'grid',gridTemplateColumns:'58px 1fr',gap:.65,alignItems:'center'}}><Typography sx={{fontSize:8.5,fontWeight:900,color:C.ink}}>{name as string}</Typography><Box sx={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:3}}>{(states as string[]).map((x,i)=><Box key={i} sx={{height:p.large?18:12,bgcolor:color(x),border:`1px solid ${x==='off'?C.line:color(x)}`}}/>)}</Box></Box>)}</Box><Box sx={{display:'grid',gridTemplateColumns:'58px 1fr',gap:.65}}><span/><Box sx={{display:'flex',justifyContent:'space-between',fontSize:7.5,color:C.muted}}><span>-6h</span><span>-3h</span><span>NOW</span></Box></Box></Box>;
}

function MapVisual({ def, size }: Props) {
  const p=profile(size); const route=def.visual==='route';
  return <Box sx={{height:'100%',minHeight:0,position:'relative',overflow:'hidden',bgcolor:'#f1f4f3',border:`1px solid ${C.line}`,direction:'ltr',backgroundImage:`linear-gradient(${C.line2} 1px,transparent 1px),linear-gradient(90deg,${C.line2} 1px,transparent 1px)`,backgroundSize:'28px 28px'}}>
    <svg viewBox="0 0 360 220" width="100%" height="100%" preserveAspectRatio="none" aria-hidden>
      <rect x="22" y="26" width="112" height="54" fill="#e1e6e5" stroke={C.line}/><rect x="226" y="28" width="104" height="70" fill="#e1e6e5" stroke={C.line}/><rect x="54" y="145" width="112" height="46" fill="#e1e6e5" stroke={C.line}/><rect x="236" y="146" width="82" height="44" fill="#e1e6e5" stroke={C.line}/>
      <path d={route?'M36 178 L88 126 L150 132 L190 92 L250 110 L316 54':'M46 118 L104 92 L166 118 L232 92 L306 120'} fill="none" stroke={C.ink2} strokeWidth="5" strokeLinejoin="miter"/>
      <path d={route?'M36 178 L88 126 L150 132 L190 92 L250 110 L316 54':'M46 118 L104 92 L166 118 L232 92 L306 120'} fill="none" stroke={C.active} strokeWidth="2" strokeDasharray={route?'8 5':'none'}/>
      {[route?[88,126]:[104,92],route?[190,92]:[166,118],route?[250,110]:[232,92]].map((xy,i)=><g key={i}><rect x={(xy as number[])[0]-7} y={(xy as number[])[1]-7} width="14" height="14" fill={i===1?C.amber:C.active} stroke="#fff" strokeWidth="2"/></g>)}
    </svg>
    <Box sx={{position:'absolute',left:8,top:8,bgcolor:C.white,border:`1px solid ${C.line}`,px:.75,py:.45,fontSize:8.5,fontWeight:900,color:C.ink}}>{route?'TRACK · 12.4 km':'PLANT · 3 ASSETS'}</Box>
    {p.large&&<Box sx={{position:'absolute',right:8,bottom:8,display:'grid',gridTemplateColumns:'auto auto',gap:.45,bgcolor:'rgba(255,255,255,.94)',border:`1px solid ${C.line}`,p:.6}}><Box sx={{width:7,height:7,bgcolor:C.active,mt:.2}}/><Typography sx={{fontSize:8}}>ONLINE</Typography><Box sx={{width:7,height:7,bgcolor:C.amber,mt:.2}}/><Typography sx={{fontSize:8}}>WATCH</Typography></Box>}
  </Box>;
}

function Coordinates({ def, locale, size }: Props) {
  const p=profile(size); const lat=s(def.mock.lat,'35.7219° N'); const lng=s(def.mock.lng,'51.3347° E'); const acc=s(def.mock.accuracy,'4.2 m');
  return <Box sx={{height:'100%',minHeight:0,display:'grid',gridTemplateRows:p.large?'auto minmax(0,1fr)':'1fr',gap:.7,direction:'ltr'}}><Box sx={{display:'grid',gridTemplateColumns:p.compact?'1fr':'1fr 1fr',gap:.6,alignContent:'center'}}><Readout label="LATITUDE" value={lat} accent/><Readout label="LONGITUDE" value={lng} accent/><Readout label={tr(locale,'ACCURACY','دقت')} value={acc}/>{!p.compact&&<Readout label="FIX" value="3D / 12 SAT"/>}</Box>{p.large&&<Box sx={{minHeight:0,border:`1px solid ${C.line}`,bgcolor:C.face,p:.9,display:'grid',gridTemplateRows:'auto auto 1fr',gap:.85}}><Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><Typography sx={{fontSize:8.5,fontWeight:950,color:C.muted,letterSpacing:.55}}>GNSS FIX QUALITY</Typography><StateFlag text="3D LOCK" tone="active"/></Box><Segments value={12} max={16} count={16} tone="active" height={12}/><Box sx={{alignSelf:'end',display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:.7}}><Readout label="ALTITUDE" value="1,184 m"/><Readout label="HEADING" value="327°"/><Readout label="SPEED" value="0.0 km/h"/></Box></Box>}</Box>;
}

function Compass({ def, locale, size }: Props) {
  const p=profile(size); const value=n(def.mock.value,327); const plate=p.large?184:p.compact?94:112;
  const dial=<Box sx={{width:plate,height:plate,position:'relative',border:`2px solid ${C.ink}`,bgcolor:C.face}}><Box sx={{position:'absolute',left:'50%',top:0,bottom:0,borderLeft:`1px solid ${C.line}`}}/><Box sx={{position:'absolute',top:'50%',left:0,right:0,borderTop:`1px solid ${C.line}`}}/><Typography sx={{position:'absolute',top:3,left:'50%',transform:'translateX(-50%)',fontSize:8,fontWeight:900}}>N</Typography><Typography sx={{position:'absolute',bottom:3,left:'50%',transform:'translateX(-50%)',fontSize:8,fontWeight:900}}>S</Typography><Typography sx={{position:'absolute',left:4,top:'50%',transform:'translateY(-50%)',fontSize:8,fontWeight:900}}>W</Typography><Typography sx={{position:'absolute',right:4,top:'50%',transform:'translateY(-50%)',fontSize:8,fontWeight:900}}>E</Typography><Box sx={{position:'absolute',left:'50%',top:'50%',width:4,height:'36%',bgcolor:C.active,transformOrigin:'50% 100%',transform:`translate(-50%,-100%) rotate(${value}deg)`,'&:after':{content:'""',position:'absolute',top:-5,left:-3,width:0,height:0,borderLeft:'5px solid transparent',borderRight:'5px solid transparent',borderBottom:`8px solid ${C.active}`}}}/><Box sx={{position:'absolute',left:'50%',top:'50%',width:8,height:8,bgcolor:C.ink,transform:'translate(-50%,-50%)'}}/></Box>;
  if(p.large) return <Box sx={{height:'100%',minHeight:0,display:'grid',gridTemplateRows:'minmax(0,1fr) auto',gap:.8,direction:'ltr'}}><Box sx={{minHeight:0,display:'grid',gridTemplateColumns:'1fr 1fr',alignItems:'center',gap:1.1}}><Box sx={{display:'grid',placeItems:'center'}}>{dial}</Box><Box sx={{minWidth:0}}><Typography sx={{fontSize:43,fontWeight:950,lineHeight:.95}}>{value}°</Typography><Typography sx={{mt:.4,fontSize:9,fontWeight:900,color:C.muted}}>{tr(locale,'HEADING · NNW','جهت · شمال‌غربی')}</Typography><Box sx={{mt:1}}><StateFlag text="COURSE STABLE" tone="active"/></Box><Box sx={{mt:1}}><Segments value={value%90} max={90} count={9} tone="normal" height={12}/></Box></Box></Box><Box sx={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:.65}}><Readout label="BEARING" value={`${value}°`} accent/><Readout label="SECTOR" value="NNW"/><Readout label="ACCURACY" value="±2.4°"/></Box></Box>;
  return <Box sx={{height:'100%',display:'grid',gridTemplateColumns:p.wide&&!p.large?'auto 1fr':'1fr',gap:1,placeItems:'center',direction:'ltr'}}>{dial}<Box sx={{textAlign:p.wide&&!p.large?'left':'center'}}><Typography sx={{fontSize:25,fontWeight:950}}>{value}°</Typography><Typography sx={{fontSize:8.5,fontWeight:900,color:C.muted}}>{tr(locale,'HEADING · NNW','جهت · شمال‌غربی')}</Typography></Box></Box>;
}

function ButtonControl({ locale, size }: Props) {
  const p=profile(size); const [state,setState]=useState<'ready'|'sent'>('ready');
  return <Box sx={{height:'100%',display:'grid',gridTemplateRows:p.large?'1fr auto':'1fr',gap:.7,direction:locale==='fa'?'rtl':'ltr'}}><Box component="button" type="button" onClick={()=>{setState('sent');window.setTimeout(()=>setState('ready'),900)}} sx={{appearance:'none',border:`2px solid ${state==='sent'?C.active:C.ink}`,bgcolor:state==='sent'?'#dfeae8':C.face,width:'100%',height:'100%',minHeight:58,cursor:'pointer',display:'grid',gridTemplateColumns:p.compact?'1fr':'42px 1fr',alignItems:'center',p:0,color:C.ink,'&:active':{transform:'translateY(1px)'}}}><Box sx={{height:'100%',display:'grid',placeItems:'center',bgcolor:state==='sent'?C.active:C.ink,color:'#fff',fontWeight:950,fontSize:13}}>{p.compact?(state==='sent'?'SENT':'SEND'):(state==='sent'?'✓':'→')}</Box>{!p.compact&&<Box sx={{px:1,textAlign:locale==='fa'?'right':'left'}}><Typography sx={{fontSize:14,fontWeight:950}}>{state==='sent'?tr(locale,'COMMAND SENT','فرمان ارسال شد'):tr(locale,'SEND COMMAND','ارسال فرمان')}</Typography><Typography sx={{fontSize:8.5,color:C.muted,fontWeight:800}}>RPC / MOMENTARY OUTPUT</Typography></Box>}</Box>{p.large&&<Box sx={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:.6}}><Readout label="TARGET" value="Node-04"/><Readout label="QUEUE" value="0 pending"/><Readout label="LAST ACK" value="09:43:52"/></Box>}</Box>;
}

function SwitchControl({ def, locale, size }: Props) {
  const p=profile(size); const [on,setOn]=useState(Boolean(def.mock.value)); const isLock=def.id==='door-lock'; const isSiren=def.id==='siren'; const a=isLock?tr(locale,'LOCK','قفل'):isSiren?tr(locale,'ENABLE','فعال'):tr(locale,'ON','روشن'); const b=isLock?tr(locale,'UNLOCK','باز'):isSiren?tr(locale,'DISABLE','خاموش'):tr(locale,'OFF','خاموش');
  return <Box sx={{height:'100%',minHeight:0,display:'grid',gridTemplateRows:p.large?'minmax(86px,1fr) auto auto':undefined,alignContent:p.large?'stretch':'center',gap:.8,direction:locale==='fa'?'rtl':'ltr'}}><Box sx={{display:'grid',gridTemplateColumns:'1fr 1fr',border:`2px solid ${C.ink}`,minHeight:p.large?66:48}}><Box onClick={()=>setOn(true)} sx={{cursor:'pointer',display:'grid',placeItems:'center',bgcolor:on?C.active:C.white,color:on?'#fff':C.muted,borderInlineEnd:`1px solid ${C.ink}`,fontSize:p.large?14:11,fontWeight:950}}>{a}</Box><Box onClick={()=>setOn(false)} sx={{cursor:'pointer',display:'grid',placeItems:'center',bgcolor:!on?C.ink:C.white,color:!on?'#fff':C.muted,fontSize:p.large?14:11,fontWeight:950}}>{b}</Box></Box>{!p.compact&&<Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><StateFlag text={on?'FEEDBACK: ACTIVE':'FEEDBACK: INACTIVE'} tone={on?'active':'muted'}/><Typography sx={{fontSize:8.5,color:C.muted}}>DO-03</Typography></Box>}{p.large&&<Box sx={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:.6}}><Readout label="MODE" value="REMOTE"/><Readout label="INTERLOCK" value="CLEAR"/><Readout label="LAST CHANGE" value="09:41"/></Box>}</Box>;
}

function SliderControl({ def, locale, size }: Props) {
  const p=profile(size); const initial=n(def.mock.value,65); const unit=s(def.mock.unit,'%'); const [value,setValue]=useState(initial);
  return <Box sx={{height:'100%',minHeight:0,display:'grid',gridTemplateRows:p.large?'auto auto auto minmax(55px,1fr) auto':undefined,alignContent:p.large?'stretch':'center',gap:.8,direction:'ltr'}}><Box sx={{display:'flex',justifyContent:'space-between',alignItems:'end'}}><Typography sx={{fontSize:p.large?36:29,fontWeight:950}}>{value}<Box component="span" sx={{fontSize:10,ml:.35,color:C.muted}}>{unit}</Box></Typography><StateFlag text={value>85?'HIGH OUTPUT':'AUTO RANGE'} tone={value>85?'warning':'normal'}/></Box><Box sx={{position:'relative',height:26,display:'grid',alignItems:'center'}}><Box sx={{position:'absolute',left:0,right:0,height:8,bgcolor:C.face2,border:`1px solid ${C.line}`}}/><Box sx={{position:'absolute',left:0,width:`${value}%`,height:8,bgcolor:C.active}}/><Box component="input" aria-label={tr(locale,'Output level','سطح خروجی')} type="range" min="0" max="100" value={value} onChange={(e: { target: { value: string } })=>setValue(Number(e.target.value))} sx={{position:'relative',zIndex:1,width:'100%',appearance:'none',bgcolor:'transparent',cursor:'pointer','&::-webkit-slider-runnable-track':{height:8,bgcolor:'transparent'},'&::-webkit-slider-thumb':{appearance:'none',width:14,height:22,mt:'-7px',bgcolor:C.ink,border:'2px solid #fff',boxShadow:`0 0 0 1px ${C.ink}`}}}/></Box><Box sx={{display:'flex',justifyContent:'space-between',fontSize:8,color:C.muted}}><span>0</span><span>25</span><span>50</span><span>75</span><span>100</span></Box>{p.large&&<Box sx={{minHeight:0,border:`1px solid ${C.line}`,bgcolor:C.face,p:.45}}><TrendPlot values={[58,59,61,60,62,64,63,66,value-2,value]} tone={value>85?'warning':'normal'} tall/></Box>}{p.large&&<Box sx={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:.6}}><Readout label="SETPOINT" value={`${value}${unit}`} accent/><Readout label="FEEDBACK" value={`${Math.max(0,value-2)}${unit}`}/><Readout label="MODE" value="AUTO"/></Box>}</Box>;
}

function InputControl({ def, locale, size }: Props) {
  const p=profile(size); const initial=n(def.mock.value,22.5); const unit=s(def.mock.unit,'°C'); const [value,setValue]=useState(String(initial)); const [applied,setApplied]=useState(false);
  return <Box sx={{height:'100%',minHeight:0,display:'grid',gridTemplateRows:p.large?'auto auto auto minmax(50px,1fr) auto':undefined,alignContent:p.large?'stretch':'center',gap:.75,direction:locale==='fa'?'rtl':'ltr'}}><Typography sx={{fontSize:8.5,fontWeight:900,color:C.muted,letterSpacing:.5}}>{tr(locale,'TARGET SETPOINT','نقطه تنظیم هدف')}</Typography><Box sx={{display:'grid',gridTemplateColumns:'1fr auto',border:`2px solid ${C.ink}`,height:p.large?58:46,direction:'ltr'}}><Box component="input" value={value} onChange={(e: { target: { value: string } })=>{setValue(e.target.value);setApplied(false)}} sx={{border:0,outline:0,minWidth:0,width:'100%',px:1.1,font:'inherit',fontSize:p.large?24:19,fontWeight:950,color:C.ink,bgcolor:C.white}}/><Box sx={{display:'grid',placeItems:'center',px:1,bgcolor:C.face2,borderLeft:`1px solid ${C.ink}`,fontSize:10,fontWeight:900,color:C.muted}}>{unit}</Box></Box><Box onClick={()=>setApplied(true)} sx={{height:30,display:'grid',placeItems:'center',cursor:'pointer',bgcolor:applied?C.active:C.ink,color:'#fff',fontSize:9.5,fontWeight:950,letterSpacing:.45}}>{applied?tr(locale,'APPLIED','اعمال شد'):tr(locale,'APPLY VALUE','اعمال مقدار')}</Box>{p.large&&<Box sx={{minHeight:0,display:'grid',alignContent:'center',border:`1px solid ${C.line}`,px:.8,bgcolor:C.face}}><ScaleBar value={Math.max(0,Number(value)-16)} max={14} setpoint={6} tone={applied?'active':'normal'}/></Box>}{p.large&&<Box sx={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:.6}}><Readout label="CURRENT" value={`21.8 ${unit}`}/><Readout label="LIMIT" value={`16 — 30 ${unit}`}/></Box>}</Box>;
}

function Thermostat({ def, locale, size }: Props) {
  const p=profile(size); const initial=n(def.mock.value,22); const [target,setTarget]=useState(initial); const current=21.6; const diff=target-current;
  return <Box sx={{height:'100%',minHeight:0,display:'grid',gridTemplateColumns:p.compact?'1fr':p.large?'minmax(150px,.72fr) 1fr':'auto 1fr',gap:1,alignItems:p.large?'stretch':'center',direction:'ltr'}}><Box sx={{display:'grid',gridTemplateColumns:'34px minmax(70px,1fr) 34px',border:`2px solid ${C.ink}`,height:p.large?'100%':58,minHeight:p.large?100:58}}><Box onClick={()=>setTarget(v=>Math.max(12,+(v-.5).toFixed(1)))} sx={{cursor:'pointer',display:'grid',placeItems:'center',bgcolor:C.face2,borderRight:`1px solid ${C.ink}`,fontSize:20,fontWeight:950}}>−</Box><Box sx={{display:'grid',placeItems:'center',textAlign:'center'}}><Box><Typography sx={{fontSize:p.large?34:23,fontWeight:950,lineHeight:1}}>{target}°</Typography><Typography sx={{fontSize:7.5,fontWeight:900,color:C.muted}}>SETPOINT</Typography></Box></Box><Box onClick={()=>setTarget(v=>Math.min(32,+(v+.5).toFixed(1)))} sx={{cursor:'pointer',display:'grid',placeItems:'center',bgcolor:C.face2,borderLeft:`1px solid ${C.ink}`,fontSize:20,fontWeight:950}}>+</Box></Box>{!p.compact&&<Box sx={{minWidth:0,minHeight:0,display:'grid',gridTemplateRows:p.large?'auto auto minmax(48px,1fr) auto':'auto auto auto',gap:.6}}><StateFlag text={Math.abs(diff)<1?'AT SETPOINT':diff>0?'HEAT DEMAND':'COOL DEMAND'} tone={Math.abs(diff)<1?'normal':'manual'}/><ScaleBar value={current-12} max={20} setpoint={target-12} tone={Math.abs(diff)<1?'normal':'manual'}/>{p.large&&<Box sx={{minHeight:0,border:`1px solid ${C.line}`,bgcolor:C.face,p:.35}}><TrendPlot values={[21.2,21.3,21.4,21.3,21.5,21.5,21.6,21.6]} tone={Math.abs(diff)<1?'normal':'manual'} tall/></Box>}<Box sx={{display:'grid',gridTemplateColumns:p.large?'repeat(2,1fr)':'1fr',gap:.6}}><Readout label={tr(locale,'ROOM','اتاق')} value={`${current} °C`} accent/>{p.large&&<Readout label="DEVIATION" value={`${diff>=0?'+':''}${diff.toFixed(1)} °C`}/>}</Box></Box>}</Box>;
}

function ColorControl({ locale, size }: Props) {
  const p=profile(size); const presets=['#d94a46','#d48b2c','#4d9d65','#3c83a7','#7867b7','#d04f91']; const [color,setColor]=useState(presets[3]); const [level,setLevel]=useState(72);
  return <Box sx={{height:'100%',minHeight:0,display:'grid',gridTemplateRows:p.large?'minmax(72px,1fr) auto auto auto':'auto auto auto',alignContent:p.large?'stretch':'center',gap:.75,direction:'ltr'}}><Box sx={{height:p.large?'100%':35,minHeight:p.large?72:35,bgcolor:color,border:`2px solid ${C.ink}`,position:'relative'}}><Box sx={{position:'absolute',inset:0,background:'linear-gradient(90deg,rgba(255,255,255,.72),transparent 50%,rgba(0,0,0,.15))'}}/></Box><Box sx={{display:'grid',gridTemplateColumns:`repeat(${presets.length},1fr)`,gap:5}}>{presets.map(x=><Box key={x} onClick={()=>setColor(x)} sx={{height:p.large?27:20,cursor:'pointer',bgcolor:x,border:`${x===color?3:1}px solid ${x===color?C.ink:C.line}`}}/>)}</Box><Box><Box sx={{display:'flex',justifyContent:'space-between'}}><Typography sx={{fontSize:8.5,fontWeight:900,color:C.muted}}>{tr(locale,'BRIGHTNESS','روشنایی')}</Typography><Typography sx={{fontSize:9,fontWeight:900}}>{level}%</Typography></Box><Box component="input" type="range" min="0" max="100" value={level} onChange={(e: { target: { value: string } })=>setLevel(Number(e.target.value))} sx={{width:'100%',accentColor:C.ink}}/></Box>{p.large&&<Box sx={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:.6}}><Readout label="COLOR" value={color.toUpperCase()}/><Readout label="OUTPUT" value={`${level}%`} accent/></Box>}</Box>;
}

function DirectionControl({ locale, size }: Props) {
  const p=profile(size); const [last,setLast]=useState('STOP'); const dirs=[['','N',''],['W','STOP','E'],['','S','']]; const padWidth=p.large?172:p.compact?108:128;
  const pad=<Box sx={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:4,width:padWidth}}>{dirs.flat().map((d,i)=>d?<Box key={i} onClick={()=>setLast(d)} sx={{aspectRatio:'1',cursor:'pointer',display:'grid',placeItems:'center',bgcolor:last===d?(d==='STOP'?C.ink:C.active):C.face,border:`1px solid ${last===d?(d==='STOP'?C.ink:C.active):C.line}`,color:last===d?'#fff':C.ink,fontSize:d==='STOP'?8:12,fontWeight:950}}>{d}</Box>:<Box key={i}/>)}</Box>;
  if(p.large) return <Box sx={{height:'100%',minHeight:0,display:'grid',gridTemplateRows:'minmax(0,1fr) auto',gap:.85,direction:'ltr'}}><Box sx={{minHeight:0,display:'grid',gridTemplateColumns:'1fr 1fr',gap:1.2,alignItems:'center'}}><Box sx={{display:'grid',placeItems:'center'}}>{pad}</Box><Box sx={{borderLeft:`1px solid ${C.line}`,pl:1.2,display:'grid',alignContent:'center',gap:.7}}><Typography sx={{fontSize:8.5,fontWeight:900,color:C.muted}}>{tr(locale,'LAST COMMAND','آخرین فرمان')}</Typography><Typography sx={{fontSize:32,fontWeight:950,lineHeight:.95}}>{last}</Typography><StateFlag text={last==='STOP'?'DRIVE HALTED':'JOG ACTIVE'} tone={last==='STOP'?'normal':'active'}/><Typography sx={{fontSize:8.5,lineHeight:1.5,color:C.muted}}>Momentary PTZ / actuator jog. Command releases automatically after 250 ms.</Typography></Box></Box><Box sx={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:.65}}><Readout label="MODE" value="JOG"/><Readout label="PULSE" value="250 ms"/><Readout label="INTERLOCK" value="CLEAR" accent/></Box></Box>;
  return <Box sx={{height:'100%',display:'grid',gridTemplateColumns:p.wide&&!p.large?'auto 1fr':'1fr',gap:1,placeItems:'center',direction:'ltr'}}>{pad}{!p.compact&&<Box><Typography sx={{fontSize:8.5,fontWeight:900,color:C.muted}}>{tr(locale,'LAST COMMAND','آخرین فرمان')}</Typography><Typography sx={{mt:.25,fontSize:24,fontWeight:950}}>{last}</Typography><Typography sx={{mt:.35,fontSize:8.5,color:C.muted}}>PTZ / JOG · 250 ms</Typography></Box>}</Box>;
}

function TableVisual({ mode, locale, size }: Props & { mode:'table'|'measurement-list'|'alarms'|'events'|'logs' }) {
  const p=profile(size);
  const rows:Record<typeof mode,string[][]>={
    table:[['GW-01','Online','24.8 °C'],['Pump-04','Online','68%'],['Node-18','Sleep','3.8 V'],['Valve-02','Alert','Open']],
    'measurement-list':[['24.8 °C','09:44','OK'],['24.6 °C','09:39','OK'],['24.7 °C','09:34','OK'],['24.4 °C','09:29','OK']],
    alarms:[['Fire sensor','Critical','09:42'],['Door open','Warning','09:17'],['Battery low','Info','08:51']],
    events:[['Valve','Opened','09:41'],['Pump','Started','09:34'],['Mode','Auto','09:12']],
    logs:[['gateway-01','connected','09:44:21'],['pump-04','rpc ack','09:43:12'],['sensor-18','telemetry','09:42:08']],
  };
  const data=rows[mode]; const headers=mode==='table'?['DEVICE','STATE','VALUE']:mode==='measurement-list'?['VALUE','TIME','QC']:mode==='alarms'?['SOURCE','PRIORITY','TIME']:mode==='events'?['ASSET','EVENT','TIME']:['SOURCE','MESSAGE','TIME'];
  const cellTone=(v:string)=>v==='Critical'||v==='Alert'?C.red:v==='Warning'?C.amber:v==='Online'||v==='Started'||v==='Opened'||v==='connected'?C.active:C.ink2;
  const tallFleet = mode==='table' && p.h>=3;
  return <Box sx={{height:'100%',minHeight:0,display:'grid',gridTemplateRows:'auto minmax(0,1fr) auto',gap:.55,direction:'ltr'}}><Box sx={{display:'grid',gridTemplateColumns:'1.15fr .9fr .75fr',bgcolor:C.ink,color:'#fff'}}>{headers.map(x=><Typography key={x} sx={{px:.8,py:.55,fontSize:8,fontWeight:950,letterSpacing:.55}}>{x}</Typography>)}</Box><Box sx={{minHeight:0,border:`1px solid ${C.line}`,borderTop:0,display:'grid',gridTemplateRows:tallFleet?'auto minmax(0,1fr)':'1fr'}}><Box sx={{minHeight:0,display:'grid',gridTemplateRows:tallFleet?`repeat(${data.length},44px)`:`repeat(${data.length},1fr)`}}>{data.map((row,i)=><Box key={i} sx={{display:'grid',gridTemplateColumns:'1.15fr .9fr .75fr',minHeight:34,alignItems:'center',bgcolor:i%2?C.face:'#fff',borderBottom:i<data.length-1?`1px solid ${C.line2}`:'none'}}>{row.map((cell,j)=><Typography key={j} sx={{px:.8,fontSize:p.xl?10.5:9.5,fontWeight:j===0?900:750,color:j===1?cellTone(cell):j===0?C.ink:C.muted,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{cell}</Typography>)}</Box>)}</Box>{tallFleet&&<Box sx={{minHeight:0,borderTop:`1px solid ${C.line}`,p:1,display:'grid',gridTemplateRows:'auto 1fr',gap:.8,bgcolor:C.face}}><Typography sx={{fontSize:8.5,fontWeight:950,color:C.muted,letterSpacing:.5}}>FLEET HEALTH / 24H</Typography><Box sx={{alignSelf:'stretch'}}><TrendPlot values={[91,92,92,94,93,95,96,94,95,97,96,97]} tone="normal" tall/></Box></Box>}</Box><Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><StateFlag text={mode==='alarms'?'3 ACTIVE':`${data.length} ${tr(locale,'ROWS','ردیف')}`} tone={mode==='alarms'?'warning':'normal'}/><Typography sx={{fontSize:8,color:C.muted}}>{p.xl?'AUTO REFRESH · 5s':'LIVE'}</Typography></Box></Box>;
}

function Clock({ locale, size }: Props) {
  const p=profile(size);
  if(p.large) return <Box sx={{height:'100%',minHeight:0,display:'grid',gridTemplateRows:'auto auto minmax(0,1fr) auto',gap:.9,textAlign:'center',direction:'ltr'}}><Box><Typography sx={{fontFamily:'ui-monospace, SFMono-Regular, Menlo, monospace',fontSize:64,fontWeight:800,letterSpacing:'-.065em',lineHeight:.92,color:C.ink}}>09:44</Typography><Typography sx={{mt:.5,fontSize:9.5,fontWeight:900,color:C.muted}}>{tr(locale,'WED · 07 OCT 2026','چهارشنبه · ۱۵ مهر ۱۴۰۵')}</Typography></Box><Box><Box sx={{display:'flex',justifyContent:'space-between',fontSize:8.5,fontWeight:900,color:C.muted}}><span>MINUTE PROGRESS</span><span>44 / 60</span></Box><Box sx={{mt:.35}}><Segments value={44} max={60} count={12} tone="normal" height={10}/></Box></Box><Box sx={{minHeight:0,border:`1px solid ${C.line}`,bgcolor:C.face,display:'grid',gridTemplateColumns:'1fr 1fr',gap:0}}><Box sx={{display:'grid',placeItems:'center',borderRight:`1px solid ${C.line}`}}><Box><Typography sx={{fontSize:9,fontWeight:900,color:C.muted}}>UTC</Typography><Typography sx={{mt:.35,fontFamily:'ui-monospace, SFMono-Regular, Menlo, monospace',fontSize:28,fontWeight:800}}>06:14</Typography></Box></Box><Box sx={{display:'grid',placeItems:'center'}}><Box><Typography sx={{fontSize:9,fontWeight:900,color:C.muted}}>SYNC SOURCE</Typography><Typography sx={{mt:.35,fontSize:21,fontWeight:950,color:C.active}}>NTP LOCK</Typography></Box></Box></Box><Box sx={{width:'100%',display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:.6}}><Readout label="TZ" value="UTC +03:30"/><Readout label="STRATUM" value="2" accent/><Readout label="DRIFT" value="+12 ms"/></Box></Box>;
  return <Box sx={{height:'100%',display:'grid',gridTemplateRows:'1fr',placeItems:'center',textAlign:'center',direction:'ltr'}}><Box><Typography sx={{fontFamily:'ui-monospace, SFMono-Regular, Menlo, monospace',fontSize:p.compact?33:43,fontWeight:800,letterSpacing:'-.065em',lineHeight:.95,color:C.ink}}>09:44</Typography><Typography sx={{mt:.5,fontSize:9.5,fontWeight:900,color:C.muted}}>{tr(locale,'WED · 07 OCT 2026','چهارشنبه · ۱۵ مهر ۱۴۰۵')}</Typography>{!p.compact&&<Box sx={{mt:.9}}><Segments value={44} max={60} count={12} tone="normal" height={6}/></Box>}</Box></Box>;
}

function TextVisual({ locale, size }: Props) {
  const p=profile(size); const rtl=locale==='fa';
  if(p.large) return <Box sx={{height:'100%',minHeight:0,display:'grid',gridTemplateRows:'auto minmax(0,1fr) auto',gap:.9,direction:rtl?'rtl':'ltr',textAlign:rtl?'right':'left'}}><Box><Typography sx={{fontSize:21,fontWeight:950,color:C.ink}}>{tr(locale,'Server room status','وضعیت اتاق سرور')}</Typography><Typography sx={{mt:.45,fontSize:10.5,lineHeight:1.6,color:C.muted}}>{tr(locale,'All sensors are within normal operating limits. Latest telemetry was received less than one minute ago.','همه سنسورها در محدوده عادی هستند. آخرین داده کمتر از یک دقیقه قبل دریافت شده است.')}</Typography></Box><Box sx={{minHeight:0,borderTop:`2px solid ${C.ink}`,borderBottom:`1px solid ${C.line}`,display:'grid',gridTemplateRows:'repeat(3,1fr)',direction:'ltr'}}>{[['ENVIRONMENT','24.8 °C / 46%','NORMAL'],['COOLING','HVAC-02','RUNNING'],['ACCESS','Door contact','SECURE']].map(([a,b,c],i)=><Box key={a} sx={{display:'grid',gridTemplateColumns:'1fr 1fr auto',alignItems:'center',gap:.8,px:.7,bgcolor:i%2?C.face:C.white,borderBottom:i<2?`1px solid ${C.line2}`:'none'}}><Typography sx={{fontSize:8.5,fontWeight:950,color:C.muted}}>{a}</Typography><Typography sx={{fontSize:10,fontWeight:900,color:C.ink}}>{b}</Typography><StateFlag text={c} tone="active"/></Box>)}</Box><Box sx={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:.6,direction:'ltr'}}><Readout label="SENSORS" value="12 / 12" accent/><Readout label="LAST UPDATE" value="38 sec"/><Readout label="ACTIVE ALARMS" value="0"/></Box></Box>;
  return <Box sx={{height:'100%',display:'grid',gridTemplateRows:'auto 1fr',gap:.7,direction:rtl?'rtl':'ltr',textAlign:rtl?'right':'left'}}><Box><Typography sx={{fontSize:17,fontWeight:950,color:C.ink}}>{tr(locale,'Server room status','وضعیت اتاق سرور')}</Typography><Typography sx={{mt:.45,fontSize:10.5,lineHeight:1.6,color:C.muted}}>{tr(locale,'All sensors are within normal operating limits. Latest telemetry was received less than one minute ago.','همه سنسورها در محدوده عادی هستند. آخرین داده کمتر از یک دقیقه قبل دریافت شده است.')}</Typography></Box>{!p.compact&&<Box sx={{alignSelf:'end',display:'grid',gridTemplateColumns:'1fr 1fr',gap:.6,direction:'ltr'}}><Readout label="SENSORS" value="12 / 12" accent/><Readout label="LAST UPDATE" value="38 sec"/></Box>}</Box>;
}

function ImageVisual({ size }: Props) {
  const p=profile(size);
  return <Box sx={{height:'100%',minHeight:0,position:'relative',overflow:'hidden',background:'linear-gradient(150deg,#11191f,#27343d)',border:`1px solid ${C.ink}`,direction:'ltr'}}><Box sx={{position:'absolute',inset:0,opacity:.17,backgroundImage:'linear-gradient(rgba(255,255,255,.2) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.2) 1px,transparent 1px)',backgroundSize:'38px 38px'}}/><Box sx={{position:'absolute',left:'50%',top:0,bottom:0,borderLeft:'1px solid rgba(255,255,255,.22)'}}/><Box sx={{position:'absolute',top:'50%',left:0,right:0,borderTop:'1px solid rgba(255,255,255,.22)'}}/><Box sx={{position:'absolute',left:12,top:10,bgcolor:C.red,color:'#fff',px:.7,py:.35,fontSize:8.5,fontWeight:950}}>REC · LIVE</Box><Box sx={{position:'absolute',right:12,top:10,color:'#fff',fontSize:8.5,fontWeight:900}}>CAM-04 · 1080P</Box><Box sx={{position:'absolute',left:'17%',right:'17%',bottom:'16%',height:p.large?'46%':'38%',border:'2px solid rgba(255,255,255,.28)',clipPath:'polygon(8% 0,92% 0,100% 100%,0 100%)'}}/><Box sx={{position:'absolute',left:10,bottom:8,color:'#fff',fontSize:8.5,fontWeight:800}}>09:44:12 · MOTION: NONE</Box></Box>;
}

function IframeVisual({ locale, size }: Props) {
  const p=profile(size);
  return <Box sx={{height:'100%',border:`1px solid ${C.line}`,display:'grid',gridTemplateRows:'26px 1fr',overflow:'hidden',direction:'ltr'}}><Box sx={{display:'flex',alignItems:'center',gap:4,px:.7,bgcolor:C.ink,color:'#fff'}}><Box sx={{width:7,height:7,bgcolor:C.red}}/><Box sx={{width:7,height:7,bgcolor:C.amber}}/><Box sx={{width:7,height:7,bgcolor:C.normal}}/><Typography sx={{ml:.5,fontSize:8,color:'#dbe2e4'}}>embedded.local/ops</Typography></Box><Box sx={{minHeight:0,display:'grid',gridTemplateColumns:p.large?'70px 1fr':'1fr',bgcolor:C.face}}>{p.large&&<Box sx={{borderRight:`1px solid ${C.line}`,p:.6,display:'grid',alignContent:'start',gap:.45}}>{['OVERVIEW','DEVICES','RULES','LOGS'].map((x,i)=><Box key={x} sx={{px:.55,py:.5,bgcolor:i===0?C.ink:C.white,color:i===0?'#fff':C.muted,border:`1px solid ${i===0?C.ink:C.line}`,fontSize:7.5,fontWeight:900}}>{x}</Box>)}</Box>}<Box sx={{p:.9,minWidth:0,display:'grid',placeItems:'center'}}><Box sx={{textAlign:'center'}}><Typography sx={{fontSize:14,fontWeight:950,color:C.ink}}>{tr(locale,'EXTERNAL OPERATIONS VIEW','نمای عملیاتی خارجی')}</Typography><Typography sx={{mt:.35,fontSize:8.5,color:C.muted}}>iframe / HTML / vendor panel</Typography>{p.large&&<Box sx={{mt:1,display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:.5,textAlign:'left'}}><Readout label="ONLINE" value="18" accent/><Readout label="ALARM" value="2"/><Readout label="LATENCY" value="84 ms"/></Box>}</Box></Box></Box></Box>;
}

function ScadaVisual({ size }: Props) {
  const p=profile(size);
  return <Box sx={{height:'100%',minHeight:0,display:'grid',gridTemplateRows:p.xl?'minmax(0,1fr) auto':'1fr',gap:.7,direction:'ltr'}}><Box sx={{minHeight:0,border:`1px solid ${C.line}`,bgcolor:C.face,overflow:'hidden'}}><svg viewBox="0 0 620 250" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" aria-hidden>
    <defs><marker id="flatFlow" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0 0 L0 6 L6 3 z" fill={C.active}/></marker></defs>
    <rect x="26" y="42" width="124" height="142" fill="#fff" stroke={C.ink2} strokeWidth="2"/><rect x="31" y="95" width="114" height="84" fill="#c8dad7"/><line x1="31" y1="95" x2="145" y2="95" stroke={C.active} strokeWidth="4"/>
    <text x="88" y="72" textAnchor="middle" fill={C.ink} fontSize="13" fontWeight="800">TK-01</text><text x="88" y="128" textAnchor="middle" fill={C.ink} fontSize="27" fontWeight="900">63%</text><text x="88" y="150" textAnchor="middle" fill={C.muted} fontSize="10">1,260 L</text>
    <line x1="150" y1="124" x2="238" y2="124" stroke={C.ink2} strokeWidth="8"/><line x1="173" y1="124" x2="224" y2="124" stroke={C.active} strokeWidth="2" markerEnd="url(#flatFlow)"/>
    <rect x="238" y="91" width="72" height="66" fill="#fff" stroke={C.ink2} strokeWidth="2"/><circle cx="274" cy="124" r="19" fill="#e6edec" stroke={C.active} strokeWidth="3"/><text x="274" y="128" textAnchor="middle" fill={C.ink} fontSize="10" fontWeight="900">P-01</text><text x="274" y="171" textAnchor="middle" fill={C.active} fontSize="9" fontWeight="900">RUN</text>
    <line x1="310" y1="124" x2="402" y2="124" stroke={C.ink2} strokeWidth="8"/><line x1="332" y1="124" x2="388" y2="124" stroke={C.active} strokeWidth="2" markerEnd="url(#flatFlow)"/>
    <rect x="402" y="70" width="96" height="108" fill="#fff" stroke={C.ink2} strokeWidth="2"/><path d="M430 124 L450 106 L470 124 L450 142 Z" fill="#dbe7e5" stroke={C.active} strokeWidth="2"/><text x="450" y="91" textAnchor="middle" fill={C.ink} fontSize="11" fontWeight="900">V-02</text><text x="450" y="160" textAnchor="middle" fill={C.active} fontSize="9" fontWeight="900">OPEN 82%</text>
    <line x1="498" y1="124" x2="590" y2="124" stroke={C.ink2} strokeWidth="8"/><rect x="536" y="88" width="46" height="27" fill="#fff" stroke={C.line}/><text x="559" y="105" textAnchor="middle" fill={C.ink} fontSize="8" fontWeight="900">2.6 bar</text>
    <rect x="164" y="86" width="60" height="26" fill="#fff" stroke={C.line}/><text x="194" y="103" textAnchor="middle" fill={C.ink} fontSize="8" fontWeight="900">18.4 L/m</text>
    {p.xl&&<><line x1="26" y1="204" x2="590" y2="204" stroke={C.line}/><text x="28" y="222" fill={C.muted} fontSize="8">PROCESS LINE A · AUTO · INTERLOCKS CLEAR</text><rect x="505" y="211" width="9" height="9" fill={C.active}/><text x="520" y="220" fill={C.muted} fontSize="8">NORMAL</text></>}
  </svg></Box>{p.xl&&<Box sx={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:.55}}><Readout label="LEVEL" value="63%" accent/><Readout label="FLOW" value="18.4 L/min"/><Readout label="PRESS" value="2.6 bar"/><Readout label="MOTOR" value="1.82 A"/><Readout label="VALVE" value="82% OPEN"/></Box>}</Box>;
}

export function FlatVisualRenderer(props: Props) {
  const v=props.def.visual;
  if(v==='metric') return <Metric {...props}/>;
  if(v==='gauge') return <Gauge {...props}/>;
  if(v==='battery') return <Battery {...props}/>;
  if(v==='signal') return <Signal {...props}/>;
  if(v==='tank') return <Tank {...props}/>;
  if(v==='boolean') return <BooleanStatus {...props}/>;
  if(v==='alarm-indicator') return <AlarmIndicator {...props}/>;
  if(v==='line'||v==='area') return <LineChartVisual {...props}/>;
  if(v==='bar') return <BarVisual {...props}/>;
  if(v==='histogram') return <Histogram {...props}/>;
  if(v==='donut') return <Donut {...props}/>;
  if(v==='heatmap') return <Heatmap {...props}/>;
  if(v==='timeline') return <TimelineVisual {...props}/>;
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
  if(v==='scada') return <ScadaVisual {...props}/>;
  return <Box sx={{height:'100%',display:'grid',placeItems:'center'}}><Typography sx={{fontSize:11,color:C.muted}}>Unsupported industrial visual: {v}</Typography></Box>;
}
