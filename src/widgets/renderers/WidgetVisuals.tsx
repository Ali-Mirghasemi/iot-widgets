import { useMemo, useState } from 'react';
import {
  Box, Button, FormControlLabel, LinearProgress, Slider, Switch, TextField, Typography,
} from '@mui/material';
import type { Locale, WidgetDefinition, WidgetThemeTokens, WidgetSize } from '../core/types';
import { bars, heat, spark, spark2 } from '../data/mockData';
import { MaterialVisualRenderer } from '../themes/MaterialVisuals';
import { MinimalVisualRenderer } from '../themes/MinimalVisuals';
import { IOSVisualRenderer } from '../themes/IOSVisuals';
import { GlassVisualRenderer } from '../themes/GlassVisuals';

interface Props { def: WidgetDefinition; theme: WidgetThemeTokens; locale: Locale; size: WidgetSize; }

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
    compact: area <= 1,
    small: area <= 2,
    medium: area >= 2,
    large: area >= 4,
    tall: h > w,
    wide: w > h,
    showChart: area >= 2,
    showSecondary: area >= 2,
    showDetails: area >= 4 || h >= 2 || w >= 3,
  };
}

function Sparkline({ values = spark, color, fill = false, height = 54 }: { values?: number[]; color: string; fill?: boolean; height?: number }) {
  const points = useMemo(() => {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(1, max - min);
    return values.map((v, i) => `${(i / Math.max(1, values.length - 1)) * 100},${40 - ((v - min) / range) * 32}`).join(' ');
  }, [values]);

  return <svg viewBox="0 0 100 42" preserveAspectRatio="none" width="100%" height={height} aria-hidden>
    {fill && <polygon points={`0,42 ${points} 100,42`} fill={color} opacity=".12" />}
    <polyline points={points} fill="none" stroke={color} strokeWidth="2.4" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
    {values.map((_, i) => i < values.length - 1 ? <line key={i} x1={i * (100 / (values.length - 1))} x2={i * (100 / (values.length - 1))} y1="4" y2="42" stroke="rgba(148,163,184,.12)" strokeWidth=".3" /> : null)}
  </svg>;
}

function MiniProgress({ value, color, muted, max = 100 }: { value: number; color: string; muted: string; max?: number }) {
  const pct = clamp((value / Math.max(1, max)) * 100, 0, 100);
  return <Box sx={{ height: 8, borderRadius: 99, overflow: 'hidden', bgcolor: `${muted}22` }}>
    <Box sx={{ width: `${pct}%`, height: '100%', borderRadius: 99, background: `linear-gradient(90deg, ${color}, ${color}bb)` }} />
  </Box>;
}

function LabeledPill({ label, value, tone, theme }: { label: string; value: string; tone?: 'default' | 'good' | 'warn' | 'danger'; theme: WidgetThemeTokens }) {
  const color = tone === 'good' ? theme.accent : tone === 'warn' ? '#f59e0b' : tone === 'danger' ? '#ef4444' : theme.muted;
  return <Box sx={{ px: 1, py: .7, borderRadius: 2.5, border: `1px solid ${theme.border}`, bgcolor: `${color}10` }}>
    <Typography sx={{ fontSize: 10.5, color: theme.muted, lineHeight: 1 }}>{label}</Typography>
    <Typography sx={{ mt: .25, fontSize: 12.5, fontWeight: 800, lineHeight: 1.15, color }}>{value}</Typography>
  </Box>;
}

