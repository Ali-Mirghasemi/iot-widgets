import { Box, Typography } from '@mui/material';
import type { ComponentType } from 'react';
import type { Locale, WidgetDefinition, WidgetSize, WidgetThemeId, WidgetThemeTokens } from '../core/types';
import { FlatVisualRenderer } from '../themes/FlatVisuals';
import { GamingVisualRenderer } from '../themes/GamingVisuals';
import { GlassVisualRenderer } from '../themes/GlassVisuals';
import { IOSVisualRenderer } from '../themes/IOSVisuals';
import { MaterialVisualRenderer } from '../themes/MaterialVisuals';
import { MinimalVisualRenderer } from '../themes/MinimalVisuals';
import { resolveWidgetView, type ResolvedWidgetView } from '../../library/adaptive';
import { StudioVisualRenderer } from '../themes/StudioVisuals';

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
  return <Box sx={{height:'100%',minHeight:0,display:'flex',alignItems:'center',minWidth:0,justifyContent:'flex-start',gap:1,overflow:'hidden'}}>
    <Typography sx={{fontSize:'clamp(24px,10cqw,43px)',lineHeight:1.1,fontWeight:800,letterSpacing:'-.055em',color:theme.foreground,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',fontVariantNumeric:'tabular-nums'}}>{value}</Typography>
    {!active && <Typography sx={{fontSize:11,fontWeight:750,color:theme.muted,whiteSpace:'nowrap'}}>{unit}</Typography>}
  </Box>;
}
export function WidgetVisualRenderer(props: WidgetRendererProps) {
  const view=props.view??resolveWidgetView(props.size);
  if (view==='compact' && !['studio','horizon'].includes(props.theme.id) &&
    ['metric','battery','signal','tank','boolean','gauge','alarm-indicator'].includes(props.def.visual)) {
    return <CompactReading {...props}/>;
  }
  const Renderer = visualRenderers[props.theme.id];
  return <Renderer {...props} view={view} />;
}


export { visualRenderers };
