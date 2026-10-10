import { Box, Typography } from '@mui/material';
import { useEffect, useRef, useState, type ComponentType } from 'react';
import type { Locale, WidgetDefinition, WidgetSize, WidgetThemeId, WidgetThemeTokens } from '../core/types';
import { FlatVisualRenderer } from '../themes/FlatVisuals';
import { GamingVisualRenderer } from '../themes/GamingVisuals';
import { GlassVisualRenderer } from '../themes/GlassVisuals';
import { IOSVisualRenderer } from '../themes/IOSVisuals';
import { MaterialVisualRenderer } from '../themes/MaterialVisuals';
import { MinimalVisualRenderer } from '../themes/MinimalVisuals';
import { resolveWidgetView, type ResolvedWidgetView } from '../../library/adaptive';
import { StudioVisualRenderer } from '../themes/StudioVisuals';
import { AdaptiveGauge } from './AdaptiveGauge';
import { AdaptiveChart } from './AdaptiveChart';
import { MomentaryDirection } from './MomentaryDirection';

export interface WidgetRendererProps {
  def: WidgetDefinition;
  theme: WidgetThemeTokens;
  locale: Locale;
  size: WidgetSize;
  view?: ResolvedWidgetView;
  /** Only provided runtime history is shown in the adaptive metric chart. */
  history?: number[];
}

const visualRenderers: Record<WidgetThemeId, ComponentType<WidgetRendererProps>> = {
  studio: StudioVisualRenderer,
  horizon: StudioVisualRenderer,
  material: MaterialVisualRenderer,
  flat: FlatVisualRenderer,
  minimal: MinimalVisualRenderer,
  gaming: GamingVisualRenderer,
  ios: IOSVisualRenderer,
  glass: GlassVisualRenderer,
};

/**
 * Renders the theme-specific body for a widget.
 *
 * This component is intentionally very small: each built-in theme owns its own
 * renderer module so themes can use completely different composition systems
 * rather than branching throughout one shared renderer.
 */
/** Compact fallback trims decorative graphics before they can overlap the header. */
function CompactReading({def,theme}:WidgetRendererProps){
  const raw = def.mock.value;
  const active = typeof raw==='boolean';
  const value = active?(raw?'On':'Off'):(typeof raw==='number'||typeof raw==='string'?raw:'—');
  const unit = typeof def.mock.unit==='string'?def.mock.unit:'';
  return <Box sx={{height:'100%',minHeight:0,display:'flex',alignItems:'center',minWidth:0,justifyContent:'center',gap:1,overflow:'hidden'}}>
    <Typography sx={{fontSize:'clamp(24px,10cqw,43px)',lineHeight:1.1,fontWeight:800,letterSpacing:'-.055em',color:theme.foreground,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',fontVariantNumeric:'tabular-nums'}}>{value}</Typography>
    {!active && <Typography sx={{fontSize:11,fontWeight:750,color:theme.muted,whiteSpace:'nowrap'}}>{unit}</Typography>}
  </Box>;
}
export function WidgetVisualRenderer(props: WidgetRendererProps) {
  const elementRef=useRef<HTMLDivElement>(null);
  const [bounds,setBounds]=useState<{width:number;height:number}>();
  useEffect(()=>{
    const element=elementRef.current;
    if(!element || typeof ResizeObserver==='undefined') return;
    const observer=new ResizeObserver(entries=>{
      const r=entries[0]?.contentRect;
      if(!r) return;
      setBounds(old=>old && Math.abs(old.width-r.width)<1 && Math.abs(old.height-r.height)<1 ? old : {width:r.width,height:r.height});
    });
    observer.observe(element);
    return ()=>observer.disconnect();
  },[]);
  // Re-evaluate *body* bounds after theme headers, status rows and padding.
  // This is the same path in the standalone gallery and reusable dashboard.
  const view=resolveWidgetView(props.size,bounds,props.view??'auto');
  const renderProps={...props,view};
  const Renderer=visualRenderers[props.theme.id];
  let content;
  if(props.def.visual==='direction') content=<MomentaryDirection {...renderProps}/>;
  else if(props.def.visual==='gauge') content=<AdaptiveGauge {...renderProps} bounds={bounds}/>;
  else if(['line','area','bar','histogram'].includes(props.def.visual) && bounds && (bounds.height<215 || bounds.width<310))
    content=<AdaptiveChart {...renderProps}/>;
  else if(['table','heatmap'].includes(props.def.visual) && view==='compact')
    content=<Box sx={{height:'100%',display:'grid',placeItems:'center',color:props.theme.muted,textAlign:'center',px:1,fontSize:12}}>
      {props.locale==='fa'?'برای دیدن جزئیات ویجت را بزرگ کنید':'Expand to see details'}
    </Box>;
  else if(view==='compact' && !['switch','button','direction','slider','input','thermostat','color'].includes(props.def.visual)
    && ['metric','battery','signal','tank','boolean','alarm-indicator'].includes(props.def.visual))
    content=<CompactReading {...renderProps}/>;
  else content=<Renderer {...renderProps}/>;
  return <Box ref={elementRef} data-responsive-widget-body="true"
    sx={{height:'100%',width:'100%',minWidth:0,minHeight:0,overflow:'hidden',containerType:'size'}}>{content}</Box>;
}


export { visualRenderers };