function Metric({ def, theme, locale, size }: Props) {
  const profile = sizeProfile(size);
  const value = n(def.mock.value, 24.8);
  const unit = s(def.mock.unit);
  const trend = n(def.mock.trend, 2.4);
  const values = (def.mock.values as number[] | undefined) ?? spark;
  const max = n(def.mock.max, Math.max(100, value * 1.4));
  const pct = clamp((value / Math.max(1, max)) * 100, 2, 100);
  const trendGood = trend >= 0;
  const trendText = `${trendGood ? '↑' : '↓'} ${Math.abs(trend)}%`;

  if (theme.id === 'flat') return <Box sx={{height:'100%',display:'grid',gridTemplateColumns:profile.compact?'1fr':'minmax(0,1.1fr) minmax(80px,.9fr)',gap:1,direction:'ltr'}}>
    <Box sx={{display:'flex',flexDirection:'column',justifyContent:'center',minWidth:0}}>
      <Typography sx={{fontSize:profile.compact?36:42,fontWeight:950,lineHeight:.9,letterSpacing:'-.05em'}}>{value}<Box component="span" sx={{fontSize:14,ml:.55,color:theme.muted,fontWeight:800}}>{unit}</Box></Typography>
      <Box sx={{mt:1,display:'flex',alignItems:'center',gap:.7}}><Box sx={{width:9,height:9,bgcolor:trendGood?theme.accent:'#f59e0b'}}/><Typography sx={{fontSize:11,fontWeight:900,color:trendGood?theme.accent:'#f59e0b'}}>{trendText}</Typography><Typography sx={{fontSize:10.5,color:theme.muted}}>24H</Typography></Box>
      <Box sx={{mt:1.2,height:8,bgcolor:'#e8eeec'}}><Box sx={{height:'100%',width:`${pct}%`,bgcolor:theme.accent}}/></Box>
    </Box>
    {!profile.compact&&<Box sx={{borderLeft:`1px solid ${theme.border}`,pl:1,display:'flex',flexDirection:'column',justifyContent:'center'}}><Typography sx={{fontSize:10,color:theme.muted,fontWeight:800,textTransform:'uppercase'}}>{locale==='fa'?'روند':'trend'}</Typography><Sparkline values={values} color={theme.accent} height={56}/></Box>}
  </Box>;

  if (theme.id === 'minimal') return <Box sx={{height:'100%',display:'flex',flexDirection:'column',justifyContent:'center',direction:'ltr'}}>
    <Box sx={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',gap:1}}><Box><Typography sx={{fontSize:profile.compact?38:46,fontWeight:550,lineHeight:.86,letterSpacing:'-.06em'}}>{value}<Box component="span" sx={{fontSize:13,ml:.55,color:'#9ca3af',fontWeight:600}}>{unit}</Box></Typography><Typography sx={{mt:1,fontSize:10.5,color:'#9ca3af'}}>CURRENT VALUE</Typography></Box><Typography sx={{fontSize:11,fontWeight:750,color:trendGood?'#111827':'#f59e0b'}}>{trendText}</Typography></Box>
    <Box sx={{mt:profile.compact?1.7:2.3,position:'relative',height:16}}><Box sx={{position:'absolute',left:0,right:0,top:7,height:1,bgcolor:'#d1d5db'}}/><Box sx={{position:'absolute',left:0,top:5,width:5,height:5,borderRadius:'50%',bgcolor:'#111827'}}/><Box sx={{position:'absolute',left:`${pct}%`,top:3,width:9,height:9,borderRadius:'50%',bgcolor:'#111827',transform:'translateX(-50%)'}}/><Box sx={{position:'absolute',right:0,top:5,width:5,height:5,borderRadius:'50%',bgcolor:'#d1d5db'}}/></Box>
    {profile.showChart&&<Box sx={{mt:.6}}><Sparkline values={values} color="#111827" height={50}/></Box>}
  </Box>;

  if (theme.id === 'gaming') {
    const segments=12; const lit=Math.round((pct/100)*segments);
    return <Box sx={{height:'100%',display:'flex',flexDirection:'column',justifyContent:'center',direction:'ltr',fontFamily:'inherit'}}>
      <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',gap:1}}><Box><Typography sx={{fontFamily:'inherit',fontSize:10,letterSpacing:1.5,color:'#6f96a0'}}>LIVE_TELEMETRY</Typography><Typography sx={{fontFamily:'inherit',fontSize:profile.compact?34:42,fontWeight:900,lineHeight:.95,letterSpacing:1,color:'#e6fbff',textShadow:'0 0 18px rgba(25,247,255,.18)'}}>{value}<Box component="span" sx={{fontSize:12,ml:.7,color:'#19f7ff'}}>{unit}</Box></Typography></Box><Typography sx={{fontFamily:'inherit',fontSize:11,color:trendGood?'#00ffc8':'#ffb703'}}>{trendText}</Typography></Box>
      <Box sx={{display:'grid',gridTemplateColumns:`repeat(${segments},1fr)`,gap:.45,mt:1.2}}>{Array.from({length:segments}).map((_,i)=><Box key={i} sx={{height:profile.compact?12:15,clipPath:'polygon(0 0,80% 0,100% 50%,80% 100%,0 100%,14% 50%)',bgcolor:i<lit?(i>segments*.75?'#ff3ab8':'#19f7ff'):'rgba(25,247,255,.10)',boxShadow:i<lit?'0 0 10px rgba(25,247,255,.28)':'none'}}/>)}</Box>
      {profile.showChart&&<Box sx={{mt:1,borderTop:'1px dashed rgba(25,247,255,.2)',pt:.4}}><Sparkline values={values} color="#19f7ff" height={48}/></Box>}
    </Box>;
  }

  if (theme.id === 'ios') return <Box sx={{height:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',gap:1.2,direction:'ltr'}}>
    <Box sx={{minWidth:0}}><Typography sx={{fontSize:profile.compact?40:46,fontWeight:760,lineHeight:.88,letterSpacing:'-.055em'}}>{value}<Box component="span" sx={{fontSize:14,ml:.6,color:'#8e8e93',fontWeight:650}}>{unit}</Box></Typography><Box sx={{mt:1,display:'inline-flex',px:.85,py:.4,borderRadius:99,bgcolor:trendGood?'rgba(52,199,89,.12)':'rgba(255,159,10,.12)'}}><Typography sx={{fontSize:11,fontWeight:760,color:trendGood?'#34c759':'#ff9f0a'}}>{trendText} · 24h</Typography></Box>{profile.showChart&&<Box sx={{mt:1,width:profile.large?160:120}}><Sparkline values={values} color={theme.accent} height={46}/></Box>}</Box>
    <Box sx={{width:profile.compact?64:78,height:profile.compact?64:78,borderRadius:'50%',position:'relative',display:'grid',placeItems:'center',background:`conic-gradient(${theme.accent} ${pct*3.6}deg, rgba(142,142,147,.14) 0)`}}><Box sx={{position:'absolute',inset:7,borderRadius:'50%',bgcolor:'rgba(255,255,255,.96)'}}/><Typography sx={{position:'relative',zIndex:1,fontSize:11,fontWeight:800,color:'#8e8e93'}}>{Math.round(pct)}%</Typography></Box>
  </Box>;

  if (theme.id === 'glass') return <Box sx={{height:'100%',display:'grid',gridTemplateColumns:profile.compact?'1fr':'1fr auto',alignItems:'center',gap:1.2,direction:'ltr'}}>
    <Box sx={{minWidth:0}}><Typography sx={{fontSize:profile.compact?38:44,fontWeight:780,lineHeight:.9,letterSpacing:'-.04em',textShadow:'0 6px 22px rgba(0,0,0,.18)'}}>{value}<Box component="span" sx={{fontSize:14,ml:.55,color:'rgba(255,255,255,.65)'}}>{unit}</Box></Typography><Typography sx={{mt:.85,fontSize:11,color:'rgba(255,255,255,.7)'}}>{trendText} · 24h</Typography><Box sx={{mt:1.1,height:6,borderRadius:99,bgcolor:'rgba(255,255,255,.12)',overflow:'hidden'}}><Box sx={{width:`${pct}%`,height:'100%',borderRadius:99,background:`linear-gradient(90deg,${theme.accent},${theme.accent2})`,boxShadow:`0 0 18px ${theme.accent}55`}}/></Box>{profile.showChart&&<Box sx={{mt:.65}}><Sparkline values={values} color={theme.accent} height={46}/></Box>}</Box>
    {!profile.compact&&<Box sx={{width:74,height:74,borderRadius:'50%',display:'grid',placeItems:'center',background:'rgba(255,255,255,.08)',border:'1px solid rgba(255,255,255,.16)',boxShadow:'inset 0 0 24px rgba(255,255,255,.04)'}}><Typography sx={{fontSize:12,fontWeight:800,color:theme.accent}}>LIVE</Typography></Box>}
  </Box>;

  return <Box sx={{height:'100%',display:'flex',flexDirection:'column',justifyContent:'space-between',gap:1,direction:'ltr'}}>
    <Box sx={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:1}}><Box><Typography sx={{fontSize:profile.compact?38:44,fontWeight:850,lineHeight:.9,letterSpacing:'-.045em'}}>{value}<Box component="span" sx={{fontSize:14,ml:.55,color:theme.muted,fontWeight:750}}>{unit}</Box></Typography><Box sx={{mt:.8,display:'inline-flex',px:.8,py:.35,borderRadius:99,bgcolor:trendGood?`${theme.accent}12`:'rgba(245,158,11,.12)'}}><Typography sx={{fontSize:11,fontWeight:800,color:trendGood?theme.accent:'#f59e0b'}}>{trendText} · 24h</Typography></Box></Box>{!profile.compact&&<Typography sx={{fontSize:10.5,color:theme.muted}}>CURRENT</Typography>}</Box>
    <MiniProgress value={value} color={theme.accent} muted={theme.muted} max={max}/>
    {profile.showChart&&<Sparkline values={values} color={theme.accent} fill height={56}/>} 
  </Box>;
}

function Battery({ def, theme, size, locale }: Props) {
  const profile=sizeProfile(size); const value=clamp(n(def.mock.value,76),0,100); const voltage=s(def.mock.voltage,'3.94 V'); const remain=s(def.mock.remaining,'8h 42m');
  const level=value<20?'#ef4444':value<45?'#f59e0b':theme.accent;
  if(theme.id==='minimal') return <Box sx={{height:'100%',display:'flex',flexDirection:'column',justifyContent:'center',direction:'ltr'}}><Box sx={{display:'flex',alignItems:'baseline',justifyContent:'space-between'}}><Typography sx={{fontSize:42,fontWeight:520,letterSpacing:'-.06em'}}>{value}%</Typography><Typography sx={{fontSize:11,color:'#9ca3af'}}>{voltage}</Typography></Box><Box sx={{mt:1.5,height:2,bgcolor:'#e5e7eb'}}><Box sx={{height:'100%',width:`${value}%`,bgcolor:'#111827'}}/></Box><Typography sx={{mt:1,fontSize:10.5,color:'#9ca3af'}}>{locale==='fa'?'زمان تقریبی':'EST.'} {remain}</Typography></Box>;
  if(theme.id==='gaming'){const seg=10,lit=Math.round(value/10);return <Box sx={{height:'100%',display:'flex',flexDirection:'column',justifyContent:'center',direction:'ltr',fontFamily:'inherit'}}><Box sx={{display:'flex',alignItems:'baseline',justifyContent:'space-between'}}><Typography sx={{fontFamily:'inherit',fontSize:36,fontWeight:900,color:'#e6fbff'}}>{value}%</Typography><Typography sx={{fontFamily:'inherit',fontSize:11,color:'#19f7ff'}}>{voltage}</Typography></Box><Box sx={{display:'grid',gridTemplateColumns:`repeat(${seg},1fr)`,gap:.5,mt:1}}>{Array.from({length:seg}).map((_,i)=><Box key={i} sx={{height:22,border:'1px solid rgba(25,247,255,.22)',bgcolor:i<lit?(i<2?'#ff3ab8':'#19f7ff'):'rgba(25,247,255,.05)',boxShadow:i<lit?'0 0 10px rgba(25,247,255,.25)':'none'}}/>)}</Box><Typography sx={{fontFamily:'inherit',fontSize:10,color:'#6f96a0',mt:.8}}>ETA::{remain}</Typography></Box>}
  if(theme.id==='flat') return <Box sx={{height:'100%',display:'flex',flexDirection:'column',justifyContent:'center',gap:1.1,direction:'ltr'}}><Box sx={{display:'flex',alignItems:'baseline',justifyContent:'space-between'}}><Typography sx={{fontSize:36,fontWeight:950}}>{value}%</Typography><Typography sx={{fontSize:11,color:theme.muted,fontWeight:800}}>{voltage}</Typography></Box><Box sx={{height:28,border:'2px solid #152231',position:'relative',p:.35,'&:after':{content:'""',position:'absolute',right:-6,top:6,width:4,height:12,bgcolor:'#152231'}}}><Box sx={{height:'100%',width:`${value}%`,bgcolor:level}}/></Box><Typography sx={{fontSize:10.5,color:theme.muted}}>{remain} remaining</Typography></Box>;
  if(theme.id==='ios') return <Box sx={{height:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:1.5,direction:'ltr'}}><Box sx={{width:profile.compact?84:104,height:profile.compact?44:52,border:'3px solid #1c1c1e',borderRadius:14,p:.45,position:'relative','&:after':{content:'""',position:'absolute',right:-7,top:'30%',width:5,height:'40%',bgcolor:'#1c1c1e',borderRadius:'0 3px 3px 0'}}}><Box sx={{width:`${value}%`,height:'100%',borderRadius:9,bgcolor:level}}/></Box><Box><Typography sx={{fontSize:32,fontWeight:780}}>{value}%</Typography><Typography sx={{fontSize:11,color:'#8e8e93'}}>{voltage} · {remain}</Typography></Box></Box>;
  if(theme.id==='glass') return <Box sx={{height:'100%',display:'grid',placeItems:'center',direction:'ltr'}}><Box sx={{width:'90%',maxWidth:180,p:1.2,borderRadius:4,bgcolor:'rgba(255,255,255,.08)',border:'1px solid rgba(255,255,255,.18)'}}><Box sx={{display:'flex',justifyContent:'space-between',alignItems:'baseline'}}><Typography sx={{fontSize:34,fontWeight:800}}>{value}%</Typography><Typography sx={{fontSize:11,color:'rgba(255,255,255,.68)'}}>{voltage}</Typography></Box><Box sx={{mt:1,height:14,borderRadius:99,bgcolor:'rgba(255,255,255,.12)',overflow:'hidden'}}><Box sx={{height:'100%',width:`${value}%`,borderRadius:99,background:`linear-gradient(90deg,${theme.accent},${theme.accent2})`,boxShadow:`0 0 20px ${theme.accent}55`}}/></Box><Typography sx={{mt:.8,fontSize:10.5,color:'rgba(255,255,255,.65)'}}>{remain} left</Typography></Box></Box>;
  return <Box sx={{height:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:1.4,direction:'ltr'}}><Box sx={{width:profile.compact?94:118,height:profile.compact?48:58,border:`3px solid ${theme.foreground}`,borderRadius:12,p:.45,position:'relative','&:after':{content:'""',position:'absolute',right:-7,top:'30%',width:5,height:'40%',bgcolor:theme.foreground,borderRadius:'0 3px 3px 0'}}}><Box sx={{width:`${value}%`,height:'100%',borderRadius:8,background:`linear-gradient(90deg,${level},${level}cc)`}}/></Box><Box><Typography sx={{fontSize:32,fontWeight:850}}>{value}%</Typography><Typography sx={{fontSize:11,color:theme.muted}}>{voltage}</Typography></Box></Box>;
}

function Signal({ def, theme, size }: Props) {
  const profile = sizeProfile(size);
  const value = n(def.mock.value, -72);
  const barsOn = value > -60 ? 5 : value > -70 ? 4 : value > -80 ? 3 : value > -90 ? 2 : 1;
  return <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: .9, direction: 'ltr' }}>
    <Box sx={{ display: 'flex', alignItems: 'end', gap: .72, height: profile.large ? 74 : 62 }}>
      {[1,2,3,4,5].map(i => <Box key={i} sx={{ width: profile.compact ? 10 : 12, height: 8 + i * (profile.large ? 11 : 9), borderRadius: '4px 4px 2px 2px', bgcolor: i <= barsOn ? theme.accent : `${theme.muted}30`, boxShadow: i <= barsOn ? `0 8px 18px ${theme.accent}20` : 'none' }} />)}
    </Box>
    <Typography sx={{ fontSize: profile.large ? 32 : 28, fontWeight: 850 }}>{value} dBm</Typography>
    <Typography variant="caption" sx={{ color: theme.muted }}>{s(def.mock.network, 'LTE · RSRP')}</Typography>
  </Box>;
}

