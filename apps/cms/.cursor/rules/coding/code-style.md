---
priority: high
always_include: true
category: coding
---

# Code style

## ESLint & Prettier

Use the workspace config. Typical commands:

```bash
pnpm --filter cms lint
pnpm --filter cms format
```

## TypeScript

- `strict: true`  
- Prefer explicit types on public APIs.  
- Run `pnpm --filter cms typecheck` before merge.

## File naming

Use **kebab-case** for files and folders: `instructor-list-page.tsx`, `program-detail/`.  
Exceptions: `index.ts`, `index.tsx` entrypoints.

## Related

- [component-patterns.md](./component-patterns.md)  
- [custom-hooks.md](./custom-hooks.md)  

**Last updated:** 2026-04-21
