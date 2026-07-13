# Platform project rules

**JaKorea Platform** (`apps/platform`) — Vite + React + TypeScript + CSS Modules, 모바일 퍼스트 반응형 UI.

## Start here

- [Project overview](./project-overview.md)
- [Project structure](./architecture/project-structure.md)
- [frontend-css-modules-responsive.mdc](./frontend-css-modules-responsive.mdc) — **alwaysApply** 기본 스타일·반응형 규칙

## Architecture

- [Project structure](./architecture/project-structure.md) — FSD-lite 레이어

## Auth

- [email-id-policy.mdc](./auth/email-id-policy.mdc) — 회원 이메일 ID 형식·금칙어·중복·정규화 정책

## Coding (CMS 공통 규칙 선별)

- [Code style](./coding/code-style.md) — ESLint, TypeScript, kebab-case
- **[Feature file naming](./coding/feature-file-naming.mdc)** — 경로=스코프, kebab-case (**alwaysApply**)
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

## Data / TanStack Query (모노레포 공통)

- 앱 포인터: [libraries/tanstack-query-cache.mdc](./libraries/tanstack-query-cache.mdc)
- 공통 Rule: [`.cursor/rules/backend-response-cache-policy.mdc`](../../../../.cursor/rules/backend-response-cache-policy.mdc)
- 공통 Skill: [`.cursor/skills/tanstack-query-backend-cache/SKILL.md`](../../../../.cursor/skills/tanstack-query-backend-cache/SKILL.md)

키 루트는 Platform 도입 시 `['platform', …]` (CMS `['cms', …]`와 분리).

## Skills

- `.cursor/skills/css-modules-responsive/SKILL.md`
- `.cursor/skills/typescript/SKILL.md`
- `.cursor/skills/frontend-design/SKILL.md`
- 모노레포: [tanstack-query-backend-cache](../../../../.cursor/skills/tanstack-query-backend-cache/SKILL.md)

## References

- `.cursor/references/responsive-review-checklist.md`
- `.cursor/references/templates/component-css-modules-template.md`

## Breakpoints (기본)

| 구간 | min-width |
|------|-----------|
| mobile | default |
| tablet | 768px |
| desktop | 1024px |
| wide | 1280px |

토큰: `src/shared/styles/tokens.css`
