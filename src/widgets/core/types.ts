import type { SvgIconComponent } from '@mui/icons-material';

export type WidgetThemeId = 'material' | 'flat' | 'minimal' | 'gaming' | 'ios' | 'glass';
export type Locale = 'en' | 'fa';
export type WidgetSize = '1x1' | '1x2' | '2x1' | '2x2' | '1x3' | '3x1' | '2x3' | '3x2' | '3x3';
export type WidgetCategory = 'metrics' | 'controls' | 'charts' | 'location' | 'tables' | 'display';
export type WidgetDirection = 'ltr' | 'rtl' | 'auto';

export type WidgetVisual =
  | 'metric' | 'battery' | 'signal' | 'tank' | 'boolean' | 'gauge'
  | 'line' | 'area' | 'bar' | 'histogram' | 'donut' | 'heatmap' | 'timeline'
  | 'map' | 'coordinates' | 'route' | 'compass'
  | 'button' | 'switch' | 'slider' | 'input' | 'thermostat' | 'color' | 'direction'
  | 'table' | 'measurement-list' | 'alarms' | 'events' | 'logs'
  | 'clock' | 'text' | 'image' | 'iframe' | 'scada' | 'alarm-indicator';

export interface WidgetField {
  key: string;
  labelEn: string;
  labelFa: string;
  type: 'number' | 'string' | 'boolean' | 'time' | 'geo' | 'array' | 'color';
  unit?: string;
  required?: boolean;
}

export interface WidgetDefinition {
  id: string;
  type: string;
  category: WidgetCategory;
  visual: WidgetVisual;
  titleEn: string;
  titleFa: string;
  descriptionFa: string;
  icon: SvgIconComponent;
  defaultSize: WidgetSize;
  supportedSizes: WidgetSize[];
  direction: WidgetDirection;
  fields: WidgetField[];
  mock: Record<string, unknown>;
  capabilities?: Array<'realtime' | 'history' | 'thresholds' | 'aggregation' | 'control' | 'multi-device' | 'geo' | 'custom-content'>;
}

export interface WidgetThemeTokens {
  id: WidgetThemeId;
  label: string;
  background: string;
  surface: string;
  foreground: string;
  muted: string;
  accent: string;
  accent2: string;
  border: string;
  radius: number;
  shadow: string;
  headerWeight: number;
  backdropFilter?: string;
  fontFamily?: string;
}
