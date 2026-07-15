# 일반 프로그램 API — 백엔드 핸드오프 (갭·미구현)

CMS `/programs/general` mock → `programs` API 전환 시 백엔드 확인·요청 항목입니다.

연동 명세: [programs-api-integration.md](./programs-api-integration.md)  
등록 플로우 API 전체 목록: [programs-registration-flow-api-backend-handoff.md](./programs-registration-flow-api-backend-handoff.md)  
등록 완료 POST 핸드오프: [programs-create-api-backend-handoff.md](./programs-create-api-backend-handoff.md)  
마이그레이션: [programs-api-migration-guide.md](./programs-api-migration-guide.md)  
상세 완료율 · Phase 5–10: [programs-detail-api-conversion-status.md](./programs-detail-api-conversion-status.md)

**작성일**: 2026-07-09  
**갱신**: 2026-07-15 (OpenAPI fetch 후 상세 잔여 FE 블로커 정리)

---

## 요약

| 구분 | 설명 |
|------|------|
| **1차 완료 (FE)** | GET 목록/상세, POST/PATCH/DELETE 코어, URL 쿼리 연동 |
| **P0 갭** | 목록 필터 `lifecycleStatus`·`participantRecruitment`·운영기간 서버 필터 |
| **P1 갭** | `generalCommonInfo`·모집 nested 필드 PATCH 계약 |
| **2차 트랙** | 신청·진행 목록·navigation·posts/surveys 목록 FE 연동됨. 아래 P2 계약 갭 잔여 |

---

## P0 — 목록·필터

| 항목 | 현재 FE | 백엔드 요청 |
|------|---------|-------------|
| 프로그램명 검색 | `keyword` | 확인 완료 가정 |
| 4카드 status | `periodStatus` RECRUITING/IN_PROGRESS/COMPLETED | `lifecycleStatus` 세분 enum과 매핑표 |
| lifecycleStatus 필터 | 클라이언트 only | query param 추가 또는 `periodStatus` 확장 |
| targetLevel | 클라이언트 only | query param |
| participantRecruitment | 클라이언트 only | query param |
| operationStartDate/EndDate | 클라이언트 only | businessStartDate/EndDate range query |

---

## P1 — 상세 저장 필드

`ProgramCreateRequest` / `ProgramUpdateRequest`에 **없거나 CMS만 쓰는 필드**:

| CMS `Program` 필드 | 비고 |
|--------------------|------|
| `generalCommonInfo` | 교육 일정·급여·모집 설정 nested — FE는 `serviceDetailJson` v1으로 전송. **BE 영속·재조회 보장** 확인 필요 |
| `generalProgramEducationStructure` / `SessionRound` / `Audience` | FE JSON v1에 포함(2026-07-15). BE가 `serviceDetailJson`을 그대로 저장·반환해야 roundtrip 성립 |
| `sponsorId` | 공통정보 저장 시 1순위 `sponsorManagementIds[0]`과 동기화(FE). BE UUID/숫자 id 계약 확인 |
| `generalParticipantTypes` | 참여자 유형 플래그 |
| `generalSurveyMenuKeys` | 설문 메뉴 |
| `targetLevels[]` | 다중 대상 — API는 `targetLevel` 단일 |
| `instructorApplication*` / `volunteerApplication*` | 모집 기간·발표 nested |
| `resultAnnouncement*` | 결과 발표 |

**제안**: `serviceDetailJson`에 CMS nested JSON v1 스키마 합의, 또는 전용 nested DTO 확장.

---

## P1 — enum·상태 매핑

| CMS `lifecycleStatus` | API `periodStatus` (목록) |
|-----------------------|---------------------------|
| recruiting_students 등 | RECRUITING |
| education_in_progress | IN_PROGRESS |
| education_completed | COMPLETED |

상세 `lifecycleStatus` enum 값 전체 목록 백엔드 SSOT 필요.

---

## 2차 트랙 (진행 중)

| 도메인 | FE 상태 | 모듈 키 |
|--------|---------|---------|
| 기관/강사/개인/봉사자 신청 목록·결정 | hybrid | `applications` (+ `programs`) |
| 진행 참여자 목록 (개인/기관/강사/봉사) | hybrid | `programProgress` (+ `programs`) |
| navigation / posts·surveys **목록** | hybrid | `programs` |
| 면접 슬롯·배정 | POST만 OpenAPI — **목록 GET 없음**. FE는 배정 시 slot create+assign | `applications` |
| 출석 | schedule 단위 GET/PUT·bulk 있음. **프로그램 schedules 목록 GET 없음** → UI 세션 매핑 블로커 | `programProgress` |
| 과제(homework) | 회원 assignment-submissions만. **프로그램 단위 과제 세션 API 없음** | — |
| 담당자 CRUD | **OpenAPI path 없음** | — |
| 신청경로 CRUD | **OpenAPI path 없음** (`applicationPathId` 필드만 프로그램 PATCH) | — |

**활성화 예시**

```env
VITE_REAL_API_MODULES=...,programs,applications,programProgress
```

상세: [programs-api-migration-guide.md](./programs-api-migration-guide.md) 2차 섹션 · [programs-detail-api-conversion-status.md](./programs-detail-api-conversion-status.md)

---

## P2 — 상세 잔여 FE 블로커 (OpenAPI 2026-07-15 fetch 기준)

BE `/v3/api-docs` 스냅샷: `apps/cms/openapi/backend.openapi.json` (475 paths).

| 우선 | 요청 | 이유 |
|------|------|------|
| P2-1 | `GET /api/admin/programs/{programId}/interview-slots` (+ 기간 필터) | 면접 캘린더·가용 슬롯 표시. 현재 POST create만 있어 배정 시 ad-hoc 생성 |
| P2-2 | `GET /api/admin/programs/{programId}/schedules` (또는 execution schedules list) | 출석/과제 UI 세션 목록. 없으면 attendance GET/PUT을 CMS 화면에 묶기 어려움 |
| P2-3 | 프로그램 담당자 CRUD (`…/managers` 또는 동등) | `program-managers-tab` 전면 mock |
| P2-4 | 신청경로 리소스 CRUD 또는 프로그램 nested | path store mock. `applicationPathId` PATCH만으로는 메타 편집 불가 |
| P2-5 | 프로그램 단위 과제(세션·제출) admin API | 진행 과제 탭. 회원 `assignment-submissions`만으로는 부족 |

**이미 OpenAPI에 있어 FE hand-wrap 대상 (이번 전환)**

- `POST …/interview-slots`, `POST …/interview-assignments`, volunteer `…/interview-assignments`
- `POST/PATCH/DELETE …/posts`, comments, reactions
- `GET …/surveys/{templateVersionId}/responses|summary`
- `GET/PUT` attendance by scheduleId, `POST …/attendances:bulk-upsert`

---

## 스모크 테스트 (백엔드)

1. `GET /api/admin/programs?programType=GENERAL&periodStatus=RECRUITING`
2. `POST /api/admin/programs` — 최소 `title`, `sponsorId`, `type`, `lifecycleStatus`
3. `PATCH /api/admin/programs/{id}` — `title` 변경 후 GET 일치
4. `DELETE /api/admin/programs/{id}` — 목록에서 제거
5. (상세) `POST …/interview-slots` → `POST …/interview-assignments`
6. (상세) `GET …/surveys/{templateVersionId}/responses` · `summary`
7. (상세) `POST …/posts` · `GET …/posts`
