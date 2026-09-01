# CMS 회원 관리 — Notion 기획 ↔ API/비즈니스 로직 검증 리포트

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-08-28 |
| **Notion SSOT** | [CMS 어드민 기능정의서](https://app.notion.com/p/tintolab/CMS-33af3e2a77d080748112df7c8b1adfe0) (`collection://33af3e2a-77d0-8153-a119-000b7b801259`) |
| **OpenAPI SSOT** | [`members.openapi.json`](../../openapi/members.openapi.json) (87 admin paths) |
| **FE handoff** | [`member-permission-management-fe-be-integration-2026-08-28.md`](./member-permission-management-fe-be-integration-2026-08-28.md) |
| **seed spec** | [`member-permission-management-seed-v1.spec.json`](./member-permission-management-seed-v1.spec.json) |

**범례:** ✅ 일치 · ⚠️ 부분 · ❌ 불일치 · 🔶 BE/QA 확인 필요

---

## 1. Notion 페이지 인벤토리 (73건)

Notion DB `화면 ∈ {회원 목록, 회원 권한 승인}` 전수 조회 결과.

| 상세 경로 | 페이지 수 | Notion `화면 개발` | Notion `기획 업데이트` |
|-----------|----------|-------------------|------------------------|
| 1-0. 전체 회원 | 3 | 프론트 완료 | 개발 확인 완료 |
| 1-1. 전체 회원 > 상세 | 12 | 프론트 완료 | 개발/백엔드 혼재 |
| 1-0. 강사 권한 승인 | 3 | 개발 완료 | 개발 확인 완료 |
| 1-1. 강사 권한 승인 > 상세 | 6 | 개발 완료 | 개발 확인 완료 |
| 2-0. 관리자 권한 승인 | 3 | 개발 완료 | 개발 확인 완료 |
| 2-1. 관리자 권한 승인 > 상세 | 4 | 개발 완료 | 개발 확인 완료 |
| 2-0. 학교(교사) 회원 관리 | 3 | 프론트 완료 | 개발/백엔드 혼재 |
| 2-1. 학교(교사) 회원 관리 > 상세 | 11 | 프론트 완료 | 대부분 백엔드 확인 |
| 3-0. 강사 회원 관리 | 3 | 프론트 완료 | 백엔드 확인 |
| 3-1. 강사 회원 관리 > 상세 | 14 | 프론트 완료 | 개발/백엔드 혼재 |
| 3-0. 관리자 권한 설정 | 1 | 개발 완료 | 개발 확인 완료 |
| 4-0. 관리자 회원 관리 | 3 | 프론트 완료 | 개발/백엔드 혼재 |
| 4-1. 관리자 회원 관리 > 상세 | 5 | 프론트 완료 | 대부분 백엔드 확인 |

**제공 URL 40+건**은 위 73건의 부분집합이며, 누락분은 DB SQL 조회로 보완함.

---

## 2. 도메인별 검증 매트릭스

### 2.1 전체 회원 (`/users/list?kind=all`)

| Notion | FE | API | 상태 |
|--------|----|-----|------|
| 컬럼: No·회원명·연락처·이메일·회원유형·가입유형·가입일 | `user-list.tsx` `columnsForKind()` | `GET /api/admin/members/all` | ✅ |
| 회원유형: 개인/학교(교사)/강사/강사(권한박탈)/관리자, 겸직 표기 | `map-member-role.ts`, `member-list-display.ts` | `rolesExactAnyOf` | ✅ |
| 권한박탈 시 상세 메뉴 동일·기본정보 가입유형 형태 | `revoked-instructor-overlay.ts` | `INSTRUCTOR_REVOKED` | ✅ |
| 필터: 회원명·회원유형·가입시기 | `user-list-table.config.ts` | `keyword`, `rolesExactAnyOf`, `createdAtFrom/To` | ⚠️ 전체 탭 유형 필터는 remote **클라 스캔** |
| 삭제·등록·엑셀 | `user-list-page.tsx` | `bulk-delete`, `pre-register/*` | ✅ |
| 상세 LNB: 회원상세·프로그램수강·봉사 | `user-detail-fullpage-modal.tsx` | `GET users/{id}/*` | ✅ |
| 상세 버튼: 탈퇴·정보수정(관리자등록만)·코멘트·개인정보 | `get-default-header-actions.ts` | `delete`, `PATCH`, `comments`, `privacy/unmask` | ✅ |
| 약관 및 동의 (4종 + UJAT 4종) | `member-consent-*` | `consent-records`, `filled-document` | ⚠️ pre-register filled-document **BE 500** |
| 프로그램 수강 이력: 수료증·이력삭제(실적유지) | `detail/history/*` | `program-history`, `DELETE program-history/{id}` | 🔶 remote parity handoff 별도 |

### 2.2 학교(교사) 회원 (`?kind=institutions`)

| Notion | FE | API | 상태 |
|--------|----|-----|------|
| 컬럼: 기관명·소재지·수강횟수·교사수·등록일 | `columnsForKind('institutions')` | `GET organizations/schools` | ✅ |
| 필터: 기관명·소재지·등록시기 | `user-list-filter-fields.ts` | `keyword`, `regionSido/Sigungu`, `createdAtFrom/To` | ✅ |
| 학교 등록·삭제·엑셀 | register/delete modals | `pre-register/school`, `bulk-delete` | ✅ |
| **등록 교사 있으면 삭제 불가** | FE validation | BE 409 | 🔶 BE smoke 필요 |
| 상세 LNB: 학교상세·프로그램수강 | school strategy | `organizations/schools/{id}` | ✅ |
| 학교 수강 이력 (수료증 버튼 **비노출**) | school enrollment tab | `program-enrollment-history` | ⚠️ mock fallback 잔존 가능 |

### 2.3 강사 회원 (`?kind=instructors`)

| Notion | FE | API | 상태 |
|--------|----|-----|------|
| 컬럼: 강사명·연락처·이메일·JA등급·정산현황·가입일 | `columnsForKind('instructors')` | `GET users` + `rolesExactAnyOf` | ✅ |
| 상세 LNB: 강사상세·수강·강의·봉사·**정산현황** | instructor strategy | users/* + settlement | ⚠️ 정산 탭 `paymentOrders`/`accountPayments` 게이트 |
| 정산 리스트: 회차별·반려/정정 취소선·재신청 분리 | settlement tab UI | settlement APIs | 🔶 BE seed + handoff |
| 정산 캘린더: hover·우측 리스트·체크박스 | calendar view | settlement APIs | 🔶 |
| 강사 권한 박탈 | `instructor-permission-revoke-modal.tsx` | `POST instructors/{id}/revoke` | ⚠️ **OpenAPI 미등록**, BE route 존재(401) |
| JA 등급 평가 | `ja-grade-evaluation-modal.tsx` | `POST …/evaluation-grade` | ⚠️ **OpenAPI 미등록**, BE route 존재(401) |

### 2.4 관리자 회원 (`?kind=admins`)

| Notion | FE | API | 상태 |
|--------|----|-----|------|
| 컬럼: 관리자명·연락처·이메일·권한유형·담당프로그램·가입일 | `columnsForKind('admins')` | `GET admin-accounts` | ✅ |
| 필터: 관리자명·권한유형·**가입시기** | filter fields | `keyword`, `roleCode` | ⚠️ **가입일 remote 미지원** (`member-remote-capabilities.ts`) |
| 상세: 담당 프로그램 이력 | admin programs tab | `admin-programs`, `program-roles` | ✅ |
| 목록 권한유형 드롭다운 변경 | `AdminPermissionDropdownCell` | `PATCH …/role` | ✅ |

### 2.5 권한 승인 — 강사 (`/admin/permission-requests` 강사 탭)

| Notion | FE | API | 상태 |
|--------|----|-----|------|
| 컬럼: No·회원명·연락처·이메일·회원유형·승인현황·신청일 | `members-permission-list.tsx` | `GET instructor-role-requests` | ✅ |
| ~~신청유형~~ (기획 삭제) | 컬럼 없음 | `requestedActivityType` 응답만 | ✅ Notion strike-through 일치 |
| 필터: 회원명·회원유형·승인현황·신청시기 | `members-permission-table.config.ts` | `keyword`, `status` 서버 / 유형·기간 **클라** | ⚠️ |
| pure instructor만 목록 | mock + BE seed | list inclusion rule | ✅ IR-EXCLUDED-DUAL 172007 |
| 일괄 승인/반려, non-PENDING 차단 | `permission-request-list-page.tsx` | bulk-*, 409 | ✅ |
| 상세: joinedAt·social·feeGrade·JA등급·알림재발송 | `map-instructor-role-request-detail-to-user.ts` | detail GET | ✅ |
| structured 이력서 | `userToApplicantInstructorRow` | `instructorCmsProfile` | ✅ |
| 승인취소·알림재발송 | reset/resend mutations | reset-pending, resend-notification | ✅ |
| 알림 발송 시점 UI | approve modal | 미전송 (P1) | ⚠️ |

### 2.6 권한 승인 — 관리자 (관리자 탭)

| Notion | FE | API | 상태 |
|--------|----|-----|------|
| 컬럼: No·회원명·연락처·이메일·승인현황·신청일 | `members-permission-list.tsx` | `GET admin-approval-requests` | ✅ |
| 셀프가입 승인 큐만 (provisioned 제외) | list mapper | seed `adminListInclusion` | ✅ AA-PROVISIONED-NEG 172231 |
| 필터: 회원명·승인현황·신청시기 | table config | `keyword`, `status` 서버 / 기간 **클라** | ⚠️ |
| 승인: MASTER/중간/뷰어 | approve modal | `MASTER`/`PARTNER`/`VIEWER` | ⚠️ PM/PARTNER UI 통합 |
| 단건: role 변경 → approve | mutations | `PATCH role` + `POST approve` | ✅ |
| 상세: 약관 4+MFA·담당프로그램 수 | `map-admin-account-detail-to-user.ts` | detail GET | ✅ |

### 2.7 관리자 권한 설정 (`/admin/settings/permissions`)

| Notion | FE | API | 상태 |
|--------|----|-----|------|
| MASTER/PM/PARTNER/VIEWER 매트릭스 | `AdminPermissionsRemotePanel` | `admin-roles/{code}/permissions` | ✅ (remote) |
| PM: 관리자승인·로그(메일제외) 제외 | RBAC spec | FE route guard | 🔶 전역 RBAC 감사 필요 |
| PARTNER: + 주민/계좌 확인 제외 | RBAC spec | privacy unmask guard | 🔶 |
| VIEWER: CRUD·PII·로그·다운로드 금지 | RBAC spec | `canWrite` 등 | 🔶 |

---

## 3. OpenAPI ↔ Notion 액션 대조

### 3.1 목록·조회 (P0)

| Notion 액션 | OpenAPI path | FE client | OpenAPI query | 비고 |
|-------------|--------------|-----------|---------------|------|
| 전체 회원 목록 | `GET /api/admin/members/all` | `fetchAllCmsMembersAndAdminsPageRemote` | keyword, rolesExactAnyOf, createdAtFrom/To, page, size | ✅ |
| 개인/강사 회원 | `GET /api/admin/users` | `fetchMembersPageRemote` | keyword, rolesExactAnyOf, createdAtFrom/To, jaEvaluationGrade, settlementStatus | ✅ |
| 학교 목록 | `GET /api/admin/organizations/schools` | `fetchSchoolsPageRemote` | keyword, regionSido/Sigungu, createdAtFrom/To | ✅ |
| 관리자 목록 | `GET /api/admin/admin-accounts` | `fetchAdminsPageRemote` | keyword, roleCode, status, page, size | ⚠️ **createdAtFrom/To 없음** |
| 강사 권한승인 목록 | `GET /api/admin/instructor-role-requests` | `fetchInstructorRoleRequestsPageRemote` | keyword, status, page, size | ⚠️ requestedAtFrom/To, memberType **없음** |
| 관리자 권한승인 목록 | `GET /api/admin/admin-approval-requests` | `fetchAdminApprovalRequestsPageRemote` | keyword, roleCode, status, page, size | ⚠️ requestedAtFrom/To **없음** |

### 3.2 mutation (P0)

| Notion 액션 | OpenAPI | FE | 비고 |
|-------------|---------|-----|------|
| 회원/학교/관리자 일괄삭제 | bulk-delete paths | ✅ | |
| 강사 승인/반려/일괄/reset/resend | instructor-role-requests/* | ✅ | |
| 관리자 승인/반려/일괄/reset/resend | admin-approval-requests/* | ✅ | |
| 관리자 role 변경 | `PATCH admin-accounts/{id}/role` | ✅ | |
| 권한 매트릭스 저장 | `PUT admin-roles/{code}/permissions` | ✅ | |
| 강사 권한 박탈 | **OpenAPI 없음** | `revokeInstructorPermissionRemote` | BE route **존재** (401 unauth) |
| JA 등급 변경 | **OpenAPI 없음** | `changeInstructorEvaluationGradeRemote` | BE route **존재** (401 unauth) |
| pre-register 동의서 | `POST …/filled-document` | ✅ | 🔶 BE 500 이슈 |

### 3.3 customInstance gap (OpenAPI 미등록 · BE 구현 가능)

| Path | FE 함수 | OpenAPI | 로컬 route probe |
|------|---------|---------|------------------|
| `POST /api/admin/instructors/{id}/revoke` | `revokeInstructorPermissionRemote` | ❌ | 401 (존재) |
| `POST /api/admin/instructors/{id}/evaluation-grade` | `changeInstructorEvaluationGradeRemote` | ❌ | 401 (존재) |

**조치:** BE OpenAPI 동기화 → `fetch:openapi` + Orval 재생성.

---

## 4. 상태·역할 매핑 (Notion ↔ FE SSOT)

| UI (Notion 3상태) | 강사 API | 관리자 API | FE mapper |
|-------------------|----------|------------|-----------|
| 승인 대기 | PENDING | PENDING, PENDING_VERIFICATION | `map-permission-approval-status.ts` ✅ |
| 승인 완료 | APPROVED, COMPLETED | ACTIVE, APPROVED, VERIFIED | ✅ |
| 신청 반려 | REJECTED, REVOKED | REJECTED, REJECTED_VERIFICATION, INACTIVE, SUSPENDED, REVOKED | ✅ |
| 회원유형: 강사(권한박탈) | INSTRUCTOR_REVOKED | — | `memberRolesWithInstructorRevoked` ✅ |
| 겸직: 학교+강사 | school_teacher + instructor | — | `instructor_dual` ✅ |
| 관리자 UI variant | — | MASTER / PM / PARTNER / VIEWER | `admin-approval-role.ts` ⚠️ PM=partner UI |

---

## 5. FE 비즈니스 로직 감사 요약

| 영역 | 핵심 파일 | 결과 |
|------|-----------|------|
| 회원 목록 kind/API 분기 | `user-list-table.config.ts`, `member-list-kinds.ts` | ✅ P1: all-tab role client scan, admin createdAt |
| 권한승인 필터 | `members-permission-table.config.ts`, `parse-members-permission-list-params.ts` | ⚠️ memberType·신청기간 client-only |
| 승인/반려/bulk/reset/resend | `permission-request-list-page.tsx`, mutation hooks | ✅ |
| 상세 헤더 액션 | `get-default-header-actions.ts`, `permission-header-actions.tsx` | ✅ revoke는 pure instructor만 |
| 역할 표시 | `map-member-role.ts`, `member-list-display.ts` | ✅ |
| structured 이력서 | `user-to-applicant-instructor-row.ts` | ✅ remote `instructorCmsProfile` |
| remote 게이트 | `member-remote-capabilities.ts`, `real-api-modules.ts` | ✅ granular modules |

### 단위 테스트 (2026-08-28 실행)

```
vitest: 5 files, 35 tests passed
- map-instructor-role-request-detail-to-user.test.ts
- map-admin-account-detail-to-user.test.ts
- user-to-applicant-instructor-row.test.ts
- member-list-display.test.ts
- map-roles-exact-any-of.test.ts
```

---

## 6. 로컬 BE smoke

| 항목 | 결과 | 비고 |
|------|------|------|
| `GET /actuator/health` | **200** | local BE 기동 확인 |
| Member API routes (unauthenticated) | **401** (not 404) | instructor-role-requests, admin-approval-requests, members/all, admin-accounts, schools, admin-roles/permissions, instructors/revoke, evaluation-grade |
| Seed caseId authenticated smoke | **handoff §9 참조** | 2026-08-28 `member-permission-management-fe-be-integration` 에서 GET+mutation 스모크 ✅ 기록 |
| IR-PENDING-PORTAL-FULL (172001) | handoff ✅ | keyword `최지원`, detail snapshot |
| IR-EXCLUDED-DUAL (172007) | handoff ✅ | 목록 미노출 |
| AA-PROVISIONED-NEG (172231) | handoff ✅ | 목록 미노출 |

**재실행 방법 (authenticated):**

```bash
# .env.local
VITE_REAL_API_MODULES=members,instructorRoleRequests,adminApprovalRequests,adminPermissions

# 로그인: admin1@jakorea.org / admin1234! / MFA 000000
# handoff §12 시나리오 1–9
```

---

## 7. P0 / P1 backlog

### P0 — BE

| # | 항목 | Notion | 조치 |
|---|------|--------|------|
| 1 | pre-register filled-document HTTP 500 | 약관 및 동의 | [`member-pre-register-filled-document-500-…`](./member-pre-register-filled-document-500-backend-request-2026-08-26.md) |
| 2 | revoke / evaluation-grade OpenAPI 등록 | 강사 상세·권한박탈·JA등급 | OpenAPI 추가 → Orval |
| 3 | 학교 삭제(교사 존재) 409 | 학교 버튼 리스트 | BE business rule + FE smoke |

### P1 — FE + BE

| # | 항목 | Notion | 조치 |
|---|------|--------|------|
| 4 | 권한승인 `requestedAtFrom/To` 서버 필터 | 강사/관리자 솔팅 | OpenAPI query + FE parse |
| 5 | 강사 권한승인 `memberType` 서버 필터 | 회원유형 셀렉 | OpenAPI query + FE parse |
| 6 | 관리자 목록 가입일 필터 | 관리자 솔팅 | OpenAPI `createdAtFrom/To` 또는 FE filter disabled |
| 7 | approve `scheduledNotificationAt` | 승인 팝업 | BE field + FE payload |
| 8 | PM vs PARTNER 승인 UI 분리 | 관리자 승인 모달 | FE radio + `roleCode` |

### P2 — QA / RBAC / Settlement

| # | 항목 | Notion | 조치 |
|---|------|--------|------|
| 9 | PM/파트너/뷰어 메뉴·버튼 RBAC | 관리자 권한 설정 | route guard + BE 403 audit |
| 10 | 강사 정산 탭 remote parity | 3-6.1/3-6.2 | settlement handoff + seed |
| 11 | 프로그램 이력 remote parity | 2-1/2-2/2-3 | 4종 handoff smoke |
| 12 | formResponse draft 조회 | 동의/신청서 | BE API + FE TODO 제거 |

---

## 8. 결론

- **P0 핵심 화면**(전체/학교/강사/관리자 목록, 권한승인 강사·관리자, 상태 매핑, bulk/reset/resend)은 Notion 기획과 **FE·OpenAPI가 대체로 일치**한다.
- Notion에서 **의도적으로 삭제된 항목**(강사 권한승인 ~~신청유형~~)은 FE에도 반영되어 **일치**한다.
- **부분 일치(⚠️)** 는 주로 **서버 필터 미지원**(신청기간·회원유형·관리자 가입일)과 **알림 시점 UI-only** 영역에 집중된다.
- **불일치/확인필요(❌/🔶)** 는 pre-register 500, OpenAPI 미등록 customInstance(revoke/evaluation-grade), 정산·이력 remote parity, RBAC 전역 검증이다.

**Last updated:** 2026-08-28
