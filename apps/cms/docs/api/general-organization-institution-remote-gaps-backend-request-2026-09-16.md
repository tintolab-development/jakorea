# 일반 프로그램 신청·기관 — remote 보완 · 백엔드 요청

**작성일:** 2026-09-16  
**OpenAPI 재검토:** 2026-09-16 (v9 · live = local)  
**우선순위:** P1  
**대상:** 일반 프로그램 **기관 신청/참여 상세**(합반·교재) · **봉사자 신청 심사**(1차 서류 · 합격자 · 2차 면접)  
**SSOT:** 일반 프로그램(기관·봉사자) FE 수정·미연동 갭은 **본 문서에만** 누적합니다.

## FE 원칙 (2026-09-16)

- **연동 가능한 API는 remote 호출** — 성공 시 목록 invalidate·재조회.
- **API가 없거나 remote 비활성** → **mock/로컬 patch 금지**. `program-api-unavailable` 모달(`useNotifyProgramApiUnavailableOnce` / `notifyProgramApiUnavailable`)로 1회 안내.
- 승인 취소·반려 취소·상세 PATCH·담당 교사·알림 재발송 등 **계약 부재 액션**도 동일 — 로컬 상태 변경 없음.

---

## A. 기관 (신청 · 참여)

### A-1) FE 연동 현황 (2026-09-16 OpenAPI 재검토 후)

| 화면 | 기능 | API | 연동 |
|------|------|-----|------|
| 기관 신청 목록 | 목록 | `GET …/programs/{programId}/organization-applications` | ✅ |
| 기관 신청 목록/상세 | 승인·반려 | `POST …/organization-applications/{id}/approve\|reject` | ✅ |
| 기관 신청 목록 | 일괄 승인·반려 (≥2) | `POST …/organization-applications/bulk-approve\|bulk-reject` | ✅ |
| 기관 신청 상세 | 승인 취소 · 반려 취소 | `POST …/cancel-approval\|cancel-rejection` (`ApplicationDecisionCancelRequest.reason`) | ✅ |
| 기관 신청 상세 | 알림 재발송 | — | ⏸ **보류** (BE 요청 제외 · FE unavailable 유지) |
| 기관 신청 상세 | 상세 GET / 필드 PATCH | — | ❌ unavailable (합반 제외) |
| 기관 신청/참여 상세 | 합반 | `GET/POST/DELETE …/organization-merge-groups` | ✅ |
| 합반 | 담당 교사 `leadTeacherMemberId` create/update | — (응답에만 필드) | ❌ unavailable |
| 참여 기관 | participants ORGANIZATION enrich | 목록만 · `availableActions` 추가됨 | ⚠️ 학년·교재·지역 부족 |

### A-2) LNB 기준 remote 보완 요약

#### 참여자 신청 목록 > 기관 신청 > 기관 신청 상세

- 기관 신청 상세 GET 부재 — 합반 외 필드(주소·교재·담당 교사 등) 수정 API 없음 → FE unavailable
- `organization-applications` 목록에 **학년(`educationGrade`)**·지역·합반 파트너 enrich 없음 → 동일 기관 타 학년 lookup FE가 목록 50건 한정
- 합반 저장 후 **파트너 학년 신청 건 교재명 동기화** — merge-groups만으로는 FE가 파트너 상세 갱신 불가
- **`CreateMergeRequest`에 `leadTeacherMemberId` 누락** — 응답 `MergeGroupResponse.leadTeacherMemberId`만 존재, create/update 계약 없음
- unmask/privacy · admin comment API 부재
- 알림 재발송 — **보류** (강사·개인과 동일 `…/notifications/resend` 패턴 후순위)

#### 프로그램 진행 현황 > 참여 기관 > 참여 기관 상세 > 신청 정보

- `participants`(ORGANIZATION) 목록 **학년·반·인원·교재·지역** 필드 부족 — FE adapter 빈값 (`availableActions`만 OpenAPI 추가)
- 참여 기관 상세 GET 부재 — 합반 외 신청 정보 필드 PATCH API 없음 → FE unavailable
- 합반 **멤버(비 lead) 행**에서 취소·변경 API — DELETE는 lead 그룹 기준
- 교재 선택 저장 — participant/org-application textbook PATCH와 merge-groups 연동 계약 없음

### A-3) 이미 구현·FE 연동한 API (기관)

