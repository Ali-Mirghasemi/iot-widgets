import { Box, Typography } from '@mui/material';
import type { WidgetRendererProps } from './WidgetVisuals';
import type { ResolvedWidgetView } from '../../library/adaptive';
import { measureGaugeLayout } from './gaugeSizing';

const finite = (input: unknown, fallback: number) => typeof input === 'number' && Number.isFinite(input) ? input : fallback;
const clamp = (value:number) => Math.max(0,Math.min(1,value));

/**
 * Shared measured gauge geometry for every visual theme. Theme frames remain
 * distinct, but dial, label and diagnostics may not overlap at any viewport.
 * SVG scales to the available space instead of positioning labels over the arc.
 */
export function AdaptiveGauge({def,theme,locale,history,view='standard',bounds}:WidgetRendererProps & {
  view?: ResolvedWidgetView;
  bounds?:{width:number;height:number};
}) {
  const value=finite(def.mock.value,0);
  const min=finite(def.mock.min,0);
  const max=Math.max(min+0.0001,finite(def.mock.max,100));
  const pct=clamp((value-min)/(max-min));
  const unit=typeof def.mock.unit==='string'?def.mock.unit:'';
  const high=pct>=.9, warning=pct>=.72;
  const accent=high?'#f17e7e':warning?'#e4b568':theme.accent;
  const label=locale==='fa'?(high?'بحرانی':warning?'هشدار':'عادی'):(high?'Critical':warning?'Elevated':'Normal');
  const isDark=theme.paletteMode==='dark'||['studio','gaming','glass','horizon','industrial'].includes(theme.id);
  const track=isDark?theme.border:theme.border;
  const radius=75,circ=2*Math.PI*radius,arc=circ*.75;
  const {horizontal,detailed,showTrace,diameter,traceHeight}=measureGaugeLayout(bounds,view,history?.length??0);
  const readable=Number.isInteger(value)?value.toLocaleString(locale==='fa'?'fa-IR':'en-US'):value.toLocaleString(locale==='fa'?'fa-IR':'en-US',{maximumFractionDigits:2});
  const dial=<Box data-adaptive-gauge-face="true" sx={{width:diameter,height:diameter,flex:'0 0 auto',minWidth:0,minHeight:0,
    display:'grid',placeItems:'center',mx:'auto',my:'auto',overflow:'hidden'}}>
    <svg width="100%" height="100%" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet" role="img" aria-label={`${readable} ${unit} (${Math.round(pct*100)}%)`} style={{display:'block',width:'100%',height:'100%',overflow:'hidden'}}>
      <circle cx="100" cy="100" r={radius} stroke={track} strokeWidth="13" strokeLinecap="round" fill="none"
        strokeDasharray={`${arc} ${circ}`} transform="rotate(135 100 100)"/>
      <circle cx="100" cy="100" r={radius} stroke={accent} strokeWidth="13" strokeLinecap="round" fill="none"
        strokeDasharray={`${Math.max(0.0001,arc*pct)} ${circ}`} transform="rotate(135 100 100)"/>
      <text x="100" y="96" textAnchor="middle" dominantBaseline="middle" fill={theme.foreground}
        fontSize={readable.length>=6?28:readable.length>=4?34:41} fontWeight="750" fontFamily="system-ui, sans-serif">{readable}</text>
      <text x="100" y="120" textAnchor="middle" fill={theme.muted} fontSize="13" fontFamily="system-ui, sans-serif">{unit}</text>
      <text x="100" y="142" textAnchor="middle" fill={accent} fontSize="12" fontWeight="700" fontFamily="system-ui, sans-serif">{label}</text>
    </svg>
  </Box>;
  const details=<Box sx={{display:'flex',flexDirection:'column',justifyContent:'center',gap:1.1,minWidth:0,height:'100%'}}>
    <Box sx={{display:'flex',justifyContent:'space-between',alignItems:'baseline',gap:1}}>
      <Typography sx={{fontSize:11.5,color:theme.muted}}>{locale==='fa'?'بازه عملکرد':'Operating range'}</Typography>
      <Typography sx={{fontSize:18,fontWeight:750,color:theme.foreground}}>{Math.round(pct*100)}%</Typography>
    </Box>
    <Box sx={{height:10,flexShrink:0,background:track,borderRadius:99,overflow:'hidden'}}>
      <Box sx={{height:'100%',width:`${pct*100}%`,bgcolor:accent,borderRadius:99}}/>
    </Box>
    <Box sx={{display:'flex',justifyContent:'space-between',gap:1}}>
      <Typography sx={{fontSize:11,color:theme.muted}}>{min}{unit}</Typography>
      <Typography sx={{fontSize:11,color:theme.muted}}>{max}{unit}</Typography>
    </Box>
    {detailed&&<Box sx={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',gap:1,mt:1}}>
      <Box sx={{border:`1px solid ${theme.border}`,p:1,borderRadius:1.5,minWidth:0}}>
        <Typography sx={{fontSize:10,color:theme.muted}}>{locale==='fa'?'مقدار کنونی':'Current'}</Typography>
        <Typography sx={{fontSize:16,fontWeight:760,color:theme.foreground,overflowWrap:'anywhere'}}>{readable} {unit}</Typography>
      </Box>
      <Box sx={{border:`1px solid ${theme.border}`,p:1,borderRadius:1.5,minWidth:0}}>
        <Typography sx={{fontSize:10,color:theme.muted}}>{locale==='fa'?'باقیمانده':'Headroom'}</Typography>
        <Typography sx={{fontSize:16,fontWeight:760,color:theme.foreground,overflowWrap:'anywhere'}}>{Math.max(0,max-value).toLocaleString('en-US',{maximumFractionDigits:1})} {unit}</Typography>
      </Box>
    </Box>}
  </Box>;
  return <Box dir="ltr" data-adaptive-gauge="true" sx={{height:'100%',width:'100%',minHeight:0,minWidth:0,display:'grid',gridTemplateRows:showTrace?`minmax(0,1fr) ${traceHeight}px`:'minmax(0,1fr)',gap:showTrace?1.2:0,overflow:'hidden'}}>
    <Box sx={{display:'grid',height:'100%',minHeight:0,minWidth:0,overflow:'hidden',gridTemplateColumns:horizontal?'minmax(0,1fr) minmax(0,1fr)':'minmax(0,1fr)',gap:horizontal?1.2:0,alignItems:'stretch'}}>
      {dial}
      {horizontal&&details}
    </Box>
    {showTrace&&<Box sx={{minHeight:0,display:'flex',alignItems:'end',gap:'2%',borderTop:`1px solid ${theme.border}`,pt:.8}}
      aria-label={locale==='fa'?'تاریخچه مقادیر':'Value history'}>
      {history!.slice(-36).map((n,i,arr)=><Box key={i} sx={{minWidth:2,flex:1,height:`${Math.max(5,clamp((n-min)/(max-min))*100)}%`,background:accent,opacity:.3+.65*i/arr.length,borderRadius:'3px 3px 0 0'}}/>)}
    </Box>}
  </Box>;
}
