import type { ComponentType } from 'react';
import type { Locale, WidgetDefinition, WidgetSize, WidgetThemeId, WidgetThemeTokens } from '../core/types';
import { FlatVisualRenderer } from '../themes/FlatVisuals';
import { GamingVisualRenderer } from '../themes/GamingVisuals';
import { GlassVisualRenderer } from '../themes/GlassVisuals';
import { IOSVisualRenderer } from '../themes/IOSVisuals';
import { MaterialVisualRenderer } from '../themes/MaterialVisuals';
import { MinimalVisualRenderer } from '../themes/MinimalVisuals';

export interface WidgetRendererProps {
  def: WidgetDefinition;
  theme: WidgetThemeTokens;
  locale: Locale;
  size: WidgetSize;
}

const visualRenderers: Record<WidgetThemeId, ComponentType<WidgetRendererProps>> = {
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
export function WidgetVisualRenderer(props: WidgetRendererProps) {
  const Renderer = visualRenderers[props.theme.id];
  return <Renderer {...props} />;
}

export { visualRenderers };
