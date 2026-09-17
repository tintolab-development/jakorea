# 일반 프로그램(개인) 진행현황 · 설문 · 신청 — remote 보완 · 백엔드 요청

**작성일:** 2026-09-17  
**우선순위:** P0 / P1  
**대상:** 일반 프로그램 **개인** 진행현황(참여자·봉사자 상세) · 설문 관리 3탭 · 참여자 신청 더블체크  
**교차:** 기관 공통 갭은 [general-organization-institution-remote-gaps-backend-request-2026-09-16.md](./general-organization-institution-remote-gaps-backend-request-2026-09-16.md)  
**신청 심사(목록) 갭:** [general-participant-application-screening-remote-gaps-backend-request-2026-09-16.md](./general-participant-application-screening-remote-gaps-backend-request-2026-09-16.md) — 복제하지 않음. `GET individual-applications/{id}` · `POST …/cancel-rejection` 는 **FE 완료**.

## FE 원칙

- **연동 가능한 API는 remote 호출** — 성공 시 목록/상세 invalidate. 로컬 patch 금지.
- **API가 없거나 remote 비활성** → mock 금지. `program-api-unavailable` 안내.
- 기관 문서에 이미 적힌 강사 배정·정산·기관 출석은 **재요청하지 않음**.

---

## 0. 현황 요약 (2026-09-17)

| 영역 | 기능 | 현재 API | FE | 서버 보완 |
|------|------|----------|-----|-----------|
| 참여자 목록 | participants INDIVIDUAL | 부분 | ✅ `id=participantId`, `individualApplicationId=sourceApplicationId` | enrich (아래 A) |
| 참여자 상세 | 신청 GET/PATCH | ✅ | ✅ applicationId | 목록 `sourceApplicationId` 항상 포함 |
| 참여자·봉사 상세 | 활동 포기 | ✅ give-up | ✅ participantId + optional `stopScheduleId` | `stopScheduleId` 수용 (기관 문서 A/G와 동일) |
| 참여자 상세 | 출석 정정 | ✅ schedule attendances / bulk-upsert | ✅ 1인 스코프 | `sessions[].scheduleId` |
| 참여자 상세 | 과제 팀 변경 | ✅ submission-team GET/PUT | ✅ | 프로그램 스코프 제출 파일 ZIP |
| 참여자 상세 | 제출물 보기·일괄 다운로드 | 회원 `assignment-submissions`만 | coming soon | program+participant 파일 계약 |
| 개인 봉사 상세 | 봉사 배정 | ✅ education-scope GET/PUT | ✅ GENERAL_INDIVIDUAL VOLUNTEER | 기관(학교) 배정은 기관 문서 |
| 설문 3탭 | 등록 | ✅ form-bindings + template copy | ✅ `newTemplateId` | — |
| 설문 3탭 | 공유 | ✅ share-link POST | ✅ clipboard `formPath` | — |
| 설문 3탭 | 기간 PATCH | ✅ form-bindings PATCH | ❌ UI 없음 (이번 범위 제외) | enum·필드 SSOT 문서화 |
| 강의평가 | 응답 수정 | submit만 | ❌ | update/delete |
| 신청 상세 | 반려 취소 | ✅ cancel-rejection | ✅ | — |
| 프로그램 LNB 과제 | 회차별 전체 제출 | — | unavailable | 신규 계약 |

---

## A. participants(INDIVIDUAL) enrich — P0

`GET …/programs/{programId}/participants?participantType=INDIVIDUAL`

| 필드 | UI 용도 | 비고 |
|------|---------|------|
| `participantId` | 목록 rowKey · give-up · 출석 | ✅ |
| `sourceApplicationId` | 신청 GET/PATCH PK | **P0** — 없으면 신청 탭 저장 unavailable |
| `sessions[].scheduleId` | 출석 bulk-upsert · 포기 중단일 | **P0** |
| `memberId` | PII unmask | |
| `grade`, `organizationName`, 주소/PII | 목록·상세 | 없으면 빈 칸 |
| 출석 요약 | 참여자 상세 출석 탭 | 선택 |

