---
priority: medium
always_include: false
category: data
---

# Mock data

## Placement

Keep mock **services** in `entities/*/api/*-service.ts` (or feature-local mocks when experimental). Arrays/objects should mirror real API shapes.

## Consistency

When deleting or mutating entities, keep **referential integrity** (e.g. cascade deletes where the real API would).

## General programs (`general-programs.ts`)

- 6건, 진행현황별 2건.
- `category`: `school` | `individual` | `instructor` | `volunteer` — 4유형 순환 배정(목록 필터·테이블 표기와 동일).
- `scheduleTimeEnabled: false` → `startTime`/`endTime` 없음 → 주간 격자 **종일(00:00–24:00)** + 라벨 `종일` (규칙: [calendar-week-time-grid.md](../design/calendar-week-time-grid.md)).

## Related

- [api-spec-mock.md](./api-spec-mock.md)  
- [fsd-structure.md](../architecture/fsd-structure.md)  

**Last updated:** 2026-05-29
