import { widgetRegistry } from '../widgets/registry';
import { widgetThemes } from '../widgets/core/themeTokens';
import type { WidgetDefinition, WidgetThemeId, WidgetThemeTokens } from '../widgets/core/types';

/** Immutable built-in definitions indexed by widget ID. */
export const widgetsById: Readonly<Record<string, WidgetDefinition>> = Object.freeze(
  Object.fromEntries(widgetRegistry.map(def => [def.id, def])) as Record<string, WidgetDefinition>,
);

export function getWidgetDefinition(widgetId: string): WidgetDefinition | undefined {
  return widgetsById[widgetId];
}

export function requireWidgetDefinition(widgetId: string): WidgetDefinition {
  const definition = getWidgetDefinition(widgetId);
  if (!definition) {
    const known = widgetRegistry.map(item => item.id).join(', ');
    throw new Error(`Unknown IoT widget ID "${widgetId}". Known widget IDs: ${known}`);
  }
  return definition;
}

export function getWidgetTheme(themeId: WidgetThemeId): WidgetThemeTokens {
  return widgetThemes[themeId];
}