| Method | Path | FE 용도 |
|--------|------|---------|
| GET | `/api/admin/programs/{programId}/organization-applications` | 기관 신청 목록 |
| POST | `/api/admin/organization-applications/{applicationId}/approve` | 단건 승인 |
| POST | `/api/admin/organization-applications/{applicationId}/reject` | 단건 반려 |
| POST | `/api/admin/organization-applications/bulk-approve` | 일괄 승인 (≥2) |
| POST | `/api/admin/organization-applications/bulk-reject` | 일괄 반려 (≥2) |
| POST | `/api/admin/organization-applications/{applicationId}/cancel-approval` | 승인 취소 |
| POST | `/api/admin/organization-applications/{applicationId}/cancel-rejection` | 반려 취소 |
| GET | `/api/admin/programs/{programId}/organization-merge-groups` | 합반 hydrate |
| POST | `/api/admin/programs/{programId}/organization-merge-groups` | 합반 신청 |
| DELETE | `/api/admin/programs/{programId}/organization-merge-groups/{mergeGroupId}` | 합반 취소 |

**CreateMergeRequest:** `leadApplicationId`, `members[{ organizationApplicationId, grade }]`, `changeReason?`  
**MergeGroupResponse:** `leadTeacherMemberId` (read-only — create body 미포함)

### A-4) participants(ORGANIZATION) 목록 enrich — P1

`GET /api/admin/programs/{programId}/participants?participantType=ORGANIZATION` item enrich:

| 필드 | 용도 |
|------|------|
| `educationGrade` (또는 `grade`) | 합반 partner select · POST `members[].grade` |
| `region`, `classCount`, `studentCount` | 목록·상세 |
| `textbookId`, `textbookName`, `textbookStatus` | 신청 정보 탭 |
| `organizationApplicationId` | merge POST·강사 배정 스코프 |
| `mergeGroupId`, `combinedClassYn` (optional) | 목록 배지 |

### A-5) organization-applications 목록 enrich — P1

- `educationGrade` / `grade`, `region`, (optional) `mergeGroupId`, `combinedClassPartnerGrades[]`

### A-6) 기관 신청·참여 상세 GET + PATCH — P1

- `GET/PATCH /api/admin/organization-applications/{applicationId}`
- (참여) participant enrich 또는 전용 GET/PATCH
- (권장) `CreateMergeRequest.leadTeacherMemberId` 또는 합반 담당 교사 PATCH
- ~~(권장) 알림 재발송 `POST …/notifications/resend`~~ — **보류** (이번 BE 요청 범위 제외)

### A-7) 합반 저장 후 교재·파트너 동기화 · 멤버 해제 · 신청/진행 단계 — P2

- merge POST 후 member 교재·합반 snapshot propagate
- DELETE idempotency / member withdraw API
- 신청 단계 merge 허용 여부 → `availableActions` 또는 phase flag

### A-8) 기관 FE 검증 체크리스트

- [ ] remote 프로그램 — 목록 승인/반려·일괄·승인취소·반려취소 후 목록 상태 일치
- [ ] remote 비활성 — 의사결정·상세 수정 시 unavailable · mock 변경 없음
- [ ] 동일 기관 2학년+ partner select · GET/POST/DELETE merge-groups
- [ ] 합반 외 필드 저장 · 담당 교사 → unavailable
- [ ] 알림 재발송 — 보류 (클릭 시 unavailable 유지, BE 미요청)
- [ ] participants `organizationApplicationId` = 강사 배정 ID

---

## B. 봉사자 신청 심사

### B-1) LNB 기준 remote 보완 요약

#### 봉사자 신청 목록 > 1차 서류 심사 대상자

- 목록 페이지네이션·서버 필터(`documentStatus`) — FE `page=0, size=50` + 클라이언트 필터
- 목록 enrich: 담당자 A/B 서류평가·에세이·연락처 등 부족

#### … > 1차 서류 심사 대상자 상세

- `GET …/volunteer-applications/{applicationId}` **부재** — 목록 행 pass-through
- 승인 취소 / 반려 취소 API **부재** → FE mock patch **제거**, unavailable 안내
- 담당자 A/B 서류평가 저장 API **부재**
- 상세 본문(에세이·면접 가능일·PII) 계약 부족 · unmask 후 row merge 미구현
- `document-result`에 `notifyTiming` 미지원

