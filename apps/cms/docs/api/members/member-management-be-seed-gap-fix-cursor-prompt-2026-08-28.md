# Cursor prompt — CMS 회원 관리 DB seed P0 보완 (directory·상세 이력 gap)

**이 파일 전체를 백엔드(JABACK) Cursor에 붙여넣어 실행하라.**  
질문은 엔티티·FK·contributor 실행 순서를 찾아도 판단이 안 될 때만 하라. 프론트 레포는 없다.

프론트 CMS **회원 관리** remote 연동 P0가 permission seed까지는 통과했으나, **회원 목록·학교·상세 이력 탭** smoke가 실패한다.  
FE catalog·spec JSON numeric id는 확정됐다. **아래 3 contributor가 handoff id로 idempotent upsert 되도록 보완하라.**

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-28 |
| **화면** | CMS LNB `회원 관리` — 목록(전체/학교/강사/관리자) · 상세(프로젝트 참여 이력·정산) · 권한 승인 · 관리자 권한 설정 |
| **FE 모듈 플래그** | `VITE_REAL_API_MODULES=...,members,instructorRoleRequests,adminApprovalRequests,adminPermissions` |
| **OpenAPI SSOT** | `GET /v3/api-docs` · members subset |
| **FE zip (spec+catalog)** | FE repo `pnpm --filter cms package:member-management-seed-handoff -- --openapi` |

### 시드 라벨 · contributor (3종 모두 필수)

| 영역 | seedLabel | contributor (예상 클래스명) | FE smoke (2026-08-28) |
|------|-----------|----------------------------|------------------------|
| 회원·학교·관리자 **디렉터리** | `member-management-v1-2026-08` | `LocalDemoMemberManagementSeedContributor` | ❌ **미적재** |
| 회원 **상세 이력** 탭 | `member-detail-history-v1-2026-08` | `LocalDemoMemberDetailHistorySeedContributor` | ❌ **미적재** |
| **권한 승인** (강사·관리자) | `member-permission-management-v1-2026-08` | `LocalDemoMemberPermissionManagementSeedContributor` | ✅ **pass** |

**실행 조건:** `SPRING_PROFILES_ACTIVE=local` + `JA_LOCAL_DEMO_ENABLED=true` → bootRun 시 **3 contributor 모두** idempotent upsert.

**로그인 admin(162001)** ≠ **디렉터리 showcase admin(171601)** — 별개 id. smoke·fixture 혼동 금지.

---

## Goal

1. **§A Directory smoke (§7-1~3)** — `members/all` · `organizations/schools` · bulk-delete 409
2. **§B Detail history smoke (§7-4~10)** — applications · program-history · school enrollment · admin program-roles · settlements
3. **§C Permission smoke (§7-11~19)** — **현재 pass 유지** (회귀 금지)
4. 프로그램 FK — `economy-prog-001`~`005` (BE program id **167001–167005** handoff 기준) 와 이력 seed 연결
5. FE smoke script **16/16 pass**: `node scripts/member-management-be-smoke.mjs` (FE repo, admin JWT)

완료 조건 (관리자 JWT + local seed 갱신 후):

```
GET /api/admin/members/all?keyword=김개인        → memberId 171001
GET /api/admin/organizations/schools?keyword=서울 → organizationId 171501, registeredTeachersCount=3
GET /api/admin/users/171001/applications         → 5 items (173001–173005)
GET /api/admin/users/171003/applications         → 10 items (5 enrollment + 5 lecture)
GET /api/admin/settlements?instructorMemberId=171003 → ≥1 row
GET /api/admin/organizations/schools/171501/program-enrollment-history → 5 rows (174001–174005)
GET /api/admin/admin-accounts/171601/program-roles → 5 rows (174501–174505)
GET /api/admin/instructor-role-requests?status=PENDING → 172001 ∈, 172007 ∉  (회귀 확인)
```

---

## Out of scope / 금지

- API path 변경 금지 — FE Orval client 고정.
- permission contributor 동작 **깨지 말 것** (172001 profile · 172007 exclude · 172231 exclude).
- legacy school id (1696xxx)만 두고 171501 showcase **대체하지 말 것** — **171501 병행 upsert**.
- directory memberId(171xxx) 와 permission memberId(172xxx) **혼용 금지** (§4).
- 강사 승인 목록: pure instructor only · server masking · 172007 exclude.
- 관리자 승인 목록: self-signup only · 172231 provisioned exclude.

---

