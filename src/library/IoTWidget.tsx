import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent, type FormEvent as ReactFormEvent } from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import OpenInFullRounded from '@mui/icons-material/OpenInFullRounded';
import { useResolvedWidgetTheme, useWidgetAppearance } from './WidgetThemeProvider';
import { WidgetFrame } from '../widgets/core/WidgetFrame';
import { WidgetVisualRenderer } from '../widgets/renderers/WidgetVisuals';
import { requireWidgetDefinition } from './catalog';
import { getWidgetMinimumSize, historyValues, resolveWidgetView } from './adaptive';
import type { IoTWidgetProps, WidgetMetadata } from './types';

const readText = (value: unknown, fallback = '') => typeof value === 'string' ? value : fallback;

const defaultMetadata: Required<WidgetMetadata> = {
  deviceName: 'Device',
  deviceNameFa: 'دستگاه',
  locationLabel: 'Site',
  locationLabelFa: 'سایت',
  status: 'Live',
  statusFa: 'زنده',
  lastSeen: 'Just now',
  lastSeenFa: 'اکنون',
};

/**
 * Production-facing widget component.
 *
 * Unlike `WidgetCard`, this component has no resize context menu and no built-in
 * metadata dialog. It is intended to be placed inside your own dashboard/grid.
 */
