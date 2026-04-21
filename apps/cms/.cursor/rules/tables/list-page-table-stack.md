---
priority: medium
always_include: false
category: tables
---

# CMS list pages — filter + table stack

For new **admin list screens**, follow this stack. Column widths, `ellipsis`, `fixed`, `cms-data-table`: see [table-implementation.md](./table-implementation.md).

## Layout

- **Filter + divider + table:** `FilterTableLayout` (`@/shared/components/filter-table-layout` or `@/shared/ui`).  
- Filter definitions align with `TableFilterGroup` / `FilterFieldConfig[]`.

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

Avoid **pending vs applied** duplicate state. After “Search/Apply”, **`searchParams`** drives the table; pending draft lives in `pendingFilters` + `applySearch`.

## Exceptions

Full-page modals or nested contexts without clean URL access: namespace query keys or inject `searchParams` via hooks—document the reason in PR comments.

**Last updated:** 2026-04-21
