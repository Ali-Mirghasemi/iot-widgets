import { Box, IconButton, Typography } from '@mui/material';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import type { WidgetFrameProps } from '../core/WidgetFrame';

/** Physical smart-home tile: icon sculpture, raised surface and calm device identity. */
export function TactileFrame(p:WidgetFrameProps){
 const compact=p.view==='compact',rtl=p.locale==='fa';
 const Icon=p.def.icon;
 const title=rtl?p.def.titleFa:p.def.titleEn;
 return <Box data-iot-theme-frame="tactile" sx={{height:'100%',width:'100%',minHeight:0,minWidth:0,boxSizing:'border-box',overflow:'hidden',display:'grid',
  gridTemplateRows:compact?'auto minmax(0,1fr)':'auto minmax(0,1fr) auto',borderRadius:compact?'20px':'28px',color:p.theme.foreground,
  background:p.theme.surface,border:`1px solid ${p.theme.border}`,boxShadow:`0 11px 28px ${p.theme.accent}10, inset 0 2px 1px rgba(255,255,255,.65)`,
  fontFamily:'Inter, ui-sans-serif, system-ui, sans-serif',position:'relative'}}>
  <Box sx={{px:compact?1.25:1.65,pt:compact?1.1:1.55,pb:compact?.2:.5,display:'flex',alignItems:'center',gap:1.1,direction:rtl?'rtl':'ltr',minWidth:0}}>
   <Box sx={{height:compact?35:45,width:compact?35:45,flexShrink:0,display:'grid',placeItems:'center',borderRadius:compact?'12px':'17px',
    background:`linear-gradient(145deg,${p.theme.accent}23,${p.theme.accent2}24)`,color:p.theme.accent,
    boxShadow:`inset 0 1px 2px rgba(255,255,255,.65),0 3px 8px ${p.theme.accent}16`}}><Icon sx={{fontSize:compact?19:25}}/></Box>
   <Box sx={{flex:1,minWidth:0}}><Typography sx={{fontSize:compact?12.5:14.5,fontWeight:800,lineHeight:1.22,
    textOverflow:'ellipsis',overflow:'hidden',whiteSpace:'nowrap'}}>{title}</Typography>
    {!compact&&<Typography sx={{mt:.25,fontSize:10.5,color:p.theme.muted,whiteSpace:'nowrap',textOverflow:'ellipsis',overflow:'hidden'}}>{p.deviceName}</Typography>}
   </Box>
   {p.onInfo&&<IconButton size="small" aria-label={rtl?'اطلاعات':'Widget information'} onClick={p.onInfo} sx={{color:p.theme.muted,p:.3}}><InfoOutlined sx={{fontSize:17}}/></IconButton>}
  </Box>
  <Box sx={{minHeight:0,minWidth:0,p:compact?'4px 14px 13px':'8px 18px 11px',overflow:'hidden'}}>{p.children}</Box>
  {!compact&&<Box sx={{px:1.8,pb:1.15,pt:.15,display:'flex',justifyContent:'space-between',alignItems:'center',gap:1,direction:rtl?'rtl':'ltr'}}>
   <Typography sx={{fontSize:10.5,color:p.theme.muted,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{p.locationLabel}</Typography>
   <Box sx={{display:'flex',alignItems:'center',gap:.6}}><Box sx={{height:7,width:7,borderRadius:'50%',bgcolor:p.theme.accent2}}/><Typography sx={{fontSize:10.5,fontWeight:700,color:p.theme.muted}}>{p.status}</Typography></Box>
  </Box>}
 </Box>;
}
