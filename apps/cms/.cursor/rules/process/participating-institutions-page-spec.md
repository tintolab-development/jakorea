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
- **Session column:** if ≤3 sessions, list all; if ≥4, show **2** lines then **“+ N more sessions”** (N = total − 2).  
- Textbook: `StatusDropdownCell` + `TextbookStatusBadge`; classes `textbook-status-dropdown-cell` / `textbook-status-dropdown-trigger`. Exclude row navigation when clicking dropdown/checkbox.

## Row behavior

- Multi-select checkboxes; bulk actions update selection (mock: toast / local state).  
- **Calendar view** — in-modal calendar or navigate to schedule route per product.  
- Row click may open school detail; exclude controls from row handler.

## Checklist

- [ ] Filters include institution name  
- [ ] Mock rows include `sessions` array  
- [ ] Styles aligned with program progress / applicants tabs  
- [ ] Horizontal scroll + session truncation rules  

**Last updated:** 2026-04-21
