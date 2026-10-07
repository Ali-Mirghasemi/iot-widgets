import { useState } from 'react';
import {
  IoTWidget,
  type WidgetThemeId,
} from 'iot-widget-studio-react';

const tileStyle = { width: 320, height: 228 };

export function MixedThemeDashboardExample() {
  const [batteryTheme, setBatteryTheme] = useState<WidgetThemeId>('ios');

  return (
    <>
      <label>
        Battery theme
        <select value={batteryTheme} onChange={event => setBatteryTheme(event.target.value as WidgetThemeId)}>
          <option value="material">Material 3</option>
          <option value="flat">Industrial Flat</option>
          <option value="minimal">Minimal Mono</option>
          <option value="gaming">HUD / Cyber</option>
          <option value="ios">Cupertino</option>
          <option value="glass">Aurora Glass</option>
        </select>
      </label>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <div style={tileStyle}>
          <IoTWidget
            widgetId="battery"
            themeId={batteryTheme}
            size="1x1"
            data={{ value: 76, voltage: '3.94 V', remaining: '8h 42m' }}
            metadata={{ deviceName: 'Tracker · TR-18', locationLabel: 'Fleet' }}
          />
        </div>

        <div style={{ ...tileStyle, width: 656 }}>
          <IoTWidget
            widgetId="temperature"
            themeId="material"
            size="2x1"
            data={{ value: 24.8, unit: '°C', trend: 2.4 }}
          />
        </div>
      </div>
    </>
  );
}
