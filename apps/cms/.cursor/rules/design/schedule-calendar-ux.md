# Schedule calendar — click behaviour

## Context

Admins add many schedule items; **viewing** is frequent, **creating** is periodic.

## Options

1. **Date with events → open summary/drawer (recommended)**  
   - Clicking the day (even empty padding) opens the day’s events.  
   - Creating a new item uses an explicit **“Add schedule”** action or clicking an **empty** day.

2. **Current mixed behaviour**  
   - Item click → detail.  
   - Empty area on busy day → create modal (fast add, ambiguous intent).

3. **Hybrid**  
   - Day opens list drawer with “Add” inside—extra step, clearer intent.

## Recommendation

Prefer **option 1** for consistency with common calendar apps and fewer mistaken creates.

## Engineering

- **공통 캘린더 단일 진입:** [calendar-common.md](./calendar-common.md) (shell 토큰·셀·리스트·날짜·모드·[오늘]·PR 체크리스트)
- FilterTableLayout 안 캘린더: [calendar-filter-table-layout.md](./calendar-filter-table-layout.md)
- Stop propagation on nested controls per [event-handling.md](./event-handling.md).
- 7:3 카드형: [calendar-split-card-layout.md](./calendar-split-card-layout.md)
- 우측 일별 리스트: [calendar-sub-right-list.md](./calendar-sub-right-list.md)
- 주간 시간 격자: [calendar-week-time-grid.md](./calendar-week-time-grid.md)

**Last updated:** 2026-05-28
