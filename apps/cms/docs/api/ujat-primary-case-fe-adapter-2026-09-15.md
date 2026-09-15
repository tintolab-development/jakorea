# UJAT Primary 5 Case — CMS FE 어댑터 (2026-09-15)

Backend SoT: `182101`–`182105` / `ujat-primary-case-01`–`05`  
BE local: `JA_LOCAL_DEMO_UJAT_PRIMARY_CASES_ENABLED=true`, legacy·frontend-program-dummy OFF

## FE 변경 요약

- Primary ID·uuid 상수 (`is-ujat-primary-program.ts`)
- `serviceDetailJson` — FE `{version,program}` + BE flat `config_jsonb` (ujatProgressStatus, semesterType=FULL_YEAR, blockedDates*, listCaps, educationForm, preTrainingDeliveredBy, surveyMenuKeys)
- 목록/상세 어댑터 — `periodStatus`→lifecycle, Primary progress fallback, 강사 KPI `0` 유지( "-" 금지)
- 봉사 `application_status` canonical 정규화 (WAITING_REVIEW / DOCUMENT_PASSED / INTERVIEW_ASSIGNED / FINAL_SELECTED / RESERVE+rank / INTERVIEW_FAILED / GIVE_UP). `INTERVIEW_EVALUATED`·PASSED·WAITING·FINAL_ACCEPTED thin alias 제거
- 기관·봉사 신청 목록 remote (`organization-applications` / `volunteer-applications`) — Primary empty는 mock로 채우지 않음
- region-capacities / partner-assignments HTTP 클라이언트 (OpenAPI 재생성 없음)
- Mock fixture ID → `182101`–`182105` (legacy `ujat-progress-*` alias 유지)

## 화면별 확인 API

| 화면 | API |
| --- | --- |
| 목록 | `GET /api/admin/programs?programType=ujat` (또는 `UJAT`) |
| 상세 | `GET /api/admin/programs/{182101…182105}` |
| 모집/LNB | `…/recruitments`, `…/navigation` |
| 지역 정원 | `GET /api/admin/program-execution/programs/{id}/ujat/region-capacities` |
| 기관 신청 | `…/organization-applications` (+ roster / requested-schedules) |
| 봉사 심사 | `…/volunteer-applications` |
| 배정 | partner-assignments path (PRIMARY/SECONDARY) |

## Case 매핑

| ID | periodStatus | ujatProgressStatus | QA |
| --- | --- | --- | --- |
| 182101 | SCHEDULED | EDUCATION_SCHEDULED | 신청 0 · Empty |
| 182102 | RECRUITING | PARTICIPANT_RECRUITING | 기관 A–E |
| 182103 | RECRUITING | VOLUNTEER_RECRUITING | 봉사 ≥9 canonical |
| 182104 | IN_PROGRESS | EDUCATION_IN_PROGRESS | 2인조·출결·불가일·계획서/일지 |
| 182105 | COMPLETED | PROGRAM_ENDED | 설문 응답 |

## 로컬 env (CMS)

- `VITE_API_SERVER=http://localhost:8080` (또는 프록시)
- remote URL 있으면 `programs` + `ujatPrograms` + `applications` 모듈 ON
- UJAT는 일반 강사 모집 LNB 없음 (봉사자=강사)

## 하지 않음

- OpenAPI 재생성 / BE DTO 추가
- Semester 자식 프로그램·학년학급 마스터 API 가정
