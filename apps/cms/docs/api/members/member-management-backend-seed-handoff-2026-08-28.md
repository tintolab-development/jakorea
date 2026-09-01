# Cursor prompt — CMS 회원 관리 DB seed P0 (mock → API parity)

**이 파일 전체를 백엔드(JABACK) Cursor에 붙여넣어 실행하라.**  
질문은 엔티티·FK를 찾아도 판단이 안 될 때만 하라. 프론트 레포는 없다.

프론트 CMS **회원 관리**(목록·상세·권한승인·권한설정) mock → remote 연동을 위해 **local/staging DB seed를 FE mock·Notion 기획·OpenAPI 계약에 맞춰라.**  
기존 local demo seed가 “목록만 보이는” 수준이면 필터·마스킹·structured profile·inclusion/exclusion 규칙이 깨진다.

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-28 |
| **화면** | CMS LNB `회원 관리` — 전체/학교/강사/관리자 목록, 권한 승인, 관리자 권한 설정 |
| **모듈 플래그(FE)** | `VITE_REAL_API_MODULES=...,members,instructorRoleRequests,adminApprovalRequests,adminPermissions` |
| **시드 라벨** | `member-management-v1-2026-08` |
| **기계 스펙 JSON** | `member-management-seed-v1.spec.json` (FE mirror, zip 패키징 포함) |
| **권한승인 subset** | `member-permission-management-seed-v1.spec.json` (동일 ID 172xxx) |
| **OpenAPI SSOT** | `openapi/backend.openapi.json` 또는 `GET /v3/api-docs` |
| **FE mock SSOT** | `users.ts` + `member-management-seed-catalog.ts` (numeric id 매핑) |

---

## Goal

1. **Flyway/local demo fixture**가 아래 showcase caseId·numeric id·비즈니스 규칙을 만족한다.
2. **OpenAPI** path/query/body/response enum이 FE mapper와 일치한다 (P0 필드 누락 없음).
3. **목록 inclusion/exclusion** — 강사 권한승인 pure instructor only, 관리자 provisioned ACTIVE 제외, 학교 삭제 제약.
4. **상세 structured profile** — 강사 권한승인 detail에 education/career/essays/settlement/social/terms **"데이터 없음" 방지**.
5. **Mutation** — reset-pending `{ reason }` 필수, bulk non-PENDING → 409 + failures[], resend APPROVED only.

완료 조건 (관리자 JWT + **갱신된** local seed, `JA_LOCAL_DEMO_ENABLED=true`):

- `GET /api/admin/members/all` — 6종 회원유형(개인/교사/강사/겸직/권한박탈/관리자) showcase 존재
- `GET /api/admin/organizations/schools` — 171501(교사 3명), 171503(교사 0·삭제 가능)
- `POST …/organizations/schools/bulk-delete` — 171501 포함 시 **409** (교사 존재)
- `GET /api/admin/instructor-role-requests?status=PENDING` — **172001 포함, 172007 제외**
- `GET /api/admin/instructor-role-requests/172001` — `profile.education.highestSchoolType=college4`, essays/social/terms 4건
- `GET /api/admin/admin-approval-requests` — 172201–210 포함, **172231 제외**
- bulk/reset/resend/409 시나리오 — §9 smoke 통과

---

## Out of scope / 금지

- API path 변경 금지 — FE Orval client 고정 path 유지.
- 강사 권한승인 목록에 **school_teacher-only / instructor_dual** 신청 노출 금지.
- 관리자 승인 목록에 **MASTER 직접 등록 ACTIVE**(provisioned) 노출 금지.
- 강사 목록 remote 시 **FE 이중 마스킹** 유발 — list item은 `maskedName/Phone/Email` 서버 마스킹.
- `requestedActivityType` — 응답 필드는 유지, **목록 컬럼/필터 미사용**(Notion strike-through).
- revoke / evaluation-grade path **삭제 금지** — OpenAPI에 **등록**만 추가.

---

## 1. ID 범위 (Flyway)

| 리소스 | ID 범위 | 비고 |
|--------|---------|------|
| Member (directory) | 171001–171400 | individual/school_teacher/instructor/dual/revoked |
| School organization | 171501–171550 | institutions tab |
| Admin account (directory) | 171601–171650 | admins tab |
| InstructorRoleRequest | 172001–172040 | 권한승인 강사 |
| Instructor member (linked) | 172101–172140 | request memberId |
| Admin approval (self-signup) | 172201–172230 | 권한승인 관리자 |
| Provisioned admin (exclude) | 172231–172235 | 목록 ❌ |

