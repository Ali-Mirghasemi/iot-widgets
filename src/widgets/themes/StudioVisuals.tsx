import { useId, useState } from 'react';
import { Box, Switch, Typography } from '@mui/material';
import { MaterialVisualRenderer } from './MaterialVisuals';
import type { WidgetRendererProps } from '../renderers/WidgetVisuals';
import { spark2, bars } from '../data/mockData';
import { resolveWidgetView } from '../../library/adaptive';

const number = (value: unknown, fallback = 0) => typeof value === 'number' ? value : fallback;
const string = (value: unknown, fallback = '') => typeof value === 'string' ? value : fallback;
const bounded = (n: number, min=0, max=100) => Math.max(min,Math.min(max,n));
const dim = (size: string) => { const [w,h]=size.split('x').map(Number);return {compact:w*h===1,wide:w>h,large:w*h>=4}; };

function Sparkline({ values, color, fill=true, muted }: {values:number[];color:string;fill?:boolean;muted:string}) {
  const id = useId().replace(/:/g,'');
  const min=Math.min(...values), max=Math.max(...values), range=Math.max(max-min,1);
  const pts=values.map((v,i)=>`${(i/Math.max(1,values.length-1))*300},${92-((v-min)/range)*74}`).join(' ');
  return <svg viewBox="0 0 300 108" preserveAspectRatio="none" width="100%" height="100%" aria-label="Recent values trend" role="img" style={{display:'block',overflow:'hidden'}}>
    <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop stopColor={color} stopOpacity=".27"/><stop offset="1" stopColor={color} stopOpacity="0"/></linearGradient></defs>
    {[20,55,92].map(y=><line key={y} x1="0" y1={y} x2="300" y2={y} stroke={muted} strokeOpacity=".17" strokeDasharray="3 4" />)}
    {fill&&<polygon points={`0,108 ${pts} 300,108`} fill={`url(#${id})`}/>}
    <polyline points={pts} fill="none" stroke={color} strokeWidth="2.8" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="300" cy={92-((values[values.length-1]-min)/range)*74} r="3.5" fill={color} strokeWidth="1.5" stroke="white" vectorEffect="non-scaling-stroke"/>
  </svg>;
}

function Value({ value, unit, color }: {value:string|number;unit:string;color:string}) {
  return <Box sx={{display:'flex',alignItems:'baseline',gap:.55,minWidth:0,flexWrap:'wrap'}}>
    <Typography sx={{fontSize:'clamp(26px,10cqw,47px)',fontWeight:780,letterSpacing:'-.058em',lineHeight:1,color,whiteSpace:'nowrap',fontVariantNumeric:'tabular-nums'}}>{value}</Typography>
    <Typography sx={{fontSize:12,fontWeight:650,color,opacity:.58}}>{unit}</Typography>
  </Box>;
}

function StudioMetric({def,theme,size,view,history}:WidgetRendererProps){
 const value=number(def.mock.value,24.8),unit=string(def.mock.unit),trend=number(def.mock.trend,0);
 const currentView=view??resolveWidgetView(size);
 const maxConfigured=number(def.mock.max,NaN),minConfigured=number(def.mock.min,0);
 const max=Number.isFinite(maxConfigured)?maxConfigured:Math.max(10,Math.ceil(Math.abs(value)*1.35));
 const fill=bounded(100*(value-minConfigured)/Math.max(1,max-minConfigured));
 const detailed=currentView==='detailed' && Boolean(history?.length);
 return <Box sx={{height:'100%',minHeight:0,minWidth:0,display:'flex',flexDirection:'column',gap:currentView==='compact'?.25:1.1,overflow:'hidden'}}>
   <Box sx={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:1,minWidth:0}}>
     <Value value={value} unit={unit} color={theme.foreground}/>
     {currentView!=='compact'&&Number.isFinite(trend)&&trend!==0&&<Typography component="span" sx={{flexShrink:0,color:trend>=0?theme.accent2:'#f59e83',fontSize:11,fontWeight:750,bgcolor:(trend>=0?theme.accent2:'#f59e83')+'15',borderRadius:3,px:1,py:.45}}>{trend>=0?'↗':'↘'} {Math.abs(trend)}%</Typography>}
   </Box>
   {detailed ? <>
     <Box sx={{flex:1,minHeight:0,overflow:'hidden'}}><Sparkline values={history!} color={theme.accent} muted={theme.muted}/></Box>
     <Box sx={{display:'flex',justifyContent:'space-between',gap:1}}><Typography sx={{fontSize:10,color:theme.muted}}>History</Typography><Typography sx={{fontSize:10,color:theme.muted}}>{history!.length} samples · Latest {value}{unit}</Typography></Box>
   </> : currentView!=='compact' ? <>
     <Box sx={{mt:'auto',height:9,bgcolor:theme.border,borderRadius:12,overflow:'hidden',flexShrink:0}}><Box sx={{height:'100%',width:fill+'%',borderRadius:12,background:`linear-gradient(90deg,${theme.accent},${theme.accent2})`}}/></Box>
     <Box sx={{display:'flex',justifyContent:'space-between',minWidth:0}}><Typography sx={{fontSize:10,color:theme.muted}}>{minConfigured}{unit}</Typography><Typography sx={{fontSize:10,color:theme.muted}}>{max}{unit}</Typography></Box>
   </> : null}
 </Box>;
}

