# CMS 회원관리 — 관리자 회원 서버 수정 요청

**작성일:** 2026-08-12  
**우선순위:** P0 (일괄 삭제·목록·상세·등록) / P1 (포털 최초 로그인 플래그)  
**요청 대상:** Members API · Admin Accounts API · Portal Auth API  
**관련 FE (CMS):** `user-list-page.tsx` · `map-account-directory-item-to-user.ts` · `partition-users-for-bulk-delete.ts` · `admin-register-modal.tsx` · `fetch-admin-member-detail.ts` · `map-admin-account-detail-to-user.ts` · `member-basic-info-terms-patch.ts` · 회원 상세 기본정보/동의 수정  
**관련 FE (Platform):** `sign-in/page.tsx` · `admin-registered/*`  
**OpenAPI:** `apps/cms/openapi/members.openapi.json`

---

## 1. 요약

CMS **회원관리 > 관리자 회원** 및 **관리자 등록 회원(개인/강사) 상세 동의 수정** 연동 중 아래 건이 서버 측 보완·확인을 필요로 합니다. 프론트는 일부 **임시 우회**로 동작 중이며, 서버 반영 후 우회 코드를 제거할 예정입니다.

| # | 이슈 | 현재 상태 | 요청 |
|---|------|-----------|------|
| 1 | **일괄 삭제** | 관리자 회원 다건 삭제 실패 | `adminAccountId` 배열을 받는 일괄 삭제 API |
| 2 | **전체 회원 목록** | 관리자 회원 미노출 | `GET /api/admin/users`에 관리자 포함 또는 통합 목록 API |
| 3 | **등록 — 약관 동의** | payload 전송하나 저장 여부 불명 | `POST …/admin-accounts` `termsAgreements` 저장·조회 확인 |
| 4 | **상세 조회** | 약관 동의·생년월일 누락 | 상세 응답 보완 (`termsAgreements`, `birthDate`) |
| 5 | **관리자 등록 회원 최초 로그인** | 플로우 분기 불완전 | 로그인 response에 온보딩 플래그 |
| 6 | **기본정보 PATCH — 선택 동의 수정** | OpenAPI에서 `termsAgreements` 제거됨 | **선택 동의만** 재허용 · **필수 동의는 수정 불가** (FE/BE 공통) |

---

## 2. 이슈 1 — 관리자 회원 일괄 삭제 API (P0)

### 2.1 현상

- CMS 회원 목록 **일괄 삭제** 시 관리자 회원(`role === ADMIN`) 행이 정상 처리되지 않음.
- 일반 회원은 `POST /api/admin/users/bulk-delete` (`BulkDecisionRequest.ids`: **memberId** 배열) 사용.
- 관리자 회원은 **단건** `DELETE /api/admin/admin-accounts/{adminAccountId}` 만 존재.
- FE는 선택 행마다 `deleteUser()` 루프 호출 — 관리자·일반 혼합 선택 시 관리자 쪽 실패·부분 성공 가능.

### 2.2 FE 현행

```typescript
// user-list-page.tsx — 행마다 순차 deleteUser (bulk API 미사용)
for (const u of toDelete) {
  await deleteUser(u.id, resolveDeleteUserOptions(u))
}
// role === ADMIN → DELETE /api/admin/admin-accounts/{adminAccountId}
// 그 외 → DELETE /api/admin/users/{memberId} (또는 bulk-delete 미연동)
```

`resolveDeleteUserOptions`는 `adminAccountId`·`memberId` 힌트를 넘기며, 관리자는 **`adminAccountId` 필수**.

### 2.3 요청

**신규 API (권장)**

| Method | Path | Body | 비고 |
|--------|------|------|------|
| `POST` | `/api/admin/admin-accounts/bulk-delete` | `{ "ids": number[], "reason"?: string }` | `ids` = **adminAccountId** 배열, max 100 |

**또는** 회원 일괄 삭제 API 확장:

- `POST /api/admin/users/bulk-delete` 요청에 `{ memberIds?: number[], adminAccountIds?: number[], reason?: string }` 형태로 **관리자·일반 혼합** 처리.

**응답 (권장):** 기존 `ApiResponseBulkActionResponse` 패턴 — 성공/실패 건수, 실패 id·사유.

### 2.4 수용 기준

- 관리자 회원 목록에서 2건 이상 선택 → **단일 API 호출**로 전부 삭제(익명화) 성공.
- 전체 회원 목록에서 관리자 행만 선택해도 동일.
- `reason` 감사로그 저장.