---

## 2. 비즈니스 규칙 (Notion ↔ FE SSOT)

### 2.1 회원 목록 (`GET /api/admin/members/all`)

| 회원 유형 UI | roles[] / accountType |
|-------------|------------------------|
| 개인 | INDIVIDUAL |
| 학교(교사) | SCHOOL_TEACHER |
| 강사 | INSTRUCTOR (pure) |
| 학교+강사 겸직 | SCHOOL_TEACHER + INSTRUCTOR |
| 강사(권한박탈) | INSTRUCTOR_REVOKED |
| 관리자 | ADMIN + accountType=ADMIN_ACCOUNT |

가입 유형: SELF vs ADMIN_REGISTERED.  
필터 P0: `keyword`, `rolesExactAnyOf`, `createdAtFrom/To`.

### 2.2 학교 목록 (`GET /api/admin/organizations/schools`)

| caseId | orgId | 교사 수 | 삭제 |
|--------|-------|---------|------|
| MD-SCHOOL-SEOUL | 171501 | 3 | ❌ 409 |
| MD-SCHOOL-JINWOL | 171502 | 1 | ❌ |
| MD-SCHOOL-NO-TEACHERS | 171503 | 0 | ✅ |

### 2.3 강사 권한승인 목록

- **포함:** pure instructor 신청만
- **제외:** 172007 (IR-EXCLUDED-DUAL) — active SCHOOL_TEACHER + instructor 겸직
- **마스킹:** list `maskedName`, `maskedPhone`, `maskedEmail`
- **query P0:** `status`, `keyword`, `page`, `size`
- **query P1 (미구현 OK):** `requestedAtFrom/To`, `memberType`

### 2.4 관리자 권한승인 목록

- **포함:** self-signup (`ADMIN_SELF_SIGNUP_PENDING_VERIFICATION` log)
- **제외:** 172231 — `ADMIN_CREATED_ACTIVE` log, ACTIVE provisioned
- **query P0:** `keyword`, `status`(optional), `roleCode`, `page`, `size`

### 2.5 상태 매핑

| UI | 강사 API | 관리자 API (query normalize) |
|----|----------|------------------------------|
| PENDING | PENDING | PENDING → PENDING_VERIFICATION |
| APPROVED | APPROVED (+ COMPLETED alias) | APPROVED → ACTIVE |
| REJECTED | REJECTED (+ REVOKED alias) | REJECTED → REJECTED_VERIFICATION |

---

## 3. Showcase cases (필수 seed)

### 강사 권한승인

| caseId | requestId / memberId | status | 목록 | 특이사항 |
|--------|----------------------|--------|------|----------|
| IR-PENDING-PORTAL-FULL | 172001 / 172101 | PENDING | ✅ | keyword `최지원`, **full structured profile** |
| IR-APPROVED-RESEND | 172002 / 172102 | APPROVED | ✅ | GRADE_2, JA_A, notificationResentAt |
| IR-REJECTED-RESET | 172003 / 172103 | REJECTED | ✅ | rejectedReason, reset-pending 대상 |
| IR-BULK-PENDING | 172004–006 | PENDING | ✅ | bulk approve |
| IR-EXCLUDED-DUAL | 172007 / 172107 | PENDING | ❌ | inclusion negative |
| IR-DIST | 172008–012 | mixed | ✅ | 상태 분포 |

**172001 detail 필수 필드:**

- `profile.education.highestSchoolType` = `college4`
- `profile.career.level` = `experienced`
- `profile.essays.freeWrite1` non-empty
- `socialAccounts[]` KAKAO+NAVER CONNECTED
- `termsAgreements[]` 4종 + `agreedAt`
- `settlement` bankName + masked account

### 관리자 권한승인

| caseId | adminId | status | 목록 |
|--------|---------|--------|------|
| AA-PENDING-MFA-TERMS | 172201 | PENDING_VERIFICATION | ✅ |
| AA-APPROVED-MASTER | 172202 | ACTIVE | ✅ |
| AA-REJECTED | 172203 | REJECTED_VERIFICATION | ✅ |
| AA-BULK-PENDING | 172204–205 | PENDING_VERIFICATION | ✅ |
| AA-DIST | 172206–210 | mixed | ✅ |
| AA-PROVISIONED-NEG | 172231 | ACTIVE | ❌ |

172201 detail: gender, birthDate, terms 4+MFA agreedAt, social 2건.