export function IoTWidget({
  widgetId,
  definition,
  themeId,
  theme: suppliedTheme,
  themeOverrides,
  colorMode,
  onExpand,
  size,
  view = 'auto',
  expanded = false,
  locale = 'en',
  data,
  metadata,
  onInfo,
  onInteraction,
  sx,
  className,
  style,
}: IoTWidgetProps) {
  const appearance = useWidgetAppearance();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [bounds,setBounds] = useState<{width:number;height:number}>();
  useEffect(()=>{
    const element=wrapperRef.current;
    if(!element || typeof ResizeObserver==='undefined')return;
    const observer=new ResizeObserver(entries=>{
      const rect=entries[0]?.contentRect;
      if(!rect)return;
      setBounds(old=>(old && Math.abs(old.width-rect.width)<1 && Math.abs(old.height-rect.height)<1)
        ? old : {width:rect.width,height:rect.height});
    });
    observer.observe(element);
    return ()=>observer.disconnect();
  },[]);
  const effectiveThemeId = themeId ?? appearance?.themeId ?? 'material';
  const baseDefinition = definition ?? requireWidgetDefinition(widgetId ?? '');
  const resolvedSize = size ?? baseDefinition.defaultSize;

  const minimum = getWidgetMinimumSize(baseDefinition);
  const [logicalW,logicalH] = resolvedSize.split('x').map(Number);
  if (!baseDefinition.supportedSizes.includes(resolvedSize) || logicalW<minimum.w || logicalH<minimum.h) {
    throw new Error(
      `Widget "${baseDefinition.id}" does not support size "${resolvedSize}". ` +
      `Minimum: ${minimum.w}x${minimum.h}; supported sizes: ${baseDefinition.supportedSizes.join(', ')}`,
    );
  }

  const inheritedTheme = useResolvedWidgetTheme(effectiveThemeId, colorMode);
  const baseTheme = suppliedTheme ?? inheritedTheme;
  const resolvedTheme = useMemo(
    () => ({ ...baseTheme, ...themeOverrides, id: baseTheme.id }),
    [baseTheme, themeOverrides],
  );

  const resolvedView = resolveWidgetView(resolvedSize,bounds,view,expanded);
  const history = useMemo(()=>historyValues(data),[data]);
  const runtimeDefinition = useMemo(
    () => ({
      ...baseDefinition,
      mock: {
        ...baseDefinition.mock,
        ...metadata,
        ...data,
      },
    }),
    [baseDefinition, data, metadata],
  );

  const mock = runtimeDefinition.mock;
  const deviceName = locale === 'fa'
    ? (metadata?.deviceNameFa ?? metadata?.deviceName ?? readText(mock.deviceNameFa, readText(mock.deviceName, defaultMetadata.deviceNameFa)))
    : (metadata?.deviceName ?? readText(mock.deviceName, defaultMetadata.deviceName));
  const locationLabel = locale === 'fa'
    ? (metadata?.locationLabelFa ?? metadata?.locationLabel ?? readText(mock.locationLabelFa, readText(mock.locationLabel, defaultMetadata.locationLabelFa)))
    : (metadata?.locationLabel ?? readText(mock.locationLabel, defaultMetadata.locationLabel));
  const status = locale === 'fa'
    ? (metadata?.statusFa ?? metadata?.status ?? readText(mock.statusFa, readText(mock.status, defaultMetadata.statusFa)))
    : (metadata?.status ?? readText(mock.status, defaultMetadata.status));
  const lastSeen = locale === 'fa'
    ? (metadata?.lastSeenFa ?? metadata?.lastSeen ?? readText(mock.lastSeenFa, readText(mock.lastSeen, defaultMetadata.lastSeenFa)))
    : (metadata?.lastSeen ?? readText(mock.lastSeen, defaultMetadata.lastSeen));
  const bodyDir = runtimeDefinition.direction === 'auto'
    ? (locale === 'fa' ? 'rtl' : 'ltr')
    : runtimeDefinition.direction;

  const emitClick = (event: ReactMouseEvent<HTMLElement>) => {
    if (!onInteraction) return;
    const element = event.target instanceof Element
      ? event.target.closest('button,input,[role="button"]') as HTMLElement | null
      : null;
    const control = element?.getAttribute('aria-label')
      ?? element?.getAttribute('name')
      ?? element?.textContent?.trim().slice(0, 80)
      ?? undefined;
    onInteraction({
      kind: 'click',
      widgetId: runtimeDefinition.id,
      themeId: resolvedTheme.id,
      size: resolvedSize,
      control,
    });
  };

  const emitChange = (event: ReactFormEvent<HTMLElement>) => {
    if (!onInteraction) return;
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) return;
    let value: string | number | boolean = target.value;
    if (target instanceof HTMLInputElement) {
      if (target.type === 'checkbox' || target.type === 'radio') value = target.checked;
      else if (target.type === 'range' || target.type === 'number') value = target.valueAsNumber;
    }
    onInteraction({
      kind: 'change',
      widgetId: runtimeDefinition.id,
      themeId: resolvedTheme.id,
      size: resolvedSize,
      control: target.getAttribute('aria-label') ?? target.getAttribute('name') ?? undefined,
      value,
      checked: target instanceof HTMLInputElement ? target.checked : undefined,
      inputType: target instanceof HTMLInputElement ? target.type : target.tagName.toLowerCase(),
    });
  };

  return <Box
    ref={wrapperRef}
    className={className}
    style={style}
    data-iot-widget="true"
    data-widget-id={runtimeDefinition.id}
    data-widget-visual={runtimeDefinition.visual}
    data-widget-theme={resolvedTheme.id}
    data-widget-size={resolvedSize}
    data-widget-view={resolvedView}
    onClickCapture={emitClick}
    onChangeCapture={emitChange}
    sx={[
      { width:'100%', height:'100%', minWidth:0, minHeight:0, position:'relative' },
      ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
    ]}
  >
    {onExpand && <Tooltip title="Expand widget"><IconButton aria-label="Expand widget" onClick={event => { event.stopPropagation(); onExpand(); }} sx={{ position:'absolute', top:7, right:8, zIndex:12, width:30, height:30, bgcolor:resolvedTheme.surface, color:resolvedTheme.muted, border:`1px solid ${resolvedTheme.border}`, opacity:.92, '&:hover':{bgcolor:resolvedTheme.surface,color:resolvedTheme.accent} }}><OpenInFullRounded sx={{fontSize:15}}/></IconButton></Tooltip>}
    <WidgetFrame
      def={runtimeDefinition}
      theme={resolvedTheme}
      locale={locale}
      size={resolvedSize}
      view={resolvedView}
      deviceName={deviceName}
      locationLabel={locationLabel}
      status={status}
      lastSeen={lastSeen}
      onInfo={onInfo ? () => onInfo({
        definition: runtimeDefinition,
        widgetId: runtimeDefinition.id,
        themeId: resolvedTheme.id,
        size: resolvedSize,
        locale,
      }) : undefined}
    >
      <Box dir={bodyDir} sx={{ height:'100%', minHeight:0 }}>
        <WidgetVisualRenderer
          def={runtimeDefinition}
          theme={resolvedTheme}
          locale={locale}
          size={resolvedSize}
          view={resolvedView}
          history={history}
        />
      </Box>
    </WidgetFrame>
  </Box>;
}
