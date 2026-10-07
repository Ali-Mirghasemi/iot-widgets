# Widget Catalog

Current built-in registry: **63 widgets**.

The `id` column is the stable value to store in dashboard JSON and pass as `widgetId`.

## Metrics & Sensors (29)

| ID | English | Persian | Visual | Default | Supported sizes |
|---|---|---|---|---|---|
| `temperature` | Temperature | دما | `metric` | `1x1` | `1x1`, `2x1`, `2x2` |
| `humidity` | Humidity | رطوبت | `metric` | `1x1` | `1x1`, `2x1`, `2x2` |
| `pressure` | Pressure | فشار | `gauge` | `1x1` | `1x1`, `2x1`, `2x2` |
| `voltage` | Voltage | ولتاژ | `metric` | `1x1` | `1x1`, `2x1`, `2x2` |
| `current` | Current | جریان | `metric` | `1x1` | `1x1`, `2x1`, `2x2` |
| `power` | Power | توان | `metric` | `1x1` | `1x1`, `2x1`, `2x2` |
| `energy` | Energy | انرژی | `metric` | `1x1` | `1x1`, `2x1`, `2x2` |
| `battery` | Battery | باتری | `battery` | `1x1` | `1x1`, `2x1`, `2x2` |
| `light` | Light / Lux | شدت نور | `metric` | `1x1` | `1x1`, `2x1`, `2x2` |
| `air-quality` | Air Quality | کیفیت هوا | `gauge` | `1x1` | `1x1`, `2x1`, `2x2` |
| `co2` | CO₂ | دی‌اکسید کربن | `metric` | `1x1` | `1x1`, `2x1`, `2x2` |
| `pm25` | PM2.5 | ذرات PM2.5 | `metric` | `1x1` | `1x1`, `2x1`, `2x2` |
| `gas` | Gas Level | سطح گاز | `gauge` | `1x1` | `1x1`, `2x1`, `2x2` |
| `soil-moisture` | Soil Moisture | رطوبت خاک | `tank` | `1x1` | `1x1`, `2x1`, `2x2` |
| `water-level` | Tank / Water Level | سطح مخزن | `tank` | `1x1` | `1x1`, `1x2`, `2x1` |
| `flow` | Flow Rate | دبی | `metric` | `1x1` | `1x1`, `2x1`, `2x2` |
| `speed` | Speed | سرعت | `gauge` | `1x1` | `1x1`, `2x1`, `2x2` |
| `rpm` | RPM | دور موتور | `gauge` | `1x1` | `1x1`, `2x1`, `2x2` |
| `vibration` | Vibration | لرزش | `metric` | `1x1` | `1x1`, `2x1`, `2x2` |
| `noise` | Noise | صدا | `metric` | `1x1` | `1x1`, `2x1`, `2x2` |
| `distance` | Distance | فاصله | `metric` | `1x1` | `1x1`, `2x1`, `2x2` |
| `weight` | Weight | وزن | `metric` | `1x1` | `1x1`, `2x1`, `2x2` |
| `wind` | Wind Speed | سرعت باد | `gauge` | `1x1` | `1x1`, `2x1`, `2x2` |
| `rain` | Rain | بارش | `metric` | `1x1` | `1x1`, `2x1`, `2x2` |
| `signal` | Cellular Signal | قدرت سیگنال موبایل | `signal` | `1x1` | `1x1`, `2x1`, `2x2` |
| `device-status` | Device Status | وضعیت دستگاه | `boolean` | `1x1` | `1x1`, `2x1`, `2x2` |
| `fire-alarm` | Fire Alarm | هشدار آتش | `alarm-indicator` | `1x1` | `1x1`, `2x1`, `2x2` |
| `smoke-alarm` | Smoke Detector | دتکتور دود | `alarm-indicator` | `1x1` | `1x1`, `2x1`, `2x2` |
| `water-leak` | Water Leak | نشتی آب | `alarm-indicator` | `1x1` | `1x1`, `2x1`, `2x2` |

## Controls (11)