function Tank({ def, theme, size }: Props) {
  const profile = sizeProfile(size);
  const value = clamp(n(def.mock.value, 63), 0, 100);

  return <Box sx={{ height: '100%', display: 'flex', flexDirection: profile.compact || profile.tall ? 'column' : 'row', alignItems: 'center', justifyContent: 'center', gap: 1.6, px: .5, direction: 'ltr' }}>
    <Box sx={{ width: profile.large ? 92 : 76, height: profile.large ? 126 : 106, border: `2px solid ${theme.border}`, borderRadius: 4, p: .6, display: 'flex', alignItems: 'end', overflow: 'hidden', boxShadow: `inset 0 0 0 1px ${theme.border}` }}>
      <Box sx={{ width: '100%', height: `${value}%`, bgcolor: theme.accent, opacity: .9, borderRadius: '10px 10px 18px 18px', position: 'relative', '&:before': { content: '""', position: 'absolute', left: 0, right: 0, top: -5, height: 10, bgcolor: theme.accent, borderRadius: '50%', opacity: .8 } }} />
    </Box>
    <Box sx={{ textAlign: profile.tall || profile.compact ? 'center' : 'left' }}>
      <Typography sx={{ fontSize: profile.large ? 36 : 32, fontWeight: 850 }}>{value}%</Typography>
      <Typography variant="body2" sx={{ color: theme.muted }}>{s(def.mock.liters, '1,260 L')}</Typography>
      {!profile.compact && <Typography variant="caption" sx={{ color: theme.muted }}>level</Typography>}
    </Box>
  </Box>;
}

function BooleanStatus({ def, theme, locale, size }: Props) {
  const profile=sizeProfile(size); const [on,setOn]=useState(Boolean(def.mock.value??true)); const label=on?(locale==='fa'?'فعال':'Active'):(locale==='fa'?'غیرفعال':'Inactive');
  if(theme.id==='gaming') return <Box sx={{height:'100%',display:'grid',placeItems:'center',fontFamily:'inherit'}}><Box onClick={()=>setOn(v=>!v)} sx={{cursor:'pointer',width:88,height:88,display:'grid',placeItems:'center',clipPath:'polygon(14% 0,86% 0,100% 14%,100% 86%,86% 100%,14% 100%,0 86%,0 14%)',border:'1px solid rgba(25,247,255,.35)',background:on?'rgba(25,247,255,.12)':'rgba(255,58,184,.08)',boxShadow:on?'0 0 26px rgba(25,247,255,.18)':'none'}}><Box sx={{width:34,height:34,borderRadius:'50%',border:`3px solid ${on?'#19f7ff':'#ff3ab8'}`,boxShadow:on?'0 0 18px rgba(25,247,255,.5)':'0 0 18px rgba(255,58,184,.25)'}}/></Box><Typography sx={{fontFamily:'inherit',fontSize:12,letterSpacing:1.5,color:on?'#19f7ff':'#ff3ab8'}}>{label.toUpperCase()}</Typography></Box>;
  if(theme.id==='ios') return <Box sx={{height:'100%',display:'grid',placeItems:'center',textAlign:'center'}}><Box onClick={()=>setOn(v=>!v)} sx={{cursor:'pointer',width:profile.compact?74:86,height:profile.compact?74:86,borderRadius:22,display:'grid',placeItems:'center',bgcolor:on?theme.accent:'rgba(142,142,147,.13)',boxShadow:on?`0 16px 30px ${theme.accent}28`:'none'}}><Box sx={{width:30,height:30,borderRadius:'50%',bgcolor:on?'#fff':'#8e8e93'}}/></Box><Typography sx={{mt:.8,fontSize:13,fontWeight:750,color:on?theme.accent:'#8e8e93'}}>{label}</Typography></Box>;
  if(theme.id==='minimal') return <Box sx={{height:'100%',display:'flex',flexDirection:'column',justifyContent:'center'}}><Typography onClick={()=>setOn(v=>!v)} sx={{cursor:'pointer',fontSize:profile.compact?32:38,fontWeight:500,letterSpacing:'-.04em'}}>{on?'ON':'OFF'}</Typography><Box sx={{mt:1,width:'100%',height:1,bgcolor:on?'#111827':'#d1d5db'}}/><Typography sx={{mt:.8,fontSize:10.5,color:'#9ca3af'}}>{label}</Typography></Box>;
  return <Box sx={{height:'100%',display:'grid',placeItems:'center',textAlign:'center'}}><Box onClick={()=>setOn(v=>!v)} sx={{cursor:'pointer',width:profile.large?92:80,height:profile.large?92:80,borderRadius:'50%',display:'grid',placeItems:'center',bgcolor:on?`${theme.accent}16`:`${theme.muted}13`,border:`1px solid ${on?theme.accent:theme.border}`,boxShadow:on?`0 0 0 10px ${theme.accent}0b,0 0 28px ${theme.accent}20`:'none'}}><Box sx={{width:30,height:30,borderRadius:'50%',bgcolor:on?theme.accent:theme.muted}}/></Box><Typography sx={{fontSize:18,fontWeight:850}}>{label}</Typography></Box>;
}

