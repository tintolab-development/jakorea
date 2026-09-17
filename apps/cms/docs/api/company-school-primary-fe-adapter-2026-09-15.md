# 1사1교 Primary ONE-01/02/03 — CMS FE 어댑터 (2026-09-15)

Backend SoT: `170001`–`170003` / `LocalDemoCompanySchoolPrimarySeedContributor`  
BE 핸드오프: JABACK `docs/frontend/company-school-primary-seed-handoff-2026-09.md`

## FE 변경 요약

- `parseCompanySchoolServiceDetailJson` — Primary flat `config_jsonb` + FE `{program}` envelope 모두 hydrate
- `mapCompanySchoolDetailToProgram` — `settlementPolicy`→임금, typed remarks/nameKo, periodStatus→lifecycle
- Primary ID `170001`–`170003` · `ONE-0*` 제목 → `isCompanySchoolProgram` / 상세 LNB(봉사 숨김)
- 목록 overview·예정 필터: `SCHEDULED`∪`RECRUITING` (id 중복 제거) — 카드 건수와 목록 집합 동일
- 기관 신청: `GET …/requested-schedules` → `sessions` / 희망일정 표시
- 강사 신청: `distanceKm` / `longDistance`(API) 우선, threshold 100km(시드 컬럼)
- 1일1교: `instructor-assignments` + `programs/{id}/schedules`로 점유일·배정 보드 (mock 제거)
- 배정 create: `POST …/instructor-assignments` (`requestedScheduleId` / `resolvedScheduleId` 매핑)

## 화면별 확인 API

| 화면 | API |
| --- | --- |
| 목록 | `GET /api/admin/programs?programType=COMPANY_SCHOOL` |
| 상세 | `GET /api/admin/programs/{170001\|170002\|170003}` |
| LNB | `GET /api/admin/programs/{id}/navigation` |
| 기관 신청 | `GET …/organization-applications` + `…/organization-applications/{id}/requested-schedules` |
| 강사 신청 | `GET …/instructor-applications` (`distanceKm`, `longDistance`) |
| 강사 배정·1일1교 | `GET …/program-execution/instructor-assignments?programId=` + dashboard schedules (`startAt`) |

## OpenAPI (로컬)

- `pnpm fetch:openapi` ← `VITE_API_SERVER` (`http://localhost:8080`)
- `pnpm generate:api` — Orval 슬라이스 재생성
- 이번 동기화에서 `ProgramResponse`에 `contactName` / `otherMatters` / `remarks` / `recruitmentTargetDetail` 반영
- **assignment calendar 전용 GET은 OpenAPI에 없음** → FE는 배정 목록 + 일정 날짜로 1일1교 충돌을 유도. write 시 BE `ONE_COMPANY_ONE_SCHOOL_INSTRUCTOR_DAY_CONFLICT`(409)

## 로컬 env

- CMS: `VITE_COMPANY_SCHOOL_PROGRAMS_REMOTE_ENABLED=true` (+ programs/applications/programProgress 모듈)
- BE: `JA_LOCAL_DEMO_COMPANY_SCHOOL_PRIMARY_ENABLED=true`, legacy OFF
