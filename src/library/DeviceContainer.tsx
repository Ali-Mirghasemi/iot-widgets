import { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import SensorsOutlined from '@mui/icons-material/SensorsOutlined';
import type { Locale, WidgetThemeId, WidgetSize } from '../widgets/core/types';
import { IoTWidget } from './IoTWidget';
import { getWidgetDefinition } from './catalog';
import { DashboardGrid, type DashboardItem } from './DashboardGrid';
import { useWidgetAppearance, useResolvedWidgetTheme } from './WidgetThemeProvider';

export interface DeviceContainerProps {
  deviceId: string;
  title: string;
  widgets: DashboardItem[];
  onWidgetsChange: (widgets: DashboardItem[]) => void;
  /** Map telemetry keys to the individual child's data object. */
  telemetry?: Record<string, Record<string, unknown>>;
  editable?: boolean;
  locale?: Locale;
  themeId?: WidgetThemeId;
  status?: string;
  columns?: number;
}

/** A reusable group for multiple widgets of one device, with its own reorderable layout. */
export function DeviceContainer({deviceId,title,widgets,onWidgetsChange,telemetry={},editable=false,locale='en',themeId,status='Online',columns=6}:DeviceContainerProps) {
  const appearance=useWidgetAppearance();
  const resolved=themeId ?? appearance?.themeId ?? 'studio';
  const tokens=useResolvedWidgetTheme(resolved);
  const [expanded,setExpanded]=useState(false);
  return <Box data-device-container={deviceId} sx={{minWidth:0,p:2.2,bgcolor:tokens.surface,color:tokens.foreground,border:`1px solid ${tokens.border}`,borderRadius:3.2}}>
    <Box sx={{display:'flex',alignItems:'center',gap:1.2,mb:2}}>
      <Box sx={{width:38,height:38,bgcolor:tokens.accent+'1a',color:tokens.accent,display:'grid',placeItems:'center',borderRadius:2}}><SensorsOutlined/></Box>
      <Box sx={{flex:1,minWidth:0}}><Typography sx={{fontSize:15,fontWeight:800}}>{title}</Typography><Typography sx={{fontSize:11,color:tokens.muted}}>{deviceId} · {status}</Typography></Box>
      <Button size="small" onClick={()=>setExpanded(v=>!v)} sx={{color:tokens.accent,textTransform:'none'}}>{expanded?'Compact':'Expand group'}</Button>
    </Box>
    <DashboardGrid items={widgets} onChange={onWidgetsChange} editable={editable} columns={columns} rowHeight={expanded?146:110} gap={12} renderWidget={item=><IoTWidget
      widgetId={item.widgetId} themeId={item.themeId??resolved} colorMode={item.colorMode} locale={locale}
      size={((() => {
        const def = getWidgetDefinition(item.widgetId);
        const preferred = `${Math.min(item.w,3)}x${Math.min(item.h,3)}` as WidgetSize;
        return def?.supportedSizes.includes(preferred) ? preferred : def?.supportedSizes.includes('2x2') ? '2x2' : def?.defaultSize;
      })())} data={{...(item.data??{}),...(telemetry[item.id]??telemetry[item.widgetId]??{})}}
      metadata={{...(item.metadata??{}),deviceName:title,status}}
    />}/>
  </Box>;
}
