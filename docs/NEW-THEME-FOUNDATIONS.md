# Industrial Process and Tactile Smart Home foundations

This patch sequence extends the previous eight-theme baseline to **10 themes**, without aliasing a new theme to Studio/Horizon.

- `industrial`: dark technical HMI panels, square instrument bezels, segmented range bars, status readouts, industrial trace charts and momentary command buttons.
- `tactile`: warm accessible home-control cards, soft physical surfaces, bulb/relay illustrations, large touch controls, slider treatments and home-style trends.

Both are compatible with `WidgetThemeProvider`, inherited primary/secondary palettes, `DashboardPanel`, catalog boards, EN/FA, and measured compact/standard/detailed view rules. All registered widgets have a renderer or an explicit source-needed fallback, although real map providers and host device commands remain the responsibility of the consuming application.

## QA

The Linux and Windows runners automatically discover both themes from `WidgetThemeId`; no manual theme arguments are required when using `all`.

```bash
npm test
node scripts/test-theme-readings.mjs
npm run build
npm run qa:responsive -- --boards catalog --themes industrial,tactile --locale both --widths 375,768,1280
./scripts/widget-qa.sh all --locale both --profile review --quality 80
```

**Do not treat syntax and unit tests as visual sign-off.** Review new browser screenshots before freezing the foundation for parallel theme-polishing chats. For these two themes, responsive QA also verifies primary-reading geometry and positive body height.

## Incremental patch order

1. `iot-widgets-industrial-001.patch`
2. `iot-widgets-tactile-001.patch`
3. `iot-widgets-qa-009.patch`

Baseline: source containing the previously delivered iOS-004 and QA-008 fixes. These three patches deliberately do not change `package.json` or Git history.
