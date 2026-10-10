import { useId, useState } from 'react';
import { Box, Button, Slider, Switch, Typography } from '@mui/material';
import type { WidgetRendererProps } from '../renderers/WidgetVisuals';

const numeric=(v:unknown,fallback=0)=>typeof v==='number'&&Number.isFinite(v)?v:fallback;
const string=(v:unknown,fallback='')=>typeof v==='string'?v:fallback;
const clamp=(v:number,min=0,max=1)=>Math.min(max,Math.max(min,v));
const local=(fa:boolean,en:string,faText:string)=>fa?faText:en;

/** Industrial readouts: segmented instruments, squared scales and technical trend plots. */
export function ProcessVisualRenderer({def,theme,locale,view='standard',history}:WidgetRendererProps){
  const [active,setActive]=useState(Boolean(def.mock.value));
  const [setting,setSetting]=useState(numeric(def.mock.value,50));
  const chartId=useId().replace(/:/g,'');
  const compact=view==='compact',detailed=view==='detailed',fa=locale==='fa';
  const value=def.mock.value;
  const num=numeric(value,0);
  const unit=string(def.mock.unit);
  const lower=numeric(def.mock.min,0),upper=Math.max(lower+1,numeric(def.mock.max,100));
  const fraction=clamp((num-lower)/(upper-lower));
  const tone=/alarm|critical/i.test(string(def.mock.status))?'#ff796a':theme.accent;
  const rawHistory=history??(Array.isArray(def.mock.values)?def.mock.values.filter((v):v is number=>typeof v==='number'&&Number.isFinite(v)):[]);
  const valueText=typeof value==='number'?num.toLocaleString(fa?'fa-IR':'en-US',{maximumFractionDigits:2}):string(value,'—');
  const readout=<Box sx={{display:'flex',alignItems:'baseline',justifyContent:compact?'center':'flex-start',gap:.7,minWidth:0,direction:'ltr'}}>
    <Typography data-iot-reading="true" sx={{color:theme.foreground,fontFamily:'inherit',fontSize:compact?'clamp(22px,8cqw,37px)':'clamp(25px,10cqw,48px)',fontWeight:850,lineHeight:1.18,letterSpacing:'-.04em',fontVariantNumeric:'tabular-nums',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{valueText}</Typography>
    <Typography sx={{fontFamily:'inherit',fontSize:compact?10:12,color:theme.accent,fontWeight:800,whiteSpace:'nowrap'}}>{unit}</Typography>
  </Box>;
  const levelBars=<Box aria-label="Operating level" sx={{display:'grid',gridTemplateColumns:'repeat(16,minmax(0,1fr))',gap:'3px',height:compact?9:15}}>
    {Array.from({length:16},(_,i)=><Box key={i} sx={{bgcolor:i<Math.ceil(fraction*16)?(i>13?'#f47d65':tone):`${theme.accent}20`,border:`1px solid ${i<Math.ceil(fraction*16)?tone:theme.border}`,minWidth:0}}/>)}
  </Box>;
  const controlStyle={borderRadius:1,fontFamily:'inherit',fontSize:compact?11:13,fontWeight:850,minHeight:compact?39:50};

  if(def.visual==='switch'||def.visual==='boolean') return <Box sx={{height:'100%',display:'flex',alignItems:'center',justifyContent:'space-around',gap:1.2}}>
    <Box sx={{minWidth:0}}><Typography sx={{color:active?theme.accent2:theme.muted,fontWeight:850,fontFamily:'inherit',fontSize:compact?18:26}}>{local(fa,active?'ACTIVE':'STANDBY',active?'فعال':'غیرفعال')}</Typography>{!compact&&<Typography sx={{color:theme.muted,fontFamily:'inherit',fontSize:10}}>DO · 01</Typography>}</Box>
    <Switch checked={active} onChange={(_,v)=>setActive(v)} inputProps={{'aria-label':local(fa,'Relay switch','کلید رله')}} sx={{'& .MuiSwitch-switchBase.Mui-checked':{color:theme.accent2},'& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track':{bgcolor:theme.accent2}}}/>
  </Box>;
  if(def.visual==='button') return <Box sx={{height:'100%',display:'grid',placeItems:'center',p:compact?0:1}}><Button fullWidth variant="outlined" aria-label={local(fa,'Issue command','ارسال فرمان')} sx={{...controlStyle,border:`2px solid ${theme.accent}`,color:theme.accent,
    background:`${theme.accent}12`,'&:active':{background:`${theme.accent}45`}}}>{local(fa,'EXECUTE / PULSE','فرمان لحظه‌ای')}</Button></Box>;
  if(['slider','thermostat','input','color'].includes(def.visual)) return <Box sx={{height:'100%',minHeight:0,display:'flex',flexDirection:'column',justifyContent:'center',gap:1}}>
    <Box sx={{display:'flex',alignItems:'baseline',justifyContent:'space-between',gap:1}}><Typography data-iot-reading="true" sx={{fontWeight:850,fontSize:compact?20:30,fontFamily:'inherit',color:theme.foreground}}>{Math.round(setting)}{unit}</Typography>{!compact&&<Typography sx={{color:theme.muted,fontSize:10}}>{local(fa,'SETPOINT','نقطه تنظیم')}</Typography>}</Box>
    <Slider aria-label={local(fa,'Setpoint','نقطه تنظیم')} value={clamp(setting,lower,upper)} min={lower} max={upper} onChange={(_,v)=>setSetting(v as number)} sx={{color:theme.accent,py:1}}/>
  </Box>;
  if(def.visual==='donut') return <Box sx={{height:'100%',minHeight:0,display:'flex',alignItems:'center',justifyContent:'center',gap:2}}>
    <Box sx={{height:'min(100%,168px)',aspectRatio:'1',flex:'0 1 168px',borderRadius:'50%',p:'12px',background:`conic-gradient(${theme.accent} ${fraction*100}%,${theme.border} 0)`}}>
      <Box sx={{height:'100%',width:'100%',bgcolor:theme.surface,borderRadius:'50%',display:'grid',placeItems:'center'}}>
        <Typography data-iot-reading="true" sx={{color:theme.foreground,fontFamily:'inherit',fontWeight:850,fontSize:compact?16:28}}>{Math.round(fraction*100)}%</Typography>
      </Box>
    </Box>
    {!compact&&<Box sx={{minWidth:0,display:'grid',gap:.5}}><Typography sx={{fontFamily:'inherit',fontSize:11,color:theme.accent}}>{local(fa,'CAPACITY','ظرفیت')}</Typography><Typography sx={{fontFamily:'inherit',fontSize:11,color:theme.muted}}>{local(fa,'UTILIZATION','میزان استفاده')}</Typography></Box>}
  </Box>;
  if(def.visual==='heatmap') return <Box sx={{height:'100%',minHeight:0,display:'grid',gridTemplateColumns:'repeat(9,1fr)',gridTemplateRows:'repeat(5,1fr)',gap:compact?2:4,p:compact?.5:1}}>
    {Array.from({length:45},(_,i)=><Box key={i} sx={{minHeight:0,minWidth:0,border:`1px solid ${theme.border}`,background:`${theme.accent}${Math.round((.12+((i*7+i/9)%11)/14)*255).toString(16).padStart(2,'0')}`}}/>)}
  </Box>;
  if(def.visual==='scada') return <Box sx={{height:'100%',minHeight:0,display:'grid',placeItems:'center',p:1}}>
    <svg width="100%" height="100%" viewBox="0 0 300 135" role="img" aria-label="Illustrative process schematic">
      <path d="M48 70 H125 M164 70 H250 M105 70 V115 H180" stroke={theme.accent} strokeWidth="5" fill="none" strokeLinecap="square" />
      <rect x="12" y="30" width="45" height="70" rx="2" stroke={theme.accent} strokeWidth="3" fill="none"/>
      <rect x="16" y="58" width="37" height="38" fill={theme.accent} opacity=".4"/>
      <circle cx="144" cy="70" r="21" fill={theme.surface} stroke={theme.accent2} strokeWidth="3"/>
      <path d="M134 63 L155 70 L134 77 Z" fill={theme.accent2}/>
      <path d="M230 57 L249 70 L230 83 M266 57 L249 70 L266 83" fill="none" stroke={theme.accent2} strokeWidth="3"/>
      <text x="8" y="123" fill={theme.muted} fontSize="11">TANK</text><text x="128" y="35" fill={theme.muted} fontSize="11">PUMP</text>
      <text x="230" y="106" fill={theme.muted} fontSize="11">VALVE</text>
    </svg>
  </Box>;
  if(['line','area','bar','histogram','timeline'].includes(def.visual)) {
    const vals=rawHistory.length>1?rawHistory:[24,29,27,37,31,40,48,43,51,56,49,61];
    const min=Math.min(...vals),max=Math.max(...vals),range=Math.max(1,max-min);
    const poly=vals.map((v,i)=>`${10+(i/(vals.length-1))*280},${92-((v-min)/range)*75}`).join(' ');
    return <Box sx={{height:'100%',minHeight:0,display:'grid',gridTemplateRows:compact?'minmax(0,1fr)':'auto minmax(0,1fr) auto',gap:.7}}>
      {!compact&&<Typography sx={{color:theme.accent,fontFamily:'inherit',fontSize:10,fontWeight:800}}>{local(fa,'HISTORIAN / SIGNAL TRACE','ثبت داده / روند سیگنال')}</Typography>}
      <Box sx={{height:'100%',minHeight:0,overflow:'hidden',border:`1px solid ${theme.border}`}}><svg viewBox="0 0 300 110" preserveAspectRatio="none" width="100%" height="100%" role="img" aria-label="Industrial telemetry trace" style={{display:'block'}}>
        <defs><linearGradient id={chartId} x1="0" y1="0" x2="0" y2="1"><stop stopColor={theme.accent} stopOpacity=".3"/><stop offset="1" stopColor={theme.accent} stopOpacity="0"/></linearGradient></defs>
        {[22,52,82].map(y=><line key={y} x1="0" x2="300" y1={y} y2={y} stroke={theme.border} strokeDasharray="2 4"/>)}
        {['bar','histogram'].includes(def.visual)?vals.map((v,i)=><rect key={i} x={8+i*284/vals.length} y={100-(v-min)/range*75} width={Math.max(2,284/vals.length-3)} height={Math.max(2,(v-min)/range*75)} fill={i===vals.length-1?theme.accent2:theme.accent} opacity=".8"/>):<><polygon points={`10,110 ${poly} 290,110`} fill={`url(#${chartId})`}/><polyline points={poly} fill="none" stroke={theme.accent} strokeWidth="2.2" vectorEffect="non-scaling-stroke"/></>}
      </svg></Box>
      {!compact&&<Typography sx={{fontFamily:'inherit',color:theme.muted,textAlign:'end',fontSize:9}}>{vals.length} {local(fa,'samples','نمونه')} · {history?.length?'LIVE':'DEMO'}</Typography>}
    </Box>;
  }
  if(def.visual==='tank')return <Box sx={{height:'100%',minHeight:0,display:'grid',gridTemplateColumns:'minmax(42px,35%) minmax(0,1fr)',alignItems:'center',gap:1.25}}>
    <Box sx={{height:'85%',minHeight:35,position:'relative',border:`2px solid ${theme.accent}`,borderRadius:1,overflow:'hidden',background:`${theme.accent}0d`}}><Box sx={{position:'absolute',inset:'auto 0 0',height:`${clamp(num,0,100)*100/100}%`,bgcolor:`${theme.accent}7f`,borderTop:`3px solid ${theme.accent}`}}/></Box>
    <Box sx={{minWidth:0}}>{readout}{!compact&&<Typography sx={{fontFamily:'inherit',color:theme.muted,fontSize:10}}>{local(fa,'VESSEL / LEVEL','مخزن / سطح')}</Typography>}</Box>
  </Box>;
  if(['map','route','coordinates','compass','scada','image','iframe'].includes(def.visual))return <Box sx={{height:'100%',display:'grid',placeItems:'center',border:`1px dashed ${theme.accent}55`,p:1,textAlign:'center',gap:.5,alignContent:'center'}}>
    <Typography sx={{fontFamily:'inherit',color:theme.accent,fontWeight:850,fontSize:compact?12:16}}>{def.visual==='scada'?local(fa,'PROCESS DIAGRAM','نقشه فرآیند'):local(fa,'GEO / DEVICE DATA','اطلاعات مکان / دستگاه')}</Typography>
    {!compact&&<Typography sx={{fontFamily:'inherit',fontSize:10,color:theme.muted}}>{local(fa,'Connect a renderer / data source','منبع داده / نمایشگر را متصل کنید')}</Typography>}
  </Box>;
  if(['table','measurement-list','alarms','events','logs'].includes(def.visual)) return <Box sx={{height:'100%',display:'grid',alignContent:'center',gap:.7,minHeight:0}}>
    {['STATUS','CHANNEL','UPDATED'].slice(0,compact?1:3).map((l,i)=><Box key={l} sx={{display:'flex',justifyContent:'space-between',borderBottom:`1px solid ${theme.border}`,py:.45,gap:1}}><Typography sx={{fontFamily:'inherit',color:theme.muted,fontSize:10}}>{l}</Typography><Typography sx={{fontFamily:'inherit',color:i===0?theme.accent2:theme.foreground,fontSize:10}}>{i===0?'NORMAL':i===1?'IO-01':'JUST NOW'}</Typography></Box>)}
  </Box>;
  if(def.visual==='battery'||def.visual==='signal') return <Box sx={{height:'100%',display:'flex',flexDirection:'column',justifyContent:'center',gap:1.5}}>{readout}{levelBars}</Box>;
  return <Box sx={{height:'100%',display:'flex',flexDirection:'column',justifyContent:compact?'center':'space-around',gap:1.2,minHeight:0}}>{readout}
    {!compact&&<><Box>{levelBars}</Box>{detailed&&<Box sx={{display:'flex',justifyContent:'space-between',minWidth:0,gap:1}}><Typography sx={{fontFamily:'inherit',color:theme.muted,fontSize:10}}>{local(fa,'LOW','کمینه')} {lower}{unit}</Typography><Typography sx={{fontFamily:'inherit',color:theme.muted,fontSize:10}}>{local(fa,'HIGH','بیشینه')} {upper}{unit}</Typography></Box>}</>}
  </Box>;
}
