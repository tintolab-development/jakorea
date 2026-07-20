# Package management

## pnpm workspace

Root `pnpm-workspace.yaml` includes `apps/*` and `packages/*`. Run `pnpm install` once at the repo root.

## Workspace packages

- `@jakorea/ui` — shared UI
- `@jakorea/utils` — shared utilities

## Adding deps to Platform

```bash
pnpm --filter platform add <package>
```

## Related

- [shared-packages.md](../libraries/shared-packages.md)

**Last updated:** 2026-06-08
