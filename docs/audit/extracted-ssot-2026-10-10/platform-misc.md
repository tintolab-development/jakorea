# Platform 이관 SSOT

이관일: 2026-10-10
원본 수: 1

원본 경로 목록:

- `apps/platform/docs/api/instructor-schedule-options-program-186048-verification-backend-cursor-prompt-2026-10-06.md`

---

### Source: `apps/platform/docs/api/instructor-schedule-options-program-186048-verification-backend-cursor-prompt-2026-10-06.md`

# Cursor prompt — 프로그램 186048 강사 신청 "강의 진행 가능 일정" 선택지 검증 (JABACK)

> **Status (2026-10-06):** 검증·BE 수정 완료. 0개는 승인 기관 부재(H1)로 정상이었고, 날짜 지정형 기관 답 `line:N`을 로더가 읽지 못하는 버그(H2·H4)는 기관 승인 시 `program_schedule` 생성 + 연결 경로 추가로 해결.  
> FE handoff: `JABACK/docs/frontend/general-organization-fixed-date-instructor-schedule-options-frontend-handoff-2026-10-06.md`  
> FE 후속: 종일 일정 카드 2행을 `00:00 ~ 00:00` 대신 `종일`로 표시. 아래는 이력용.

아래 지시를 **백엔드 레포(`JABACK`, 로컬 `localhost:8080`)에서 실행**하라.  
프론트 레포를 탐색하지 말고, **이 문서의 재현·질문에만** 답하라.  
**코드·데이터를 고치지 말고 먼저 검증 결과만 보고하라.** 수정이 필요하면 원인과 수정안을 제안만 한다.

이 문서는 프론트 레포 경로:

`apps/platform/docs/api/instructor-schedule-options-program-186048-verification-backend-cursor-prompt-2026-10-06.md`

관련 BE handoff: `JABACK/docs/frontend/general-organization-period-instructor-schedule-options-frontend-handoff-2026-10-06.md`  
관련 코드: `src/main/java/com/jakorea/cms/form/service/ProgramApplicationAudienceRuntimeLoader.java`

---

## 증상

Platform 강사 신청 화면(프로그램 **186048**, 강사 모집 **186112**)에서
`program-instructor-application-seed-available-schedule`(강의 진행 가능 일정, 필수)의 선택지가 **0개**다.
FE는 `runtimeResolved=true` + `options=[]`를 받아 "선택 가능한 강의 일정이 없어 신청할 수 없습니다"를 띄우고 제출을 막는다.
즉 **강사가 이 프로그램에 신청할 수 없는 상태**다.

이것이 **정책상 정상(아직 승인 기관 없음)** 인지, **데이터/로더 문제**인지 판정하라.

---

## FE가 확인한 사실 (`GET /api/portal/programs/186048`, 2026-10-06 21:09 KST)

| 항목 | 값 |
|------|----|
| `programType` | `GENERAL_ORGANIZATION` |
| `applicationTargetMode` | `ORGANIZATION` |
| `educationScheduleMode` | `date` (날짜 지정형 — PERIOD 아님) |
| `educationScheduleLines` | `26년 10월 20일(화) 10:00 ~ 12:00`, `26년 10월 27일(화) 13:30 ~ 16:00`, `26년 11월 3일(화) 9:30 ~ 11:30`, `26년 11월 10일(화) 14:00 ~ 16:30` (4줄) |
| `schedules` (= `program_schedule`) | **1건뿐**: `scheduleId=186619`, `sessionNo=1`, `scheduleName="디지털 리터러시 교실 커리큘럼"`, `startAt=2026-10-15T15:00:00Z`, `endAt=2026-11-15T15:00:00Z`, `allDay=true` |
| 강사 모집 | `recruitmentId=186112`, `INSTRUCTOR`, `startAt=2026-10-01T15:00Z` ~ `endAt=2026-10-21T15:00Z`, `open=true` |
| 기관 모집 | `recruitmentId=186111`, `ORGANIZATION`, `startAt=2026-10-08T15:00Z` ~ `endAt=2026-10-21T15:00Z`, **`open=false` (아직 시작 전)** |

로더 규칙(요약): `GENERAL_ORGANIZATION`은 `organizationOnly` → **승인된 기관 신청과 연결된 `program_schedule`만** 선택지가 된다.
연결 경로는 ① 기관 신청서 희망 일정 답의 `schedule:{id}` ② (PERIOD만) 날짜 객체 ↔ 같은 날 일정 ③ `program_application_requested_schedule` 날짜 ↔ 같은 날 일정 ④ UJAT 배정.

---

## 가설 (각각 참/거짓 판정)

- **H1. 승인된 기관 신청이 없다.** 기관 모집이 10/8 시작이라 `program_organization_application`에 `APPROVED`/`APPROVAL_COMPLETED`/`FINAL_SELECTED` 행이 없어 선택지 0개 → 정책상 정상.
- **H2. 날짜 지정 일정 4개가 `program_schedule`로 생성되지 않았다.** `educationScheduleLines` 4줄은 표시용이고 실제 행은 종일 커리큘럼 블록 186619 하나. 기관이 승인돼도 기관 신청서 희망 일정 선택지가 186619 하나뿐이거나, 날짜 매칭(③)이 10/16 하루와만 맞아 **4개 날짜가 강사 선택지로 나오지 않는다**.
- **H3. 일정 행이 로더 필터에 걸린다.** `cancelled_at`, `schedule_status`, `effective_from`/`effective_to`(now 기준)로 186619(또는 다른 행)가 제외된다.
- **H4. 기관 신청서 희망 일정 답 형식이 로더와 맞지 않는다.** 날짜 지정형인데 답이 `schedule:{id}`가 아닌 날짜 객체/문자열로 저장돼 ①에 안 걸리고, PERIOD가 아니라 ②도 안 탄다.
- **H5. 강사 차단 날짜로 전부 빠진다.** 테스트 강사 회원의 `program_instructor_assignment` / `instructor_assignment_calendar`가 해당 날짜를 막는다.

---

## 실행할 검증 (SQL 결과를 그대로 붙여라)

```sql

#### Marker lines (excerpt)
```
-- 5) 희망 일정 테이블 (경로 ③)
## FE 기대 응답 (변경 금지 계약)
```

---
