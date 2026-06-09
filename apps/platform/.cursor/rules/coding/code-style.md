---
priority: high
always_include: true
category: coding
---

# Code style

## ESLint & Prettier

Use the workspace config. Typical commands:

```bash
pnpm --filter platform lint
pnpm --filter platform typecheck
```

## TypeScript

- `strict: true`
- Prefer explicit types on public APIs.
- Run `pnpm --filter platform typecheck` before merge.

## File naming

Use **kebab-case** for files and folders: `home-page.tsx`, `app-layout/`, `use-list-filters.ts`.

Exceptions: `index.ts`, `index.tsx` entrypoints.

**React export 이름**은 PascalCase (`HomePage`, `AppLayout`) — 파일명과 분리.

상세: [feature-file-naming.mdc](./feature-file-naming.mdc) (`alwaysApply: true`).

## Related

- [feature-file-naming.mdc](./feature-file-naming.mdc)
- [component-splitting.md](./component-splitting.md)
- [custom-hooks.md](./custom-hooks.md)

**Last updated:** 2026-06-08
