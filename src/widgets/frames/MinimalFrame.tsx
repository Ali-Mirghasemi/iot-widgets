import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import type { WidgetFrameProps } from '../core/WidgetFrame';

/** Standalone minimalist frame, without eager imports of other theme frames. */
export function MinimalFrame(p: WidgetFrameProps) {
  const [w,h] = p.size.split('x').map(Number);
  const compact = p.view === 'compact' || (p.view === undefined && w*h===1);
  const Icon = p.def.icon;
  const title = p.locale === 'fa' ? p.def.titleFa : p.def.titleEn;
  const rtl = p.locale === 'fa';
  return <Box sx={{height:'100%',minHeight:0,overflow:'hidden',position:'relative',
    bgcolor:p.theme.inheritPalette?p.theme.surface:'#fff',color:p.theme.foreground,
    borderRadius:0,borderTop:`2px solid ${p.theme.inheritPalette?p.theme.accent:'#111827'}`,
    borderBottom:`1px solid ${p.theme.border}`,display:'flex',flexDirection:'column'}}>
    <Box sx={{px:1.2,pt:1.2,pb:.35,display:'flex',alignItems:'flex-start',
      justifyContent:'space-between',gap:1,direction:rtl?'rtl':'ltr'}}>
      <Box sx={{minWidth:0}}>
        <Typography sx={{fontSize:10.5,color:p.theme.muted,fontWeight:700,overflow:'hidden',
          textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.deviceName}</Typography>
        <Box sx={{display:'flex',alignItems:'center',gap:.65,mt:.2}}>
          <Icon sx={{fontSize:15,color:p.theme.foreground}}/>
          <Typography sx={{fontSize:14.5,fontWeight:800,overflow:'hidden',
            textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{title}</Typography>
        </Box>
      </Box>
      {p.onInfo&&<Tooltip title={rtl?'اطلاعات':'Info'}>
        <IconButton size="small" onClick={p.onInfo} sx={{color:p.theme.muted,width:28,height:28}}>
          <InfoOutlined sx={{fontSize:16}}/>
        </IconButton>
      </Tooltip>}
    </Box>
    <Box sx={{flex:1,minHeight:0,p:compact?'1px 12px 12px':'8px 12px 12px',
      overflow:'hidden'}}>{p.children}</Box>
    {!compact && <Box sx={{px:1.2,pb:.8,display:'flex',justifyContent:'space-between',
      alignItems:'center',gap:1,direction:rtl?'rtl':'ltr'}}>
      <Typography sx={{fontSize:10,color:p.theme.muted,overflow:'hidden',
        textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.locationLabel}</Typography>
      <Typography sx={{fontSize:10,color:p.theme.muted,overflow:'hidden',
        textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.status}</Typography>
    </Box>}
  </Box>;
}