function Gauge({ def, theme, locale, size }: Props) {
  const profile=sizeProfile(size); const value=n(def.mock.value,68); const max=n(def.mock.max,100); const pct=clamp(value/Math.max(1,max),0,1); const unit=s(def.mock.unit); const warn=pct>.78; const danger=pct>.9; const tone=danger?'#ef4444':warn?'#f59e0b':theme.accent;
  if(theme.id==='flat') return <Box sx={{height:'100%',display:'flex',flexDirection:'column',justifyContent:'center',direction:'ltr'}}><Box sx={{display:'flex',alignItems:'baseline',justifyContent:'space-between'}}><Typography sx={{fontSize:36,fontWeight:950}}>{value}<Box component="span" sx={{fontSize:13,ml:.5,color:theme.muted}}>{unit}</Box></Typography><Typography sx={{fontSize:10.5,fontWeight:900,color:tone}}>{danger?'CRITICAL':warn?'WARNING':'NORMAL'}</Typography></Box><Box sx={{mt:1.2,height:20,display:'grid',gridTemplateColumns:'repeat(10,1fr)',gap:3}}>{Array.from({length:10}).map((_,i)=><Box key={i} sx={{bgcolor:i<Math.ceil(pct*10)?(i>7?'#ef4444':i>5?'#f59e0b':theme.accent):'#e8eeec'}}/>)}</Box><Box sx={{mt:.8,display:'flex',justifyContent:'space-between',fontSize:10,color:theme.muted}}><span>0</span><span>{max}</span></Box></Box>;
  if(theme.id==='minimal') return <Box sx={{height:'100%',display:'flex',flexDirection:'column',justifyContent:'center',direction:'ltr'}}><Box sx={{display:'flex',alignItems:'baseline',gap:.5}}><Typography sx={{fontSize:42,fontWeight:520,letterSpacing:'-.05em'}}>{value}</Typography><Typography sx={{fontSize:12,color:'#9ca3af'}}>{unit}</Typography></Box><Box sx={{mt:1.6,position:'relative',height:18}}><Box sx={{position:'absolute',left:0,right:0,top:8,height:1,bgcolor:'#d1d5db'}}/><Box sx={{position:'absolute',left:`${pct*100}%`,top:2,width:2,height:13,bgcolor:'#111827'}}/>{[0,.25,.5,.75,1].map((t,i)=><Box key={i} sx={{position:'absolute',left:`${t*100}%`,top:6,width:1,height:5,bgcolor:'#9ca3af'}}/>)}</Box><Typography sx={{fontSize:10.5,color:'#9ca3af'}}>{danger?'Critical range':warn?'Approaching limit':'Within range'}</Typography></Box>;
  if(theme.id==='gaming'){const seg=18,lit=Math.round(pct*seg);return <Box sx={{height:'100%',display:'flex',flexDirection:'column',justifyContent:'center',direction:'ltr',fontFamily:'inherit'}}><Box sx={{display:'flex',alignItems:'baseline',justifyContent:'space-between'}}><Typography sx={{fontFamily:'inherit',fontSize:36,fontWeight:900}}>{value}<Box component="span" sx={{fontSize:11,ml:.6,color:'#19f7ff'}}>{unit}</Box></Typography><Typography sx={{fontFamily:'inherit',fontSize:9.5,letterSpacing:1.1,color:tone}}>LIMIT::{Math.round(pct*100)}%</Typography></Box><Box sx={{display:'grid',gridTemplateColumns:`repeat(${seg},1fr)`,gap:.3,mt:1}}>{Array.from({length:seg}).map((_,i)=><Box key={i} sx={{height:22,transform:'skewX(-12deg)',bgcolor:i<lit?(i>seg*.82?'#ff3ab8':'#19f7ff'):'rgba(25,247,255,.08)',boxShadow:i<lit?'0 0 8px rgba(25,247,255,.22)':'none'}}/>)}</Box></Box>}
  if(theme.id==='ios'){const c=2*Math.PI*44;return <Box sx={{height:'100%',display:'grid',placeItems:'center',direction:'ltr'}}><Box sx={{position:'relative',width:profile.compact?126:150,height:profile.compact?126:150}}><svg viewBox="0 0 120 120" width="100%" height="100%"><circle cx="60" cy="60" r="44" fill="none" stroke="rgba(142,142,147,.12)" strokeWidth="12"/><circle cx="60" cy="60" r="44" fill="none" stroke={tone} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${c*pct} ${c}`} transform="rotate(-90 60 60)"/></svg><Box sx={{position:'absolute',inset:0,display:'grid',placeItems:'center',textAlign:'center'}}><Box><Typography sx={{fontSize:30,fontWeight:780}}>{value}</Typography><Typography sx={{fontSize:11,color:'#8e8e93'}}>{unit}</Typography></Box></Box></Box></Box>}
  if(theme.id==='glass'){const c=2*Math.PI*43;return <Box sx={{height:'100%',display:'grid',placeItems:'center',direction:'ltr'}}><Box sx={{position:'relative',width:profile.compact?132:156,height:profile.compact?132:156,filter:'drop-shadow(0 12px 24px rgba(0,0,0,.15))'}}><svg viewBox="0 0 120 120" width="100%" height="100%"><defs><linearGradient id={`g-${def.id}`} x1="0" x2="1"><stop offset="0" stopColor={theme.accent}/><stop offset="1" stopColor={theme.accent2}/></linearGradient></defs><circle cx="60" cy="60" r="43" fill="rgba(255,255,255,.05)" stroke="rgba(255,255,255,.13)" strokeWidth="12"/><circle cx="60" cy="60" r="43" fill="none" stroke={`url(#g-${def.id})`} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${c*pct} ${c}`} transform="rotate(-90 60 60)"/></svg><Box sx={{position:'absolute',inset:0,display:'grid',placeItems:'center',textAlign:'center'}}><Box><Typography sx={{fontSize:30,fontWeight:800}}>{value}</Typography><Typography sx={{fontSize:11,color:'rgba(255,255,255,.62)'}}>{unit}</Typography></Box></Box></Box></Box>}
  const angle=-120+pct*240,r=54,c=2*Math.PI*r,visible=c*.67; return <Box sx={{height:'100%',display:'grid',placeItems:'center',direction:'ltr'}}><Box sx={{width:'100%',maxWidth:profile.large?240:205}}><svg viewBox="0 0 160 126" width="100%"><circle cx="80" cy="80" r={r} fill="none" stroke={`${theme.muted}24`} strokeWidth="13" strokeLinecap="round" strokeDasharray={`${visible} ${c}`} transform="rotate(150 80 80)"/><circle cx="80" cy="80" r={r} fill="none" stroke={tone} strokeWidth="13" strokeLinecap="round" strokeDasharray={`${visible*pct} ${c}`} transform="rotate(150 80 80)"/><line x1="80" y1="80" x2={80+43*Math.cos(angle*Math.PI/180)} y2={80+43*Math.sin(angle*Math.PI/180)} stroke={theme.foreground} strokeWidth="3" strokeLinecap="round"/><circle cx="80" cy="80" r="5" fill={theme.foreground}/><text x="80" y="112" textAnchor="middle" fill={theme.foreground} fontSize="20" fontWeight="800">{value}{unit}</text></svg></Box></Box>;
}

function LineChartVisual({ def, theme, size }: Props) {
  const profile = sizeProfile(size);
  const values = (def.mock.values as number[] | undefined) ?? spark;
  const summary = s(def.mock.summary, '24.8 °C');

  return <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', direction: 'ltr', gap: 1 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}>
      <Typography sx={{ fontWeight: 850, fontSize: profile.large ? 28 : 24 }}>{summary}</Typography>
      <Box sx={{ px: 1, py: .45, borderRadius: 99, border: `1px solid ${theme.border}`, color: theme.muted, fontSize: 10.5 }}>24h</Box>
    </Box>
    <Box sx={{ flex: 1, minHeight: profile.large ? 130 : 92, display: 'flex', alignItems: 'end' }}>
      <Sparkline values={values} color={theme.accent} fill={def.visual === 'area'} height={profile.large ? 110 : 76} />
    </Box>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', color: theme.muted, fontSize: 11 }}><span>00</span><span>06</span><span>12</span><span>18</span><span>24</span></Box>
  </Box>;
}

function BarVisual({ def, theme, size }: Props) {
  const profile = sizeProfile(size);
  const values = (def.mock.values as number[] | undefined) ?? bars;
  return <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', direction: 'ltr', gap: 1 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}><Typography sx={{ fontWeight: 800 }}>{s(def.mock.summary, 'Weekly total')}</Typography><Typography variant="caption" sx={{ color: theme.muted }}>7d</Typography></Box>
    <Box sx={{ flex: 1, display: 'flex', alignItems: 'end', gap: .9, px: .5 }}>
      {values.map((v, i) => <Box key={i} sx={{ flex: 1, height: `${Math.max(10, v)}%`, minHeight: 18, background: i === values.length - 2 ? `linear-gradient(180deg, ${theme.accent2}, ${theme.accent2}aa)` : `linear-gradient(180deg, ${theme.accent}, ${theme.accent}aa)`, opacity: .5 + i / values.length * .45, borderRadius: '8px 8px 3px 3px', boxShadow: profile.large ? `0 8px 20px ${theme.accent}12` : 'none' }} />)}
    </Box>
  </Box>;
}

function Histogram({ theme }: Props) {
  const values = [2,5,9,15,20,17,12,8,4,2];
  return <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: .9, direction: 'ltr' }}>
    <Typography sx={{ fontWeight: 800 }}>Distribution</Typography>
    <Box sx={{ flex: 1, display: 'flex', alignItems: 'end', px: .8 }}>
      {values.map((v, i) => <Box key={i} sx={{ flex: 1, height: `${v * 4}%`, maxHeight: '92%', minHeight: 5, bgcolor: theme.accent, opacity: .28 + (v / 20) * .72, borderRadius: '5px 5px 0 0' }} />)}
    </Box>
  </Box>;
}

