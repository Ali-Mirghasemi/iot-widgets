export { IoTWidget } from './IoTWidget';
export {
  getWidgetDefinition,
  getWidgetTheme,
  requireWidgetDefinition,
  widgetsById,
} from './catalog';
export type {
  IoTWidgetInfoContext,
  IoTWidgetProps,
  WidgetData,
  WidgetInstanceConfig,
  WidgetMetadata,
  WidgetInteraction,
} from './types';

// Built-in catalog and theme metadata.
export { widgetCategories, widgetRegistry } from '../widgets/registry';
export { widgetThemeList, widgetThemes } from '../widgets/core/themeTokens';

// Advanced building blocks for projects that want to compose their own wrapper.
export { WidgetCard } from '../widgets/core/WidgetCard';
export { WidgetFrame } from '../widgets/core/WidgetFrame';
export { WidgetVisualRenderer, visualRenderers } from '../widgets/renderers/WidgetVisuals';

export type {
  Locale,
  WidgetCategory,
  WidgetDefinition,
  WidgetDirection,
  WidgetField,
  WidgetSize,
  WidgetThemeId,
  WidgetThemeTokens,
  WidgetVisual,
} from '../widgets/core/types';
export type { WidgetFrameProps } from '../widgets/core/WidgetFrame';
export type { WidgetRendererProps } from '../widgets/renderers/WidgetVisuals';
