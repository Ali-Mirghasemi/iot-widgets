# Runtime Data Model

## Metadata

Frame metadata is supplied separately from telemetry:

```ts
interface WidgetMetadata {
  deviceName?: string;
  deviceNameFa?: string;
  locationLabel?: string;
  locationLabelFa?: string;
  status?: string;
  statusFa?: string;
  lastSeen?: string;
  lastSeenFa?: string;
}
```

Use English and Persian variants when the device/site names themselves should be localized.

## Runtime telemetry

`data` is intentionally an open `Record<string, unknown>` because different IoT widgets have different payload shapes.

Common keys used by the current renderers include:

| Key | Typical use |
|---|---|
| `value` | current numeric/boolean value |
| `unit` | `°C`, `%`, `V`, `A`, `bar`, etc. |
| `trend` | short-period percentage change |
| `values` | historical numeric series for sparkline/chart |
| `max` | gauge/scale maximum |
| `voltage` | battery voltage text |
| `remaining` | battery time remaining |
| `network` | cellular technology / RSRP label |
| `liters` | tank volume |
| `lat` / `lng` | coordinate display |
| `accuracy` | GPS accuracy |
| `summary` | chart summary label |
| `location` | route/map summary value depending on widget |
| `severity` | alarm visual severity |
| `status` / `statusFa` | can also override status via the merged runtime object |

Example:

```tsx
<IoTWidget
  widgetId="battery"
  data={{
    value: 81,
    unit: '%',
    voltage: '4.08 V',
    remaining: '11h 20m',
  }}
/>
```

## Definition fields vs runtime renderer keys

`WidgetDefinition.fields` describes the formal/configurable datasource fields a dashboard builder should ask the user to bind.

Some visualization keys such as demo trend/history data are additional rendering context and are not necessarily marked as required fields.

A production dashboard builder can therefore use:

```text
fields          -> binding/configuration UI
runtime data    -> resolved telemetry + optional visualization context
```

## Immutability

`IoTWidget` does not mutate `widgetRegistry`. It creates a runtime copy of the definition before merging `data` and `metadata`.

This is important when the same widget type is rendered multiple times with different devices/themes.

## Recommended host data adapter

Keep transport and device APIs outside the widget library:

```ts
const telemetry = useDeviceTelemetry(deviceId);

const widgetData = {
  value: telemetry.temperature,
  unit: '°C',
  trend: telemetry.temperatureTrend24h,
  values: telemetry.temperatureHistory,
};

return <IoTWidget widgetId="temperature" data={widgetData} />;
```

The widget package should not know whether data came from MQTT, WebSocket, REST, Redux, Zustand, TanStack Query, ThingsBoard, your own backend, etc.