---

## 3. 이슈 2 — 전체 회원 목록에 관리자 회원 포함 (P0)

### 3.1 현상

- **전체 회원** (`kind=all`) 목록 API(`GET /api/admin/users`) 응답에 **관리자 회원이 포함되지 않음**.
- **관리자 회원** 전용 목록(`GET /api/admin/admin-accounts`) 에서만 노출됨.

### 3.2 FE 임시 처리 (2026-08-12)

프론트가 두 API를 **각각 페이지 조회**한 뒤 **등록일 내림차순 k-way merge** 로 한 목록처럼 표시합니다.

| API | 용도 |
|-----|------|
| `GET /api/admin/users` | 일반·강사·학교 등 member |
| `GET /api/admin/admin-accounts` | 관리자 계정 |

- ~~구현: `fetch-all-members-merged-page.ts` · `mergeAdminAccounts`~~ → **FE 연결 완료:** `GET /api/admin/members/all` · `listAllAccounts`
- **한계(과거):** 필터·total count·페이지네이션이 서버 단일 API 대비 복잡 · 성능·정합성 리스크

### 3.3 요청 (택1)

| 옵션 | 내용 |
|------|------|
| **A. users 목록 확장** | `GET /api/admin/users`에 `role=ADMIN` 또는 관리자 계정 row 포함 · 정렬 `createdAt desc` 서버 보장 |
| **B. 통합 목록 API** | `GET /api/admin/members/all` 등 member + admin-account 통합 cursor/page API |
| **C. 현행 유지** | FE merge 유지 — 단, 두 API **동일 필터·정렬·total** 계약 문서화 |

**최소 수용:** 전체 회원 화면에서 관리자 회원이 **한 API(또는 공식 통합 API)** 로 조회 가능.

### 3.4 목록 row 필수 필드 (관리자)

전체 회원 merge·상세 진입을 위해 관리자 list item에 **`adminAccountId`** 포함 필요 (FE: `ADMIN_ACCOUNT_ID_REQUIRED_MESSAGE`).

---

## 4. 이슈 3 — 관리자 등록 시 약관별 동의 저장 (P0 · 확인 요청)

### 4.1 현상

CMS **관리자 신규 등록** 시 약관별 동의 여부를 **payload로 전송**하나, 서버에서 **저장되지 않는 것으로 추정** (등록 후 상세·consent 조회 시 반영 안 됨).

### 4.2 FE 송신 (현행)

**API:** `POST /api/admin/admin-accounts`  
**스키마:** `AdminAccountCreateRequest.termsAgreements` — **정확히 4건**

| # | `termsType` | 등록 필수(정책) | FE `required` |
|---|-------------|-----------------|---------------|
| 1 | `SERVICE_TERMS` | Y | `true` |
| 2 | `PRIVACY_COLLECTION` | Y | `true` |
| 3 | `MFA_SETUP_CONSENT` | Y | `true` |
| 4 | `MARKETING` | N | `false` |

각 항목: `{ termsType, version, required?, agreed }`  
빌더: `buildAdminAccountCreateTermsAgreements()` · 등록 화면 `admin-register-modal.tsx`

**예시 payload:**

```json
{
  "email": "admin@example.com",
  "rawPassword": "admin@example.com",
  "name": "홍길동",
  "phone": "01012345678",
  "gender": "M",
  "birthDate": "1990-01-01",
  "roleCode": "VIEWER",
  "reason": "CMS 관리자 회원 신규 등록",
  "termsAgreements": [
    { "termsType": "SERVICE_TERMS", "version": "2026-01", "required": true, "agreed": true },
    { "termsType": "PRIVACY_COLLECTION", "version": "2026-01", "required": true, "agreed": true },
    { "termsType": "MFA_SETUP_CONSENT", "version": "2026-01", "required": true, "agreed": true },
    { "termsType": "MARKETING", "version": "2026-01", "required": false, "agreed": false }
  ]
}
```

등록 직전 `GET /api/public/terms-documents/{termsType}/current` 로 **version** 갱신 가능 (`resolvePreRegisterTermsAgreementVersions`).

### 4.3 BE 확인·수정 요청