---

## 4. Mutation 계약

| API | body | 에러 |
|-----|------|------|
| approve (강사) | `{ reason, feeGrade, activityType, jaGrade? }` | non-PENDING → 409 |
| reject | `{ reason, rejectReason }` | |
| reset-pending | `{ reason }` **필수** | already PENDING → 409 |
| resend-notification | (empty) | non-APPROVED → 409 |
| bulk-* | `{ ids[], reason, ... }` | failures[] in 200 or 409 |
| admin approve | PATCH role → POST approve | 순서 고정 |

---

## 5. OpenAPI 갭 (P0 등록 요청)

| Path | 현재 | 조치 |
|------|------|------|
| `POST /api/admin/instructors/{id}/revoke` | runtime only | OpenAPI + schema |
| `POST /api/admin/instructors/{id}/evaluation-grade` | runtime only | OpenAPI + schema |
| `GET /api/admin/admin-accounts` | createdAtFrom/To 없음 | query 추가 또는 FE filter disable 문서화 |

---

## 6. FE zip 패키징 (전달물)

```bash
pnpm --filter cms package:member-management-seed-handoff -- --openapi
```

포함 파일:

- `member-management-seed-v1.spec.json`
- `member-permission-management-seed-v1.spec.json`
- `member-management-backend-seed-handoff-2026-08-28.md` (본 문서)
- `member-permission-management-backend-seed-handoff-2026-08-28.md`
- `members.openapi.json` snapshot

---

## 7. Fixture 구현 가이드 (JABACK)

1. `LocalDemoMemberPermissionSeedFixtures` (또는 동등 클래스)에 **172001 full profile** JSON embed — FE `SEED_IR_PENDING_PORTAL_FULL_PROFILE` 와 동형.
2. Member 172101 생성 시 **roles=[]** pure instructor, SCHOOL_TEACHER role **없음**.
3. Member 172107 생성 시 SCHOOL_TEACHER + INSTRUCTOR active → request 172007는 DB에 있으나 **list query exclude**.
4. Admin 172231 — `ADMIN_CREATED_ACTIVE` audit log → `listAdminApprovalRequests` exclude.
5. Organization 171501 — affiliated teachers ≥1, bulk-delete 409.
6. Distribution 172008–012, 172206–210 — status ratio §distribution in spec JSON.

---

## 8. Smoke checklist (§9)

로그인: `admin1@jakorea.org` / `admin1234!` / MFA `000000` (`verificationCode` 필드)

1. `GET /api/admin/instructor-role-requests?status=PENDING` → 172001 ∈, 172007 ∉
2. `GET /api/admin/instructor-role-requests/172001` → structured profile assertions
3. `GET /api/admin/instructor-role-requests/172002` → defaultFeeGrade, notificationResentAt
4. `GET /api/admin/admin-approval-requests/172201` → terms+MFA+social
5. `GET /api/admin/admin-approval-requests` → 172231 ∉
6. `POST bulk-approve` ids [172004,172005,172006]
7. `POST reset-pending` on 172003 with `{ reason }`
8. `POST resend-notification` on 172002
9. `GET /api/admin/admin-roles` → MASTER/PM/PARTNER/VIEWER

---

## 11. 회원 상세 이력 seed (유형별 LNB)

목록 seed(171001–171005)만으로는 **상세 → 프로젝트 참여 이력** 탭이 비거나 mock과 불일치한다.  
아래를 **동일 Flyway fixture**에 포함하라.

| 항목 | 값 |
|------|-----|
| **시드 라벨** | `member-detail-history-v1-2026-08` |
| **기계 스펙** | `member-detail-history-seed-v1.spec.json` |
| **FE catalog** | `member-detail-history-seed-catalog.ts` |
| **5단계 demo SSOT** | `economy-prog-001~005` (`program-lecture-history-demo.ts`) |

### 11.1 ID 범위 (이력 전용)

| 리소스 | ID 범위 |
|--------|---------|
| Member application (`app-*`) | 173001–173400 |
| Program-history participant (`ph-*` / `part-*`) | 173401–173800 |
| School enrollment `historyRowId` | 174001–174100 |
| Admin `program-roles` row | 174501–174550 |
| Instructor settlement | 175001–175100 |

### 11.2 유형별 showcase (필수)