function Donut({ def, theme, size }: Props) {
  const profile = sizeProfile(size);
  const value = n(def.mock.value, 72);
  const c = 2 * Math.PI * 42;
  return <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', direction: 'ltr' }}><svg viewBox="0 0 120 120" width={profile.large ? 170 : 146} height={profile.large ? 170 : 146}>
    <circle cx="60" cy="60" r="42" fill="none" stroke={`${theme.muted}25`} strokeWidth="15" />
    <circle cx="60" cy="60" r="42" fill="none" stroke={theme.accent} strokeWidth="15" strokeLinecap="round" strokeDasharray={`${c * value / 100} ${c}`} transform="rotate(-90 60 60)" />
    <text x="60" y="58" textAnchor="middle" dominantBaseline="middle" fill={theme.foreground} fontSize="23" fontWeight="800">{value}%</text>
    <text x="60" y="78" textAnchor="middle" fill={theme.muted} fontSize="11">Used</text>
  </svg></Box>;
}

function Heatmap({ theme, size }: Props) {
  const profile = sizeProfile(size);
  return <Box sx={{ height: '100%', display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: .55, alignContent: 'center' }}>
    {heat.flat().map((v, i) => <Box key={i} sx={{ aspectRatio: '1 / 1', borderRadius: 1.4, bgcolor: `rgba(16,185,129,${0.1 + v / 100 * 0.9})`, border: `1px solid ${theme.border}` }} />)}
    {profile.large && <Box sx={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'space-between', color: theme.muted, fontSize: 10.5, mt: .4 }}><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span></Box>}
  </Box>;
}

function TimelineVisual({ theme }: Props) {
  const rows = [
    { name: 'Line 1', segments: ['#10b981', '#10b981', '#f59e0b', '#10b981', '#ef4444'] },
    { name: 'Line 2', segments: ['#10b981', '#10b981', '#10b981', '#64748b', '#10b981'] },
    { name: 'Pump', segments: ['#64748b', '#10b981', '#10b981', '#10b981', '#f59e0b'] },
  ];
  return <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 1.1, direction: 'ltr' }}>
    {rows.map((row, idx) => <Box key={idx} sx={{ display: 'grid', gridTemplateColumns: '62px 1fr', gap: 1, alignItems: 'center' }}>
      <Typography variant="caption" sx={{ color: theme.muted }}>{row.name}</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: .5 }}>
        {row.segments.map((seg, i) => <Box key={i} sx={{ height: 14, borderRadius: 1.2, bgcolor: seg }} />)}
      </Box>
    </Box>)}
    <Box sx={{ display: 'flex', justifyContent: 'space-between', color: theme.muted, fontSize: 10.5, mt: 'auto' }}><span>00</span><span>06</span><span>12</span><span>18</span><span>24</span></Box>
  </Box>;
}

