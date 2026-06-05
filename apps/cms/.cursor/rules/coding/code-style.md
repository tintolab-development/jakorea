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

**CMS 전역 (필수)** — `src/features`, `src/pages`, `src/entities` 등에서 경로에 이미 있는 접두어(`cms`, `general`, `ujat`, `program`, `sponsor` …)를 파일명·colocated CSS에 반복하지 않음.  
예: `features/program/general/…/recruitment-view.tsx` (not `general-program-recruitment-view.tsx`).  
규칙: [feature-file-naming.mdc](./feature-file-naming.mdc) (`alwaysApply: true`).

## Related

- [component-patterns.md](./component-patterns.md)  
- [custom-hooks.md](./custom-hooks.md)  

**Last updated:** 2026-04-21