---

## B. give-up `stopScheduleId` — P0 (기관 공통)

`POST /api/admin/programs/{programId}/participants/{participantId}/give-up`

```json
{ "reason": "활동 포기", "stopScheduleId": 12345 }
```

개인 **참여자·봉사자** 상세에도 동일. 기관 문서 §B-5 / §G-8과 교차.

---

## C. 프로그램 LNB 과제 관리 — P1

회원 `GET /api/admin/users/{memberId}/applications/{applicationId}/assignment-submissions` 는 **1인 스코프**.

프로그램 진행현황 과제 LNB(회차별 전체 제출 목록 · 파일 ZIP)용 계약이 없다 → FE unavailable.

요청 예:

```http
GET /api/admin/programs/{programId}/assignment-submissions?scheduleId=
GET /api/admin/programs/{programId}/assignment-submissions/download
```

---

## D. 제출물 보기 coming soon — P1

참여자 상세 과제 탭 「제출물 보기」「과제 일괄 다운로드」.

- 회원 assignment-submissions 를 program+participant 로 쓸 수 있는지 **계약 확인**.
- 불가하면 program-scoped 파일 API 보강.

---

## E. 강의평가 응답 수정 — P1

`POST …/form-responses/submit` 만 있음. 관리자 강의평가 **수정/삭제** API 없음. UI 삭제 버튼도 없음(의도적 비연동).

요청: `PATCH/DELETE /api/admin/form-responses/{formResponseId}` (권한 FORM_RESPONSE_WRITE).

---

## F. 설문 binding 기간 PATCH — P2 (문서만)

OpenAPI `PATCH …/form-bindings/{bindingId}` 존재. FE 기간 변경 UI 없음 → **이번 미구현**.

UI 추가 전 `submissionStartAt` / `submissionEndAt` / `active` enum SSOT 확정.

---

## G. 이미 연동한 API (이번 FE)

| 화면 | API |
|------|-----|
| 참여자 상세 신청 | `GET/PATCH …/individual-applications/{applicationId}` (`sourceApplicationId`) |
| 참여자·봉사 활동 포기 | `POST …/participants/{id}/give-up` |
| 참여자 출석 | `GET` schedule attendances + `PUT …/attendances` bulk-upsert |
| 과제 팀 | `GET/PUT …/participants/{id}/submission-team` · `GET/POST …/submission-teams` |
| 개인 봉사 배정 | `GET/PUT …/participants/{id}/education-scope` |
| 설문 등록 | template copy + `POST …/form-bindings` (`newTemplateId`) |
| 설문 공유 | `POST …/surveys/bindings/{bindingId}/share-link` |
| 신청 반려 취소 | `POST …/individual-applications/{id}/cancel-rejection` |

---

## H. QA 체크리스트

- [ ] 개인 참여자 상세: 신청 저장·코멘트가 applicationId PATCH (participantId 아님)
- [ ] `sourceApplicationId` 없으면 저장 unavailable · 로컬 성공 토스트 없음
- [ ] 활동 포기: participants invalidate · 기관 출석/강사 배정 회귀 없음
- [ ] 출석 정정: scheduleId 있는 회차만 저장 · 없으면 unavailable
- [ ] 개인 봉사 배정: PUT 실패 시 테이블 불변 · empty list = 배정 없음
- [ ] 설문 등록 binding `templateId` = 복제본
- [ ] 공유 클립보드 URL = share-link `formPath` (하드코딩 Platform path 아님)
- [ ] 신청 상세 반려 취소 POST + list/detail invalidate
- [ ] 개인 프로그램에서 강사/봉사 목록이 school-list(기관 mock)를 호출하지 않음

**Last updated:** 2026-09-17