function MapVisual({ theme, size }: Props) {
  const profile = sizeProfile(size);
  return <Box sx={{ height: '100%', borderRadius: 3, overflow: 'hidden', position: 'relative', border: `1px solid ${theme.border}`, background: 'linear-gradient(180deg, rgba(226,232,240,.65), rgba(241,245,249,.92))' }}>
    <Box sx={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(transparent 0 94%, rgba(148,163,184,.12) 94%), linear-gradient(90deg, transparent 0 94%, rgba(148,163,184,.12) 94%)', backgroundSize: '48px 48px' }} />
    <svg viewBox="0 0 300 180" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
      <path d="M10 125 C 55 80, 95 82, 136 118 S 224 156, 290 92" fill="none" stroke={theme.accent} strokeWidth="4" strokeLinecap="round" strokeDasharray="1 0" />
      {[{ x: 72, y: 96 }, { x: 134, y: 118 }, { x: 214, y: 126 }].map((p, i) => <g key={i}><circle cx={p.x} cy={p.y} r="8" fill={theme.accent} opacity=".18" /><circle cx={p.x} cy={p.y} r="5" fill={theme.accent} /></g>)}
    </svg>
    <Box sx={{ position: 'absolute', left: 10, bottom: 10, px: 1.1, py: .65, borderRadius: 2, bgcolor: 'rgba(255,255,255,.84)', backdropFilter: 'blur(8px)', boxShadow: '0 8px 24px rgba(15,23,42,.10)' }}>
      <Typography sx={{ fontSize: 11, fontWeight: 800 }}>{profile.large ? 'Fleet · 3 devices' : '3 devices'}</Typography>
    </Box>
  </Box>;
}

function Coordinates({ def, theme, locale }: Props) {
  return <Box sx={{ height: '100%', display: 'grid', alignContent: 'center', gap: 1.05, direction: 'ltr' }}>
    <LabeledPill label="Lat" value={s(def.mock.lat, '35.7219° N')} theme={theme} />
    <LabeledPill label="Lng" value={s(def.mock.lng, '51.3347° E')} theme={theme} />
    <LabeledPill label={locale === 'fa' ? 'دقت' : 'Accuracy'} value={s(def.mock.accuracy, '4.2 m')} theme={theme} />
  </Box>;
}

function Compass({ def, theme }: Props) {
  const value = n(def.mock.value, 327);
  return <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', direction: 'ltr' }}>
    <Box sx={{ width: 138, height: 138, borderRadius: '50%', border: `1px solid ${theme.border}`, position: 'relative', display: 'grid', placeItems: 'center' }}>
      <Typography sx={{ position: 'absolute', top: 8, fontSize: 12, color: theme.muted }}>N</Typography>
      <Typography sx={{ position: 'absolute', right: 10, fontSize: 12, color: theme.muted }}>E</Typography>
      <Typography sx={{ position: 'absolute', bottom: 8, fontSize: 12, color: theme.muted }}>S</Typography>
      <Typography sx={{ position: 'absolute', left: 10, fontSize: 12, color: theme.muted }}>W</Typography>
      <Box sx={{ width: 3, height: 52, borderRadius: 99, bgcolor: theme.accent, transform: `rotate(${value}deg)`, transformOrigin: 'center', position: 'absolute' }} />
      <Box sx={{ textAlign: 'center' }}><Typography sx={{ fontSize: 28, fontWeight: 850 }}>{value}°</Typography><Typography variant="caption" sx={{ color: theme.muted }}>heading</Typography></Box>
    </Box>
  </Box>;
}

function ButtonControl({ theme, locale, size }: Props) {
  const profile = sizeProfile(size);
  const [sent, setSent] = useState(false);
  return <Box sx={{ height: '100%', display: 'grid', placeItems: 'center' }}>
    <Box sx={{ width: '100%', textAlign: 'center' }}>
      <Button variant="contained" onClick={() => { setSent(true); setTimeout(() => setSent(false), 1200); }} sx={{ minWidth: profile.compact ? 118 : 156, py: profile.compact ? 1.05 : 1.2, borderRadius: 3.2, background: `linear-gradient(135deg, ${theme.accent}, ${theme.accent2})`, boxShadow: `0 14px 32px ${theme.accent}26` }}>
        {locale === 'fa' ? 'ارسال فرمان' : 'Send command'}
      </Button>
      <Typography variant="caption" sx={{ display: 'block', mt: 1.15, color: sent ? theme.accent : theme.muted }}>{sent ? (locale === 'fa' ? 'فرمان ارسال شد' : 'Command queued') : (locale === 'fa' ? 'آماده ارسال' : 'Ready')}</Typography>
    </Box>
  </Box>;
}

function SwitchControl({ theme, locale, size }: Props) {
  const profile=sizeProfile(size); const [checked,setChecked]=useState(true);
  if(theme.id==='flat') return <Box sx={{height:'100%',display:'grid',placeItems:'center'}}><Box onClick={()=>setChecked(v=>!v)} sx={{cursor:'pointer',width:profile.compact?124:150,height:48,display:'grid',gridTemplateColumns:'1fr 1fr',border:'2px solid #152231'}}><Box sx={{display:'grid',placeItems:'center',bgcolor:checked?theme.accent:'transparent',color:checked?'#fff':theme.muted,fontWeight:900}}>ON</Box><Box sx={{display:'grid',placeItems:'center',bgcolor:!checked?'#152231':'transparent',color:!checked?'#fff':theme.muted,fontWeight:900}}>OFF</Box></Box></Box>;
  if(theme.id==='minimal') return <Box sx={{height:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',gap:1}}><Box><Typography sx={{fontSize:30,fontWeight:500}}>{checked?'ON':'OFF'}</Typography><Typography sx={{fontSize:10.5,color:'#9ca3af'}}>{locale==='fa'?'خروجی':'OUTPUT'}</Typography></Box><Box onClick={()=>setChecked(v=>!v)} sx={{cursor:'pointer',width:48,height:24,borderBottom:'1px solid #111827',position:'relative'}}><Box sx={{position:'absolute',left:checked?29:1,top:6,width:16,height:16,borderRadius:'50%',bgcolor:'#111827',transition:'.2s'}}/></Box></Box>;
  if(theme.id==='gaming') return <Box sx={{height:'100%',display:'grid',placeItems:'center',fontFamily:'inherit'}}><Box onClick={()=>setChecked(v=>!v)} sx={{cursor:'pointer',width:90,height:90,borderRadius:'50%',display:'grid',placeItems:'center',border:`2px solid ${checked?'#19f7ff':'#ff3ab8'}`,boxShadow:checked?'0 0 30px rgba(25,247,255,.18)':'0 0 24px rgba(255,58,184,.12)',background:'radial-gradient(circle,rgba(25,247,255,.08),transparent 68%)'}}><Typography sx={{fontFamily:'inherit',fontSize:13,letterSpacing:1.3,color:checked?'#19f7ff':'#ff3ab8'}}>{checked?'ARMED':'OFFLINE'}</Typography></Box></Box>;
  if(theme.id==='ios') return <Box sx={{height:'100%',display:'grid',placeItems:'center'}}><Box><Switch checked={checked} onChange={(_,v)=>setChecked(v)} sx={{transform:'scale(1.5)','& .MuiSwitch-switchBase.Mui-checked':{color:'#fff'},'& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':{backgroundColor:'#34c759',opacity:1},'& .MuiSwitch-track':{backgroundColor:'#c7c7cc',opacity:1}}}/><Typography sx={{mt:1.1,textAlign:'center',fontSize:12,fontWeight:700,color:checked?'#34c759':'#8e8e93'}}>{checked?(locale==='fa'?'روشن':'On'):(locale==='fa'?'خاموش':'Off')}</Typography></Box></Box>;
  if(theme.id==='glass') return <Box sx={{height:'100%',display:'grid',placeItems:'center'}}><Box onClick={()=>setChecked(v=>!v)} sx={{cursor:'pointer',width:108,height:54,borderRadius:99,p:.55,background:'rgba(255,255,255,.09)',border:'1px solid rgba(255,255,255,.18)',boxShadow:'inset 0 0 18px rgba(255,255,255,.04)'}}><Box sx={{width:44,height:44,borderRadius:'50%',transform:`translateX(${checked?52:0}px)`,transition:'.22s',background:checked?`linear-gradient(145deg,${theme.accent},${theme.accent2})`:'rgba(255,255,255,.28)',boxShadow:checked?`0 0 24px ${theme.accent}55`:'none'}}/></Box></Box>;
  return <Box sx={{height:'100%',display:'grid',placeItems:'center'}}><Box sx={{textAlign:'center'}}><Switch checked={checked} onChange={(_,v)=>setChecked(v)} sx={{transform:'scale(1.35)','& .MuiSwitch-switchBase.Mui-checked':{color:theme.accent},'& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':{backgroundColor:theme.accent}}}/><Typography sx={{mt:1,fontWeight:850}}>{checked?(locale==='fa'?'روشن':'ON'):(locale==='fa'?'خاموش':'OFF')}</Typography></Box></Box>;
}

function SliderControl({ def, theme, size }: Props) {
  const profile = sizeProfile(size);
  const [value, setValue] = useState(n(def.mock.value, 65));
  return <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', px: 1.2, direction: 'ltr', gap: 1 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><Typography sx={{ fontSize: profile.large ? 34 : 30, fontWeight: 850 }}>{value}<small style={{ fontSize: 14 }}> {s(def.mock.unit, '%')}</small></Typography><Typography variant="caption" sx={{ color: theme.muted }}>{s(def.mock.range, '0 — 100')}</Typography></Box>
    <Slider value={value} onChange={(_, v) => setValue(v as number)} sx={{ color: theme.accent, '& .MuiSlider-thumb': { boxShadow: `0 0 0 8px ${theme.accent}18` } }} />
    {!profile.compact && <MiniProgress value={value} color={theme.accent} muted={theme.muted} />}
  </Box>;
}

function InputControl({ def, theme, locale }: Props) {
  const [value, setValue] = useState(String(def.mock.value ?? '22.5'));
  return <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', px: 1.2 }}><TextField value={value} onChange={e => setValue(e.target.value)} label={locale === 'fa' ? 'مقدار هدف' : 'Target value'} size="small" fullWidth inputProps={{ dir: 'ltr' }} sx={{ '& .MuiOutlinedInput-root': { color: theme.foreground, borderRadius: 2.6 }, '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.border }, '& .MuiInputLabel-root': { color: theme.muted } }} /></Box>;
}

