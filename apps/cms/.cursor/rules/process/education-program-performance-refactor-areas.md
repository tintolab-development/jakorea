# Education program route — performance / refactor (no business change)

Safe optimizations only; keep filters, permissions, API shapes, and URLs unchanged.

## Priority 1

1. **Split `program-list.tsx`** (~1900+ lines) into filters, table, calendar, toolbar; memoize `columns` and stable menu helpers.  
2. **Single `useSearchParams`** — avoid duplicate hooks for admin vs participant filters on the same URL.  
3. **`program-list-page.tsx`** — consolidate `useEffect` for search/viewMode + debounce; avoid redundant URL updates.  
4. **Favorites** — replace N× `isFavoriteProgram` with batch API or `Promise.all` if no batch endpoint.

## Priority 2

- `React.memo` on `ProgramCalendarView` + stable `programs` reference.  
- Narrow `useProgramStore` subscriptions in `ProgramProgressWidget`.  
- Optional shared data source for enrollment page vs list store.  
- `React.lazy` heavy program detail tabs.

## Priority 3

- Collocate modal state (`useReducer` / helper).  
- Memoize column factories per variant.  
- Tokenize CSS / remove dead rules.  
- `React.memo` on layout-only wrappers.

## Do not change without product sign-off

- Dual sources for `filteredPrograms` vs `getEducationPrograms()` when counts must match.  
- Route tree under `/programs/...`.

**Last updated:** 2026-04-21