1. `POST /api/admin/admin-accounts` 수신 시 `termsAgreements` **4건 모두 동의 원장(consent)에 persist** 하는지 확인.
2. `agreed: false` (마케팅)도 **미동의 상태로 저장**되는지 확인.
3. 저장 후 `GET /api/admin/admin-accounts/{adminAccountId}/consent-records` 로 **round-trip** 검증.
4. validation: 필수 3건 `agreed: false` → 4xx · 선택 `MARKETING` `agreed: false` → **등록 성공**.

---

## 5. 이슈 4 — 관리자 상세 조회 누락 필드 (P0)

### 5.1 현상

`GET /api/admin/admin-accounts/{adminAccountId}` (`AdminAccountApprovalDetailResponse`) 조회 시:

| 필드 | 문제 |
|------|------|
| **약관별 동의 여부** | 응답에 **`termsAgreements` 없음** (필드 자체 부재) |
| **`birthDate`** | **`null`** 로 내려옴 · 마스킹 해제(`POST …/privacy/unmask`) 후에는 **정상 값** 확인됨 → **마스킹 대상 아님** |

CMS 상세 **약관 및 동의** 섹션은 상세 본문의 `termsAgreements`를 SSOT로 사용하며, 없을 때만 `consent-records` fallback. 관리자 상세는 **별도 consent API 연동 전**이라 UI에 동의 상태가 비어 있음.

### 5.2 FE 기대

**옵션 A (권장):** 상세 응답에 회원 상세와 동일하게 **`termsAgreements[]`** 포함

```json
{
  "termsType": "SERVICE_TERMS",
  "version": "2026-01",
  "required": true,
  "agreed": true,
  "agreedAt": "2026-08-12T00:00:00Z"
}
```

관리자 고정 4종: `SERVICE_TERMS`, `PRIVACY_COLLECTION`, `MFA_SETUP_CONSENT`, `MARKETING`

**옵션 B:** 상세는 유지하고 FE가 `GET …/consent-records` 만 사용 — 이 경우 **consent-records가 등록 시 저장(§4)과 일치**해야 함.

**`birthDate`:** 등록 시 입력·저장된 값을 **마스킹 없이** 상세 GET에 포함 (`gender`와 동일 수준). PII 마스킹 대상에서 **제외**해 달 것.

### 5.3 수용 테스트

1. 관리자 등록(생년월일 입력) → 상세 GET → **`birthDate` 즉시 표시** (unmask 불필요).
2. 등록 시 약관 동의/미동의 → 상세 GET → **4종 동의 상태 일치**.
3. unmask API 호출 없이도 기본정보 탭 **성별·생년월일** 정상.

---

## 6. 이슈 5 — 관리자 등록 회원 최초 로그인 플래그 (P1)

### 6.1 배경

CMS에서 **관리자에 의해 등록**된 회원(`registeredByAdmin`, 본인 가입 절차 미완료)이 **포털(홈페이지) 최초 로그인** 시 아래 온보딩 플로우가 필요합니다.

### 6.2 제품 플로우 (SSOT)

1. **로그인**
2. **2단계 Authenticator(MFA) 인증**
3. **「관리자에 의해 가입된 회원입니다」** 안내 팝업
4. **생년월일·성별** 입력
5. **휴대폰 본인인증**
6. **비밀번호 변경** (초기 비밀번호 = 이메일 등)
7. **로그인 화면 이동** 또는 **소셜 계정 연동**

### 6.3 FE 현행

- Platform 로그인: `POST` Portal Auth → `AuthTokenResponse.passwordChangeRequired` 처리 중 (`sign-in/page.tsx`).
- `passwordChangeRequired === true` → `/auth/admin-registered/notice` wizard 진입.
- **미연동:** MFA 단계·단계별 resume·가입 완료 플래그(`identitySelfSignupCompletedAfterAdminRegistration`) — 대부분 mock/localStorage.

### 6.4 BE 요청

**로그인 성공 response** (`AuthTokenResponse` 또는 Portal 전용 확장)에 최초 로그인 분기용 플래그 포함:

| 필드 (안) | 타입 | 설명 |
|-----------|------|------|
| `passwordChangeRequired` | `boolean` | *(기존)* 임시 비밀번호·최초 변경 필요 |
| `adminProvisionedOnboardingRequired` | `boolean` | 관리자 등록 회원 온보딩 미완료 |
| `adminProvisionedOnboardingStep` | `string?` | `MFA` \| `NOTICE` \| `PROFILE` \| `IDENTITY` \| `PASSWORD` \| `SOCIAL_LINK` \| `DONE` |
| `registeredByAdmin` | `boolean?` | 관리자 등록 여부 (참고) |
| `identitySelfSignupCompletedAfterAdminRegistration` | `boolean?` | 본인 가입·온보딩 완료 여부 |

