# Release Checklist

Before creating a reusable library release:

- [ ] `node node_modules/typescript/bin/tsc -b` passes (or `npm run build:app` on the target OS)
- [ ] `npm run build:lib` passes
- [ ] `npm pack --dry-run` contains only expected package files
- [ ] EN screenshot QA passes for all required themes
- [ ] FA screenshot QA passes for all required themes
- [ ] mixed-theme dashboard smoke test
- [ ] live `data` prop update smoke test
- [ ] per-instance `themeOverrides` smoke test
- [ ] invalid widget ID error is clear
- [ ] unsupported size error is clear
- [ ] README version matches package version
- [ ] `dist/` is committed for Git-install releases
- [ ] package name/scope confirmed
- [ ] repository URL confirmed
- [ ] license decision confirmed
- [ ] tag release version