| ID | English | Persian | Visual | Default | Supported sizes |
|---|---|---|---|---|---|
| `button` | Command Button | دکمه فرمان | `button` | `1x1` | `1x1`, `2x1`, `2x2` |
| `switch` | Switch / Relay | کلید روشن/خاموش | `switch` | `1x1` | `1x1`, `2x1`, `2x2` |
| `slider` | Slider | اسلایدر | `slider` | `1x1` | `1x1`, `2x1`, `2x2` |
| `set-value` | Manual Set Value | ورود مقدار | `input` | `1x1` | `1x1`, `2x1`, `2x2` |
| `thermostat` | Thermostat | ترموستات | `thermostat` | `1x1` | `1x1`, `2x1`, `2x2` |
| `door-lock` | Door Lock | قفل | `switch` | `1x1` | `1x1`, `2x1`, `2x2` |
| `color` | RGB / Light Color | رنگ چراغ | `color` | `1x1` | `1x1`, `2x1`, `2x2` |
| `direction` | Directional Control | کنترل جهت | `direction` | `1x1` | `1x1`, `2x1`, `2x2` |
| `downlink` | Downlink Action | ارسال Downlink | `button` | `1x1` | `1x1`, `2x1`, `2x2` |
| `siren` | Siren / Beacon | آژیر و چراغ هشدار | `switch` | `1x1` | `1x1`, `2x1`, `2x2` |
| `fan-control` | Fan Speed | سرعت فن | `slider` | `1x1` | `1x1`, `2x1`, `2x2` |

## Charts & History (9)

| ID | English | Persian | Visual | Default | Supported sizes |
|---|---|---|---|---|---|
| `time-series` | Time Series | نمودار زمانی | `line` | `2x1` | `2x1`, `2x2`, `3x1`, `3x2` |
| `area-chart` | Area Chart | نمودار سطحی | `area` | `2x1` | `2x1`, `2x2`, `3x1`, `3x2` |
| `bar-chart` | Bar Chart | نمودار میله‌ای | `bar` | `2x1` | `2x1`, `2x2`, `3x1` |
| `gauge` | Gauge | گیج | `gauge` | `1x1` | `1x1`, `2x1`, `2x2` |
| `histogram` | Histogram | هیستوگرام | `histogram` | `2x1` | `2x1`, `2x2`, `3x1` |
| `donut` | Donut / Pie | دایره‌ای | `donut` | `1x1` | `1x1`, `2x1`, `2x2` |
| `heatmap` | Heatmap | نقشه حرارتی | `heatmap` | `2x1` | `2x1`, `2x2`, `3x2` |
| `state-timeline` | State Timeline | خط زمانی وضعیت | `timeline` | `3x1` | `2x1`, `3x1`, `3x2` |
| `status-history` | Status History | تاریخچه وضعیت | `timeline` | `3x1` | `2x1`, `3x1`, `3x2` |

## Location (4)

| ID | English | Persian | Visual | Default | Supported sizes |
|---|---|---|---|---|---|
| `map` | Map | نقشه | `map` | `2x2` | `2x2`, `3x2`, `3x3` |
| `location` | Coordinates | مختصات | `coordinates` | `1x1` | `1x1`, `2x1`, `2x2` |
| `route` | Route / Track | مسیر حرکت | `route` | `2x2` | `2x2`, `3x2`, `3x3` |
| `compass` | Compass / Heading | قطب‌نما | `compass` | `1x1` | `1x1`, `2x1`, `2x2` |

## Tables & Events (5)

| ID | English | Persian | Visual | Default | Supported sizes |
|---|---|---|---|---|---|
| `device-table` | Device Table | جدول دستگاه‌ها | `table` | `3x2` | `2x2`, `3x2`, `3x3` |
| `measurement-list` | Measurement List | لیست اندازه‌گیری | `measurement-list` | `2x2` | `2x2`, `3x2` |
| `alarms` | Alarms | هشدارها | `alarms` | `2x2` | `2x2`, `3x2` |
| `events` | Event History | تاریخچه رویداد | `events` | `2x2` | `2x2`, `3x2` |
| `logs` | Logs | لاگ‌ها | `logs` | `2x2` | `2x2`, `3x2` |

## Display & Custom (5)

| ID | English | Persian | Visual | Default | Supported sizes |
|---|---|---|---|---|---|
| `clock` | Clock | ساعت | `clock` | `1x1` | `1x1`, `2x1`, `2x2` |
| `text` | Text / Markdown | متن و توضیحات | `text` | `2x1` | `1x1`, `2x1`, `2x2` |
| `image` | Image / Camera Snapshot | تصویر یا عکس دوربین | `image` | `2x1` | `2x1`, `2x2`, `3x2` |
| `iframe` | iFrame / External Content | محتوای خارجی | `iframe` | `2x1` | `2x1`, `2x2`, `3x2` |
| `scada` | SCADA / Mimic | نمایش شماتیک SCADA | `scada` | `3x2` | `2x2`, `3x2`, `3x3` |

## Discover at runtime

```ts
import { widgetRegistry, widgetsById } from 'iot-widget-studio-react';

const battery = widgetsById['battery'];
console.log(battery.supportedSizes);
```