**동작:**

- 온보딩 완료 전: 일반 홈 진입 **차단** · 해당 step부터 resume.
- 온보딩 완료 API(별도) 성공 시 `identitySelfSignupCompletedAfterAdminRegistration = true` · 이후 로그인은 일반 플로우.
- CMS 회원 상세 GET에도 동일 플래그 반영 (`UserResponse` 등).

**MFA:** CMS 관리자 계정 로그인과 포털 회원 로그인 **auth endpoint가 다를 경우** 각각 문서화.

---

## 7. 이슈 6 — 기본정보 PATCH로 선택 동의 수정 재허용 (P0 · FE/BE 공통)

### 7.1 배경·현상

- CMS **관리자 등록 회원** 상세(개인·강사)에서 약관·동의 **선택 항목**을 수정한 뒤 기본정보 저장으로 persist 해야 함.
- 최근 OpenAPI에서 `AdminMemberBasicInfoUpdateRequest.termsAgreements`가 **제거**됨 → `PATCH /api/admin/users/{memberId}`로 동의 갱신 **불가**.
- FE는 강사 상세 수정 경로에 `termsAgreements`를 실어 보내는 확장을 유지 중이나, 스펙상 필드는 없음.

### 7.2 제품 규칙 (FE/BE **동일** 적용)

| 구분 | `termsType` (canonical) | 상세에서 수정 |
|------|-------------------------|---------------|
| **필수 — 수정 불가** | `SERVICE_TERMS`, `PRIVACY_COLLECTION`, `MFA_SETUP_CONSENT` | 수정 모드에서도 **라디오 노출 + disabled** · PATCH에 포함해도 **서버 무시 또는 4xx** |
| **선택 — 수정 가능** | `MARKETING`, `PORTRAIT_RIGHTS`, `PAYMENT_STATEMENT_PRE_CONSENT`, `FACILITATOR_PLEDGE`, `ADMINISTRATIVE_INFO_CONSENT`, `CRIMINAL_HISTORY_CHECK_CONSENT` 등 정책상 선택 항목 | 동의/미동의 변경 후 기본정보 저장으로 persist |

- 가입·등록 시점의 **필수 동의 원장**은 유지한다 (관리자가 사후 철회·변경 불가).
- 선택 항목만 `agreed` 갱신. `version`은 기존 원장 유지 또는 current terms version 정책에 따름(서버 확정).

### 7.3 BE 요청

1. `AdminMemberBasicInfoUpdateRequest`에 **`termsAgreements?: TermsAgreementRequest[]` 복구** (OpenAPI 반영).
2. `PATCH /api/admin/users/{memberId}` 처리:
   - **선택** `termsType`만 동의 원장 upsert.
   - **필수** `termsType`이 body에 있으면 **거부(권장 400)** 또는 **무시(문서화 필수)**. FE는 필수를 보내지 않음.
3. 저장 후 상세 GET / `consent-records` round-trip으로 선택 동의 상태 일치.
4. 대상: **개인·강사(교사겸 포함)** member PATCH · **관리자 계정** `PATCH …/admin-accounts/{id}/basic-info`  
   (`AdminAccountBasicInfoUpdateRequest.termsAgreements` — 선택 동의만, 필수 거부/무시).

**예시 (선택만 전송):**

```json
{
  "name": "홍길동",
  "termsAgreements": [
    { "termsType": "MARKETING", "version": "2026-01", "required": false, "agreed": true },
    { "termsType": "PORTRAIT_RIGHTS", "version": "2026-01", "required": false, "agreed": false }
  ]
}
```

### 7.4 FE 현행·후속

- FE 헬퍼: `member-basic-info-terms-patch.ts` — 필수 타입 상수·PATCH 필터.
- 관리자 등록 **개인** 상세: 정보 수정 시 선택 동의 라디오 편집 → draft → PATCH. 필수 약관은 라디오 **disabled**.
- 관리자 등록 **강사** 상세: 필수 약관 라디오 **disabled** · PATCH에서 필수 제외.
- **관리자 계정** 상세: 동일 UI(필수 disabled / 마케팅 편집) → `AdminAccountBasicInfoUpdateRequest.termsAgreements`.
- OpenAPI: `AdminMemberBasicInfoUpdateRequest` · `AdminAccountBasicInfoUpdateRequest` 모두 `termsAgreements` 포함.

