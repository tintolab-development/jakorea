# Platform 프로그램 상세 — 봉사자 「면접 진행 가능 일정」

**Date:** 2026-10-09  
**Status:** **BE 완료** — FE handoff:  
`JABACK/docs/frontend/portal-program-detail-volunteer-interview-schedule-frontend-handoff-2026-10-09.md`  
**App:** `apps/platform` `/programs/{programId}` 봉사자 모집 상세

## BE 확정 필드

`GET /api/portal/programs/{programId}` 의 `recruitments[]` (VOLUNTEER · 면접 운영 행):

| 필드 | 용도 |
| --- | --- |
| `volunteerInterviewSchedule` | 면접 진행 가능 일정 요약·선택지. 없으면 null/생략 → 섹션 숨김 |
| `.source` | `SLOT` / `SCHEDULE_INFO` / `EMPTY` |
| `.periodStartDate` / `.periodEndDate` | 기간 요약 (`YYYY-MM-DD` KST) |
| `.availableTimeSlots` / `.recurringUnavailable` | CMS 원문 표시 |
| `.options[]` | `label` 목록. 없으면 `[]` |

## FE 매핑

- `@jakorea/domain/portal/program-detail` — `PortalVolunteerInterviewSchedule*`
- `mapPortalProgramDetail` → `ProgramDetail.volunteerInterviewSchedule`
- `program-info-detail.tsx` — 라벨 **「면접 진행 가능 일정」**
- `schedules[]` / `educationScheduleLines` / `interviewStartAt`만으로 목록을 합성하지 않음
