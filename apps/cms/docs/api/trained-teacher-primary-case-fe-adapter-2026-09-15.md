# 교육받은 교사 Primary 8 Case — CMS FE 어댑터 (2026-09-15)

Backend SoT: `186001`–`186008` / `trained-teacher-primary-case-01`–`08` /
`LOCAL-TRAINED-TEACHER-PRIMARY-01`–`08`  
BE: `JA_LOCAL_DEMO_TRAINED_TEACHER_PRIMARY_CASES_ENABLED=true`,  
`JA_LOCAL_DEMO_FRONTEND_PROGRAM_DUMMY_ENABLED=false`,  
`JA_LOCAL_DEMO_LEGACY_PROGRAM_SEEDS_ENABLED=false`  
BE 핸드오프: JABACK `docs/frontend/trained-teacher-primary-case-seed-handoff-2026-09.md`

## FE 변경 요약

- Primary ID·uuid·program_code 상수 (`is-trained-teachers-primary-program.ts`)
- 상세 판별: mock membership 제거 → Primary / remote snapshot / 로컬 등록만
- periodStatus → typed lifecycle (`scheduled` / `recruiting_students` / `in_progress` / `completed`)
- 교사 연수 일정명 SoT: **「교사 연수」** + IPS Prepare (`TRAINED_TEACHER_TRAINING_SCHEDULE_NAME`)
- 기관 신청 approve/reject → TT 전용 path (공통 applications 미사용)
- 희망일정 mock 블록: remote ON 시 비움 (memo만 표시)
- 교육일지: submitted 파일만 · remote 전용 (로컬 mock 쿼리 제거)
- **학생교육 완료** `GET …/trained-teacher/education-completions` 배선 — 일지와 별도 SSOT
- 실적 strip: performance-summary + 활성 completion 건수
- 강사/봉사자/합반 UI 비노출 유지 · 배송상태 API 필드 invent 금지 (`not_applicable`)

## Case 매핑

| ID | Case | 구조 | 연수 | periodStatus |
| --- | --- | --- | --- | --- |
| 186001 | TCH-01 | curriculum/single | OFF | COMPLETED |
| 186002 | TCH-02 | curriculum/single | ON | IN_PROGRESS |
| 186003 | TCH-03 | curriculum/multi | OFF | IN_PROGRESS |
| 186004 | TCH-04 | curriculum/multi | ON | COMPLETED |
| 186005 | TCH-05 | schedule/single | OFF | SCHEDULED |
| 186006 | TCH-06 | schedule/single | ON | IN_PROGRESS |
| 186007 | TCH-07 | schedule/multi | OFF | IN_PROGRESS |
| 186008 | TCH-08 | schedule/multi | ON | COMPLETED |

## 화면별 확인 API

| 화면 | API |
| --- | --- |
| 목록 | `GET /api/admin/programs?programType=TRAINED_TEACHER` |
| 상세·공통정보 | `GET/PATCH …/trained-teacher/detail` |
| 기관 신청 | `GET …/organization-applications` (+ approve/reject) |
| 교육일지 | `GET …/education-journals` |
| 학생교육 완료 | `GET …/education-completions` |
| 실적 | `GET …/performance-summary` |

## 로컬 env (CMS)

```env
VITE_API_SERVER=http://localhost:8080
VITE_TRAINED_TEACHER_PROGRAMS_REMOTE_ENABLED=true
```

## 하지 않음

- OpenAPI 재생성 / BE DTO·Flyway 변경
- thin TT `169201`–`169208` / FE mock `trained-teachers-prog-*`를 Primary SoT로 취급
- 배송 전/중/완료를 API 필드로 가정
- 강사·봉사자·합반 UI 추가
