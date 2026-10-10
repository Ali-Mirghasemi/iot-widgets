import { Box, IconButton, Typography } from '@mui/material';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import type { WidgetFrameProps } from '../core/WidgetFrame';

/** Instrument bezel, compact operator labels, alarm-status strip. Not a recolored Studio card. */
export function ProcessFrame(p: WidgetFrameProps) {
  const compact=p.view==='compact';
  const rtl=p.locale==='fa';
  const Icon=p.def.icon;
  const title=rtl?p.def.titleFa:p.def.titleEn;
  const alarm=/alarm|error|critical|offline/i.test(p.status);
  const statusColor=alarm?'#ff796a':p.theme.accent2;
  return <Box data-iot-theme-frame="process" sx={{width:'100%',height:'100%',minHeight:0,minWidth:0,overflow:'hidden',boxSizing:'border-box',
    bgcolor:p.theme.surface,color:p.theme.foreground,border:`1px solid ${p.theme.border}`,borderRadius:1,
    boxShadow:`inset 0 0 0 1px ${p.theme.accent}10, ${p.theme.shadow}`,display:'grid',gridTemplateRows:compact?'auto minmax(0,1fr)':'auto minmax(0,1fr) auto',
    fontFamily:'"IBM Plex Mono", "Roboto Mono", ui-monospace, monospace',position:'relative'}}>
    <Box sx={{height:3,position:'absolute',top:0,left:0,right:0,background:`linear-gradient(90deg,${p.theme.accent},${p.theme.accent2})`}}/>
    <Box sx={{minWidth:0,px:compact?1:1.4,pt:compact?1.05:1.5,pb:compact?.6:1,
      display:'flex',alignItems:'center',gap:1,direction:rtl?'rtl':'ltr',borderBottom:`1px solid ${p.theme.border}`}}>
      <Box sx={{width:compact?25:31,height:compact?25:31,display:'grid',placeItems:'center',flexShrink:0,
        bgcolor:`${p.theme.accent}17`,border:`1px solid ${p.theme.accent}70`,color:p.theme.accent}}><Icon sx={{fontSize:compact?16:19}}/></Box>
      <Box sx={{flex:1,minWidth:0}}>
        <Typography sx={{fontFamily:'inherit',fontSize:compact?11:13,fontWeight:850,lineHeight:1.2,
          textOverflow:'ellipsis',overflow:'hidden',whiteSpace:'nowrap',color:p.theme.foreground}}>{title}</Typography>
        {!compact&&<Typography sx={{fontFamily:'inherit',fontSize:9,mt:.25,color:p.theme.muted,
          textOverflow:'ellipsis',overflow:'hidden',whiteSpace:'nowrap'}}>{p.deviceName}</Typography>}
      </Box>
      {p.onInfo&&<IconButton onClick={p.onInfo} size="small" aria-label={rtl?'اطلاعات':'Widget information'} sx={{color:p.theme.muted,p:0.4}}><InfoOutlined sx={{fontSize:16}}/></IconButton>}
      <Box sx={{width:7,height:7,flexShrink:0,bgcolor:statusColor,boxShadow:`0 0 0 3px ${statusColor}20`}}/>
    </Box>
    <Box sx={{minWidth:0,minHeight:0,overflow:'hidden',p:compact?1:1.5,backgroundImage:`linear-gradient(${p.theme.accent}07 1px,transparent 1px),linear-gradient(90deg,${p.theme.accent}07 1px,transparent 1px)`,backgroundSize:'21px 21px'}}>{p.children}</Box>
    {!compact&&<Box sx={{minWidth:0,display:'flex',alignItems:'center',justifyContent:'space-between',gap:1,direction:rtl?'rtl':'ltr',
      borderTop:`1px solid ${p.theme.border}`,px:1.3,py:.45}}>
      <Typography sx={{fontFamily:'inherit',fontSize:9,color:p.theme.muted,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.locationLabel}</Typography>
      <Typography sx={{fontFamily:'inherit',fontSize:9,color:statusColor,fontWeight:850,whiteSpace:'nowrap'}}>{p.status.toUpperCase()}</Typography>
    </Box>}
  </Box>;
}
