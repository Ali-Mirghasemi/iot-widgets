import type { ReactNode } from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import InfoOutlined from '@mui/icons-material/InfoOutlined';
import MoreHoriz from '@mui/icons-material/MoreHoriz';
import type { Locale, WidgetDefinition, WidgetSize, WidgetThemeTokens } from './types';

interface FrameProps {
  def: WidgetDefinition;
  theme: WidgetThemeTokens;
  locale: Locale;
  size: WidgetSize;
  deviceName: string;
  locationLabel: string;
  status: string;
  lastSeen: string;
  onInfo: () => void;
  children: ReactNode;
}

const dims = (size: WidgetSize) => {
  const [w,h] = size.split('x').map(Number);
  return { w,h, area:w*h, compact:w*h===1, roomy:w*h>=4 || w>=3 || h>=2 };
};

function Actions({ theme, locale, onInfo, ios = false }: Pick<FrameProps,'theme'|'locale'|'onInfo'> & { ios?: boolean }) {
  return <Box sx={{ display:'flex', alignItems:'center', gap:.15 }}>
    <Tooltip title={locale==='fa'?'اطلاعات':'Info'}>
      <IconButton size="small" onClick={onInfo} sx={{ color:theme.muted, width:28, height:28 }}>{ios ? <MoreHoriz sx={{fontSize:18}}/> : <InfoOutlined sx={{fontSize:16}}/>}</IconButton>
    </Tooltip>
  </Box>;
}