## 1. FE smoke gap (2026-08-28 — 수정 대상)

FE가 local BE (`localhost:8080`) 에 대해 실행한 결과:

| # | API | 기대 | 실제 (gap) |
|---|-----|------|------------|
| 1 | `GET /api/admin/members/all?keyword=김개인` | 171001 | **items=[]** |
| 2 | `GET /api/admin/organizations/schools?keyword=서울` | 171501 | **171501 없음** (1696xxx legacy만) |
| 4 | `GET /api/admin/users/171001/applications` | 5건 | **0건** |
| 5 | `GET /api/admin/users/171001/program-history` | 5건 volunteer | **0건** |
| 6 | `GET /api/admin/users/171002/applications` | 5건 | **0건** |
| 7 | `GET /api/admin/users/171003/applications` | 10건 | **0건** |
| 8 | `GET /api/admin/settlements?instructorMemberId=171003` | ≥1 | **0건** |
| 9 | `GET .../schools/171501/program-enrollment-history` | 5건 | **SCHOOL_ORGANIZATION_NOT_FOUND** |
| 10 | `GET .../admin-accounts/171601/program-roles` | 5건 | **ADMIN_ACCOUNT_NOT_FOUND** |
| 11–15, 19 | Permission APIs | pass | ✅ **유지** |

**원인 추정 (BE 확인):**
- `LocalDemoMemberManagementSeedContributor` / `LocalDemoMemberDetailHistorySeedContributor` 미등록·조건부 skip·Flyway 순서 문제
- Organization 171501 / AdminAccount 171601 미생성 → 이력 FK 실패
- Program 167001–167005 미연결 → application seed empty

---

## 2. 기계 스펙 JSON (SSOT)

FE `docs/api/members/` (zip 패키징에 포함):

| 파일 | 범위 |
|------|------|
| `member-management-seed-v1.spec.json` | 디렉터리 171001–171601 · 학교 171501–503 · id 범위 |
| `member-detail-history-seed-v1.spec.json` | 상세 이력 173001–175013 · 5단계 demo |
| `member-permission-management-seed-v1.spec.json` | 권한 172001–172231 |

JABACK mirror: `docs/frontend/` 동일 파일명.

---

## 3. ID 범위 (Flyway · upsert PK)

| 리소스 | ID 범위 | contributor |
|--------|---------|-------------|
| Member directory | 171001–171400 | Management |
| School organization | 171501–171550 | Management |
| Admin directory (showcase) | 171601–171650 | Management |
| InstructorRoleRequest | 172001–172040 | Permission ✅ |
| Instructor member (permission) | 172101–172140 | Permission ✅ |
| Admin approval queue | 172201–172230 | Permission ✅ |
| Provisioned exclude | 172231–172235 | Permission ✅ |
| Member application | 173001–173400 | **DetailHistory** |
| Program-history participant | 173401–173800 | **DetailHistory** |
| School enrollment historyRowId | 174001–174100 | **DetailHistory** |
| Admin program-role row | 174501–174550 | **DetailHistory** |
| Instructor settlement | 175001–175100 | **DetailHistory** |
| Program (5단계 demo) | 167001–167005 | DetailHistory FK |

---

## 4. FE mock ↔ BE id 분리 (fixture 설계 필수)

동일 인물이라도 **화면별 memberId가 다름**. FE는 API 응답 id 그대로 사용.

| FE mock userId | Directory memberId (목록·상세 이력) | Permission memberId (권한승인) |
|----------------|--------------------------------------|-------------------------------|
| mock-md-individual-171001 | **171001** | — |
| mock-instructor-kang-001 | **171002** | **172103** |
| mock-instructor-jung-001 | **171003** | **172101** |
| mock-instructor-choi-001 | **171004** | **172107** |
| mock-md-instructor-revoked-171005 | **171005** | — |
| mock-md-admin-171601 | admin **171601** | — |

- `GET /api/admin/users/{memberId}/applications` → **171xxx**
- `GET /api/admin/instructor-role-requests/{requestId}` → request **172xxx**, detail `memberId` **172101** 등

---

## 5. Showcase — Directory (Management contributor)

### 5.1 `GET /api/admin/members/all`

