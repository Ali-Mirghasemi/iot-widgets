import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { widgetThemes } from '../widgets/core/themeTokens';
import type { WidgetThemeId, WidgetThemeTokens } from '../widgets/core/types';

export type DashboardPalette = {
  primary: string;
  secondary: string;
  background?: string;
  surface?: string;
  text?: string;
  muted?: string;
  border?: string;
};
export type DashboardAppearance = {
  themeId: WidgetThemeId;
  mode: 'light' | 'dark';
  palette: DashboardPalette;
  /** Original uses each visual style's own authored color palette. */
  colorMode: 'inherit' | 'original';
};

const AppearanceContext = createContext<DashboardAppearance | null>(null);

export function WidgetThemeProvider({ appearance, children }: { appearance: DashboardAppearance; children: ReactNode }) {
  return <AppearanceContext.Provider value={appearance}>{children}</AppearanceContext.Provider>;
}

export function useWidgetAppearance() { return useContext(AppearanceContext); }

export function resolveWidgetTokens(
  themeId: WidgetThemeId,
  appearance: DashboardAppearance | null,
  colorMode?: 'inherit' | 'original',
): WidgetThemeTokens {
  const base = widgetThemes[themeId];
  if (!appearance || (colorMode ?? appearance.colorMode) === 'original') return base;
  const { palette, mode } = appearance;
  const dark = mode === 'dark';
  const surface = palette.surface ?? (dark ? '#161e2e' : '#ffffff');
  const foreground = palette.text ?? (dark ? '#f1f5ff' : '#172034');
  return {
    ...base,
    accent: palette.primary,
    accent2: palette.secondary,
    background: palette.background ?? (dark ? '#0b1120' : '#f1f4fa'),
    surface,
    foreground,
    muted: palette.muted ?? (dark ? '#96a5bc' : '#67758b'),
    border: palette.border ?? (dark ? '#2a354a' : '#e3e8f1'),
    shadow: dark ? '0 14px 36px rgba(0,0,0,.16)' : '0 12px 34px rgba(21,32,56,.045)',
    paletteMode: mode,
    inheritPalette: true,
  };
}

export function useResolvedWidgetTheme(themeId: WidgetThemeId, colorMode?: 'inherit' | 'original') {
  const appearance = useWidgetAppearance();
  return useMemo(() => resolveWidgetTokens(themeId, appearance, colorMode), [themeId, appearance, colorMode]);
}
