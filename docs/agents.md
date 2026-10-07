# Agent / Parallel-Work Rules

## Read first

Any theme or library task should read:

1. `docs/profile.md`
2. `docs/agents.md`
3. `docs/todo.md`

## Theme work ownership

Parallel theme chats should own one stable theme ID at a time and prefer theme-specific files under:

```text
src/widgets/themes/
```

Do not rename stable theme/widget IDs.

## Coordinator-owned shared contracts

Changes to these files affect every theme or the public package and should be coordinated:

```text
src/library/*
src/widgets/core/types.ts
src/widgets/core/WidgetFrame.tsx
src/widgets/core/themeTokens.ts
src/widgets/renderers/WidgetVisuals.tsx
src/widgets/registry.ts
src/widgets/index.ts
package.json
tsconfig.lib.json
README.md
docs/architecture.md
docs/api-reference.md
```

Theme-only patches should avoid these unless integration genuinely requires them.

## Theme definition

A theme is not a recolor. A theme pass must inspect composition, density, controls, gauges, charts, state language and all supported sizes.

## Size QA

Every supported size must be intentional. Do not validate only defaults.

## EN / FA QA

Run both English and Persian screenshot passes for final approval.

## Reusable-library rule

Do not import showcase code from reusable modules.

Theme renderers receive props and should not read page-global state.

## Patch delivery

Parallel design work should return theme-specific patch files and integration notes rather than whole project copies unless the coordinator explicitly requests a full repository.
