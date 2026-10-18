import {
  createContext, useContext, useEffect, useMemo, useRef, useState,
  type ComponentType, type FormEvent, type MouseEvent, type ReactNode,
} from 'react';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';
import OpenInFullRounded from '@mui/icons-material/OpenInFullRounded';
import type { IoTWidgetProps, WidgetMetadata } from './types';
import { getWidgetMinimumSize, historyValues, resolveWidgetView } from './adaptive';
import { createWidgetVisualRenderer, type WidgetRendererMap } from '../widgets/renderers/WidgetVisualCore';
import type { WidgetFrameProps } from '../widgets/core/WidgetFrame';
import type { WidgetDefinition, WidgetThemeId, WidgetThemeTokens } from '../widgets/core/types';

export type ScopedWidgetAppearance = {
  themeId: WidgetThemeId;
  mode: 'light' | 'dark';
  palette: {
    primary: string; secondary: string; background?: string; surface?: string;
    text?: string; muted?: string; border?: string;
  };
  colorMode: 'inherit' | 'original';
};

const Appearance = createContext<ScopedWidgetAppearance | null>(null);

/** Host-controlled appearance, without importing the all-themes provider. */
export function ScopedWidgetAppearanceProvider({ appearance, children }: {
  appearance: ScopedWidgetAppearance;
  children: ReactNode;
}) {
  return <Appearance.Provider value={appearance}>{children}</Appearance.Provider>;
}

export type ScopedWidgetFrames = Readonly<Partial<Record<WidgetThemeId, ComponentType<WidgetFrameProps>>>>;

export interface ScopedIoTWidgetOptions {
  /** Only definitions deliberately registered for this product build. */
  definitions: Readonly<Record<string, WidgetDefinition>>;
  /** Only authored theme token objects deliberately registered for this build. */
  themes: Readonly<Partial<Record<WidgetThemeId, WidgetThemeTokens>>>;
  /** Static imports from the individual renderer subpaths. */
  visualRenderers: WidgetRendererMap;
  /** Static imports from the individual frame subpaths. */
  frames: ScopedWidgetFrames;
  defaultThemeId: WidgetThemeId;
}

function inheritTokens(base: WidgetThemeTokens, appearance: ScopedWidgetAppearance | null,
  colorMode: 'inherit' | 'original' | undefined): WidgetThemeTokens {
  if (!appearance || (colorMode ?? appearance.colorMode) === 'original') return base;
  const { palette, mode } = appearance;
  const dark = mode === 'dark';
  return {
    ...base,
    accent: palette.primary,
    accent2: palette.secondary,
    background: palette.background ?? (dark ? '#0b1120' : '#f1f4fa'),
    surface: palette.surface ?? (dark ? '#161e2e' : '#ffffff'),
    foreground: palette.text ?? (dark ? '#f1f5ff' : '#172034'),
    muted: palette.muted ?? (dark ? '#96a5bc' : '#67758b'),
    border: palette.border ?? (dark ? '#2a354a' : '#e3e8f1'),
    shadow: dark ? '0 14px 36px rgba(0,0,0,.16)' : '0 12px 34px rgba(21,32,56,.045)',
    paletteMode: mode,
    inheritPalette: true,
  };
}

const readText = (value: unknown, fallback: string) => typeof value === 'string' ? value : fallback;
const baseMetadata: Required<WidgetMetadata> = {
  deviceName: 'Device', deviceNameFa: 'دستگاه',
  locationLabel: 'Unknown location', locationLabelFa: 'موقعیت نامشخص',
  status: 'Unknown', statusFa: 'نامشخص',
  lastSeen: 'Unknown', lastSeenFa: 'نامشخص',
};

/**
 * Create a complete IoTWidget without importing the default registry, all-theme
 * visual map, all-theme frames, or showcase mock data. The caller owns the
 * statically imported definition/theme/renderer/frame allowlist.
 *
 * Unlike the showcase's IoTWidget, demoFallback defaults to false here.
 */
