# Publishing the Widget Library

## Current package metadata

The repository is prepared with the package name:

```text
iot-widget-studio-react
```

Version:

```text
0.4.0
```

This name has not been checked for registry availability. Change it before public publishing if necessary.

## Build

```bash
npm run build:lib
```

The output contains ESM JavaScript, source maps and TypeScript declarations under `dist/`.

## Inspect package payload

```bash
npm pack --dry-run
```

Only these top-level payload groups should normally be included:

```text
dist/
README.md
docs/
package.json
```

`node_modules`, screenshots, the showcase source and QA output should not be published in the npm package payload.

## Create local package tarball

```bash
npm run pack:lib
```

## npm registry

Choose/confirm:

- package name/scope;
- repository URL;
- license;
- author/organization;
- public vs private visibility.

Then publish through your registry's normal workflow.

## Git releases

For installation directly from Git, commit `dist/` before tagging because this package does not run a build as an install-time `prepare` script.

This keeps Git installation deterministic and prevents consumers from downloading Playwright/Vite development tooling just to install the widget package.