| caseId | memberId / adminId | keyword | roles |
|--------|-------------------|---------|-------|
| MD-INDIVIDUAL | 171001 | 김개인 | INDIVIDUAL |
| MD-SCHOOL-TEACHER | 171002 | 강선생 | SCHOOL_TEACHER |
| MD-INSTRUCTOR | 171003 | 정멘토 | INSTRUCTOR |
| MD-INSTRUCTOR-DUAL | 171004 | 최강사 | SCHOOL_TEACHER + INSTRUCTOR |
| MD-INSTRUCTOR-REVOKED | 171005 | 박박탈 | INSTRUCTOR_REVOKED |
| MD-ADMIN | admin 171601 | — | ADMIN MASTER |

### 5.2 `GET /api/admin/organizations/schools`

| caseId | orgId | 이름 | 교사 수 | 삭제 |
|--------|-------|------|---------|------|
| MD-SCHOOL-SEOUL | 171501 | 서울초등학교 | 3 | ❌ bulk-delete → **409** |
| MD-SCHOOL-JINWOL | 171502 | 진월초등학교 | 1 | ❌ |
| MD-SCHOOL-NO-TEACHERS | 171503 | 교사없음테스트학교 | 0 | ✅ |

---

## 6. Showcase — Detail history (DetailHistory contributor)

**5단계 demo:** program `economy-prog-001`~`005` (BE 167001–167005)  
No.5→1: 신청 대기 → 반려 → 교육 예정 → 진행 중 → 종료(강의보고서)

| caseId | memberId | LNB 탭 | applicationIds | volunteer ph-* | settlement |
|--------|----------|--------|----------------|----------------|------------|
| MH-MD-INDIVIDUAL | 171001 | 수강·봉사 | 173001–173005 | 173401–173405 | — |
| MH-MD-SCHOOL-TEACHER | 171002 | 수강·봉사 | 173011–173015 | 173411–173415 | — |
| MH-MD-INSTRUCTOR | 171003 | 수강·강의·봉사·정산 | 173021–173030 (10) | 173421–173425 | 175001–175003 |
| MH-MD-INSTRUCTOR-DUAL | 171004 | 동일 | 173031–173040 | 173431–173435 | 175011–175013 |
| MH-MD-INSTRUCTOR-REVOKED | 171005 | 수강·강의·봉사 | 173041–173050 | 173441–173445 | **없음** |

**학교:** 171501 → enrollment 174001–174005 · 171502 → 174011–174015  
**관리자:** 171601 → program-roles 174501–174505 (economy-prog-001~005)

**봉사 program-history:** `managerName` non-empty (REQ-005).  
**순수 교사 171002:** lecture application **seed 넣지 말 것** (FE 강의 탭 미노출).

---

## 7. Showcase — Permission (Permission contributor · 회귀 방지)

| caseId | requestId / memberId | status | 목록 |
|--------|---------------------|--------|------|
| IR-PENDING-PORTAL-FULL | 172001 / 172101 | PENDING | ✅ keyword `최지원` |
| IR-APPROVED-RESEND | 172002 / 172102 | APPROVED | ✅ GRADE_2, notificationResentAt |
| IR-REJECTED-RESET | 172003 / 172103 | REJECTED | ✅ reset-pending |
| IR-BULK-PENDING | 172004–172006 | PENDING | ✅ bulk |
| IR-EXCLUDED-DUAL | 172007 / 172107 | PENDING | ❌ **목록 제외** |
| AA-PENDING-MFA-TERMS | 172201 | PENDING_VERIFICATION | ✅ |
| AA-PROVISIONED-NEG | 172231 | ACTIVE | ❌ **목록 제외** |

**172001 detail assertion:**
- `profile.education.highestSchoolType` = `college4`
- `profile.career.level` = `experienced`
- `profile.essays.freeWrite1` non-empty
- `socialAccounts[]` KAKAO+NAVER CONNECTED
- `termsAgreements[]` 4종 + `agreedAt`
- `settlement` bankName + masked account

---

## 8. Mutation 계약 (P0 · 회귀 확인)

| API | body | 에러 |
|-----|------|------|
| approve (강사) | `{ reason, feeGrade, activityType, jaGrade? }` | non-PENDING → 409 |
| reset-pending | `{ reason }` **필수** | already PENDING → 409 |
| resend-notification | (empty) | non-APPROVED → 409 |
| bulk-* | `{ ids[], reason, ... }` | failures[] |
| admin approve | PATCH role → POST approve | 순서 고정 |

---

## 9. 구현 가이드 (JABACK)

