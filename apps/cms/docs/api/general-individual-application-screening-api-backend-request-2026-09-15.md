# BE → FE 핸드오프 (2026-09-15) — 단독 문서

**작성일:** 2026-09-15  
**문서 성격:** BE 구현 완료 후 FE 배선 기준서 (이 파일만으로 검수 가능)  
**상태:** BE P0+P1 **완료** · FE remote 배선 **완료** (Orval codegen은 OpenAPI sync 후 확장 타입 교체 권장)

| # | 우선순위 | API | 상태 |
|---|----------|-----|------|
| **A** | P0 | individual document-result / final-result / interview-assignments | BE✅ FE✅ |
| **B** | P1 | list assignedInterview* enrich | BE✅ FE✅ |
| **C** | P2 | 프로그램 단위 과제 admin | 미구현 (mock 유지) |

---

## BE 수락 요약 (2026-09-15)

### 1) 서류 결과
`POST /api/admin/individual-applications/{applicationId}/document-result`  
Permission: `APPLICATION_WRITE`  
body: `{ result: "PASS"|"FAIL", reason? }` — `DocumentResultRequest` (DOCUMENT_PASSED / REJECTED alias 허용)  
Response: `ApplicationDecisionResponse`

### 2) 면접 배정 — **옵션 B only (canonical)**
⚠️ `POST /api/admin/applications/individuals/{id}/interview-assignments` **미구현(legacy 금지)**  
✅ `POST /api/admin/interview-assignments`  
`{ individualApplicationId, interviewSlotId }` ↔ `{ volunteerApplicationId, interviewSlotId }` 상호 배타  
슬롯: 기존 `POST /api/admin/programs/{programId}/interview-slots`  
Response에 `individualApplicationId` 포함. 평가: 기존 `POST …/interview-assignments/{id}/evaluations`

### 3) 최종 결과
`POST /api/admin/individual-applications/{applicationId}/final-result`  
`VolunteerFinalResultRequest` 재사용 (`PASS` / `FAIL` / `RESERVE`+rank 1~4)  
면접 OFF 단순 승인: 기존 `approve` / `reject` / `give-up` 유지

### 4) 목록 enrich (P1)
`GET …/individual-applications`에  
`assignedInterviewSlotId` / `assignedInterviewStartAt` / `assignedInterviewEndAt`  
`availableActions` 봉사자 screening 패리티

---

## FE 배선 (완료)

| 영역 | 경로 |
|------|------|
| 확장 타입 | `apps/cms/src/features/program/general/api/individual-application-screening-api-types.ts` |
| API client | `…/api/applications-api-client.ts` |
| service | `…/api/admin-applications-service.ts` (`assignGeneralIndividualInterview` 등) |
| remote hook | `…/hooks/use-general-volunteer-applications-remote.ts` |
| 신청 목록 doc1 | `…/applicant-list/use-applicants-detail.ts` (doc1 → document-result) |
| 서류합격 | `…/volunteer-screening/use-doc-passed.ts` |
| 2차면접 | `…/volunteer-screening/use-interview2.ts` (final-result via remote hook) |
| adapter | `…/adapters/general-applications-adapters.ts` |

---

## 수락 기준 (검증 체크리스트)

- [ ] 개인·면접 ON 프로그램에서 서류 PASS → 목록 documentStatus 반영, 서류합격 탭 노출
- [ ] 동일 신청 면접 슬롯 배정(`individualApplicationId`) → interviewStatus=ASSIGNED
- [ ] 목록에 assignedInterviewStartAt/EndAt → UI 일시 표시
- [ ] 최종 PASS / FAIL / RESERVE(rank=2) → finalResultStatus·reserveRank 반영
- [ ] give-up 기존 API와 충돌 없음
- [ ] 봉사자 interview-assignments(`volunteerApplicationId`) 회귀 없음
- [ ] 시드: 「[개인] 커리큘럼형 복수회차 테스트 프로그램」(`168006`) — 전 카테고리·회원 매핑: [general-primary-168006-nested-seed-backend-request-2026-09-15.md](./general-primary-168006-nested-seed-backend-request-2026-09-15.md)

---

## 비범위

- P2 프로그램 단위 과제 admin API (진행「과제」탭 mock 유지)
- 개인 상세(에세이·평가 캘린더) 추가 enrich
- Platform(홈) 신청 플로우