function Thermostat({ def, theme, size }: Props) {
  const profile = sizeProfile(size);
  const [value, setValue] = useState(n(def.mock.value, 22));
  const diameter = profile.large ? 172 : 148;
  return <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', direction: 'ltr' }}>
    <Box sx={{ width: diameter, height: diameter, borderRadius: '50%', border: `10px solid ${theme.accent}24`, display: 'grid', placeItems: 'center', boxShadow: `inset 0 0 0 2px ${theme.border}` }}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography sx={{ fontSize: profile.large ? 40 : 34, fontWeight: 850 }}>{value}°</Typography>
        <Typography variant="caption" sx={{ color: theme.muted }}>SETPOINT</Typography>
        <Slider min={16} max={30} value={value} onChange={(_, v) => setValue(v as number)} size="small" sx={{ width: 94, color: theme.accent, mt: .7 }} />
      </Box>
    </Box>
  </Box>;
}

function ColorControl({ theme, locale, size }: Props) {
  const profile=sizeProfile(size); const [hue,setHue]=useState(188); const [brightness,setBrightness]=useState(78); const [on,setOn]=useState(true);
  const preview=on?`hsl(${hue} 86% ${brightness/1.7}%)`:'#374151'; const presets=[0,36,120,188,265,315];
  const radius=theme.id==='flat'?1:theme.id==='gaming'?0:theme.id==='ios'?4:3;
  return <Box sx={{height:'100%',display:'flex',flexDirection:'column',justifyContent:'center',gap:profile.compact?.85:1.05,direction:'ltr'}}>
    <Box onClick={()=>setOn(v=>!v)} sx={{cursor:'pointer',height:profile.large?82:62,borderRadius:radius,background:preview,boxShadow:on?`0 16px 34px hsl(${hue} 80% 55% / .25)`:'none',position:'relative',overflow:'hidden',border:theme.id==='gaming'?'1px solid rgba(25,247,255,.26)':`1px solid ${theme.border}`}}><Box sx={{position:'absolute',inset:0,background:'radial-gradient(circle at 28% 15%,rgba(255,255,255,.5),transparent 32%)'}}/><Typography sx={{position:'absolute',left:10,bottom:8,fontSize:11,fontWeight:850,color:'#fff'}}>{on?(locale==='fa'?'روشن':'ON'):(locale==='fa'?'خاموش':'OFF')}</Typography><Typography sx={{position:'absolute',right:10,bottom:8,fontSize:10.5,color:'rgba(255,255,255,.82)'}}>{brightness}%</Typography></Box>
    <Box sx={{display:'flex',gap:.65,justifyContent:'space-between'}}>{presets.map(p=><Box key={p} onClick={()=>{setHue(p);setOn(true)}} sx={{cursor:'pointer',width:profile.compact?22:26,height:profile.compact?22:26,borderRadius:theme.id==='flat'?1:'50%',background:`hsl(${p} 82% 55%)`,border:hue===p?'2px solid currentColor':'2px solid transparent',boxShadow:hue===p?`0 0 0 2px ${theme.surface},0 0 0 3px ${theme.border}`:'none'}}/>)}</Box>
    <Box><Typography sx={{fontSize:10,color:theme.muted,mb:-.25}}>{locale==='fa'?'رنگ':'HUE'} · {hue}°</Typography><Slider min={0} max={360} value={hue} onChange={(_,v)=>setHue(v as number)} size="small" sx={{color:theme.id==='gaming'?'#19f7ff':theme.accent,py:.7}}/></Box>
    {profile.showSecondary&&<Box><Typography sx={{fontSize:10,color:theme.muted,mb:-.25}}>{locale==='fa'?'روشنایی':'BRIGHTNESS'}</Typography><Slider min={5} max={100} value={brightness} onChange={(_,v)=>setBrightness(v as number)} size="small" sx={{color:theme.accent2,py:.7}}/></Box>}
  </Box>;
}

function DirectionControl({ theme, locale }: Props) {
  const [active, setActive] = useState('•');
  const keys = ['↑', '←', '•', '→', '↓'];
  return <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', direction: 'ltr' }}>
    <Box>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 52px)', gridTemplateRows: 'repeat(3, 52px)', gap: .8 }}>
        {keys.map((k, i) => {
          const pos = [2, 4, 5, 6, 8][i];
          return <Button key={k} onClick={() => setActive(k)} sx={{ gridColumn: ((pos - 1) % 3) + 1, gridRow: Math.floor((pos - 1) / 3) + 1, minWidth: 0, borderRadius: 2.2, border: `1px solid ${active === k ? `${theme.accent}88` : theme.border}`, color: active === k ? theme.accent : theme.foreground, bgcolor: active === k ? `${theme.accent}14` : 'transparent' }}>{k}</Button>;
        })}
      </Box>
      <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: theme.muted, mt: 1 }}>{locale === 'fa' ? 'آخرین فرمان' : 'Last command'}: {active}</Typography>
    </Box>
  </Box>;
}

function statusCellColor(cell: string, theme: WidgetThemeTokens, mode: 'table' | 'measurement-list' | 'alarms' | 'events' | 'logs') {
  if (mode === 'alarms') {
    if (cell === 'Critical') return '#ef4444';
    if (cell === 'Warning') return '#f59e0b';
    return theme.accent;
  }
  if (cell === 'Online' || cell === 'Started' || cell === 'Opened' || cell === 'connected') return theme.accent;
  if (cell === 'Alert') return '#ef4444';
  if (cell === 'Sleep') return theme.muted;
  return theme.muted;
}

