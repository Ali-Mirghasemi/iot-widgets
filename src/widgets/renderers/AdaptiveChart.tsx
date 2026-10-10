import { Box, Typography } from '@mui/material';
import { useId } from 'react';
import type { WidgetRendererProps } from './WidgetVisuals';

/** Small charts keep the visual intact instead of squeezing labels, legends and axes together. */
export function AdaptiveChart({def,theme,locale,history}:WidgetRendererProps){
  const id=useId().replace(/[^a-z0-9]/gi,'');
  const source=history??(Array.isArray(def.mock.values)?def.mock.values:undefined);
  const data=(source??[]).filter((value):value is number=>typeof value==='number'&&Number.isFinite(value)).slice(-40);
  if(data.length<2)return <Box sx={{display:'grid',placeItems:'center',height:'100%',minHeight:0}}><Typography sx={{fontSize:12,color:theme.muted}}>{locale==='fa'?'دادهٔ تاریخی موجود نیست':'No history available'}</Typography></Box>;
  const min=Math.min(...data),max=Math.max(...data),range=Math.max(.00001,max-min);
  const points=data.map((v,i)=>`${12+(i/(data.length-1))*276},${99-(v-min)/range*76}`).join(' ');
  const bars=def.visual==='bar'||def.visual==='histogram';
  const primary=theme.accent,secondary=theme.accent2;
  return <Box data-adaptive-chart="true" sx={{height:'100%',width:'100%',minHeight:0,minWidth:0,overflow:'hidden'}}>
    <svg viewBox="0 0 300 116" preserveAspectRatio="none" role="img" aria-label={locale==='fa'?'نمودار روند داده':'Data trend chart'} width="100%" height="100%" style={{display:'block'}}>
      <defs><linearGradient id={`chart-fill-${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={primary} stopOpacity=".38"/><stop offset="1" stopColor={primary} stopOpacity="0"/></linearGradient></defs>
      {[24,60,99].map(y=><line key={y} x1="6" y1={y} x2="294" y2={y} stroke={theme.border} strokeWidth="1" strokeDasharray="4 5"/>)}
      {bars ? data.slice(-20).map((v,i,a)=>{
        const width=280/a.length, height=Math.max(3,(v-min)/range*76);
        return <rect key={i} x={12+i*width+2} y={99-height} width={Math.max(2,width-4)} height={height} rx="2" fill={i===a.length-1?secondary:primary} opacity={.65+i/a.length*.35}/>;
      }):<>
        <polygon points={`12,110 ${points} 288,110`} fill={`url(#chart-fill-${id})`}/>
        <polyline points={points} fill="none" stroke={primary} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
      </>}
    </svg>
  </Box>;
}