function StudioGauge({def,theme,size,view}:WidgetRendererProps){
 const value=number(def.mock.value,64),max=number(def.mock.max,100),pct=bounded(value/Math.max(1,max)*100);
 const compact=(view??resolveWidgetView(size))==='compact';
 if(compact) return <Box sx={{height:'100%',display:'flex',alignItems:'center',gap:1,minWidth:0}}><Value value={value} unit={string(def.mock.unit)} color={theme.foreground}/></Box>;
 return <Box sx={{height:'100%',minHeight:0,display:'flex',gap:1.5,alignItems:'center',justifyContent:'center',overflow:'hidden'}}>
   <Box sx={{height:'min(100%,140px)',width:'min(54%,140px)',maxHeight:'100%',aspectRatio:'1',flexShrink:1,position:'relative',display:'grid',placeItems:'center'}}>
     <Box sx={{position:'absolute',inset:0,borderRadius:'50%',background:`conic-gradient(${theme.accent} ${pct}%, ${theme.border} ${pct}%)`,transform:'rotate(-90deg)'}}/>
     <Box sx={{position:'absolute',inset:'13%',borderRadius:'50%',bgcolor:theme.surface}}/>
     <Box sx={{position:'relative',textAlign:'center'}}><Typography sx={{fontSize:'clamp(20px,9cqw,33px)',fontWeight:800,lineHeight:1,color:theme.foreground}}>{value}</Typography><Typography sx={{fontSize:11,mt:.55,color:theme.muted}}>{string(def.mock.unit)}</Typography></Box>
   </Box>
   <Typography sx={{fontSize:11,color:theme.muted,fontWeight:650,minWidth:0,flex:'0 1 90px'}}>{pct<70?'Normal':pct<90?'Elevated':'High'}</Typography>
 </Box>;
}

function StudioBattery({def,theme,size,view}:WidgetRendererProps){
 const value=bounded(number(def.mock.value,76));const compact=(view??resolveWidgetView(size))==='compact';
 return <Box sx={{height:'100%',minHeight:0,display:'flex',flexDirection:'column',justifyContent:compact?'center':'space-around',gap:compact?.6:1.3,overflow:'hidden'}}>
   <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:1}}><Value value={value} unit="%" color={theme.foreground}/>{!compact&&<Typography sx={{fontSize:10.5,color:theme.accent2,fontWeight:750}}>● Healthy</Typography>}</Box>
   {!compact&&<Box sx={{height:14,p:3/8,bgcolor:theme.border,borderRadius:2.5,position:'relative',flexShrink:0}}><Box sx={{height:'100%',width:`${value}%`,borderRadius:2.2,background:`linear-gradient(90deg,${theme.accent},${theme.accent2})`,transition:'width .2s'}}/></Box>}
   {!compact&&<Box sx={{display:'flex',justifyContent:'space-between',gap:1,flexWrap:'wrap'}}><Typography sx={{fontSize:10.5,color:theme.muted}}>Voltage <Box component="strong" sx={{color:theme.foreground}}>{string(def.mock.voltage,'3.94 V')}</Box></Typography><Typography sx={{fontSize:10.5,color:theme.muted}}>{string(def.mock.remaining,'8h left')}</Typography></Box>}
 </Box>;
}