function TableVisual({ theme, mode, size }: Props & { mode: 'table' | 'measurement-list' | 'alarms' | 'events' | 'logs' }) {
  const profile = sizeProfile(size);
  const rows = mode === 'alarms'
    ? [['Fire sensor', 'Critical', '09:42'], ['Door open', 'Warning', '09:17'], ['Battery low', 'Info', '08:51']]
    : mode === 'logs'
      ? [['gateway-01', 'connected', '09:44:21'], ['pump-04', 'rpc ack', '09:43:12'], ['sensor-18', 'telemetry', '09:42:08']]
      : mode === 'events'
        ? [['Valve', 'Opened', '09:41'], ['Pump', 'Started', '09:34'], ['Mode', 'Auto', '09:12']]
        : mode === 'measurement-list'
          ? [['24.8 °C', '09:44'], ['24.6 °C', '09:39'], ['24.7 °C', '09:34'], ['24.4 °C', '09:29']]
          : [['GW-01', 'Online', '24.8 °C'], ['Pump-04', 'Online', '68%'], ['Node-18', 'Sleep', '3.8 V'], ['Valve-02', 'Alert', 'Open']];
  return <Box sx={{ height: '100%', overflow: 'hidden', direction: 'ltr', display: 'flex', flexDirection: 'column', gap: .4 }}>
    {rows.slice(0, profile.compact ? 3 : rows.length).map((row, i) => <Box key={i} sx={{ display: 'grid', gridTemplateColumns: `repeat(${row.length}, minmax(0,1fr))`, gap: 1, p: .9, borderRadius: 2, border: `1px solid ${theme.border}`, bgcolor: i === 0 && mode === 'alarms' ? 'rgba(239,68,68,.06)' : 'transparent', alignItems: 'center' }}>
      {row.map((cell, j) => <Typography key={j} variant="body2" sx={{ fontWeight: j === 0 ? 750 : 600, color: j === 1 ? statusCellColor(cell, theme, mode) : j === 0 ? theme.foreground : theme.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cell}</Typography>)}
    </Box>)}
  </Box>;
}

function Clock({ theme, locale }: Props) {
  return <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', textAlign: 'center' }}><Box><Typography sx={{ fontSize: 42, fontWeight: 300, letterSpacing: '-.04em', direction: 'ltr' }}>09:44</Typography><Typography variant="body2" sx={{ color: theme.muted }}>{locale === 'fa' ? 'چهارشنبه، ۱۵ مهر ۱۴۰۵' : 'Wednesday, Oct 7'}</Typography></Box></Box>;
}

function TextVisual({ theme, locale, size }: Props) {
  const profile = sizeProfile(size);
  return <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', direction: locale === 'fa' ? 'rtl' : 'ltr', textAlign: locale === 'fa' ? 'right' : 'left' }}><Typography sx={{ fontWeight: 850, fontSize: profile.large ? 22 : 19 }}>{locale === 'fa' ? 'وضعیت اتاق سرور' : 'Server room status'}</Typography><Typography variant="body2" sx={{ mt: 1, color: theme.muted, lineHeight: 1.9 }}>{locale === 'fa' ? 'همه سنسورها در محدوده عادی هستند. آخرین بسته داده کمتر از یک دقیقه قبل دریافت شده است.' : 'All sensors are within their normal ranges. Latest telemetry was received less than a minute ago.'}</Typography></Box>;
}

function ImageVisual({ theme, size }: Props) {
  const profile = sizeProfile(size);
  return <Box sx={{ height: '100%', minHeight: profile.large ? 190 : 150, borderRadius: 2.8, position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #0f172a, #1e293b 40%, #334155)' }}>
    <Box sx={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 72% 28%, rgba(255,255,255,.26), transparent 21%)' }} />
    <Box sx={{ position: 'absolute', left: 14, top: 12, px: 1, py: .35, borderRadius: 99, bgcolor: 'rgba(15,23,42,.45)', color: '#fff', fontSize: 10.5, fontWeight: 800 }}>LIVE</Box>
    <Box sx={{ position: 'absolute', left: '10%', right: '10%', bottom: '12%', height: '45%', border: '2px solid rgba(255,255,255,.38)', borderRadius: '56% 56% 15% 15%', opacity: .78 }} />
    <Typography variant="caption" sx={{ position: 'absolute', left: 12, bottom: 10, color: '#fff', fontWeight: 800 }}>Camera snapshot · 09:44:12</Typography>
  </Box>;
}

function IframeVisual({ theme }: Props) {
  return <Box sx={{ height: '100%', display: 'grid', placeItems: 'center', border: `1px dashed ${theme.border}`, borderRadius: 2.5, textAlign: 'center', px: 2 }}><Box><Typography sx={{ fontWeight: 800 }}>External content</Typography><Typography variant="caption" sx={{ color: theme.muted }}>iframe / embedded app / HTML canvas</Typography></Box></Box>;
}

function ScadaVisual({ theme }: Props) {
  return <Box sx={{ height: '100%', minHeight: 170, position: 'relative', direction: 'ltr' }}><svg viewBox="0 0 520 220" width="100%" height="100%">
    <rect x="15" y="55" width="110" height="105" rx="14" fill={`${theme.accent}16`} stroke={theme.border} /><text x="70" y="105" textAnchor="middle" fill={theme.foreground} fontSize="14" fontWeight="700">TANK 01</text><text x="70" y="128" textAnchor="middle" fill={theme.accent} fontSize="22" fontWeight="800">63%</text>
    <line x1="125" y1="108" x2="220" y2="108" stroke={theme.foreground} strokeWidth="6" /><circle cx="250" cy="108" r="29" fill={`${theme.accent2}18`} stroke={theme.accent2} strokeWidth="3" /><text x="250" y="113" textAnchor="middle" fill={theme.foreground} fontSize="12" fontWeight="800">PUMP</text>
    <line x1="279" y1="108" x2="375" y2="108" stroke={theme.foreground} strokeWidth="6" /><rect x="375" y="68" width="120" height="80" rx="10" fill={`${theme.accent}12`} stroke={theme.border} /><text x="435" y="102" textAnchor="middle" fill={theme.foreground} fontSize="13" fontWeight="700">VALVE V-02</text><text x="435" y="125" textAnchor="middle" fill={theme.accent} fontSize="13" fontWeight="800">OPEN</text>
  </svg></Box>;
}

function AlarmIndicator({ def, theme, locale, size }: Props) {
  const profile=sizeProfile(size); const Icon=def.icon; const active=Boolean(def.mock.value); const severity=s(def.mock.severity,'warning');
  const isCritical=severity==='critical'; const color=active?(isCritical?'#ef4444':'#f59e0b'):theme.accent;
  const label=active?(locale==='fa'?'هشدار فعال':'ALARM ACTIVE'):(locale==='fa'?'وضعیت عادی':'NORMAL');
  if(theme.id==='gaming') return <Box sx={{height:'100%',display:'grid',placeItems:'center',fontFamily:'inherit'}}><Box sx={{textAlign:'center'}}><Box sx={{width:profile.compact?84:100,height:profile.compact?84:100,mx:'auto',display:'grid',placeItems:'center',clipPath:'polygon(50% 0,100% 50%,50% 100%,0 50%)',border:`1px solid ${color}`,background:`${color}14`,boxShadow:active?`0 0 34px ${color}44`:'none'}}><Icon sx={{fontSize:profile.compact?38:46,color,filter:active?`drop-shadow(0 0 10px ${color})`:'none'}}/></Box><Typography sx={{fontFamily:'inherit',mt:.8,fontSize:11,letterSpacing:1.5,color}}>{label}</Typography></Box></Box>;
  if(theme.id==='ios') return <Box sx={{height:'100%',display:'grid',placeItems:'center'}}><Box sx={{textAlign:'center'}}><Box sx={{width:profile.compact?76:92,height:profile.compact?76:92,borderRadius:24,mx:'auto',display:'grid',placeItems:'center',bgcolor:active?`${color}18`:'rgba(52,199,89,.12)',boxShadow:active?`0 18px 34px ${color}22`:'none'}}><Icon sx={{fontSize:profile.compact?36:44,color}}/></Box><Typography sx={{mt:.9,fontSize:13,fontWeight:780,color}}>{label}</Typography></Box></Box>;
  if(theme.id==='minimal') return <Box sx={{height:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',gap:1}}><Box><Typography sx={{fontSize:profile.compact?28:34,fontWeight:520,letterSpacing:'-.04em'}}>{active?'ALARM':'SAFE'}</Typography><Typography sx={{fontSize:10.5,color:'#9ca3af'}}>{def.id.replace('-',' ').toUpperCase()}</Typography></Box><Icon sx={{fontSize:profile.compact?38:46,color:active?'#111827':'#9ca3af'}}/></Box>;
  if(theme.id==='flat') return <Box sx={{height:'100%',display:'grid',gridTemplateColumns:'76px 1fr',alignItems:'stretch',gap:1}}><Box sx={{display:'grid',placeItems:'center',bgcolor:active?color:theme.accent,color:'#fff'}}><Icon sx={{fontSize:38}}/></Box><Box sx={{display:'flex',flexDirection:'column',justifyContent:'center'}}><Typography sx={{fontSize:22,fontWeight:950,color:active?color:theme.foreground}}>{label}</Typography><Typography sx={{fontSize:10.5,color:theme.muted}}>{active?'Immediate attention required':'System monitoring normally'}</Typography></Box></Box>;
  if(theme.id==='glass') return <Box sx={{height:'100%',display:'grid',placeItems:'center'}}><Box sx={{textAlign:'center'}}><Box sx={{width:90,height:90,borderRadius:'50%',mx:'auto',display:'grid',placeItems:'center',background:`radial-gradient(circle,${color}33,rgba(255,255,255,.04) 68%)`,border:`1px solid ${color}66`,boxShadow:active?`0 0 38px ${color}44`:'inset 0 0 24px rgba(255,255,255,.05)'}}><Icon sx={{fontSize:42,color}}/></Box><Typography sx={{mt:.8,fontSize:12,fontWeight:800,color}}>{label}</Typography></Box></Box>;
  return <Box sx={{height:'100%',display:'grid',placeItems:'center'}}><Box sx={{textAlign:'center'}}><Box sx={{width:88,height:88,borderRadius:4,mx:'auto',display:'grid',placeItems:'center',bgcolor:`${color}12`,border:`1px solid ${color}40`}}><Icon sx={{fontSize:42,color}}/></Box><Typography sx={{mt:.8,fontSize:13,fontWeight:850,color}}>{label}</Typography></Box></Box>;
}

export function WidgetVisualRenderer(props: Props) {
  if (props.theme.id === 'material') return <MaterialVisualRenderer {...props} />;
  if (props.theme.id === 'minimal') return <MinimalVisualRenderer {...props} />;
  if (props.theme.id === 'ios') return <IOSVisualRenderer {...props} />;
  if (props.theme.id === 'glass') return <GlassVisualRenderer {...props} />;
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
  return <LinearProgress sx={{ color: props.theme.accent }} />;
}
