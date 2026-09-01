---
priority: medium
always_include: false
category: tables
---

# CMS list pages — filter + table stack

For new **admin list screens**, follow this stack. Column widths, `ellipsis`, `fixed`, `cms-data-table`: see [table-implementation.md](./table-implementation.md).

**공유 의도 (CMS·Admin URL 필터 / 셸):**  
[list-filter-url-sync](../../../../.cursor/rules/cms-admin-ui/list-filter-url-sync.mdc) · [list-table-shell](../../../../.cursor/rules/cms-admin-ui/list-table-shell.mdc)

아래는 **CMS 구현** (`useTablePage` + `FilterTableLayout`). Admin은 `useListFilterUrl` — 공유 의도만 동일.

## Layout

- **Filter + divider + table:** `FilterTableLayout` (`@/shared/components/filter-table-layout` or `@/shared/ui`).  
- Filter definitions align with `TableFilterGroup` / `FilterFieldConfig[]`.
- **캘린더 뷰:** `contentVariant="calendar"` — sticky·overflow는 [calendar-filter-table-layout.md](../design/calendar-filter-table-layout.md) (테이블과 동일 레이아웃 컴포넌트, scrollport 규칙만 다름).

## State, URL, search

- Use **`useTablePage`** + per-domain **`TablePageConfig`** (`@/shared/components/table-system`).  
- Config exports typically include:
  - `columns` — TanStack column defs + Ant column resolver  
  - `filters` — `initialPending`, `syncPendingFromUrl`, `hasActiveFilters`, `getBaseCount`, optional `onFilterChange`  
  - `filterFn` — derive displayed rows from `searchParams`  
  - `getSearchSync` — URL/search integration for `useTableSearch`

## Handlers

- Put “pending filter shape” logic in **`config.filters.onFilterChange`**.  
- Pages wire `onFilterChange={handleFilterChange}` from `useTablePage` only.

## Single source of truth

공유 룰과 동일: pending draft vs **조회 후 `searchParams` 단일 소스**.  
Avoid **pending vs applied** duplicate state. After “Search/Apply”, **`searchParams`** drives the table; pending draft lives in `pendingFilters` + `applySearch`.

## Exceptions

Full-page modals or nested contexts without clean URL access: namespace query keys or inject `searchParams` via hooks—document the reason in PR comments.

**Last updated:** 2026-08-06
