import { Box, Typography } from '@mui/material';
import KeyboardArrowUpRounded from '@mui/icons-material/KeyboardArrowUpRounded';
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded';
import KeyboardArrowLeftRounded from '@mui/icons-material/KeyboardArrowLeftRounded';
import KeyboardArrowRightRounded from '@mui/icons-material/KeyboardArrowRightRounded';
import type { WidgetRendererProps } from './WidgetVisuals';

/** Direction actions are *momentary buttons*, not latched states. */
export function MomentaryDirection({theme,locale}:WidgetRendererProps){
  const arrows=[
    {direction:'up',icon:<KeyboardArrowUpRounded/>,gridColumn:2,gridRow:1},
    {direction:'left',icon:<KeyboardArrowLeftRounded/>,gridColumn:1,gridRow:2},
    {direction:'right',icon:<KeyboardArrowRightRounded/>,gridColumn:3,gridRow:2},
    {direction:'down',icon:<KeyboardArrowDownRounded/>,gridColumn:2,gridRow:3},
  ];
  return <Box sx={{height:'100%',minHeight:0,width:'100%',display:'grid',placeItems:'center'}}>
    <Box dir="ltr" role="group" aria-label={locale==='fa'?'کنترل جهت':'Directional control'}
      sx={{height:'100%',maxHeight:250,aspectRatio:1,minWidth:0,maxWidth:'100%',display:'grid',gridTemplateColumns:'repeat(3,minmax(0,1fr))',gridTemplateRows:'repeat(3,minmax(0,1fr))',gap:'5%',p:.5}}>
      {arrows.map(b=><Box component="button" key={b.direction} type="button" data-direction={b.direction}
        aria-label={locale==='fa'?({up:'بالا',down:'پایین',left:'چپ',right:'راست'} as Record<string,string>)[b.direction]:b.direction}
        sx={{all:'unset',gridColumn:b.gridColumn,gridRow:b.gridRow,cursor:'pointer',touchAction:'manipulation',userSelect:'none',border:`1px solid ${theme.border}`,
          borderRadius:2,background:theme.surface,color:theme.foreground,minWidth:38,minHeight:38,
          display:'grid',placeItems:'center',transition:'background .1s, color .1s, transform .1s',
          '& svg':{fontSize:'clamp(20px,4cqw,31px)'},
          '&:hover':{borderColor:theme.accent},
          '&:active':{background:theme.accent,color:theme.background,transform:'scale(.94)'},
          '&:focus-visible':{outline:`2px solid ${theme.accent}`,outlineOffset:2}}}>{b.icon}</Box>)}
      <Box sx={{gridColumn:2,gridRow:2,display:'grid',placeItems:'center'}}>
        <Typography sx={{fontSize:10,color:theme.muted,fontWeight:700}}>{locale==='fa'?'جهت':'MOVE'}</Typography>
      </Box>
    </Box>
  </Box>;
}