function StatusDot({ theme, status }: { theme:WidgetThemeTokens; status:string }) {
  const low = status.toLowerCase();
  const color = low.includes('critical') || low.includes('alarm') ? '#ef4444' : low.includes('warn') ? '#f59e0b' : theme.accent;
  return <Box sx={{ display:'inline-flex', alignItems:'center', gap:.55, minWidth:0 }}>
    <Box sx={{ width:7, height:7, borderRadius:'50%', bgcolor:color, boxShadow:`0 0 0 4px ${color}14` }}/>
    <Typography sx={{ fontSize:10.5, fontWeight:800, color:theme.muted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{status}</Typography>
  </Box>;
}

function MaterialFrame(p: FrameProps) {
  const d=dims(p.size); const Icon=p.def.icon; const title=p.locale==='fa'?p.def.titleFa:p.def.titleEn;
  return <Box sx={{ height:'100%', overflow:'hidden', position:'relative', borderRadius:3.5, bgcolor:'#fff', border:`1px solid ${p.theme.border}`, boxShadow:p.theme.shadow, display:'flex', flexDirection:'column', transition:'.2s', '&:hover':{transform:'translateY(-3px)',boxShadow:'0 18px 42px rgba(79,70,229,.16)'} }}>
    <Box sx={{ position:'absolute', insetInlineStart:0, top:0, bottom:0, width:4, background:`linear-gradient(180deg,${p.theme.accent},${p.theme.accent2})` }}/>
    <Box sx={{ px:1.55, pt:1.35, pb:.85, display:'flex', alignItems:'center', justifyContent:'space-between', gap:1, direction:p.locale==='fa'?'rtl':'ltr' }}>
      <Box sx={{ minWidth:0, display:'flex', alignItems:'center', gap:1 }}>
        <Box sx={{ width:36,height:36,borderRadius:2.5,display:'grid',placeItems:'center',bgcolor:`${p.theme.accent}12`,color:p.theme.accent }}><Icon sx={{fontSize:20}}/></Box>
        <Box sx={{minWidth:0}}>
          <Typography sx={{fontSize:11,color:p.theme.muted,fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.deviceName}</Typography>
          <Typography sx={{fontSize:15,fontWeight:850,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{title}</Typography>
        </Box>
      </Box>
      <Actions {...p}/>
    </Box>
    {!d.compact && <Box sx={{px:1.55,display:'flex',gap:1.3,alignItems:'center',direction:p.locale==='fa'?'rtl':'ltr'}}><StatusDot theme={p.theme} status={p.status}/><Typography sx={{fontSize:10.5,color:p.theme.muted}}>{p.locationLabel}</Typography></Box>}
    <Box sx={{ flex:1,minHeight:0,p:d.compact?1.45:1.55,pt:d.compact?1:1.2,overflow:'hidden' }}>{p.children}</Box>
    {d.roomy && <Box sx={{px:1.55,pb:1.15,display:'flex',justifyContent:'space-between',color:p.theme.muted,direction:p.locale==='fa'?'rtl':'ltr'}}><Typography sx={{fontSize:10.5}}>{p.lastSeen}</Typography><Typography sx={{fontSize:10.5,direction:'ltr'}}>{p.size}</Typography></Box>}
  </Box>;
}

function FlatFrame(p: FrameProps) {
  const d=dims(p.size); const Icon=p.def.icon; const title=p.locale==='fa'?p.def.titleFa:p.def.titleEn;
  return <Box sx={{height:'100%',overflow:'hidden',position:'relative',bgcolor:'#fff',border:`1px solid ${p.theme.border}`,borderRadius:1.5,display:'grid',gridTemplateRows:d.compact?'42px 1fr':'48px 1fr 27px',boxShadow:'0 6px 16px rgba(15,118,110,.06)'}}>
    <Box sx={{display:'flex',alignItems:'stretch',borderBottom:`1px solid ${p.theme.border}`,direction:p.locale==='fa'?'rtl':'ltr'}}>
      <Box sx={{width:42,display:'grid',placeItems:'center',bgcolor:p.theme.accent,color:'#fff'}}><Icon sx={{fontSize:20}}/></Box>
      <Box sx={{flex:1,minWidth:0,px:1.05,display:'flex',alignItems:'center',justifyContent:'space-between',gap:.7}}>
        <Box sx={{minWidth:0}}><Typography sx={{fontSize:14.5,fontWeight:900,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{title}</Typography>{!d.compact&&<Typography sx={{fontSize:10.3,color:p.theme.muted,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.deviceName}</Typography>}</Box>
        <Actions {...p}/>
      </Box>
    </Box>
    <Box sx={{minHeight:0,p:1.35,overflow:'hidden'}}>{p.children}</Box>
    {!d.compact&&<Box sx={{px:1.2,display:'flex',alignItems:'center',justifyContent:'space-between',bgcolor:'#f7faf9',borderTop:`1px solid ${p.theme.border}`,direction:p.locale==='fa'?'rtl':'ltr'}}><StatusDot theme={p.theme} status={p.status}/><Typography sx={{fontSize:10,color:p.theme.muted}}>{p.lastSeen}</Typography></Box>}
  </Box>;
}

function MinimalFrame(p: FrameProps) {
  const d=dims(p.size); const Icon=p.def.icon; const title=p.locale==='fa'?p.def.titleFa:p.def.titleEn;
  return <Box sx={{height:'100%',overflow:'hidden',position:'relative',bgcolor:'#fff',borderRadius:0,borderTop:'2px solid #111827',borderBottom:'1px solid #e5e7eb',display:'flex',flexDirection:'column'}}>
    <Box sx={{px:1.2,pt:1.2,pb:.35,display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:1,direction:p.locale==='fa'?'rtl':'ltr'}}>
      <Box sx={{minWidth:0}}><Typography sx={{fontSize:10.5,color:'#9ca3af',fontWeight:700,letterSpacing:.25,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.deviceName}</Typography><Box sx={{display:'flex',alignItems:'center',gap:.65,mt:.2}}><Icon sx={{fontSize:15,color:'#111827'}}/><Typography sx={{fontSize:14.5,fontWeight:800,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{title}</Typography></Box></Box>
      <Actions {...p}/>
    </Box>
    <Box sx={{flex:1,minHeight:0,p:d.compact?'1px 12px 12px':'8px 12px 12px',overflow:'hidden'}}>{p.children}</Box>
    {!d.compact&&<Box sx={{px:1.2,pb:.8,display:'flex',justifyContent:'space-between',alignItems:'center',direction:p.locale==='fa'?'rtl':'ltr'}}><Typography sx={{fontSize:10,color:'#9ca3af'}}>{p.locationLabel}</Typography><StatusDot theme={p.theme} status={p.status}/></Box>}
  </Box>;
}

function GamingFrame(p: FrameProps) {
  const d=dims(p.size); const Icon=p.def.icon; const title=p.locale==='fa'?p.def.titleFa:p.def.titleEn;
  return <Box sx={{height:'100%',position:'relative',overflow:'hidden',clipPath:'polygon(0 12px,12px 0,calc(100% - 20px) 0,100% 20px,100% calc(100% - 12px),calc(100% - 12px) 100%,16px 100%,0 calc(100% - 16px))',background:'linear-gradient(160deg,#07111e,#020811)',color:'#e6fbff',fontFamily:'"Rajdhani",Inter,monospace',boxShadow:'0 0 0 1px rgba(25,247,255,.22),0 16px 38px rgba(2,8,23,.55)'}}>
    <Box sx={{position:'absolute',inset:1,clipPath:'inherit',border:'1px solid rgba(25,247,255,.32)',pointerEvents:'none'}}/>
    <Box sx={{position:'absolute',inset:0,opacity:.10,backgroundImage:'repeating-linear-gradient(0deg,transparent 0 4px,rgba(25,247,255,.2) 5px)'}}/>
    <Box sx={{height:'100%',position:'relative',zIndex:1,display:'flex',flexDirection:'column'}}>
      <Box sx={{px:1.35,pt:1.05,pb:.7,display:'flex',alignItems:'center',justifyContent:'space-between',borderBottom:'1px solid rgba(25,247,255,.18)',direction:'ltr'}}>
        <Box sx={{minWidth:0,display:'flex',alignItems:'center',gap:.85}}><Box sx={{width:28,height:28,display:'grid',placeItems:'center',border:'1px solid rgba(25,247,255,.36)',color:'#19f7ff'}}><Icon sx={{fontSize:17}}/></Box><Box sx={{minWidth:0}}><Typography sx={{fontFamily:'inherit',fontSize:9.5,letterSpacing:1.2,color:'#7da0ab'}}>SYS://{p.def.id.toUpperCase()}</Typography><Typography sx={{fontFamily:'inherit',fontSize:14.5,fontWeight:900,letterSpacing:.7,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{title}</Typography></Box></Box>
        <Actions {...p}/>
      </Box>
      {!d.compact&&<Box sx={{px:1.35,pt:.6,display:'flex',justifyContent:'space-between',gap:1,direction:'ltr'}}><Typography sx={{fontFamily:'inherit',fontSize:10.5,color:'#88a4ad',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.deviceName}</Typography><Typography sx={{fontFamily:'inherit',fontSize:10.5,color:'#00ffc8'}}>[{p.status.toUpperCase()}]</Typography></Box>}
      <Box sx={{flex:1,minHeight:0,p:1.35,overflow:'hidden'}}>{p.children}</Box>
      {!d.compact&&<Box sx={{px:1.35,pb:.75,display:'flex',justifyContent:'space-between',fontFamily:'inherit'}}><Typography sx={{fontFamily:'inherit',fontSize:9.5,color:'#63838d'}}>LOC:{p.locationLabel}</Typography><Typography sx={{fontFamily:'inherit',fontSize:9.5,color:'#63838d'}}>GRID:{p.size}</Typography></Box>}
    </Box>
  </Box>;
}

function IOSFrame(p: FrameProps) {
  const d=dims(p.size); const Icon=p.def.icon; const title=p.locale==='fa'?p.def.titleFa:p.def.titleEn;
  return <Box sx={{height:'100%',overflow:'hidden',position:'relative',borderRadius:'28px',background:`linear-gradient(145deg,rgba(255,255,255,.96),${p.theme.accent}0c)`,border:'1px solid rgba(255,255,255,.9)',boxShadow:'0 18px 42px rgba(15,23,42,.11)',backdropFilter:'blur(20px) saturate(145%)',display:'flex',flexDirection:'column'}}>
    <Box sx={{px:1.5,pt:1.35,pb:.55,display:'flex',alignItems:'center',justifyContent:'space-between',gap:1,direction:p.locale==='fa'?'rtl':'ltr'}}>
      <Box sx={{display:'flex',alignItems:'center',gap:.85,minWidth:0}}><Box sx={{width:38,height:38,borderRadius:'50%',display:'grid',placeItems:'center',background:`linear-gradient(145deg,${p.theme.accent},${p.theme.accent2})`,color:'#fff',boxShadow:`0 8px 18px ${p.theme.accent}2a`}}><Icon sx={{fontSize:19}}/></Box><Box sx={{minWidth:0}}><Typography sx={{fontSize:10.5,color:'#8e8e93',fontWeight:650,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.locationLabel}</Typography><Typography sx={{fontSize:15,fontWeight:780,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{title}</Typography></Box></Box>
      <Actions {...p} ios/>
    </Box>
    <Box sx={{flex:1,minHeight:0,p:d.compact?'8px 14px 14px':'10px 15px 14px',overflow:'hidden'}}>{p.children}</Box>
    {!d.compact&&<Box sx={{px:1.55,pb:1.15,display:'flex',alignItems:'center',justifyContent:'space-between',direction:p.locale==='fa'?'rtl':'ltr'}}><Typography sx={{fontSize:10.5,color:'#8e8e93',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.deviceName}</Typography><StatusDot theme={p.theme} status={p.status}/></Box>}
  </Box>;
}

function GlassFrame(p: FrameProps) {
  const d=dims(p.size); const Icon=p.def.icon; const title=p.locale==='fa'?p.def.titleFa:p.def.titleEn;
  return <Box sx={{height:'100%',overflow:'hidden',position:'relative',borderRadius:'25px',background:'linear-gradient(150deg,rgba(255,255,255,.18),rgba(255,255,255,.06))',border:'1px solid rgba(255,255,255,.24)',boxShadow:'0 20px 46px rgba(2,8,23,.28)',backdropFilter:'blur(24px) saturate(160%)',color:'#f8fafc',display:'flex',flexDirection:'column'}}>
    <Box sx={{position:'absolute',width:120,height:120,borderRadius:'50%',right:-35,top:-45,background:`${p.theme.accent}35`,filter:'blur(8px)'}}/>
    <Icon sx={{position:'absolute',right:14,bottom:10,fontSize:d.compact?60:88,color:'rgba(255,255,255,.055)'}}/>
    <Box sx={{position:'relative',zIndex:1,px:1.5,pt:1.3,pb:.55,display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:1,direction:p.locale==='fa'?'rtl':'ltr'}}>
      <Box sx={{minWidth:0}}><Typography sx={{fontSize:10.5,color:'rgba(255,255,255,.68)',fontWeight:700,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.deviceName}</Typography><Typography sx={{fontSize:15.5,fontWeight:800,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{title}</Typography></Box>
      <Actions {...p}/>
    </Box>
    {!d.compact&&<Box sx={{position:'relative',zIndex:1,px:1.5,display:'flex',gap:1.2,alignItems:'center'}}><StatusDot theme={p.theme} status={p.status}/><Typography sx={{fontSize:10.5,color:'rgba(255,255,255,.6)'}}>{p.locationLabel}</Typography></Box>}
    <Box sx={{position:'relative',zIndex:1,flex:1,minHeight:0,p:1.45,overflow:'hidden'}}>{p.children}</Box>
  </Box>;
}

export function WidgetFrame(props: FrameProps) {
  switch (props.theme.id) {
    case 'flat': return <FlatFrame {...props}/>;
    case 'minimal': return <MinimalFrame {...props}/>;
    case 'gaming': return <GamingFrame {...props}/>;
    case 'ios': return <IOSFrame {...props}/>;
    case 'glass': return <GlassFrame {...props}/>;
    default: return <MaterialFrame {...props}/>;
  }
}