function StudioChart({def,theme,size,view,history}:WidgetRendererProps){
 const currentView=view??resolveWidgetView(size);
 const type=def.visual;
 const samples=history??(Array.isArray(def.mock.values)?def.mock.values as number[]:type==='bar'||type==='histogram'?bars:spark2);
 const vals=samples.filter(Number.isFinite);
 if(vals.length<2)return <Box sx={{display:'grid',placeItems:'center',height:'100%',color:theme.muted}}>No history available</Box>;
 const max=Math.max(1,...vals.map(Math.abs));
 return <Box sx={{height:'100%',display:'flex',flexDirection:'column',minHeight:0,overflow:'hidden',gap:.8}}>
   {currentView==='detailed'&&<Box sx={{display:'flex',alignItems:'baseline',gap:1,flexWrap:'wrap'}}><Typography sx={{fontSize:25,fontWeight:790,color:theme.foreground,letterSpacing:'-.04em'}}>{string(def.mock.total,String(vals.at(-1)))}</Typography><Typography sx={{fontSize:11,color:theme.accent2}}>Live series</Typography></Box>}
   <Box sx={{flex:1,minHeight:0,overflow:'hidden'}}>{type==='bar'||type==='histogram'?<Box sx={{height:'100%',display:'flex',alignItems:'end',gap:'2%',borderBottom:`1px solid ${theme.border}`}}>{vals.slice(-16).map((v,i,all)=><Box key={i} sx={{flex:1,minWidth:0,bgcolor:i===all.length-1?theme.accent2:theme.accent,opacity:.55+(i/all.length)*.35,height:`${bounded(Math.abs(v)/max*100,4,100)}%`,borderRadius:'5px 5px 0 0'}}/>)}</Box>:<Sparkline values={vals} color={theme.accent} muted={theme.muted}/>}</Box>
   {currentView==='detailed'&&<Typography sx={{fontSize:10.5,color:theme.muted,textAlign:'right'}}>{vals.length} samples · {history?'Provided telemetry':'Illustrative history'}</Typography>}
 </Box>;
}

function StudioTank({def,theme,size,view}:WidgetRendererProps){
 const value=bounded(number(def.mock.value,63)),compact=(view??resolveWidgetView(size))==='compact';
 if(compact)return <Box sx={{display:'flex',alignItems:'center',height:'100%'}}><Value value={value} unit="%" color={theme.foreground}/></Box>;
 return <Box sx={{height:'100%',minHeight:0,display:'flex',alignItems:'center',justifyContent:'space-around',gap:1.4,overflow:'hidden'}}><Box sx={{flex:'0 1 74px',minWidth:27,maxWidth:74,height:'83%',borderRadius:2.5,border:`2px solid ${theme.border}`,overflow:'hidden',position:'relative',bgcolor:`${theme.accent}0a`}}><Box sx={{position:'absolute',bottom:0,left:0,right:0,height:`${value}%`,background:`linear-gradient(0deg,${theme.accent},${theme.accent2}b0)`,borderRadius:'12px 12px 0 0'}}/></Box><Box sx={{minWidth:0}}><Value value={value} unit="%" color={theme.foreground}/><Typography sx={{fontSize:11,color:theme.muted,mt:.5}}>Fill level</Typography><Typography sx={{fontSize:11,color:theme.accent2,mt:.5}}>{string(def.mock.liters,'Normal')}</Typography></Box></Box>;
}

