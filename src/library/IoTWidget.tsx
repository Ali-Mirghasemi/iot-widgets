import { useMemo, type MouseEvent as ReactMouseEvent, type FormEvent as ReactFormEvent } from 'react';
import { Box } from '@mui/material';
import { WidgetFrame } from '../widgets/core/WidgetFrame';
import { WidgetVisualRenderer } from '../widgets/renderers/WidgetVisuals';
import { widgetThemes } from '../widgets/core/themeTokens';
import { requireWidgetDefinition } from './catalog';
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
  themeId = 'material',
  theme: suppliedTheme,
  themeOverrides,
  size,
  locale = 'en',
  data,
  metadata,
  onInfo,
  onInteraction,
  sx,
  className,
  style,
}: IoTWidgetProps) {
  const baseDefinition = definition ?? requireWidgetDefinition(widgetId ?? '');
  const resolvedSize = size ?? baseDefinition.defaultSize;

  if (!baseDefinition.supportedSizes.includes(resolvedSize)) {
    throw new Error(
      `Widget "${baseDefinition.id}" does not support size "${resolvedSize}". ` +
      `Supported sizes: ${baseDefinition.supportedSizes.join(', ')}`,
    );
  }

  const baseTheme = suppliedTheme ?? widgetThemes[themeId];
  const resolvedTheme = useMemo(
    () => ({ ...baseTheme, ...themeOverrides, id: baseTheme.id }),
    [baseTheme, themeOverrides],
  );

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
    className={className}
    style={style}
    data-iot-widget="true"
    data-widget-id={runtimeDefinition.id}
    data-widget-theme={resolvedTheme.id}
    data-widget-size={resolvedSize}
    onClickCapture={emitClick}
    onChangeCapture={emitChange}
    sx={[
      { width:'100%', height:'100%', minWidth:0, minHeight:0 },
      ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
    ]}
  >
    <WidgetFrame
      def={runtimeDefinition}
      theme={resolvedTheme}
      locale={locale}
      size={resolvedSize}
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
        />
      </Box>
    </WidgetFrame>
  </Box>;
}
