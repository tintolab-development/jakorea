# Applicant institutions table — layout fix (screenshot handoff)

**Scope:** Program detail full-page modal → LNB **Applicants** → **Applicant institutions** table.  
**Code:** `applicant-list.tsx`, `applicant-list.css`.

## Problem

- **Session / preferred date** column used `width: 1` with `table-layout: fixed`, so content overflowed into **Grade**, **Class count**, **Teacher** columns.  
- Horizontal scroll did not appear because total `scroll.x` was too small.

## Fix

1. **Session / preferred schedule column** — remove `width: 1`; set **`width` / `minWidth` ≈ 320px**; keep cell class e.g. `applicant-details__td-sessions`.  
2. **`scroll.x`** — for the institutions view, sum column widths using **320** for that column (not 1).  
3. **CSS** — `.applicant-details__td-sessions`: `min-width: 320px`, `white-space: normal`, `overflow-wrap: break-word`. Wrapper: `overflow-x: auto`, no parent clipping horizontal scroll.

## Acceptance

- [ ] Session text does not overlap neighboring columns.  
- [ ] When the table is wider than the viewport, a horizontal scrollbar appears and all columns are reachable.  
- [ ] Column order unchanged.

## Related

`participating-institutions-section.tsx` may need the same **min width + scroll.x** pattern if it uses a similar “sessions” column.

**Last updated:** 2026-04-21