#### 봉사자 신청 목록 > 1차 서류 합격자

- `interviewAvailability` · `assignedInterview*` · `interviewAssignmentId` 목록 enrich 부족
- 서버 필터·페이지네이션

#### … > 1차 서류 합격자 상세

- 상세 GET 부재 · give-up `ApplicationGiveUpRequest.reason` — **2026-09-16 FE reason 전송 연동**

#### 봉사자 신청 목록 > 2차 면접 대상자 / 상세

- 목록 enrich·페이지네이션 (합격자와 동일)
- 면접 평가: `interviewAssignmentId` 없으면 저장 불가
- `final-result` `notifyTiming` 미지원 · A/B 점수 분리 필드 부재

### B-2) FE 연동 현황 (2026-09-16)

| 화면 | 기능 | API | 연동 |
|------|------|-----|------|
| 1차 서류 심사 | 목록 | `GET …/programs/{programId}/volunteer-applications` | ✅ (50건 + FE 필터) |
| 1차 서류 심사 | 선택 승인/반려 | `document-result` / `document-results/bulk` | ✅ |
| 1차 서류 심사 상세 | 서류 승인/반려 | `document-result` | ✅ |
| 1차 서류 심사 상세 | 승인·반려 취소 | — | ❌ unavailable (mock 제거) |
| 1차 서류 심사 상세 | 담당자 A/B 평가 | — | ❌ unavailable |
| 1차 서류 심사 상세 | 개인정보 | member unmask | ⚠️ 감사만 · 표시 enrich 필요 |
| 1차 서류 합격자 | 목록 · 면접 배정/재배정 | 목록 + `interview-slots` + `POST …/interview-assignments` | ✅ |
| 1차 서류 합격자 상세 | 활동 포기 | `POST …/give-up` + `reason` | ✅ (reason 연동) |
| 2차 면접 | 목록 · 선택 합격/불합격 | 목록 + `final-result`(bulk) | ✅ |
| 2차 면접 | 면접일 재배정 | `interview-assignments` | ✅ |
| 2차 면접 상세 | 면접 평가 | `POST …/evaluations` | ⚠️ `interviewAssignmentId` 필수 |
| 공통 | remote 비활성·API 부재 | — | `program-api-unavailable` |

**OpenAPI `VolunteerApplicationListItemResponse`:** 상태·`memberId`·`memberName` 위주 — enrich 필드 codegen 미반영.

### B-3) 신규·보완 API 요청

#### 상세 GET

`GET /api/admin/volunteer-applications/{applicationId}` — 에세이 · 면접 가능일 · 담당자 평가 · `interviewAssignmentId` · `assignedInterview*` · `availableActions`

#### 목록 enrich · 필터

`GET …/volunteer-applications` — `page`/`size`/`totalElements`, `documentStatus` 등 서버 필터, `interviewAvailability`, `interviewAssignmentId`, `assignedInterview*`, (선택) 담당자 A/B 점수·서류평가

#### 승인 취소 · 반려 취소 · 담당자 서류평가

| 동작 | 제안 path |
|------|-----------|
| 승인 취소 | `POST …/volunteer-applications/{id}/cancel-approval` |
| 반려 취소 | `POST …/volunteer-applications/{id}/cancel-rejection` |
| 담당자 서류평가 | `PUT/PATCH …/volunteer-applications/{id}/document-evaluations/{managerSlot}` |

#### 면접 평가 · 알림

- 목록/상세 `interviewAssignmentId` 필수
- (권장) `managerAScore` / `managerBScore` 또는 조회 API
- `document-result` / `final-result` / 면접 배정에 `notifyTiming` (또는 notification resend)

### B-4) 봉사자 FE 검증 체크리스트

- [ ] remote 프로그램 — 목록 API 로드 · mock 빈 화면 없음
- [ ] remote 비활성/seed — unavailable 모달 1회 · 로컬 patch 없음
- [ ] 서류 승인/반려 후 목록 상태 일치
- [ ] 승인·반려 취소 클릭 → unavailable (상태 unchanged)
- [ ] give-up reason body 전송
- [ ] 면접 배정/재배정 후 invalidate
- [ ] `interviewAssignmentId` 있을 때 면접 평가 저장

**Last updated:** 2026-09-16 (기관 알림 재발송 BE 요청 **보류**)
