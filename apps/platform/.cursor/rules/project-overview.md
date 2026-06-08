---
priority: high
always_include: true
category: overview
---

# Platform project overview

**JaKorea Platform** (`apps/platform`) — 공개 웹 플랫폼.

## Stack

- **Vite 7** + **React 19** + **TypeScript**
- **CSS Modules** (모바일 퍼스트 반응형)
- Monorepo: `@jakorea/ui`, `@jakorea/utils`

## Conventions

- 파일·폴더: **kebab-case** ([feature-file-naming.mdc](./coding/feature-file-naming.mdc))
- 컴포넌트 export: **PascalCase** (`export function HomePage`)
- 스타일: colocated `*.module.css` + `shared/styles/` 토큰
- 구조: FSD-lite — `app` / `pages` / `widgets` / `features` / `entities` / `shared`

## Commands

```bash
pnpm --filter platform dev
pnpm --filter platform build
pnpm --filter platform typecheck
pnpm --filter platform lint
```

## Start here

- [Project structure](./architecture/project-structure.md)
- [frontend-css-modules-responsive.mdc](./frontend-css-modules-responsive.mdc)
- [Code style](./coding/code-style.md)

**Last updated:** 2026-06-08
