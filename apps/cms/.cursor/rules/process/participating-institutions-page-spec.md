# Participating institutions — program progress (spec)

**Where:** Full-page program modal → LNB **Program progress** → **Participating institutions**.  
**URL:** `lnb=progress&tab=participants`.  
**Code:** `participating-institutions-section.tsx`, `participating-schools` mock.

## Purpose

List schools in the program; filter; bulk reject/approve; change textbook shipping status.

## Filter row (five fields + Search)

One row; filters apply on **Search** click. Suggested mapping to URL query (`schoolName`, etc.) like other progress filters.

| Field | Type | Notes |
|-------|------|--------|
| Institution name | Input | Text search |
| Region | Select | `REGION_OPTIONS` / mock regions |
| Grade | Select | `GRADE_OPTIONS` |
| Textbook status | Select | preparing / shipping / delivered |
| Teacher/instructor name | Input | |

## Table header row

- Left: title + **N** records (after filters).  
- Right: **Reject selected**, **Approve selected**, **Calendar view** (outline + icon) — reuse `program-applicants-tab__*` header pattern.

## Columns (fixed order)

Checkbox | No. | Institution | Region | Session schedule summary | Grade | Classes | Students | Textbook status | Teacher | Instructor

- Allocate width / `minWidth`; **overflow-x: auto** on wrapper.  
- **Region column (`기관 소재지`):** list/calendar display only through the **구 / 면 / 읍** administrative unit (strip road names, dong, and detail address). Use `formatInstitutionRegionForTableDisplay` from `@/shared/lib/format-institution-region-display`. Full address stays in detail views and filters.  
- **Session column:** fixed **360px** (`PARTICIPATING_INSTITUTIONS_SESSIONS_COLUMN_WIDTH`); `th`/`td` both use `participating-institutions-section__th-sessions` / `__td-sessions` with `max-width` so the column does not grow when `scroll.x` exceeds the column sum. If ≤3 sessions, list all; if ≥4, show **2** lines then **“+ N more sessions”** (N = total − 2).  
- Textbook: `StatusDropdownCell` + `TextbookStatusBadge`; column **`width: 136`**; badge only **`style={PARTICIPATING_INSTITUTIONS_TEXTBOOK_STATUS_DROPDOWN_STYLE}`** (100×30). Exclude row navigation when clicking dropdown/checkbox.

## Row behavior

- Multi-select checkboxes; bulk actions update selection (mock: toast / local state).  
- **Calendar view** — in-modal calendar or navigate to schedule route per product.  
- Row click may open school detail; exclude controls from row handler.

## Checklist

- [ ] Filters include institution name  
- [ ] Mock rows include `sessions` array  
- [ ] Styles aligned with program progress / applicants tabs  
- [ ] Horizontal scroll + session truncation rules  

**Last updated:** 2026-06-05
