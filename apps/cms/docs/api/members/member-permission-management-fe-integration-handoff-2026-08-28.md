# CMS 회원 권한 관리 — BE P0 연동 handoff (2026-08-28, seed v1)

**목적:** `/admin/permission-requests` · `/admin/settings/permissions` mock → remote API 전환  
**BE 상태:** P0 API + seed + OpenAPI + §8 스모크 **완료**  
**최근 보강:** 상세 seed 고도화 — education/career/essays/settlement/social/terms 등 **"데이터 없음" 방지**  
**질문은 BE 응답과 mock diff가 안 맞을 때만.**

---

## 1. Remote 모듈 활성화

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_REAL_API_MODULES=...,instructorRoleRequests,adminApprovalRequests,adminPermissions
```

- API path 변경 없음 — 기존 Orval client 그대로
- OpenAPI SSOT: BE `openapi/backend.openapi.json` 또는 `GET /v3/api-docs`
- FE `members.openapi.json`에 P0 필드 없으면 BE spec 기준 Orval 재생성 필요

---

## 2. 대상 API (path 고정)

### 권한 승인 — 강사

| Method | Path |
|--------|------|
| GET | `/api/admin/instructor-role-requests` |
| GET | `/api/admin/instructor-role-requests/{requestId}` |
| POST | `…/{requestId}/approve` |
| POST | `…/{requestId}/reject` |
| POST | `…/bulk-approve` |
| POST | `…/bulk-reject` |
| POST | `…/{requestId}/reset-pending` |
| POST | `…/{requestId}/resend-notification` |
| POST | `…/{requestId}/privacy/unmask` |

목록 query (P0): `status`, `keyword`, `page`, `size`, `reason`(감사)

approve body:

```json
{ "reason": "...", "feeGrade": "GRADE_2", "activityType": "GENERAL", "jaGrade": "JA_A" }
```

`notifyTiming` / `scheduledNotificationAt` 미전송 OK (BE 기본 즉시 알림, P1 예정)

reject body:

```json
{ "reason": "...", "rejectReason": "서류 미비" }
```

reset-pending body (필수):

```json
{ "reason": "재검토 사유" }
```

bulk body:

```json
{ "ids": [172004, 172005, 172006], "reason": "...", "feeGrade": "GRADE_1", "activityType": "GENERAL" }
```

### 권한 승인 — 관리자

| Method | Path |
|--------|------|
| GET | `/api/admin/admin-approval-requests` |
| GET | `/api/admin/admin-approval-requests/{adminAccountId}` |
| PATCH | `/api/admin/admin-accounts/{adminId}/role` |
| POST | `…/{adminAccountId}/approve` |
| POST | `…/{adminAccountId}/reject` |
| POST | `…/bulk-approve` |
| POST | `…/bulk-reject` |
| POST | `…/{adminAccountId}/reset-pending` |
| POST | `…/{adminAccountId}/resend-notification` |

목록 query (P0): `keyword`, `status`(optional), `roleCode`, `page`, `size`

**관리자 단건 승인 순서:**

1. `PATCH /api/admin/admin-accounts/{id}/role` — `{ "roleCode": "MASTER" }`
2. `POST /api/admin/admin-approval-requests/{id}/approve` — `{ "reason": "..." }`

roleCode SSOT: `MASTER` · `PM` · `PARTNER` · `VIEWER`  
(FE 승인 모달: manager→MASTER, partner→PARTNER, viewer→VIEWER)

### 관리자 권한 설정 (변경 없음)

| Method | Path |
|--------|------|
| GET | `/api/admin/admin-roles` |
| GET | `/api/admin/admin-permissions` |
| GET/PUT | `/api/admin/admin-roles/{roleCode}/permissions` |

---

## 3. 상태 매핑 (FE mapper SSOT)

UI → API query status (UI enum 그대로 전송)

| UI | 강사 | 관리자 query → BE normalize |
|----|------|-----------------------------|
| 승인 대기 | PENDING | PENDING → PENDING_VERIFICATION |
| 승인 완료 | APPROVED | APPROVED → ACTIVE |
| 신청 반려 | REJECTED | REJECTED → REJECTED_VERIFICATION |

BE response alias (수신 시 normalize 권장)

| canonical | alias |
|-----------|-------|
| 강사 APPROVED | COMPLETED |
| 강사 REJECTED | REVOKED |
| 관리자 ACTIVE | APPROVED, VERIFIED |
| 관리자 REJECTED_VERIFICATION | REJECTED |

관리자 목록 `status` 미전달 → 3상태 혼합

---

## 4. 목록 비즈니스 규칙

### 강사 목록

- pure instructor only: 활성 `SCHOOL_TEACHER` role 보유 회원 신청 목록 제외
- `maskedName`, `maskedPhone`, `maskedEmail` — 서버 마스킹 (remote 시 FE 재마스킹 불필요)
- `requestedActivityType` — 응답 필드는 있으나 목록 컬럼/필터 미사용

### 관리자 목록

- 셀프 가입 승인 큐만 (`ADMIN_SELF_SIGNUP_PENDING_VERIFICATION` log EXISTS)
- MASTER 직접 등록 ACTIVE 제외 (`ADMIN_CREATED_ACTIVE` log EXISTS → 목록 ❌)

---

## 5. 상세 DTO P0 — structured profile 포함 (2026-08-28 seed 고도화)

BE local seed가 Portal 신청 스냅샷 수준의 구조화 profile 을 채웁니다.  
remote 연동 시 mock placeholder 대신 아래 필드가 실제 값으로 내려옵니다.

### GET `…/instructor-role-requests/{requestId}`

| 필드 | 비고 |
|------|------|
| name, gender, birthDate, phone, email | 스냅샷 + member 정합 |
| joinedAt | member.joined_at |
| notificationResentAt | nullable, resend 시 갱신 |
| socialAccounts[] | CONNECTED만 (GOOGLE/KAKAO/NAVER) |
| termsAgreements[].agreedAt | 4종 + agreedAt |
| rejectedReason | 반려 사유 |
| profile.education | highestSchoolType, college4 등 |
| profile.career | level, summaryYears, rows[] |
| profile.licenses, profile.awards, profile.jaKoreaActivities | full 케이스(172001) |
| profile.essays | freeWrite1~4 |
| profile.homeAddress | line, detail |
| settlement | bankName, accountHolder(마스킹), accountNumber(마스킹) |
| APPROVED 시 profile.defaultFeeGrade, profile.defaultJaGrade | instructor_profile merge |

### GET `…/admin-approval-requests/{adminAccountId}`

| 필드 | 비고 |
|------|------|
| gender, birthDate | seed 보강됨 |
| notificationResentAt | change_log 기반 |
| termsAgreements 4+MFA | SERVICE_TERMS, PRIVACY_COLLECTION, MFA_SETUP_CONSENT, MARKETING — 각 agreedAt |
| socialAccounts | CONNECTED provider |

관리자 상세는 `/api/admin/admin-accounts/{id}` 와 별도 — 승인 화면은 approval-requests 상세 사용.

---

## 6. Mutation 규칙 & 에러 코드

### reset-pending

- 강사 REJECTED/APPROVED → PENDING (APPROVED는 role/profile revoke)
- 관리자 REJECTED_VERIFICATION/ACTIVE → PENDING_VERIFICATION (role/MFA 유지)
- 이미 PENDING → 409 `INSTRUCTOR_ROLE_REQUEST_ALREADY_PENDING`

### resend-notification

- 강사 APPROVED만 → `notificationResentAt` 갱신
- 비-APPROVED → 409 `INSTRUCTOR_ROLE_REQUEST_NOTIFICATION_RESEND_REQUIRES_APPROVED`

### bulk

- 비-PENDING id → 409 (`INSTRUCTOR_ROLE_REQUEST_NOT_PENDING` / `ADMIN_VERIFICATION_STATE_NOT_PENDING`)
- HTTP 200 + `BulkActionResponse.failures[]` — FE: 첫 `failure.message` 노출

---

## 7. Local BE seed (검증용 ID)

조건: `SPRING_PROFILES_ACTIVE=local` + `JA_LOCAL_DEMO_ENABLED=true` + bootRun  
라벨: `member-permission-management-v1-2026-08`

### 강사 showcase

| caseId | requestId / memberId | 상세 seed tier | social | 목록 |
|--------|----------------------|----------------|--------|------|
| IR-PENDING-PORTAL-FULL | 172001 / 172101 (최지원) | full (education/career/licenses/awards/essays/JA활동) | KAKAO+NAVER | ✅ |
| IR-APPROVED-RESEND | 172002 / 172102 | full + GRADE_2/JA_A | GOOGLE | ✅ |
| IR-REJECTED-RESET | 172003 / 172103 | GEMINI full | — | ✅ |
| IR-BULK-PENDING | 172004–006 | medium | — | ✅ |
| IR-EXCLUDED-DUAL | 172007 / 172107 | medium | — | ❌ |
| Distribution | 172008–012 | medium (상태별) | 172009 GOOGLE, 172012 NAVER | ✅ |

### 관리자 showcase

| caseId | adminId | 보강 | 목록 |
|--------|---------|------|------|
| AA-PENDING-MFA-TERMS | 172201 (김승인대기) | terms 4+MFA, gender/birthDate, GOOGLE+KAKAO | ✅ |
| AA-APPROVED-MASTER | 172202 | terms, gender/birthDate, NAVER | ✅ |
| AA-REJECTED | 172203 | terms, gender/birthDate | ✅ |
| AA-BULK-PENDING | 172204–205 | terms, gender/birthDate | ✅ |
| Distribution | 172206–210 | terms, gender/birthDate, 짝수 index social | ✅ |
| AA-PROVISIONED-NEG | 172231 | — | ❌ |

로그인: `admin1@jakorea.org` / `admin1234!` / MFA `000000`  
MFA verify body: `{ "challengeUuid": "...", "verificationCode": "000000" }` ← code 아님

---

## 8. FE 연동 체크리스트

- [x] Orval: BE `/v3/api-docs` → `members.openapi.json` 재생성
- [x] Remote flag 3모듈 활성화 — `.env` / `.env.local.example`
- [x] 상태 mapper: query UI enum, response alias normalize
- [x] 강사 목록: remote 시 마스킹 필드 그대로 표시
- [x] 강사 상세: `profile.education/career/essays` 등 structured 필드 바인딩 — `map-instructor-role-request-detail-to-user` + `userToApplicantInstructorRow`
- [x] 관리자 상세: gender/birthDate/socialAccounts 바인딩 — `map-admin-account-detail-to-user`
- [x] 관리자 승인: PATCH role → POST approve 순서
- [x] reset-pending `{ reason }` 필수
- [x] bulk failure → `failures[0].message`
- [x] resend APPROVED만 (409 처리)
- [x] §9 GET structured profile 스모크 — local BE 2026-08-28

---

## 9. FE 스모크 시나리오

1. `GET /api/admin/instructor-role-requests?status=PENDING` → 172001 포함, 172007 제외
2. `GET /api/admin/instructor-role-requests/172001`
   - `profile.education.highestSchoolType=college4`
   - `profile.career.level=experienced`
   - `profile.essays.freeWrite1` 존재
   - `socialAccounts` 2건, `termsAgreements` 4건
3. `GET /api/admin/instructor-role-requests/172002` → `profile.defaultFeeGrade=GRADE_2`, `notificationResentAt` 존재
4. `GET /api/admin/admin-approval-requests/172201` → gender, birthDate, terms 4+MFA, socialAccounts 2건
5. `GET /api/admin/admin-approval-requests` → 172201–205, 172206–210 포함, 172231 제외
6. `GET /api/admin/admin-roles` → MASTER/PM/PARTNER/VIEWER

---

## 10. P1 — BE 미구현 (FE client/mock 필터 유지)

| 항목 | FE 영향 |
|------|---------|
| requestedAtFrom/To, memberType (강사 목록) | 클라 필터 유지 |
| 관리자 신청일 range | 클라 필터 유지 |
| approve scheduledNotificationAt | UI만, 미전송 |
| 관리자 코멘트 read-only, 담당 프로그램 수 | P2 |
| 엑셀 다운로드 API | FE export 유지 |

---

## 11. BE 참조 (JABACK)

- Spec: `docs/frontend/member-permission-management-seed-v1.spec.json`
- Handoff: `docs/frontend/member-permission-management-backend-seed-handoff-2026-08-28.md`
- Fixture: `LocalDemoMemberPermissionSeedFixtures.java`
- OpenAPI: `openapi/backend.openapi.json`

FE mirror 권장:

- `apps/cms/docs/api/members/member-permission-management-seed-v1.spec.json`
- `apps/cms/docs/api/members/member-permission-management-backend-seed-handoff-2026-08-28.md`

---

**Last updated:** 2026-08-28 (seed v1 structured profile)
