# CMS 회원 권한 관리 — BE → FE 연동 핸드오프 (P0)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-28 |
| **출처** | 백엔드 (local bootRun, Flyway V51) |
| **FE 대응 문서** | [`member-permission-management-backend-seed-handoff-2026-08-28.md`](./member-permission-management-backend-seed-handoff-2026-08-28.md) |
| **BE spec SSOT** | JABACK `docs/frontend/member-permission-management-seed-v1.spec.json` |

---

## 1. 대상 화면

| 화면 | FE route | BE API |
|------|----------|--------|
| 권한 승인 — 강사 | `/admin/permission-requests` (강사) | `/api/admin/instructor-role-requests/**` |
| 권한 승인 — 관리자 | `/admin/permission-requests` (관리자) | `/api/admin/admin-approval-requests/**` |
| 관리자 권한 설정 | `/admin/settings/permissions` | `/api/admin/admin-roles/{roleCode}/permissions` |

**모듈 플래그:** `instructorRoleRequests`, `adminApprovalRequests`, `adminPermissions` (또는 `members`)

---

## 2. BE P0 변경 요약

### 강사 탭

- 목록: pure instructor only, `maskedName` 서버 마스킹, `status`/`keyword` query
- 상세: `joinedAt`, `notificationResentAt`, `socialAccounts`, `termsAgreements[].agreedAt`, APPROVED 시 `profile.defaultFeeGrade` / `defaultJaGrade`
- `reset-pending`: APPROVED → PENDING 지원 (승인 취소)
- `resend-notification`: APPROVED 건만, 상세 `notificationResentAt` 갱신
- bulk: non-PENDING → `BulkActionResponse.failures` / 409

### 관리자 탭

- 목록: 셀프 가입만, `status` query 신규 (optional, 미전달 시 3상태 혼합)
- provisioned ACTIVE(172231) 목록 제외
- 상세: `notificationResentAt`, 약관 4종 + MFA `agreedAt`
- `reset-pending`: ACTIVE → PENDING_VERIFICATION 지원

### 상태 매핑

| UI | 강사 | 관리자 |
|----|------|--------|
| 승인 대기 | PENDING | PENDING_VERIFICATION |
| 승인 완료 | APPROVED | ACTIVE |
| 신청 반려 | REJECTED | REJECTED_VERIFICATION |

---

## 3. FE 구현 반영 (2026-08-28)

| 체크리스트 | 상태 |
|-----------|------|
| 강사 목록 `requestedActivityType` 컬럼·필터 없음 | ✅ (기존 UI에 컬럼 없음) |
| 강사/관리자 remote: keyword + status 서버 필터 | ✅ `parse-members-permission-list-params` |
| remote 목록 클라 이중 필터(keyword/status) 제외 | ✅ `members-permission-table.config` `remoteEnabled` |
| remote 목록 서버 마스킹 이중 적용 방지 | ✅ `displayPhone`/`displayEmail` |
| 강사 상세 매핑 (joinedAt, resent, social, grades, agreedAt) | ✅ `map-instructor-role-request-detail-to-user` |
| 강사 structured profile → 이력서 UI | ✅ `instructorCmsProfile` + `userToApplicantInstructorRow` (`instructorRoleRequests` remote) |
| 관리자 상세 gender/birthDate/social | ✅ `map-admin-account-detail-to-user` |
| 관리자 상세 `notificationResentAt` | ✅ `map-admin-account-detail-to-user` |
| `REJECTED_VERIFICATION` status | ✅ `map-permission-approval-status` |
| bulk failures 처리 | ✅ `assert-bulk-action-succeeded` + api client |
| reset/resend UI | ✅ (이전 PR `permission-request-list-page`) |
| Orval P0 필드 동기화 | ✅ live `fetch:openapi` + `filter:openapi:members` + Orval |
| §9 GET + mutation 스모크 | ✅ 2026-08-28 local BE (bulk/reset/resend/409) |

---

## 4. 로컬 시드 · 스모크

| caseId | ID | 검증 |
|--------|-----|------|
| IR-PENDING-PORTAL-FULL | 172001 / member 172101 | keyword `최지원`, 상세 스냅샷 |
| IR-APPROVED-RESEND | 172002 | fee/ja grade, notificationResentAt |
| IR-EXCLUDED-DUAL | 172007 | **목록 미노출** |
| AA-PENDING-MFA-TERMS | 172201 | 약관 4+MFA |
| AA-PROVISIONED-NEG | 172231 | **목록 미노출** |

**로컬 MASTER:** `admin1@jakorea.org` / `admin1234!` / MFA `000000`

---

## 5. P1 (FE mock/클라 유지)

- 신청기간 `requestedAtFrom/To` 서버 필터
- 강사 `memberType` 서버 필터
- approve `scheduledNotificationAt` (알림 발송 시점 UI)

---

**Last updated:** 2026-08-28
