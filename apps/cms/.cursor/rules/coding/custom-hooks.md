# Custom hooks

## One concern per hook

Split **data loading**, **filters**, and **pagination** into focused hooks when they grow past trivial glue.

Examples:

- `useInstructorList` — fetch + loading/error state  
- `useInstructorFilters` — filter object + update/reset  
- `usePagination` — page / pageSize / reset (see `shared/hooks`)

## Dependencies

Always pass a correct `useEffect` dependency array. Do not omit deps “to make it run once” unless you truly need mount-only behaviour (document why).

Use `useCallback` / `useMemo` when passing callbacks/objects into memoized children or as effect deps.

## Naming

Prefix with `use`. Name reflects behaviour (`useProgramList`, `useSettlementFilters`).

## Anti-patterns

- One giant hook that fetches, filters, paginates, and owns modal state — split.  
- Hooks that only wrap a single `useState` with no logic — inline instead.
- **`return` / 조건부 분기 뒤에 `useEffect`·`useFieldArray` 등 훅 호출** —  
  `Rendered more hooks than during the previous render` 유발.  
  → 모노레포 규칙: [react-hooks-after-early-return.mdc](../../../../../.cursor/rules/react-hooks-after-early-return.mdc)  
  (훅은 항상 최상단·동일 순서, early `return null`은 훅 **이후**)

## Related

- [refactoring-principles.md](./refactoring-principles.md)  
- [component-patterns.md](./component-patterns.md)  
- [react-hooks-after-early-return.mdc](./react-hooks-after-early-return.mdc)

**Last updated:** 2026-07-20
