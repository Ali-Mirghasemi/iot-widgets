# Installation and Distribution

## Requirements

The reusable package is designed for React applications using MUI.

Peer dependencies:

```text
react              React 18.2+ or React 19
react-dom          React 18.2+ or React 19
@mui/material      MUI 7
@mui/icons-material MUI Icons 7
@emotion/react     Emotion 11
@emotion/styled    Emotion 11
```

## Method 1 — install a packed `.tgz` file

This is the best local/internal distribution method because the consumer receives exactly the package payload that would be published to npm.

In the widget repository:

```bash
npm install
npm run pack:lib
```

This creates a file similar to:

```text
iot-widget-studio-react-0.4.0.tgz
```

In the consuming React project:

```bash
npm install ../path/to/iot-widget-studio-react-0.4.0.tgz
```

Then import from the package root:

```ts
import { IoTWidget } from 'iot-widget-studio-react';
```

## Method 2 — install from Git

Run and commit the library build before tagging a release:

```bash
npm run build:lib
git add dist package.json package-lock.json
git commit -m "Build widget library"
git tag v0.4.0
git push --tags
```

A consumer can install the tag:

```bash
npm install git+https://github.com/YOUR_ORG/YOUR_REPO.git#v0.4.0
```

or:

```bash
npm install github:YOUR_ORG/YOUR_REPO#v0.4.0
```

The `dist/` directory must exist in the Git revision because this repository deliberately does not require a package build during Git installation.

## Method 3 — npm/private registry

Before publishing, choose an available package name, repository URL and license policy.

Build:

```bash
npm run build:lib
```

Inspect the payload:

```bash
npm pack --dry-run
```

Publish to your configured npm-compatible registry:

```bash
npm publish
```

For a scoped public npm package:

```bash
npm publish --access public
```

For an internal registry, configure `.npmrc` according to that registry's authentication and scope rules.

## Method 4 — monorepo/workspace

Move this repository/package into your npm/pnpm/yarn workspace and reference it as a workspace dependency.

Example npm workspace dependency:

```json
{
  "dependencies": {
    "iot-widget-studio-react": "workspace:*"
  }
}
```

Build `dist/` before running the consumer if the workspace tooling does not transpile package source automatically.

## Method 5 — source copy

If package management is not desirable, copy these folders into the host project:

```text
src/library/
src/widgets/
```

Then import `IoTWidget` from your copied `library` entry point.

This method works but is less desirable because it loses versioning and makes upgrades harder.

## ESM package

The package build is ESM-first and intended for modern React build systems such as Vite, modern Webpack, Next.js, Remix and similar bundlers.

The package intentionally externalizes React/MUI conceptually through peer dependencies instead of embedding another React copy.
