# Known Limitations

## 1. Control widgets do not define a semantic RPC protocol

Control widgets are interactive and maintain local preview state. The public `onInteraction` hook reports low-level click/change activity.

The package does not decide what a click means to your backend. That mapping depends on the host product: MQTT topic, WebSocket command, ThingsBoard RPC, REST endpoint, LoRaWAN downlink, etc.

Recommended architecture:

```text
IoTWidget interaction
      ↓
host application command adapter
      ↓
backend / MQTT / RPC / device API
```

A future major version may add a standardized semantic command event model.

## 2. Runtime data is currently bridged through `WidgetDefinition.mock`

Theme renderers were originally developed against demo data stored on the definition. `IoTWidget` safely creates a runtime copy and merges real `data` into that field.

This is externally clean but internally the name `mock` is historical. A future major version may introduce an explicit runtime data context.

## 3. Built-in themes are a closed TypeScript union

Adding a seventh first-class built-in theme currently requires a small central integration edit. Existing widget instances can freely select among the six built-in themes.

## 4. Token override is not full theme authoring

Theme-specific renderers intentionally contain structural decisions and some fixed colors. `themeOverrides` customizes the token object for one instance but is not guaranteed to recolor every decorative element in every theme.

## 5. Package is ESM-first

The distributed package targets modern React bundlers. A dedicated CommonJS build is not currently emitted.

## 6. Accessibility needs a dedicated audit

Basic controls use native/button/input semantics in many places, but the project has primarily undergone visual QA. A complete keyboard, screen-reader, contrast and reduced-motion accessibility audit should be performed before accessibility certification.