| caseId | memberId | FE mock user | LNB 탭 | applicationId | volunteer ph-* |
|--------|----------|--------------|--------|---------------|----------------|
| MH-MD-INDIVIDUAL | 171001 | mock-md-individual-171001 | 수강·봉사 | 173001–173005 | 173401–173405 |
| MH-MD-SCHOOL-TEACHER | 171002 | mock-instructor-kang-001 | 수강·봉사 (강의 **없음**) | 173011–173015 | 173411–173415 |
| MH-MD-INSTRUCTOR | 171003 | mock-instructor-jung-001 | 수강·강의·봉사·**정산** | 173021–173030 | 173421–173425 |
| MH-MD-INSTRUCTOR-DUAL | 171004 | mock-instructor-choi-001 | 동일 + 정산 | 173031–173040 | 173431–173435 |
| MH-MD-INSTRUCTOR-REVOKED | 171005 | mock-md-instructor-revoked-171005 | 수강·강의·봉사 (정산 없음) | 173041–173050 | 173441–173445 |

**5단계 시나리오 (No.5→1):** 신청 대기 → 반려 → 교육 예정 → 진행 중 → 종료(강의보고서·수료증).

### 11.3 학교·관리자 상세

| caseId | 주체 | ID | API |
|--------|------|-----|-----|
| MH-SCHOOL-SEOUL | org 171501 | historyRowId 174001–174005 | `GET .../program-enrollment-history` |
| MH-SCHOOL-JINWOL | org 171502 | 174011–174015 | 동일 |
| MH-ADMIN-MASTER | admin 171601 | programRoleId 174501–174505 | `GET .../admin-accounts/171601/program-roles` |

### 11.4 directory ↔ permission memberId (동일 FE mock, 다른 BE id)

| FE mock | directory memberId | permission memberId |
|---------|-------------------|---------------------|
| mock-instructor-jung-001 | 171003 | 172101 |
| mock-instructor-choi-001 | 171004 | 172107 |
| mock-instructor-kang-001 | 171002 | 172103 |

상세 이력 seed는 **directory memberId** 기준. 권한승인 상세는 **172xxx**.

### 11.5 연계 handoff (필드·모달·정산)

- REQ-001~016: [member-program-history-ui-api-parity-backend-handoff-2026-08-25.md](./member-program-history-ui-api-parity-backend-handoff-2026-08-25.md)
- PH/SET: [instructor-member-detail-program-history-settlement-backend-handoff-2026-08-25.md](./instructor-member-detail-program-history-settlement-backend-handoff-2026-08-25.md)
- 학교: [school-organization-program-enrollment-history-backend-handoff-2026-08-25.md](./school-organization-program-enrollment-history-backend-handoff-2026-08-25.md)
- 관리자: [admin-member-managed-program-history-backend-handoff-2026-08-25.md](./admin-member-managed-program-history-backend-handoff-2026-08-25.md)

### 11.6 Smoke (이력)

1. `GET /api/admin/users/171001/applications` — 5건, `economy-prog-001` 포함
2. `GET /api/admin/users/171001/program-history` — 봉사 5건, `managerName` non-empty
3. `GET /api/admin/users/171002/applications` — student 5건, 강의 탭 API 호출 없음
4. `GET /api/admin/users/171003/applications` — 10건 (수강+강의)
5. `GET /api/admin/settlements?instructorMemberId=171003` — ≥1 row
6. `GET /api/admin/organizations/schools/171501/program-enrollment-history` — 174001–174005
7. `GET /api/admin/admin-accounts/171601/program-roles` — 174501–174505

---

## 9. P1 (FE client filter 유지 — seed 불필요)

- `requestedAtFrom/To`, `memberType` (강사 목록)
- 관리자 승인 신청일 range
- `scheduledNotificationAt` on approve

---

## 10. 참조 (FE repo paths)

| 파일 | 용도 |
|------|------|
| `apps/cms/docs/api/members/member-management-seed-v1.spec.json` | 기계 readable seed SSOT |
| `apps/cms/docs/api/members/member-detail-history-seed-v1.spec.json` | **상세 이력** seed SSOT |
| `apps/cms/src/data/mock/member-management-seed-catalog.ts` | FE mock ↔ numeric id (목록·권한) |
| `apps/cms/src/data/mock/member-detail-history-seed-catalog.ts` | FE mock ↔ 이력 id |
| `apps/cms/docs/api/members/member-management-notion-parity-2026-08-28.md` | Notion 기획 검증 |
| `apps/cms/src/features/user/api/lib/map-permission-approval-status.ts` | 상태 mapper |

**Last updated:** 2026-08-28
