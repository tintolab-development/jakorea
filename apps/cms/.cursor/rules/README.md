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

- [Development process](./process/development-process.md)  
- [Progress management](./process/progress-management.md)  
- [Personas](./process/persona.md)  
- [Admin notice modal](./process/admin-notice-form-modal-spec.md)  
- [Certificate issue spec](./process/member-program-certificate-issue-spec.md)  
- Other `process/*` files — feature-specific UI specs (English).  

---

**Last updated:** 2026-04-21
