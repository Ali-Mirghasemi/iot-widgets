# Parallel Theme Worker Prompt

Copy the prompt below into a new chat and replace the placeholders.

---

You are working on my **IoT Widget Studio** React + TypeScript + MUI project.

Your assigned theme is:

- Stable theme ID: `<THEME_ID>`
- Working display direction/name: `<THEME_NAME>`

Before editing anything, read these project files completely:

- `docs/profile.md`
- `docs/agents.md`
- `docs/todo.md`

Then inspect the relevant existing source code and the screenshots for **only your assigned theme**.

## Your job

Redesign and improve the assigned theme across the complete IoT widget set.

This is **not a recoloring task**. The assigned theme must have a genuinely different UI composition from Material 3 and the other themes. Change information hierarchy, frame/card language, gauges, controls, charts, state presentation, spacing, geometry, and size behavior where appropriate.

Search the web first for current, high-quality references relevant to this theme and to IoT/telemetry dashboards. Use them as design inspiration, not for pixel-for-pixel copying. Think like an ordinary dashboard user, not like someone making a UI component demo.

## Mandatory requirements

1. Inspect every widget category:
   - metrics
   - controls
   - charts
   - location
   - tables
   - display

2. Inspect **every supported widget size**, not only default size.

3. Fix:
   - overlap;
   - clipping;
   - content outside cards;
   - accidental scrollbars;
   - overly rounded/shaped UI;
   - excessive pills;
   - poor alignment;
   - wasted space;
   - tiny content inside large widgets;
   - half/cut gauges;
   - charts that do not use their area;
   - unclear state indication;
   - controls that do not visually respond.

4. Size changes must change information composition where useful:
   - `1x1`: core glanceable value/state;
   - `2x1`: add compact trend/context/control feedback;
   - `1x2`: deliberately use vertical space;
   - `2x2+`: add history, metadata, status/event context, richer control information, or a larger useful visualization.

5. Use semantic IoT visuals when they improve comprehension. For example fire/smoke/leak/alarm/tank/battery/signal/SCADA should not all look like generic KPI cards.

6. Interactive controls must work in mock mode.

7. English and Persian must remain compatible. Technical/numeric/chart content may stay LTR when appropriate.

8. Keep the widgets reusable in another React project. Do not couple theme code to the showcase page.

## Parallel-work rules

This work is happening in parallel with other theme chats.

Prefer creating/editing only dedicated theme files such as:

`src/widgets/themes/<Theme>Visuals.tsx`

Do **not** casually modify shared files such as `WidgetVisuals.tsx`, `WidgetFrame.tsx`, `themeTokens.ts`, `registry.ts`, `types.ts`, `App.tsx`, or global styles because other chats may conflict with you.

If shared integration is necessary, keep the theme implementation isolated and provide the smallest exact integration instructions in `INTEGRATION.md`. The coordinator chat will merge shared changes.

Do not rename stable theme IDs or widget IDs.

## QA

Run the theme-only screenshot pass after changes:

```powershell
$env:WIDGET_QA_THEME="<THEME_ID>"
npm run screenshots:full
```

If available, also run:

```powershell
$env:WIDGET_QA_THEME="<THEME_ID>"
npm run screenshots
```

Inspect the generated screenshots yourself before returning the result. Do not rely only on compilation.

Run TypeScript/build validation if dependencies are available.

## Deliverable

Return a **patch ZIP only**, not the entire project.

The patch should contain only the files needed for this theme plus:

- `THEME_NOTES.md` — design direction, changes, QA results, remaining issues;
- `INTEGRATION.md` — only if coordinator changes to shared files are required.

In your final response, tell me:

- exactly which files to add/replace;
- whether shared integration is required;
- the screenshot command to run;
- any remaining known issue.

Do not modify Material 3. Do not work on any other theme.

---
