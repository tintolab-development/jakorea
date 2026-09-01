# Custom hooks

## One concern per hook

Split **data loading**, **filters**, and **pagination** into focused hooks when they grow past trivial glue.

Examples:

- `use-program-list` — fetch + loading/error state
- `use-program-filters` — filter object + update/reset
- `use-pagination` — page / pageSize / reset (see `shared/hooks`)

## Dependencies

Always pass a correct `useEffect` dependency array. Do not omit deps "to make it run once" unless you truly need mount-only behaviour (document why).

Use `useCallback` / `useMemo` when passing callbacks/objects into memoized children or as effect deps.

## Naming

- File: **kebab-case** — `use-program-list.ts`
- Function: `use` prefix + PascalCase — `useProgramList`
- Name reflects behaviour (`useProgramList`, `useSettlementFilters`)

## Anti-patterns

- One giant hook that fetches, filters, paginates, and owns modal state — split.
- Hooks that only wrap a single `useState` with no logic — inline instead.

## Related

- [refactoring-principles.md](./refactoring-principles.md)
- [component-splitting.md](./component-splitting.md)

**Last updated:** 2026-06-08