export function createScopedIoTWidget(options: ScopedIoTWidgetOptions) {
  const includedThemes = Object.keys(options.themes) as WidgetThemeId[];
  if (!includedThemes.includes(options.defaultThemeId)) {
    throw new Error(`Default widget theme "${options.defaultThemeId}" is not included`);
  }
  for (const id of includedThemes) {
    if (options.themes[id]?.id !== id || !options.visualRenderers[id] || !options.frames[id]) {
      throw new Error(`Widget theme "${id}" needs matching tokens, visual renderer and frame`);
    }
  }
  for (const id of Object.keys(options.definitions)) {
    if (options.definitions[id]?.id !== id) {
      throw new Error(`Widget definition registry mismatch for "${id}"`);
    }
  }
  const VisualRenderer = createWidgetVisualRenderer(options.visualRenderers);

  function ScopedIoTWidget({
    widgetId, definition, themeId, theme: suppliedTheme, themeOverrides, colorMode,
    onExpand, size, view = 'auto', expanded = false, locale = 'en', data,
    demoFallback = false, metadata, onInfo, onInteraction, sx, className, style,
  }: IoTWidgetProps) {
    const appearance = useContext(Appearance);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [bounds, setBounds] = useState<{width:number;height:number}>();
    useEffect(() => {
      const element = wrapperRef.current;
      if (!element || typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(entries => {
        const r = entries[0]?.contentRect;
        if (!r) return;
        setBounds(old => old && Math.abs(old.width-r.width)<1 && Math.abs(old.height-r.height)<1
          ? old : {width:r.width,height:r.height});
      });
      observer.observe(element);
      return () => observer.disconnect();
    }, []);

    const requestedId = widgetId ?? definition?.id ?? '';
    const baseDefinition = options.definitions[requestedId];
    if (!baseDefinition || (definition && definition.id !== requestedId)) {
      throw new Error(`Widget "${requestedId}" is not included in this build`);
    }
    const selectedThemeId = themeId ?? suppliedTheme?.id ?? appearance?.themeId ?? options.defaultThemeId;
    const authoredTokens = options.themes[selectedThemeId];
    const Frame = options.frames[selectedThemeId];
    if (!authoredTokens || !Frame || !options.visualRenderers[selectedThemeId]
      || (suppliedTheme && suppliedTheme.id !== selectedThemeId)) {
      throw new Error(`Widget theme "${selectedThemeId}" is not included in this build`);
    }
    const resolvedTheme = useMemo(() => ({
      ...inheritTokens(suppliedTheme ?? authoredTokens, appearance, colorMode),
      ...themeOverrides,
      id: selectedThemeId,
    }), [authoredTokens, suppliedTheme, appearance, colorMode, themeOverrides, selectedThemeId]);
    const resolvedSize = size ?? baseDefinition.defaultSize;
    const minimum = getWidgetMinimumSize(baseDefinition);
    const [logicalW,logicalH] = resolvedSize.split('x').map(Number);
    if (!baseDefinition.supportedSizes.includes(resolvedSize) || logicalW<minimum.w || logicalH<minimum.h) {
      throw new Error(`Widget "${requestedId}" does not support size "${resolvedSize}"`);
    }
    const resolvedView = resolveWidgetView(resolvedSize,bounds,view,expanded);
    const history = useMemo(() => historyValues(data), [data]);
    const runtimeDefinition = useMemo(() => ({
      ...baseDefinition,
      mock: {
        ...(demoFallback ? baseDefinition.mock : {}),
        ...metadata,
        ...data,
      },
    }), [baseDefinition, demoFallback, metadata, data]);
    const mock = runtimeDefinition.mock;
    const deviceName = locale === 'fa'
      ? (metadata?.deviceNameFa ?? metadata?.deviceName ?? readText(mock.deviceNameFa,readText(mock.deviceName,baseMetadata.deviceNameFa)))
      : (metadata?.deviceName ?? readText(mock.deviceName,baseMetadata.deviceName));
    const locationLabel = locale === 'fa'
      ? (metadata?.locationLabelFa ?? metadata?.locationLabel ?? readText(mock.locationLabelFa,readText(mock.locationLabel,baseMetadata.locationLabelFa)))
      : (metadata?.locationLabel ?? readText(mock.locationLabel,baseMetadata.locationLabel));
    const status = locale === 'fa'
      ? (metadata?.statusFa ?? metadata?.status ?? readText(mock.statusFa,readText(mock.status,baseMetadata.statusFa)))
      : (metadata?.status ?? readText(mock.status,baseMetadata.status));
    const lastSeen = locale === 'fa'
      ? (metadata?.lastSeenFa ?? metadata?.lastSeen ?? readText(mock.lastSeenFa,readText(mock.lastSeen,baseMetadata.lastSeenFa)))
      : (metadata?.lastSeen ?? readText(mock.lastSeen,baseMetadata.lastSeen));
    const dir = runtimeDefinition.direction === 'auto'
      ? (locale === 'fa' ? 'rtl' : 'ltr') : runtimeDefinition.direction;

    const emitClick = (event: MouseEvent<HTMLElement>) => {
      if (!onInteraction) return;
      const control = event.target instanceof Element
        ? event.target.closest('button,input,[role="button"]') as HTMLElement | null
        : null;
      onInteraction({kind:'click',widgetId:requestedId,themeId:selectedThemeId,size:resolvedSize,
        control:control?.getAttribute('aria-label') ?? control?.getAttribute('name') ?? control?.textContent?.trim().slice(0,80) ?? undefined});
    };
    const emitChange = (event: FormEvent<HTMLElement>) => {
      if (!onInteraction) return;
      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) return;
      let value:string|number|boolean = target.value;
      if (target instanceof HTMLInputElement) {
        if (target.type === 'checkbox' || target.type === 'radio') value = target.checked;
        else if (target.type === 'range' || target.type === 'number') value = target.valueAsNumber;
      }
      onInteraction({kind:'change',widgetId:requestedId,themeId:selectedThemeId,size:resolvedSize,
        control:target.getAttribute('aria-label') ?? target.getAttribute('name') ?? undefined,
        value, checked:target instanceof HTMLInputElement ? target.checked : undefined,
        inputType:target instanceof HTMLInputElement ? target.type : target.tagName.toLowerCase()});
    };
    const noValues = !data || Object.values(data).every(value=>value===null||value===undefined);
    const isControl = baseDefinition.capabilities?.includes('control') ?? false;
    const needsTelemetry = baseDefinition.capabilities?.includes('realtime') ?? false;
    const unavailable = !demoFallback && ((isControl && !onInteraction) || (needsTelemetry && noValues));

    return <Box ref={wrapperRef} data-iot-widget="true" data-widget-id={requestedId}
      data-widget-visual={runtimeDefinition.visual} data-widget-theme={selectedThemeId}
      data-widget-size={resolvedSize} data-widget-view={resolvedView}
      className={className} style={style}
      onClickCapture={emitClick} onChangeCapture={emitChange}
      sx={[{width:'100%',height:'100%',minWidth:0,minHeight:0,position:'relative'},
        ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}>
      {onExpand && <Tooltip title={locale==='fa'?'بزرگ‌نمایی ویجت':'Expand widget'}>
        <IconButton aria-label={locale==='fa'?'بزرگ‌نمایی ویجت':'Expand widget'}
          onClick={event=>{event.stopPropagation();onExpand();}}
          sx={{position:'absolute',top:7,right:8,zIndex:12,width:30,height:30,
            bgcolor:resolvedTheme.surface,color:resolvedTheme.muted,border:`1px solid ${resolvedTheme.border}`}}>
          <OpenInFullRounded sx={{fontSize:15}}/>
        </IconButton>
      </Tooltip>}
      <Frame def={runtimeDefinition} theme={resolvedTheme} locale={locale} size={resolvedSize}
        view={resolvedView} deviceName={deviceName} locationLabel={locationLabel}
        status={status} lastSeen={lastSeen}
        onInfo={onInfo ? () => onInfo({definition:runtimeDefinition,widgetId:requestedId,
          themeId:selectedThemeId,size:resolvedSize,locale}) : undefined}>
        <Box dir={dir} sx={{height:'100%',minHeight:0}}>
          {unavailable ? <Box role="status" data-widget-unavailable="true"
            sx={{height:'100%',display:'grid',placeItems:'center',p:1}}>
            <Typography sx={{fontSize:12,color:resolvedTheme.muted,textAlign:'center'}}>
              {isControl && !onInteraction
                ? (locale==='fa'?'کنترل غیرفعال است':'Control unavailable')
                : (locale==='fa'?'داده‌ای در دسترس نیست':'Data unavailable')}
            </Typography>
          </Box> : <VisualRenderer def={runtimeDefinition} theme={resolvedTheme}
            locale={locale} size={resolvedSize} view={resolvedView} history={history}/>}
        </Box>
      </Frame>
    </Box>;
  }
  return ScopedIoTWidget;
}
