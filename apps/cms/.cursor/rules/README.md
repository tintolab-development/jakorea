# CMS project rules

Development standards for **JAKorea CMS** (`apps/cms`).

## Start here

- [Project overview](./project-overview.md)
- [FSD structure](./architecture/fsd-structure.md)

## Architecture

- [FSD structure](./architecture/fsd-structure.md) — Feature-Sliced Design  
- [Routing](./architecture/routing.md) — React Router and route naming  

## Coding

- [Code style](./coding/code-style.md) — ESLint, Prettier, TS, naming  
- [Component patterns](./coding/component-patterns.md) — shared UI usage  
- [List page composition](./coding/list-page-composition.mdc) — filter + table layout  
- [Status dropdown cell](./coding/status-dropdown-cell.md) — `StatusDropdownCell`, tag layout  
- [Custom hooks](./coding/custom-hooks.md)  
- [Type safety & consistency](./coding/type-safety-and-consistency.md) — no deprecated APIs  
- [Refactoring principles](./coding/refactoring-principles.md)  
- [Template feature implementation](./coding/template-management.md) — `features/template`, `pages/templates`  

## UI / UX

- [UI principles](./design/ui-principles.md)  
- [Modal viewport centering](./design/modal-viewport-centering.md) — center modals in viewport  
- Prefer **`ContentModal`**; direct **`TealHeaderModal`** use is deprecated  
- [Event handling](./design/event-handling.md)  
- [Color system](./design/color-system.md)  
- [Color palette](./design/color-palette.md)  
- [Styling tokens](./design/styling-tokens.md)  
- [Schedule / calendar UX](./design/schedule-calendar-ux.md)  
- [Design requests](./design/design-requests.md)  

## Libraries

- [Ant Design usage](./libraries/ant-design-usage.md)  
- [Shared packages](./libraries/shared-packages.md) — `@jakorea/ui`, `@jakorea/utils`  
- [Required libraries](./libraries/required-libraries.md)  

## State

- [State management](./state/state-management.md) — Zustand  

## Data

- [Mock data](./data/mock-data.md)  
- [API spec (mock)](./data/api-spec-mock.md)  
- [API spec detailed](../../docs/api/api-spec-mock-detailed.md)  
- [API spec extended](../../docs/api/api-spec-mock-extended.md)  

## Forms

- [Form validation](./forms/form-validation.md) — RHF + Zod  

## Tables

- [Table implementation](./tables/table-implementation.md) — Ant Table patterns  
- [Table management](./tables/table-management.md) — TanStack table & URL sync  
- [Status dropdown cell](./coding/status-dropdown-cell.md)  

## Environment

- [Browser support](./environment/browser-support.md)  
- [Package management](./environment/package-management.md) — pnpm workspace  
- [Tech stack](./environment/tech-stack.md)  

## Process

- [개발 프로세스](./process/development-process.md) - Phase별 개발 프로세스
- [진행 상황 관리](./process/progress-management.md) - PROGRESS.md 기록 규칙
- [역할별 Persona](./process/persona.md) - 시니어 PM, 기획자, UX/UI 디자이너, 개발자 역할 정의
- [관리자 공지 등록·수정 모달 UI](./process/admin-notice-form-modal-spec.md) - `ContentModal` large, 필터·폼 간격, 에디터·첨부 행 치수
- [수료증/참여인증서 발급](./process/member-program-certificate-issue-spec.md) - 발급 자격·문서 종류 기획, 화면 고정 안내 미삽입 정책
- [후원사 상세 > 프로그램 진행 이력 — 참여자 유형](./process/sponsor-program-history-participant-type.md) - 학교/기관·개인 학습자만 (`school` | `individual`)
- [프로그램 이력 삭제 — 진행 중 차단](./process/program-history-delete-blocked.md) - `EDUCATION_IN_PROGRESS` 포함 시 삭제 불가 모달
- [교재 관리 — 사업 분야](./process/textbook-management.md) - 교재 사업 분야 4종(기획 고정), 코드 상수 `textbook-business-areas.ts`
- [Development process](./process/development-process.md)  
- [Progress management](./process/progress-management.md)  
- [Personas](./process/persona.md)  
- [Admin notice modal](./process/admin-notice-form-modal-spec.md)  
- [Certificate issue spec](./process/member-program-certificate-issue-spec.md)  
- Other `process/*` files — feature-specific UI specs (English).  

---

**Last updated:** 2026-04-21
