import { useState, type ReactNode } from 'react';
import { Box, Dialog, DialogContent, DialogTitle, IconButton, Typography, useMediaQuery } from '@mui/material';
import CloseRounded from '@mui/icons-material/CloseRounded';
import { WidgetThemeProvider, type DashboardAppearance } from './WidgetThemeProvider';
import { DashboardGrid, type DashboardGridProps, type DashboardItem } from './DashboardGrid';
import { IoTWidget } from './IoTWidget';
import { getWidgetDefinition } from './catalog';
import { widgetSizeForGrid } from './adaptive';
import type { Locale } from '../widgets/core/types';

export interface DashboardPanelProps extends Pick<DashboardGridProps,'items'|'editable'|'onChange'|'onContextItem'|'columns'|'rowHeight'|'gap'> {
  /** Panel-level visual theme and colors inherited by all children by default. */
  appearance:DashboardAppearance;
  locale?:Locale;
  className?:string;
  /** Overrides the built-in IoT widget renderer. */
  renderWidget?: (item:DashboardItem, expanded:boolean)=>ReactNode;
  /** Supplying this callback leaves expanded view ownership to the host. */
  onExpand?: (item:DashboardItem)=>void;
  /** Set false to disable the built-in expanded dialog. */
  expandable?:boolean;
}

/**
 * Reusable dashboard container for host applications. It owns presentation,
 * responsive grid, palette inheritance and optional expanded view—not API
 * requests, telemetry, persistence or user permissions.
 */
export function DashboardPanel({items,editable=false,onChange,onContextItem,appearance,locale='en',
  className,renderWidget,onExpand,expandable=true,columns=12,rowHeight=98,gap=14}:DashboardPanelProps){
  const [expanded,setExpanded]=useState<DashboardItem|null>(null);
  const phone=useMediaQuery('(max-width:600px)');
  const render=(item:DashboardItem,large:boolean)=>{
    if(renderWidget)return renderWidget(item,large);
    const def=getWidgetDefinition(item.widgetId);
    if(!def)return null;
    return <IoTWidget key={item.id} widgetId={item.widgetId} themeId={item.themeId??appearance.themeId}
      colorMode={item.colorMode} size={widgetSizeForGrid(def,item.w,item.h,large)}
      expanded={large} view={large?'detailed':item.view??'auto'} data={item.data}
      metadata={item.metadata} locale={item.locale??locale}/>;
  };
  const expand=expandable?(onExpand??setExpanded):undefined;
  const direction=locale==='fa'?'rtl':'ltr';
  return <WidgetThemeProvider appearance={appearance}>
    <Box className={className} data-iot-dashboard-panel="true" data-dashboard-locale={locale}
      dir={direction} sx={{width:'100%',minWidth:0,direction:'ltr'}}>
      <DashboardGrid items={items} editable={editable} onChange={onChange} onExpand={expand}
        onContextItem={onContextItem} columns={columns} rowHeight={rowHeight} gap={gap}
        renderWidget={item=>render(item,false)}/>
      <Dialog open={Boolean(expanded)} onClose={()=>setExpanded(null)} fullScreen={phone}
        maxWidth={false} PaperProps={{sx:{width:phone?'100vw':'min(95vw,1500px)',height:phone?'100dvh':'min(90vh,850px)',borderRadius:phone?0:3,background:appearance.palette.background??(appearance.mode==='dark'?'#0c1220':'#f1f5fa')}}}>
        <DialogTitle dir={direction} sx={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:2}}>
          <Typography sx={{fontWeight:750,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
            {expanded&&(locale==='fa'?getWidgetDefinition(expanded.widgetId)?.titleFa:getWidgetDefinition(expanded.widgetId)?.titleEn)}
          </Typography>
          <IconButton aria-label={locale==='fa'?'بستن':'Close'} onClick={()=>setExpanded(null)}><CloseRounded/></IconButton>
        </DialogTitle>
        <DialogContent sx={{p:{xs:1,sm:2},minHeight:0}}>
          {expanded&&<Box sx={{height:'100%',minHeight:0}}>{render(expanded,true)}</Box>}
        </DialogContent>
      </Dialog>
    </Box>
  </WidgetThemeProvider>;
}
