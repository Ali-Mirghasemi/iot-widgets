import type { ComponentType } from 'react';
import type { WidgetThemeId } from '../core/types';
import { createWidgetVisualRenderer, type WidgetRendererProps } from './WidgetVisualCore';
import { FlatVisualRenderer } from '../themes/FlatVisuals';
import { GamingVisualRenderer } from '../themes/GamingVisuals';
import { GlassVisualRenderer } from '../themes/GlassVisuals';
import { IOSVisualRenderer } from '../themes/IOSVisuals';
import { MaterialVisualRenderer } from '../themes/MaterialVisuals';
import { MinimalVisualRenderer } from '../themes/MinimalVisuals';
import { TactileVisualRenderer } from '../themes/TactileVisuals';
import { ProcessVisualRenderer } from '../themes/ProcessVisuals';
import { StudioVisualRenderer } from '../themes/StudioVisuals';

const visualRenderers: Record<WidgetThemeId, ComponentType<WidgetRendererProps>> = {
  tactile: TactileVisualRenderer,
  industrial: ProcessVisualRenderer,
  studio: StudioVisualRenderer,
  horizon: StudioVisualRenderer,
  material: MaterialVisualRenderer,
  flat: FlatVisualRenderer,
  minimal: MinimalVisualRenderer,
  gaming: GamingVisualRenderer,
  ios: IOSVisualRenderer,
  glass: GlassVisualRenderer,
};

/** Backward-compatible full registry: imports all built-in renderer themes. */
export const WidgetVisualRenderer = createWidgetVisualRenderer(visualRenderers);
export type { WidgetRendererProps } from './WidgetVisualCore';
export { visualRenderers };