### 7.5 수용 테스트

1. 필수 동의만 body에 넣어 PATCH → **400 또는 no-op**(문서와 일치) · DB 필수 원장 불변.
2. `MARKETING` 동의↔미동의 PATCH → 상세/consent-records 반영.
3. 개인·강사 각각 1회 이상 round-trip.

---

## 8. 영향 API 목록

| Method | Path | 관련 이슈 |
|--------|------|-----------|
| `POST` | `/api/admin/admin-accounts/bulk-delete` *(신규 요청)* | #1 |
| `DELETE` | `/api/admin/admin-accounts/{adminAccountId}` | #1 (단건, 유지) |
| `POST` | `/api/admin/users/bulk-delete` | #1 (member만) |
| `GET` | `/api/admin/users` | #2 |
| `GET` | `/api/admin/admin-accounts` | #2 |
| `POST` | `/api/admin/admin-accounts` | #3 |
| `GET` | `/api/admin/admin-accounts/{adminAccountId}` | #4 |
| `GET` | `/api/admin/admin-accounts/{adminAccountId}/consent-records` | #3, #4 |
| `POST` | `/api/admin/admin-accounts/{adminAccountId}/privacy/unmask` | #4 (birthDate 불필요화) |
| `POST` | Portal Auth login | #5 |
| `GET` | Portal Auth `/me` 또는 profile | #5 |
| `PATCH` | `/api/admin/users/{memberId}` (`termsAgreements` 복구) | #6 |

OpenAPI: `apps/cms/openapi/members.openapi.json` (v9)

---

## 9. BE 확인 체크리스트

- [x] **#1** 관리자 `adminAccountId[]` 일괄 삭제 API (또는 혼합 bulk-delete) — OpenAPI: `bulkDeleteAdmins` · `POST .../members/all/bulk-delete`
- [x] **#2** 전체 회원 목록 단일(또는 통합) API로 관리자 포함 · `adminAccountId` in list row — `GET /api/admin/members/all`
- [ ] **#3** `POST admin-accounts` → `termsAgreements` 4건 DB 저장 · consent-records round-trip
- [x] **#4** 상세 GET `termsAgreements` 포함 **또는** consent-records 신뢰 가능 — OpenAPI `AdminAccountApprovalDetailResponse.termsAgreements`
- [x] **#4** 상세 GET `birthDate` 마스킹 없이 반환 (unmask 불필요)
- [ ] **#5** 로그인 response 온보딩 플래그 · step · 완료 후 `identitySelfSignupCompletedAfterAdminRegistration` (Platform)
- [x] **#6** `AdminMemberBasicInfoUpdateRequest.termsAgreements` 복구 · 선택만 upsert · 필수 거부/무시 문서화
- [x] OpenAPI 갱신 → CMS members filter에 `/api/admin/members` 포함 · `generate:api`

---

## 10. FE 후속 (BE 반영 후)

| 이슈 | FE 조치 | 상태 |
|------|---------|------|
| #1 | `deleteUsersByListKind` — 탭별 bulk · SCHOOL `deleteSchool` · 혼합 `members/all/bulk-delete` | **완료** |
| #2 | `listAllCmsMembersAndAdmins` · `listAllAccounts` · FE merge 제거 | **완료** |
| #3 | 등록 E2E — 약관 4종 저장 후 상세 동의 섹션 검증 | 대기 |
| #4 | `map-admin-account-detail-to-user` · `termsAgreements` · `toApiBirthDate` | **완료** |
| #5 | Platform admin-registered wizard mock 제거 · login response 플래그 기반 분기 | 범위 밖 (Platform) |
| #6 | `AdminMemberBasicInfoUpdateRequestWithTerms` 제거 · 필수 필터 유지 | **완료** |

---

## 11. 참고 — 관련 정책·문서

- 약관 필수/선택: `.cursor/rules/terms-and-consent-policy.mdc`
- 관리자 등록 약관 4종: `build-pre-register-terms-agreements.ts` → `buildAdminAccountCreateTermsAgreements`
- pre-register 약관 정책 핸드오프: [members-pre-register-terms-required-policy-backend-request-2026-08-11.md](./members-pre-register-terms-required-policy-backend-request-2026-08-11.md)
- FE 필터: `apps/cms/src/features/user/api/member-basic-info-terms-patch.ts`

**Last updated:** 2026-08-13
