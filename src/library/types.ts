import type { CSSProperties } from 'react';
import type { WidgetView } from './adaptive';
import type { SxProps, Theme } from '@mui/material/styles';
import type {
  Locale,
  WidgetDefinition,
  WidgetSize,
  WidgetThemeId,
  WidgetThemeTokens,
} from '../widgets/core/types';

/** Runtime telemetry / state values consumed by a widget renderer. */
export type WidgetData = Record<string, unknown>;

/**
 * Frame-level metadata shown around the visualization.
 * English and Persian variants can be supplied independently.
 */
export interface WidgetMetadata {
  deviceName?: string;
  deviceNameFa?: string;
  locationLabel?: string;
  locationLabelFa?: string;
  status?: string;
  statusFa?: string;
  lastSeen?: string;
  lastSeenFa?: string;
}

/** Serializable configuration you can persist in a dashboard JSON document. */
export interface WidgetInstanceConfig {
  id?: string;
  widgetId: string;
  themeId?: WidgetThemeId;
  size?: WidgetSize;
  locale?: Locale;
  view?: WidgetView;
  data?: WidgetData;
  metadata?: WidgetMetadata;
}


export interface WidgetInteraction {
  kind: 'click' | 'change';
  widgetId: string;
  themeId: WidgetThemeId;
  size: WidgetSize;
  /** Best-effort human-readable control hint (aria-label, name, or visible text). */
  control?: string;
  value?: string | number | boolean;
  checked?: boolean;
  inputType?: string;
}

export interface IoTWidgetInfoContext {
  definition: WidgetDefinition;
  widgetId: string;
  themeId: WidgetThemeId;
  size: WidgetSize;
  locale: Locale;
}

/** Props for the production/reusable widget component. */
export interface IoTWidgetProps {
  /** Registry ID such as `battery`, `temperature`, `map`, or `switch`. */
  widgetId?: string;

  /** Supply a custom/extended definition instead of resolving `widgetId` from the built-in registry. */
  definition?: WidgetDefinition;

  /** Built-in theme. Theme selection is per widget instance. */
  themeId?: WidgetThemeId;

  /** Advanced: supply a complete theme token object. `themeId` is ignored when this is provided. */
  theme?: WidgetThemeTokens;

  /**
   * Per-instance token overrides. Useful for accent/radius/frame tuning without changing global theme tokens.
   * Theme renderers intentionally own some fixed stylistic values, so this does not turn a built-in theme
   * into an arbitrary custom design system.
   */
  /** Inherit the dashboard's palette or retain the authored palette for this one widget. */
  colorMode?: 'inherit' | 'original';

  /** Optionally offer a large-view action; the host controls the dialog. */
  onExpand?: () => void;

  themeOverrides?: Partial<Omit<WidgetThemeTokens, 'id'>>;

  size?: WidgetSize;
  locale?: Locale;
  /** Auto chooses compact / standard / detailed from available card space. */
  view?: WidgetView;
  /** An expanded widget uses the detailed presentation, if historical data is available. */
  expanded?: boolean;

  /** Runtime values merged over the definition's demo/mock values. */
  data?: WidgetData;

  /** Device/site/status metadata merged over the definition's demo metadata. */
  metadata?: WidgetMetadata;

  /** When supplied, the frame shows its info action and invokes this callback. */
  onInfo?: (context: IoTWidgetInfoContext) => void;

  /** Optional low-level interaction hook for buttons, sliders and inputs. */
  onInteraction?: (interaction: WidgetInteraction) => void;

  /** Optional wrapper styling. The parent should normally define a concrete width and height. */
  sx?: SxProps<Theme>;
  className?: string;
  style?: CSSProperties;
}
