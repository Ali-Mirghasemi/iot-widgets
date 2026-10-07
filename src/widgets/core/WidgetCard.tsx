import { useState } from 'react';
import {
  Box, Chip, Dialog, DialogContent, DialogTitle, Divider, ListItemIcon, ListItemText,
  Menu, MenuItem, Stack, Typography,
} from '@mui/material';
import Check from '@mui/icons-material/Check';
import type { Locale, WidgetDefinition, WidgetSize, WidgetThemeTokens } from './types';
import { WidgetVisualRenderer } from '../renderers/WidgetVisuals';
import { WidgetFrame } from './WidgetFrame';
import { categoryLabels, tr } from '../../i18n/translations';

interface Props {
  def: WidgetDefinition;
  theme: WidgetThemeTokens;
  locale: Locale;
  forcedSize?: WidgetSize;
  qaMode?: boolean;
}

const text = (v: unknown, fallback='') => typeof v === 'string' ? v : fallback;

type ContextPosition = { mouseX: number; mouseY: number } | null;

export function WidgetCard({ def, theme, locale, forcedSize, qaMode=false }: Props) {
  const [open,setOpen]=useState(false);
  const [localSize,setLocalSize]=useState(def.defaultSize);
  const [contextMenu,setContextMenu]=useState<ContextPosition>(null);
  const size = forcedSize ?? localSize;
  const Icon=def.icon;
  const title=locale==='fa'?def.titleFa:def.titleEn;
  const deviceName=locale==='fa'?text(def.mock.deviceNameFa,text(def.mock.deviceName,'دستگاه نمونه')):text(def.mock.deviceName,'Demo Device');
  const locationLabel=locale==='fa'?text(def.mock.locationLabelFa,text(def.mock.locationLabel,'ناحیه A')):text(def.mock.locationLabel,'Zone A');
  const status=locale==='fa'?text(def.mock.statusFa,text(def.mock.status,'فعال')):text(def.mock.status,'Live');
  const lastSeen=locale==='fa'?text(def.mock.lastSeenFa,text(def.mock.lastSeen,'اکنون')):text(def.mock.lastSeen,'Just now');
  const bodyDir=def.direction==='auto'?(locale==='fa'?'rtl':'ltr'):def.direction;

  const handleContextMenu = (event: React.MouseEvent) => {
    if (qaMode || forcedSize) return;
    event.preventDefault();
    setContextMenu(contextMenu === null ? { mouseX:event.clientX + 2, mouseY:event.clientY - 6 } : null);
  };

  const selectSize = (next: WidgetSize) => {
    setLocalSize(next);
    setContextMenu(null);
  };

  return <>
    <Box
      className={`widget-grid-item size-${size.replace('x','-')}`}
      sx={{minWidth:0}}
      onContextMenu={handleContextMenu}
      data-widget-card="true"
      data-widget-id={def.id}
      data-widget-size={size}
      data-widget-theme={theme.id}
      data-widget-category={def.category}
    >
      <WidgetFrame def={def} theme={theme} locale={locale} size={size} deviceName={deviceName} locationLabel={locationLabel} status={status} lastSeen={lastSeen} onInfo={()=>setOpen(true)}>
        <Box dir={bodyDir} sx={{height:'100%',minHeight:0}} data-widget-body="true">
          <WidgetVisualRenderer def={def} theme={theme} locale={locale} size={size}/>
        </Box>
      </WidgetFrame>
    </Box>

    {!qaMode && !forcedSize && <Menu
      open={contextMenu !== null}
      onClose={()=>setContextMenu(null)}
      anchorReference="anchorPosition"
      anchorPosition={contextMenu ? { top:contextMenu.mouseY, left:contextMenu.mouseX } : undefined}
      slotProps={{ paper:{ sx:{ minWidth:180, borderRadius:2.5, boxShadow:'0 16px 40px rgba(15,23,42,.18)' } } }}
    >
      <Typography sx={{px:2,pt:.7,pb:.6,fontSize:11,fontWeight:800,color:'text.secondary',textTransform:'uppercase',letterSpacing:.7}}>
        {locale==='fa'?'اندازه ویجت':'Widget size'}
      </Typography>
      {def.supportedSizes.map(sz=><MenuItem key={sz} selected={sz===size} onClick={()=>selectSize(sz)}>
        <ListItemIcon sx={{minWidth:30}}>{sz===size ? <Check fontSize="small"/> : <Box sx={{width:18}}/>}</ListItemIcon>
        <ListItemText primary={sz} secondary={sizeLabel(sz,locale)} />
      </MenuItem>)}
    </Menu>}

    {!qaMode && <Dialog open={open} onClose={()=>setOpen(false)} maxWidth="sm" fullWidth dir={locale==='fa'?'rtl':'ltr'}>
      <DialogTitle sx={{display:'flex',alignItems:'center',gap:1}}><Icon color="primary"/>{title}</DialogTitle>
      <DialogContent>
        <Typography sx={{color:'text.secondary',lineHeight:1.9,direction:'rtl',textAlign:'right'}}>{def.descriptionFa}</Typography>
        <Divider sx={{my:2}}/>
        <MetaRow label={locale==='fa'?'دستگاه':'Device'} value={deviceName}/>
        <MetaRow label={locale==='fa'?'محل':'Location'} value={locationLabel}/>
        <MetaRow label={tr(locale).category} value={categoryLabels[def.category][locale]}/>
        <MetaRow label={tr(locale).direction} value={def.direction.toUpperCase()}/>
        <Typography variant="overline" color="text.secondary">{tr(locale).fields}</Typography>
        <Stack spacing={1} sx={{mb:2}}>{def.fields.map(f=><Box key={f.key} sx={{display:'flex',justifyContent:'space-between',gap:2,p:1.1,border:'1px solid',borderColor:'divider',borderRadius:2}}><Typography sx={{fontWeight:700}}>{locale==='fa'?f.labelFa:f.labelEn}</Typography><Typography color="text.secondary">{f.type}{f.unit?` · ${f.unit}`:''}</Typography></Box>)}</Stack>
        <Typography variant="overline" color="text.secondary">{tr(locale).sizes}</Typography>
        <Stack direction="row" flexWrap="wrap" gap={1} sx={{my:1.2}}>{def.supportedSizes.map(sz=><Chip key={sz} size="small" label={sz} color={sz===size?'primary':'default'} onClick={forcedSize?undefined:()=>selectSize(sz)} />)}</Stack>
        {!!def.capabilities?.length&&<><Typography variant="overline" color="text.secondary">{tr(locale).capabilities}</Typography><Stack direction="row" flexWrap="wrap" gap={1} sx={{mt:1}}>{def.capabilities.map(c=><Chip key={c} size="small" label={c}/>)}</Stack></>}
      </DialogContent>
    </Dialog>}
  </>;
}

function sizeLabel(size: WidgetSize, locale: Locale) {
  const [w,h] = size.split('x').map(Number);
  if (locale==='fa') {
    if (w===1 && h===1) return 'کوچک';
    if (w*h>=6) return 'بسیار بزرگ';
    if (w*h>=4) return 'بزرگ';
    if (w>h) return 'افقی';
    if (h>w) return 'عمودی';
    return 'متوسط';
  }
  if (w===1 && h===1) return 'Compact';
  if (w*h>=6) return 'Extra large';
  if (w*h>=4) return 'Large';
  if (w>h) return 'Wide';
  if (h>w) return 'Tall';
  return 'Medium';
}

function MetaRow({label,value}:{label:string;value:string}){return <Box sx={{display:'flex',justifyContent:'space-between',gap:2,py:.7}}><Typography color="text.secondary">{label}</Typography><Typography sx={{fontWeight:700}}>{value}</Typography></Box>}