1. **Contributor 등록 확인** — 3종 모두 `@ConditionalOnProperty(JA_LOCAL_DEMO_ENABLED)` 하에 `ApplicationReadyEvent` 또는 Flyway callback에서 실행되는지 로그로 검증.
2. **Management 먼저** — Member 171001–171005, Org 171501–503, AdminAccount 171601 생성 후 DetailHistory 실행.
3. **DetailHistory FK** — application.subjectMemberId = 171xxx; programId = 167001–167005; school org = 171501.
4. **172001 full profile** — FE `SEED_IR_PENDING_PORTAL_FULL_PROFILE` 와 동형 JSON embed (Permission contributor · 유지).
5. **Member 172107** — dual active → request 172007 list query **exclude** (Permission · 유지).
6. **Admin 172231** — `ADMIN_CREATED_ACTIVE` log → approval list exclude (Permission · 유지).
7. bootRun 후 seed label 3종 로그 출력 권장: `member-management-v1-2026-08`, `member-detail-history-v1-2026-08`, `member-permission-management-v1-2026-08`.

---

## 10. Smoke checklist (BE self-verify)

로그인: `admin1@jakorea.org` / `admin1234!` / MFA `verificationCode`=`000000`

### Directory
1. `GET /api/admin/members/all?keyword=김개인` → 171001
2. `GET /api/admin/organizations/schools?keyword=서울` → 171501, teachers=3
3. `POST /api/admin/organizations/schools/bulk-delete` body `{ "ids": [171501] }` → **409**

### Detail history
4. `GET /api/admin/users/171001/applications` → 5
5. `GET /api/admin/users/171001/program-history` → 5, managerName set
6. `GET /api/admin/users/171002/applications` → 5
7. `GET /api/admin/users/171003/applications` → 10
8. `GET /api/admin/settlements?instructorMemberId=171003` → ≥1
9. `GET /api/admin/organizations/schools/171501/program-enrollment-history` → 174001–174005
10. `GET /api/admin/admin-accounts/171601/program-roles` → 174501–174505

### Permission (회귀)
11. `GET /api/admin/instructor-role-requests?status=PENDING` → 172001 ∈, 172007 ∉
12. `GET /api/admin/instructor-role-requests/172001` → structured profile
13. `GET /api/admin/instructor-role-requests/172002` → feeGrade, notificationResentAt
14. `GET /api/admin/admin-approval-requests` → 172231 ∉
15. `GET /api/admin/admin-approval-requests/172201` → terms 4+MFA, social 2
16. `POST bulk-approve` [172004,172005,172006] · `POST reset-pending` 172003 `{reason}` · `POST resend-notification` 172002
17. `GET /api/admin/admin-roles` → MASTER/PM/PARTNER/VIEWER

FE 측 자동 smoke (BE 완료 후 FE 팀 재실행):
```bash
pnpm --filter cms smoke:member-management-be
```

---

## 11. OpenAPI 갭 (P1 · path 삭제 금지)

| Path | 조치 |
|------|------|
| `POST /api/admin/instructors/{id}/revoke` | OpenAPI 등록 (runtime 존재) |
| `POST /api/admin/instructors/{id}/evaluation-grade` | OpenAPI 등록 |
| `GET instructor-role-requests` | `requestedAtFrom/To`, `memberType` query (P1) |
| `GET admin-accounts` | `createdAtFrom/To` (P1) |

---

## 12. 상세 이력 API cross-ref (필드 갭 · 별도 handoff)

디렉터리·이력 seed 후 FE remote UI 완성을 위해 아래 4종 handoff와 API 필드 정합 필요 (zip 필수 묶음):

1. `member-program-history-ui-api-parity-backend-handoff-2026-08-25.md` (REQ-001~016)
2. `instructor-member-detail-program-history-settlement-backend-handoff-2026-08-25.md` (PH/SET)
3. `school-organization-program-enrollment-history-backend-handoff-2026-08-25.md`
4. `admin-member-managed-program-history-backend-handoff-2026-08-25.md` (ADM)

**이번 Cursor prompt P0 scope = seed id·건수·FK·smoke.** REQ/ADM 필드 gap은 seed 후속.

---

## 13. FE 회신 형식

완료 시 아래 형식으로 FE 팀에 회신:

1. bootRun 로그 — 3 seedLabel upsert 확인
2. §10 smoke 17항목 pass/fail 표
3. `pnpm --filter cms smoke:member-management-be` 결과 스크린샷 또는 exit 0
4. spec JSON diff 있으면 `docs/frontend/` mirror PR 링크

**Last updated:** 2026-08-28
