# Using the Library

## The production component

Use `IoTWidget` in another application:

```tsx
import { IoTWidget } from 'iot-widget-studio-react';
```

It resolves a registry definition, merges runtime data/metadata, selects one theme renderer, and renders the theme frame + body.

Unlike `WidgetCard`, it does not include the showcase right-click menu or metadata dialog.

## Container sizing

`IoTWidget` fills its parent:

```css
width: 100%;
height: 100%;
```

Therefore the host application must give the parent a real size.

```tsx
<div style={{ width: 320, height: 228 }}>
  <IoTWidget widgetId="temperature" />
</div>
```

In a grid dashboard, your grid library should own the actual pixel size and pass the corresponding logical `size` to `IoTWidget`.

## Basic telemetry

```tsx
<IoTWidget
  widgetId="temperature"
  themeId="material"
  size="2x1"
  data={{
    value: 24.8,
    unit: '°C',
    trend: 2.4,
    values: [22.9, 23.1, 23.6, 24.0, 23.8, 24.8],
  }}
  metadata={{
    deviceName: 'Cold storage · T-01',
    locationLabel: 'Warehouse',
    status: 'Live',
    lastSeen: '8 sec ago',
  }}
/>
```

## Mixed themes on the same dashboard

Theme is a property of each widget instance:

```tsx
<div className="dashboard">
  <Tile>
    <IoTWidget widgetId="battery" themeId="ios" size="1x1" />
  </Tile>

  <Tile>
    <IoTWidget widgetId="temperature" themeId="material" size="2x1" />
  </Tile>

  <Tile>
    <IoTWidget widgetId="signal" themeId="gaming" size="1x1" />
  </Tile>
</div>
```

No global theme provider is required for this selection.

## Change only one widget's theme

```tsx
const [batteryTheme, setBatteryTheme] = useState<WidgetThemeId>('material');

<IoTWidget
  widgetId="battery"
  themeId={batteryTheme}
  size="2x1"
/>
```

Changing `batteryTheme` re-renders only that Battery instance with the newly selected renderer/frame.

## Per-instance token override

```tsx
<IoTWidget
  widgetId="battery"
  themeId="material"
  themeOverrides={{
    accent: '#7c3aed',
    radius: 10,
  }}
/>
```

This changes the theme token object only for that instance. It does not mutate `widgetThemes.material`.

Theme renderer modules intentionally contain structural/stylistic decisions of their own. A token override is for tuning, not for inventing a seventh theme.

## Persian

```tsx
<IoTWidget
  widgetId="temperature"
  locale="fa"
  themeId="material"
  data={{ value: 24.8, unit: '°C' }}
  metadata={{
    deviceNameFa: 'سنسور دما · T-01',
    locationLabelFa: 'سردخانه',
    statusFa: 'زنده',
    lastSeenFa: '۸ ثانیه قبل',
  }}
/>
```

## Persistable dashboard JSON

A host application can persist instances using `WidgetInstanceConfig`:

```ts
const dashboard = [
  {
    id: 'tile-1',
    widgetId: 'temperature',
    themeId: 'material',
    size: '2x1',
    locale: 'en',
    data: { value: 24.8, unit: '°C' },
    metadata: { deviceName: 'T-01' },
  },
  {
    id: 'tile-2',
    widgetId: 'battery',
    themeId: 'ios',
    size: '1x1',
    data: { value: 76 },
  },
] satisfies WidgetInstanceConfig[];
```

Render it:

```tsx
{dashboard.map(item => (
  <Tile key={item.id}>
    <IoTWidget {...item} />
  </Tile>
))}
```

## Registry helpers

```ts
import {
  getWidgetDefinition,
  requireWidgetDefinition,
  widgetRegistry,
  widgetsById,
  widgetThemes,
} from 'iot-widget-studio-react';

const battery = getWidgetDefinition('battery');
console.log(battery?.supportedSizes);
```

## Info action

No info icon is shown by `IoTWidget` unless you supply `onInfo`:

```tsx
<IoTWidget
  widgetId="battery"
  onInfo={context => openInspector(context)}
/>
```

## Generic interaction hook

The built-in controls maintain their own local demo state. `onInteraction` lets a host observe low-level user interaction without coupling the widget library to a particular MQTT/RPC/downlink implementation:

```tsx
<IoTWidget
  widgetId="fan-control"
  onInteraction={event => {
    if (event.kind === 'change') {
      console.log(event.value);
    }
  }}
/>
```

For real device commands, translate the interaction in the host application into your own API/RPC command. See `known-limitations.md`.

## Custom definition

Advanced consumers can supply a definition directly:

```tsx
<IoTWidget
  definition={myDefinition}
  themeId="flat"
  size="2x1"
  data={telemetry}
/>
```

A custom definition must currently use one of the existing `WidgetVisual` renderer types unless you extend the renderer layer.
