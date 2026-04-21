---
priority: medium
always_include: false
category: tables
---

# Table + filters + URL (`useTablePage`)

**Primary stack doc:** [list-page-table-stack.md](./list-page-table-stack.md) — follow that for standard admin list pages (filter card + table + URL query sync).

---

## When to use TanStack Table

Use **`@tanstack/react-table`** when you need:

- Column filter state integrated with table model, **or**  
- Shared pagination/filter plumbing with Ant `Table` as renderer.

For simple read-only tables, Ant `Table` alone is enough.

---

## Pattern

1. Define `ColumnDef` / columns.  
2. `useReactTable` with `getCoreRowModel`, optional `getFilteredRowModel`, `getPaginationRowModel`.  
3. Map row model to Ant `Table` `dataSource` or render head/body manually.  
4. Sync page index/size (and filters) to **URL search params** using the project hooks (`useTablePage`, etc.—see list-page stack).

---

## Don’t

- Duplicate filter state in three places (local state + URL + table) without a single source of truth.  
- Re-implement pagination math that `useTablePage` already solves.

---

**Last updated:** 2026-04-21
