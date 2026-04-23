# Package management

## pnpm workspace

Root `pnpm-workspace.yaml` includes `apps/*` and `packages/*`. Run `pnpm install` once at the repo root.

## Workspace packages

- `@jakorea/ui` — shared UI  
- `@jakorea/utils` — shared utilities  

## Adding deps to CMS

```bash
pnpm --filter cms add <package>
```

## Related

- [shared-packages.md](../libraries/shared-packages.md)  
- [required-libraries.md](../libraries/required-libraries.md)  

**Last updated:** 2026-04-21
