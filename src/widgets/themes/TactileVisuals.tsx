import { useId, useState } from 'react';
import { Box, Button, Slider, Switch, Typography } from '@mui/material';
import LightbulbRounded from '@mui/icons-material/LightbulbRounded';
import PowerSettingsNewRounded from '@mui/icons-material/PowerSettingsNewRounded';
import AirRounded from '@mui/icons-material/AirRounded';
import type { WidgetRendererProps } from '../renderers/WidgetVisuals';

const numeric=(v:unknown,fallback=0)=>typeof v==='number'&&Number.isFinite(v)?v:fallback;
const text=(v:unknown,fallback='')=>typeof v==='string'?v:fallback;
const clip=(v:number,a=0,b=100)=>Math.min(b,Math.max(a,v));

/** Touchable home controls and device illustrations; deliberately unlike industrial telemetry. */
export function TactileVisualRenderer({def,theme,locale,view='standard',history}:WidgetRendererProps){
 const compact=view==='compact',detailed=view==='detailed',fa=locale==='fa';
 const [enabled,setEnabled]=useState(Boolean(def.mock.value));
 const [level,setLevel]=useState(numeric(def.mock.value,48));
 const id=useId().replace(/:/g,'');
 const t=(en:string,faText:string)=>fa?faText:en;
 const v=def.mock.value;
 const value=typeof v==='number'?v.toLocaleString(fa?'fa-IR':'en-US',{maximumFractionDigits:2}):text(v,'—');
 const unit=text(def.mock.unit);
 const smallLabel={fontSize:10.5,color:theme.muted};
 const reading=<Box sx={{display:'flex',alignItems:'baseline',justifyContent:compact?'center':'flex-start',gap:.45,direction:'ltr',minWidth:0}}>
  <Typography data-iot-reading="true" sx={{fontSize:compact?'clamp(23px,9cqw,38px)':'clamp(30px,10cqw,51px)',fontWeight:780,color:theme.foreground,
   letterSpacing:'-.05em',lineHeight:1.16,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontVariantNumeric:'tabular-nums'}}>{value}</Typography>
  <Typography sx={{fontSize:compact?11:13,color:theme.muted,fontWeight:650,whiteSpace:'nowrap'}}>{unit}</Typography>
 </Box>;
 const actionButton=(label:string,clickedText:string)=><Button fullWidth aria-label={label} variant="contained" startIcon={<PowerSettingsNewRounded/>}
  sx={{height:compact?43:58,minHeight:40,borderRadius:4,bgcolor:theme.accent,color:'#fff',fontWeight:800,fontSize:compact?12:15,
   boxShadow:`0 8px 20px ${theme.accent}33`,'&:hover':{bgcolor:theme.accent},'&:active':{transform:'scale(.97)',boxShadow:'none'}}}>{clickedText}</Button>;
 if(def.visual==='button')return <Box sx={{height:'100%',display:'grid',placeItems:'center'}}>{actionButton(t('Send command','ارسال فرمان'),t('Press to activate','برای فعال‌سازی فشار دهید'))}</Box>;
 if(def.visual==='switch'||def.visual==='boolean') return <Box sx={{height:'100%',display:'flex',alignItems:'center',justifyContent:'space-around',gap:1.2}}>
  <Box sx={{minWidth:0,display:'grid',gap:.4}}><Box sx={{width:compact?39:57,height:compact?39:57,borderRadius:compact?2.5:3.5,
   bgcolor:enabled?`${theme.accent}25`:`${theme.muted}1a`,display:'grid',placeItems:'center',color:enabled?theme.accent:theme.muted}}>
   <PowerSettingsNewRounded sx={{fontSize:compact?25:33}}/></Box>
  {!compact&&<Typography sx={{fontSize:12,fontWeight:800,color:theme.foreground}}>{t(enabled?'On':'Off',enabled?'روشن':'خاموش')}</Typography>}</Box>
  <Switch checked={enabled} onChange={(_,b)=>setEnabled(b)} inputProps={{'aria-label':t('Relay power switch','کلید روشن و خاموش رله')}} sx={{transform:compact?'scale(.9)':'scale(1.1)',
   '& .MuiSwitch-switchBase.Mui-checked':{color:theme.accent},'& .MuiSwitch-switchBase.Mui-checked+.MuiSwitch-track':{bgcolor:theme.accent,opacity:.8}}}/>
 </Box>;
 if(['slider','thermostat','color','input'].includes(def.visual))return <Box sx={{height:'100%',display:'flex',flexDirection:'column',justifyContent:'center',gap:1}}>
  <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><Typography data-iot-reading="true" sx={{fontWeight:800,fontSize:compact?25:39,color:theme.foreground}}>{Math.round(level)}{unit}</Typography>
  <LightbulbRounded sx={{fontSize:compact?25:38,color:theme.accent,filter:`drop-shadow(0 0 6px ${theme.accent}55)`}}/></Box>
  <Slider aria-label={t('Light or temperature level','تنظیم شدت نور یا دما')} value={clip(level,numeric(def.mock.min,0),numeric(def.mock.max,100))}
   min={numeric(def.mock.min,0)} max={Math.max(numeric(def.mock.min,0)+1,numeric(def.mock.max,100))} onChange={(_,n)=>setLevel(n as number)}
   sx={{color:theme.accent,mt:.3,'& .MuiSlider-thumb':{width:compact?17:25,height:compact?17:25,boxShadow:`0 2px 7px ${theme.accent}35`}}}/>
 </Box>;
 if(['metric','battery','signal','tank','alarm-indicator'].includes(def.visual)) {
  const lamp=def.id.includes('light')||def.id.includes('lux');
  const tank=def.visual==='tank';
  const battery=def.visual==='battery';
  const Icon=lamp?LightbulbRounded:tank?AirRounded:battery?PowerSettingsNewRounded:AirRounded;
  const pct=clip(numeric(v,68),0,100);
  return <Box sx={{height:'100%',minHeight:0,display:'flex',flexDirection:'column',justifyContent:compact?'center':'space-between',gap:compact?.6:1,overflow:'hidden'}}>
   <Box sx={{display:'flex',alignItems:'center',justifyContent:compact?'center':'space-between',gap:1,minWidth:0}}>
    {reading}
    {!compact&&<Box sx={{height:detailed?65:43,width:detailed?65:43,flexShrink:0,borderRadius:'50%',display:'grid',placeItems:'center',
     background:`radial-gradient(circle at 35% 25%,${theme.accent}33,${theme.accent}10)`,color:theme.accent}}><Icon sx={{fontSize:detailed?34:27}}/></Box>}
   </Box>
   {!compact&&<><Box sx={{height:detailed?16:11,borderRadius:999,background:`${theme.accent}18`,p:'2px',overflow:'hidden',flexShrink:0}}>
    <Box sx={{height:'100%',width:`${pct}%`,borderRadius:999,background:`linear-gradient(90deg,${theme.accent},${theme.accent2})`}}/>
   </Box>{detailed&&<Typography sx={{...smallLabel,textAlign:fa?'right':'left'}}>{t('Comfort range','محدوده مطلوب')}</Typography>}</>}
  </Box>;
 }
 if(def.visual==='donut')return <Box sx={{height:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:1.5}}>
  <Box sx={{height:'min(100%,178px)',flex:'0 1 178px',aspectRatio:'1',borderRadius:'50%',p:compact?'10px':'15px',
   background:`conic-gradient(${theme.accent} ${clip(numeric(v,72))}%,${theme.accent}20 0)`,boxShadow:`0 5px 17px ${theme.accent}20`}}>
   <Box sx={{height:'100%',width:'100%',borderRadius:'50%',bgcolor:theme.surface,display:'grid',placeItems:'center'}}>
    <Typography data-iot-reading="true" sx={{fontSize:compact?18:31,fontWeight:800,color:theme.foreground}}>{clip(numeric(v,72))}%</Typography>
   </Box>
  </Box>
  {!compact&&<Typography sx={{...smallLabel,fontWeight:730}}>{t('Total usage','میزان استفاده')}</Typography>}
 </Box>;
 if(def.visual==='heatmap')return <Box sx={{height:'100%',display:'grid',gridTemplateColumns:'repeat(8,minmax(0,1fr))',gridTemplateRows:'repeat(5,minmax(0,1fr))',gap:compact?3:6,p:1}}>
  {Array.from({length:40},(_,i)=><Box key={i} sx={{minHeight:0,borderRadius:compact?.75:1.5,background:((i*7+Math.floor(i/8)*3)%11)>7?theme.accent2:`${theme.accent}${Math.round((.13+((i*5)%9)/13)*255).toString(16).padStart(2,'0')}`}}/>)}
 </Box>;
 if(['line','area','bar','histogram','timeline'].includes(def.visual)){
  const raw=history??(Array.isArray(def.mock.values)?def.mock.values.filter((x):x is number=>typeof x==='number'&&Number.isFinite(x)):[]);
  const vals=raw.length>=2?raw:[28,38,35,46,51,45,62,58,66,74,69,78];
  const min=Math.min(...vals),max=Math.max(...vals),range=Math.max(1,max-min);
  const points=vals.map((n,i)=>`${10+i*280/(vals.length-1)},${95-((n-min)/range)*75}`).join(' ');
  const bar=['bar','histogram'].includes(def.visual);
  return <Box sx={{height:'100%',minHeight:0,display:'flex',flexDirection:'column',gap:1,overflow:'hidden'}}>
   {!compact&&<Typography sx={{fontSize:10.5,fontWeight:730,color:theme.muted}}>{t('Recent activity','فعالیت اخیر')}</Typography>}
   <Box sx={{flex:1,minHeight:0,overflow:'hidden'}}><svg width="100%" height="100%" viewBox="0 0 300 110" preserveAspectRatio="none" role="img" aria-label="Smart home history" style={{display:'block'}}>
    <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop stopColor={theme.accent} stopOpacity=".24"/><stop offset="1" stopColor={theme.accent} stopOpacity="0"/></linearGradient></defs>
    {bar?vals.map((n,i)=><rect key={i} x={8+i*284/vals.length} y={99-(n-min)/range*78} width={Math.max(2,284/vals.length-4)} height={Math.max(3,(n-min)/range*78)} rx="6" fill={i===vals.length-1?theme.accent2:theme.accent} opacity=".8"/>):<><polygon points={`10,110 ${points} 290,110`} fill={`url(#${id})`}/><polyline points={points} fill="none" stroke={theme.accent} strokeWidth="3.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round"/></>}
   </svg></Box>
  </Box>;
 }
 if(['map','route','coordinates','compass','scada','image','iframe'].includes(def.visual))return <Box sx={{height:'100%',display:'grid',alignContent:'center',justifyItems:'center',gap:.5,borderRadius:3,bgcolor:`${theme.accent}10`,p:1,textAlign:'center'}}>
   <AirRounded sx={{fontSize:compact?23:37,color:theme.accent}}/>
   <Typography sx={{fontSize:compact?11.5:13,color:theme.foreground,fontWeight:750}}>{t('Device location & view','موقعیت و نمای دستگاه')}</Typography>
   {!compact&&<Typography sx={{...smallLabel}}>{t('Connect a map or media source','نقشه یا منبع تصویر را متصل کنید')}</Typography>}
 </Box>;
 if(['table','measurement-list','alarms','events','logs'].includes(def.visual))return <Box sx={{height:'100%',display:'grid',alignContent:'center',gap:1}}>
  {(compact?[0]:[0,1,2]).map(i=><Box key={i} sx={{display:'flex',alignItems:'center',gap:1,py:.5}}><Box sx={{height:9,width:9,borderRadius:'50%',bgcolor:i===2?theme.accent2:theme.accent}}/><Typography sx={{fontSize:11.5,fontWeight:670,color:theme.foreground}}>{t(i===0?'Connected':i===1?'Healthy':'Updated',i===0?'متصل':i===1?'سالم':'به‌روزرسانی')}</Typography></Box>)}
 </Box>;
 return <Box sx={{height:'100%',display:'grid',placeItems:'center',minHeight:0}}>{reading}</Box>;
}