function StudioSwitch({def,theme,size,view}:WidgetRendererProps){
 const [on,setOn]=useState(Boolean(def.mock.value));const compact=(view??resolveWidgetView(size))==='compact';
 return <Box sx={{height:'100%',minHeight:0,display:'flex',alignItems:'center',justifyContent:'space-between',gap:1,overflow:'hidden'}}><Box sx={{minWidth:0}}><Typography sx={{fontSize:compact?22:28,fontWeight:780,color:theme.foreground}}>{on?'On':'Off'}</Typography>{!compact&&<Typography sx={{fontSize:11,color:theme.muted}}>Demo control · no device command</Typography>}</Box><Switch checked={on} onChange={(_,v)=>setOn(v)} inputProps={{'aria-label':'Toggle demo switch'}} sx={{flexShrink:0,'& .MuiSwitch-switchBase.Mui-checked':{color:theme.accent},'& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':{bgcolor:theme.accent}}}/></Box>;
}

function StudioSignal({def,theme,size,view}:WidgetRendererProps){
 const value=number(def.mock.value,-74),compact=(view??resolveWidgetView(size))==='compact';
 return <Box sx={{height:'100%',minHeight:0,display:'flex',flexDirection:'column',justifyContent:'space-around',gap:.6,overflow:'hidden'}}>
   <Box sx={{display:'flex',alignItems:'end',justifyContent:'space-between',gap:1}}><Value value={value} unit="dBm" color={theme.foreground}/>{!compact&&<Typography sx={{fontSize:10,color:theme.accent2,fontWeight:700}}>{string(def.mock.network,'LTE')}</Typography>}</Box>
   {!compact&&<><Box sx={{display:'flex',gap:5/8,alignItems:'end',height:32,flexShrink:1}}>{[25,40,54,70,88,100].map((h,i)=><Box key={h} sx={{height:`${h}%`,flex:1,bgcolor:i<5?theme.accent:theme.border,opacity:i<5?.48+i*.11:1,borderRadius:'5px 5px 2px 2px'}}/>)}</Box><Typography sx={{fontSize:10.5,color:theme.muted}}>Signal quality · Good</Typography></>}
 </Box>;
}
function StudioState({def,theme,size,view}:WidgetRendererProps){
 const active=Boolean(def.mock.value);const compact=(view??resolveWidgetView(size))==='compact';return <Box sx={{height:'100%',display:'flex',alignItems:'center',gap:2,justifyContent:'space-between'}}>
  <Box><Typography sx={{fontSize:28,fontWeight:800,color:theme.foreground}}>{active?'Online':'Offline'}</Typography>{!compact&&<Typography sx={{fontSize:11,color:theme.muted}}>Last reported state</Typography>}</Box>
  {!compact&&<Box sx={{width:48,height:48,borderRadius:'50%',display:'grid',placeItems:'center',bgcolor:(active?theme.accent2:'#f59e83')+'18',color:active?theme.accent2:'#f59e83',fontSize:27}}>●</Box>}
 </Box>;
}
function StudioMap({def,theme}:WidgetRendererProps){
 const isDark=theme.paletteMode==='dark'||theme.id==='studio'&&!theme.inheritPalette;
 return <Box sx={{height:'100%',minHeight:80,overflow:'hidden',position:'relative',border:`1px solid ${theme.border}`,borderRadius:2.5,background:isDark?'#14283b':'#dce9ec'}}>
   <svg viewBox="0 0 600 340" preserveAspectRatio="xMidYMid slice" height="100%" width="100%" aria-label="Illustrative device location map" role="img" style={{display:'block'}}>
     <path d="M-30 50 Q90 120 170 65 T360 72 T640 10 L650 350 L0 350Z" fill={isDark?'#183547':'#c8dee2'}/>
     <path d="M-10 270 Q90 210 220 285 T600 250" fill="none" stroke={isDark?'#32637a':'#9fc8cf'} strokeWidth="40"/>
     <path d="M-40 270 Q140 190 250 250 T640 150" fill="none" stroke={isDark?'#c6d7e0':'#fff'} strokeWidth="20"/>
     <path d="M150 -20 L260 360 M340 -10 L460 370 M0 100 L610 150 M0 330 L620 70" fill="none" stroke={isDark?'#71879a':'#fff'} strokeOpacity=".75" strokeWidth="12"/>
     <path d="M150 -20 L260 360 M340 -10 L460 370 M0 100 L610 150 M0 330 L620 70" fill="none" stroke={isDark?'#3c6073':'#b2cfd3'} strokeDasharray="5 10" strokeWidth="1.2"/>
     <path d="M90 264 Q190 240 235 208 T370 161 T513 101" fill="none" stroke={theme.accent} strokeWidth="5" strokeDasharray="6 7" strokeLinecap="round"/>
     <circle cx="370" cy="161" r="23" fill={theme.accent} fillOpacity=".19"/><circle cx="370" cy="161" r="10" fill={theme.accent} stroke="#fff" strokeWidth="3"/>
     <circle cx="90" cy="264" r="6" fill={theme.accent2} stroke="#fff" strokeWidth="2"/>
   </svg>
   <Box sx={{position:'absolute',top:12,left:12,bgcolor:isDark?'#1d344bdb':'#fffffff0',p:1.1,borderRadius:1.5,border:`1px solid ${theme.border}`,color:isDark?'#edf7ff':'#1c3443'}}><Typography sx={{fontSize:11.5,fontWeight:800}}>Truck 18 · Demo</Typography><Typography sx={{fontSize:10,mt:.3,opacity:.75}}>Simulated coordinates</Typography></Box>
   <Box sx={{position:'absolute',bottom:9,right:11,bgcolor:isDark?'#16283dd9':'#ffffffe8',color:isDark?'#cbd8e6':'#30424d',borderRadius:1,px:.7,py:.35,fontSize:9}}>Illustration · No map tiles</Box>
 </Box>;
}
function StudioList({def,theme}:WidgetRendererProps){
 const alarms=def.visual==='alarms';const entries=alarms?['Vibration level elevated','Cooling threshold approaching','Sensor calibration due']:['Gateway connected','Location updated','Telemetry batch received'];
 return <Box sx={{display:'flex',flexDirection:'column',justifyContent:'space-between',height:'100%',gap:1}}>{entries.map((title,i)=><Box key={title} sx={{display:'flex',alignItems:'center',gap:1.2,borderBottom:i===2?'none':`1px solid ${theme.border}`,pb:.65,minHeight:0}}><Box sx={{width:26,height:26,borderRadius:1.3,flexShrink:0,display:'grid',placeItems:'center',bgcolor:(alarms?'#f1a45d':theme.accent)+'18',color:alarms?'#f1a45d':theme.accent,fontSize:15}}>{alarms?'!':'↗'}</Box><Box sx={{flex:1,minWidth:0}}><Typography sx={{fontSize:11.5,fontWeight:750,color:theme.foreground,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{title}</Typography><Typography sx={{fontSize:10,color:theme.muted}}>{[2,12,35][i]} minutes ago</Typography></Box></Box>)}</Box>;
}
export function StudioVisualRenderer(props:WidgetRendererProps){
 switch(props.def.visual){
  case 'metric': return <StudioMetric {...props}/>;
  case 'gauge': return <StudioGauge {...props}/>;
  case 'battery': return <StudioBattery {...props}/>;
  case 'line': case 'area': case 'bar': case 'histogram': return <StudioChart {...props}/>;
  case 'tank': return <StudioTank {...props}/>;
  case 'switch': return <StudioSwitch {...props}/>;
  case 'signal': return <StudioSignal {...props}/>;
  case 'boolean': case 'alarm-indicator': return <StudioState {...props}/>;
  case 'map': case 'route': return <StudioMap {...props}/>;
  case 'events': case 'alarms': return <StudioList {...props}/>;
  default: if ((props.view??resolveWidgetView(props.size))==='compact' && props.def.visual!=='switch') {
    const Icon=props.def.icon;
    return <Box sx={{display:'flex',height:'100%',alignItems:'center',gap:1.2,overflow:'hidden',color:props.theme.foreground}}><Icon sx={{color:props.theme.accent,fontSize:24}}/><Typography sx={{fontSize:13,color:props.theme.muted,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{props.locale==='fa'?props.def.titleFa:props.def.titleEn}</Typography></Box>;
  }
  return <MaterialVisualRenderer {...props}/>;
 }
}
