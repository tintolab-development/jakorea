# Platform project rules

**JaKorea Platform** (`apps/platform`) — Vite + React + TypeScript + CSS Modules, 모바일 퍼스트 반응형 UI.

## Start here

- [Project overview](./project-overview.md)
- [Project structure](./architecture/project-structure.md)
- [frontend-css-modules-responsive.mdc](./frontend-css-modules-responsive.mdc) — **alwaysApply** 기본 스타일·반응형 규칙

## Architecture

- [Project structure](./architecture/project-structure.md) — FSD-lite 레이어
- [Image assets](./architecture/image-assets.mdc) — 정적 이미지 4계층 보관 규칙

## Auth

- [email-id-policy.mdc](./auth/email-id-policy.mdc) — 회원 이메일 ID 형식·금칙어·중복·정규화 정책

## Coding (CMS 공통 규칙 선별)

- [Code style](./coding/code-style.md) — ESLint, TypeScript, kebab-case
- **[Feature file naming](./coding/feature-file-naming.mdc)** — 경로=스코프, kebab-case (**alwaysApply**)
- **[Soft navigation & fetch dedupe](./coding/soft-navigation-fetch-dedupe.mdc)** — 목록 탭/필터 soft nav · StrictMode 중복 fetch 금지
- **[List URL query params](./coding/list-url-query-params.mdc)** — 목록 `list-params` · soft sync · `from`/`redirect` · CMS draft+apply 비적용
- [Component splitting](./coding/component-splitting.md)
- [Custom hooks](./coding/custom-hooks.md)
- [Refactoring principles](./coding/refactoring-principles.md)
- [Type safety & consistency](./coding/type-safety-and-consistency.md)

## CSS Modules

- [frontend-css-modules-responsive.mdc](./frontend-css-modules-responsive.mdc)
- [react-component-css-modules-pattern.mdc](./react-component-css-modules-pattern.mdc)
- [css-modules-review-checklist.mdc](./css-modules-review-checklist.mdc)

## Environment & packages

- [Package management](./environment/package-management.md)
- [Shared packages](./libraries/shared-packages.md)

## API

- env: `VITE_API_BASE_URL` / `VITE_API_SERVER` (CMS와 동일) — `.env.example` 참고
- remote 판별: `src/shared/lib/api-remote-env.ts` (`isRemoteApiConfigured`)
- axios: `src/shared/api/axios-instance.ts` · barrel `src/shared/api/`
- auth 토큰: `src/shared/lib/auth-token.ts`
- Vite `/api` 프록시: `vite.config.ts`

## Data / TanStack Query (모노레포 공통)

- 앱 포인터: [libraries/tanstack-query-cache.mdc](./libraries/tanstack-query-cache.mdc)
- Provider: `src/app/providers/query-provider.tsx` · keys: `src/shared/api/query-keys.ts` (`['platform', …]`)
- 공통 Rule: [`.cursor/rules/backend-response-cache-policy.mdc`](../../../../.cursor/rules/backend-response-cache-policy.mdc)
- 공통 Skill: [`.cursor/skills/tanstack-query-backend-cache/SKILL.md`](../../../../.cursor/skills/tanstack-query-backend-cache/SKILL.md)

## Skills

- `.cursor/skills/css-modules-responsive/SKILL.md`
- `.cursor/skills/typescript/SKILL.md`
- `.cursor/skills/frontend-design/SKILL.md`
- 모노레포: [tanstack-query-backend-cache](../../../../.cursor/skills/tanstack-query-backend-cache/SKILL.md)

## References

- `.cursor/references/responsive-review-checklist.md`
- `.cursor/references/templates/component-css-modules-template.md`

## Breakpoints (필수 3구간)

| 구간 | 조건 | CSS custom media |
|------|------|------------------|
| Mobile | ~1079 (`max-width: 1079px`) | `--bp-below-pc` |
| PC compact | 1080~1599 | `--bp-pc-compact` · (`--bp-pc-up` for 1080+) |
| PC full | 1600~ | `--bp-pc-full-up` |

토큰: `src/shared/styles/breakpoints.css`, `src/shared/lib/breakpoints.ts`

