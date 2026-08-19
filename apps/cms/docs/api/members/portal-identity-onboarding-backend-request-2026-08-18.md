# 백엔드 전달 — Portal 본인인증·온보딩·프로필 동기화 (2026-08-18)

CMS / Platform FE E2E에서 확인한 **서버 수정 요청**입니다.  
에러 메시지 노출 정책은 [backend-handoff §에러 응답](../backend-handoff.md#에러-응답--사용자-노출-메시지-p0--cms--platform-공통) · [Platform api-error-response-handoff](../../../platform/docs/api/api-error-response-handoff-2026-07-31.md) 와 동일합니다.

**관련 FE 경로**

- CMS 관리자 상세: `apps/cms/src/features/user/api/fetch-admin-member-detail.ts` · `map-admin-account-detail-to-user.ts`
- CMS 강사 소속 PATCH: `apps/cms/src/features/user/api/map-patch-user-basic-info.ts`
- Platform 관리자등록 온보딩: `apps/platform/src/pages/auth/admin-registered/**`
- Platform 마이페이지 수정: `apps/platform/src/features/mypage/settings/ui/edit-form.tsx`
- Portal PATCH 매핑: `apps/platform/src/features/auth/admin-registered/lib/map-profile-update.ts`
- Portal 로그인·에러: `apps/platform/src/features/auth/sign-in/api/client.ts` · `get-login-api-error-message.ts`

**관련 선행 문서**

- [admin-register-signup-type-portal-profile-backend-request-2026-08-14.md](./admin-register-signup-type-portal-profile-backend-request-2026-08-14.md) — Portal GET/PATCH 주소·소속·grade
- [admin-member-server-modification-request-2026-08-12.md](./admin-member-server-modification-request-2026-08-12.md) — 관리자 회원·포털 최초 로그인

---

## 우선순위 요약

| P | # | 요약 | 담당 |
|---|---|------|------|
| P0 | 5 | 온보딩 중도 이탈 후 재진입 시 `403 ADMIN_PROVISIONED_ONBOARDING_REQUIRED` — 온보딩 재개 불가 | **BE** (+ FE complete API 연동 예정) |
| P0 | 6 | 본인인증·비밀번호 변경 완료 후에도 로그인 응답 `identitySelfSignupCompletedAfterAdminRegistration: false` | **BE** |
| P0 | 3 | 관리자 등록 일반 회원 — Platform 주소 변경 `PATCH` **500** | **BE** (FE payload 정리 병행) |
| P1 | 1 | CMS **관리자 회원** 상세 — Portal 본인인증 후에도 `identityVerified: false` | **BE** |
| P1 | 2 | CMS 강사 소속 수정 → Platform GET 프로필 **구 소속** 노출 | **BE** |
| P1 | 4 | `POST /api/portal/auth/password/change` — 현재 비밀번호 오류 시 로그인 실패 문구 | **BE** |
| P1 | 7 | 기존 휴대폰 본인인증 **409** — 범용 `CONFLICT` 메시지 | **BE** |

---

## 1) CMS 관리자 회원 상세 — 본인인증 후 `identityVerified: false`

### 현상

CMS **관리자 회원 상세** 조회 시, 해당 관리자가 Platform에서 **최초 로그인 및 본인인증을 완료**했음에도 응답에 `"identityVerified": false` 가 내려옴.

### 재현 (요약)

1. CMS에서 관리자 계정 등록
2. 해당 계정으로 Platform 최초 로그인 · 본인인증 완료
3. CMS 관리자 회원 상세 재조회 → `identityVerified` 여전히 `false`

### 관련 API

| 구분 | API |
|------|-----|
| CMS 상세 | `GET /api/admin/admin-accounts/{adminId}` (`AdminAccountApprovalDetailResponse.identityVerified`) |
| Portal (본인인증 완료 시점) | 관리자 계정의 Portal 본인인증·최초 로그인 연동 API (BE 내부 흐름 확인 필요) |

### FE 기대

- CMS 목록·상세의 「본인인증 완료」·가입유형 라벨은 `identityVerified` 또는 `identitySelfSignupCompletedAfterAdminRegistration` 를 신뢰함.
- `resolve-member-registration-flags.ts`: `identityVerified === true` 를 관리자등록 후 자가가입 완료로 간주.

### 요청 (BE)

1. Portal 본인인증(및 최초 로그인) 성공 시 **관리자 계정 원장**에 `identityVerified = true` (및 필요 시 `verifiedAt` 등) 반영.
2. `GET /api/admin/admin-accounts/{adminId}` · 목록 `GET /api/admin/admin-accounts` 가 갱신된 값을 반환하는지 확인.
3. OpenAPI 예시·필드 설명에 「Portal 본인인증 완료 시 true」 명시.

### 수락 기준

- [ ] Portal 본인인증 직후 CMS 상세 재조회 → `identityVerified: true`
- [ ] 동일 관리자로 재로그인 후에도 CMS·Portal 플래그 일치

---

## 2) CMS 강사 소속 수정 — Platform 프로필 미동기화

### 현상

CMS에서 **강사 회원 등록** 후 **강사 소속을 수정**하면 CMS 상세에는 수정 후 소속이 정상 표시되나, 해당 계정으로 Platform 로그인·정보 조회 시 **수정 이전 소속**이 노출됨.

### 재현 (요약)

1. CMS 강사 pre-register / 상세에서 소속(학교·기관 등) 등록
2. CMS 강사 상세에서 소속 수정 · 저장 성공
3. Platform `GET /api/portal/me/profile` (및 마이페이지) → **이전 소속**

### 관련 API

| 구분 | API |
|------|-----|
| CMS 수정 | `PATCH /api/admin/users/{memberId}/basic-info` — `profile` (`InstructorCmsProfile`) · `affiliation` 등 |
| CMS 조회 | `GET /api/admin/users/{memberId}/instructor-profile` |
| Platform 조회 | `GET /api/portal/me/profile` — `affiliationName` · `schoolName` · `instructorProfile.profile` 등 |

### FE 기대

Platform 마이페이지·온보딩은 **Portal GET** 을 SSOT로 표시. CMS PATCH 성공 후 Portal GET이 stale 이면 사용자에게 구 데이터가 보임.

### 요청 (BE)

1. CMS 강사 소속(`InstructorCmsProfile.affiliation` / `organizationText` / `schoolOrganizationId` 등) 저장 시 **Portal 프로필 read model** 동기 투영.
2. `GET /api/portal/me/profile` 의 `affiliationName` · `schoolName` · `instructorProfile` 이 CMS 최신값과 일치하는지 검증.
3. 강사·교사·UJAT 등 역할별 투영 경로가 다르면 OpenAPI·문서에 매핑표 추가.

### 수락 기준

- [ ] CMS 소속 수정 → Platform GET 즉시(또는 동일 트랜잭션 후) 반영
- [ ] CMS 상세와 Platform 마이페이지 소속 문자열 일치

---

## 3) 관리자 등록 일반 회원 — Platform 주소 변경 시 500

### 현상

CMS에서 **일반(개인) 회원**으로 관리자 등록(pre-register)한 계정이 Platform **최초 로그인·온보딩**(또는 마이페이지 개인정보 수정) 중 **주소 변경** 저장 시 **`PATCH /api/portal/me/profile` → HTTP 500**.

(관련: 동일 API에서 validation 실패 시 **400**도 관측됨 — `teacherEmploymentStatus: ""` · `schoolOrganizationId: null` 등. 500은 서버/감사로그 쪽 의심.)

### 재현 (요약)

1. CMS 개인(일반) 회원 pre-register
2. Platform 관리자등록 온보딩 로그인 → 정보 확인/수정 화면에서 **주소만 변경** 후 저장
3. `PATCH /api/portal/me/profile` → **500**

### FE PATCH 예시 (주소 중심)

```json
{
  "postalCode": "04074",
  "address": "서울특별시 마포구 …",
  "addressDetail": "309호",
  "regionSido": "서울특별시",
  "regionSigungu": "마포구",
  "schoolEnrollmentStatus": "NOT_ENROLLED",
  "schoolOrganizationId": null,
  "schoolName": "",
  "grade": "",
  "affiliationName": "",
  "teacherEmploymentStatus": "",
  "external1365Id": "1233"
}
```

### 관련 API

- `PATCH /api/portal/me/profile` (`UpdatePortalProfileRequest`) — **감사로그 필수**, 실패 시 fail-closed → **500** 가능 (OpenAPI 설명)

### 요청 (BE)

1. **500 원인 로그** 공유 (stack trace · 감사로그 저장 실패 여부 · DB constraint).
2. 관리자등록 온보딩 중에도 주소·1365 ID 등 **허용 필드 PATCH** 가 성공해야 함 (§5 403과 연계).
3. validation 거부는 **400** + 구체 `error.code` / `error.field` (예: `PORTAL_PROFILE_*`).
4. (협의) 일반 회원 PATCH 시 `teacherEmploymentStatus` 빈 문자열 · `schoolOrganizationId: null` 수용 여부 — [2026-08-14 handoff §8](./admin-register-signup-type-portal-profile-backend-request-2026-08-14.md#8-일반-회원학교-소속--소속-해당-없음으로-변경-시-미반영) 참고.

### FE (참고, 별도 PR 예정)

- 일반 회원: `teacherEmploymentStatus` **omit**
- `external1365Id` 빈 값 omit (가입 API와 동일)

### 수락 기준

- [ ] 온보딩/마이페이지 주소 변경 PATCH → **200** + GET 재조회 일치
- [ ] 실패 시 500 대신 400 + 한국어 `error.message`

---

## 4) `POST /api/portal/auth/password/change` — 에러 메시지

### 현상

**현재 비밀번호가 틀릴 때** 응답 메시지가 로그인 실패와 동일하게  
`"이메일 또는 비밀번호를 확인해 주세요."` 로 내려옴.

Platform FE는 `error.message` 를 **그대로** 사용자에게 표시함 (`get-login-api-error-message.ts`).

### 관련 API

- `POST /api/portal/auth/password/change` (`PasswordChangeRequest`: `currentPassword`, `newPassword`)

### 요청 (BE)

1. **현재 비밀번호 불일치** 전용 `error.code` (예: `INVALID_CURRENT_PASSWORD` 또는 `PASSWORD_CURRENT_MISMATCH`).
2. **사용자 메시지** (예): `현재 비밀번호를 확인해 주세요.`
3. 로그인 API (`POST /api/portal/auth/login`) 과 **메시지·code 분리** — OpenAPI 4xx 예시 갱신.

### 수락 기준

- [ ] 의도적으로 틀린 `currentPassword` → 위 한국어 메시지 (로그인 문구 X)
- [ ] `newPassword` 정책 위반 등 다른 케이스도 case별 message

---

## 5) 관리자등록 온보딩 중도 이탈 — 재로그인·수정 시 403

### 현상

CMS **관리자가 등록한 회원**(일반·강사·교사 등)이 Platform **온보딩 도중 이탈** 후 다시 로그인하거나 개인정보 수정을 시도하면 **403**:

```json
{
  "code": "ADMIN_PROVISIONED_ONBOARDING_REQUIRED",
  "message": "…"
}
```

온보딩을 **마무리할 API 호출 자체가 막혀** 재진입 불가에 가까움.

### 관련 API·플래그

| API / 필드 | 용도 |
|------------|------|
| `POST /api/portal/auth/login` | `adminProvisionedOnboardingRequired`, `adminProvisionedOnboardingStep` |
| `PATCH /api/portal/me/profile` | 온보딩 중 정보 수정 |
| `PATCH /api/portal/auth/admin-provisioned/profile` | 생년월일·성별 확인 |
| `POST /api/portal/auth/admin-provisioned/identity/confirm` | NICE 본인인증 연결 |
| `POST /api/portal/auth/password/change` | 임시 비밀번호 변경 |
| `POST /api/portal/auth/admin-provisioned/complete` | 온보딩 최종 완료 |

`adminProvisionedOnboardingStep`: `PROFILE` · `IDENTITY` · `PASSWORD` · `PROFILE_REVIEW` · `DONE` (OpenAPI `AuthTokenResponse` 설명)

### FE 기대

- 재로그인 시 `adminProvisionedOnboardingStep` 으로 **미완료 단계 화면**으로 유도.
- 온보딩 완료에 필요한 API는 **403 없이** 호출 가능해야 함.
- 마이페이지 등 **일반 기능**만 온보딩 완료 전 제한하는 정책이면, 그 **allowlist**를 문서화.

### 요청 (BE)

1. `ADMIN_PROVISIONED_ONBOARDING_REQUIRED` 가 뜨는 조건·**차단 API 목록** 명시.
2. 온보딩 재개 시: 로그인 응답에 **정확한 step** + 해당 step에 필요한 API **허용**.
3. (정책) 온보딩 미완료 상태에서 `PATCH /api/portal/me/profile` · identity confirm · password change 는 **허용**할 것.
4. `POST /api/portal/auth/admin-provisioned/complete` 호출 전후 플래그 전이 정의.

### FE (참고)

- `complete.tsx` 가 현재 **`admin-provisioned/complete` 미호출** — BE 플래그 정합 후 FE에서 연동 예정.

### 수락 기준

- [ ] 온보딩 50% 이탈 → 재로그인 → step 기반 재개 **403 없음**
- [ ] 각 step API 성공 후 `adminProvisionedOnboardingStep` 갱신

---

## 6) 관리자등록 회원 — 완료 후에도 로그인 플래그 false

### 현상

CMS 관리자 등록 회원(전 유형)이 Platform에서 **본인인증 및 비밀번호 변경까지 완료**해도, 이후 `POST /api/portal/auth/login` (및 `GET /api/portal/auth/me`) 에서:

```json
{
  "identitySelfSignupCompletedAfterAdminRegistration": false
}
```

CMS 쪽 가입유형·「관리자 등록」 라벨이 **완료 후에도 미완료**로 남을 수 있음.

### 관련 API

| 시점 | API | 기대 필드 |
|------|-----|-----------|
| 본인인증 | `POST /api/portal/auth/admin-provisioned/identity/confirm` | `identityCompleted: true`, `identitySelfSignupCompletedAfterAdminRegistration` |
| 비밀번호 | `POST /api/portal/auth/password/change` | `passwordChangeRequired: false` |
| 최종 | `POST /api/portal/auth/admin-provisioned/complete` | `adminProvisionedOnboardingRequired: false`, `identitySelfSignupCompletedAfterAdminRegistration: true` |
| 로그인 | `POST /api/portal/auth/login` · `GET /api/portal/auth/me` | 동일 플래그 **true** |

### FE 기대 (`resolve-member-registration-flags.ts`)

```text
identitySelfSignupCompletedAfterAdminRegistration
  ← 명시 true OR identityVerified === true
```

### 요청 (BE)

1. identity confirm · password change · complete 각 단계에서 **원장·토큰 응답** 플래그 갱신.
2. complete 성공 시 `identitySelfSignupCompletedAfterAdminRegistration: true` **필수**.
3. `GET /api/admin/members/all` · member detail · admin-accounts 목록에도 동일 플래그 투영 ( [2026-08-14 §1–2](./admin-register-signup-type-portal-profile-backend-request-2026-08-14.md) ).
4. complete API의 **필수 선행 조건**(profile / identity / password) 문서화.

### 수락 기준

- [ ] 온보딩 전체 완료 → login/me → `identitySelfSignupCompletedAfterAdminRegistration: true`
- [ ] CMS 전체 회원 목록 「직접 가입」으로 전환 (관리자 등록 + 완료 케이스)

---

## 7) 기존 휴대폰 번호 본인인증 — 409 메시지

### 현상

**이미 등록된 휴대폰 번호**로 본인인증(가입·온보딩·마이페이지 번호 변경 등) 시 **409** 가 나오나, 화면에 그대로 노출되는 메시지가 범용적임:

```json
{
  "code": "CONFLICT",
  "message": "현재 상태에서는 요청을 처리할 수 없습니다."
}
```

Platform FE는 `error.message` 를 **번역 없이** 표시함.

### 관련 API (후보)

| API | 용도 |
|-----|------|
| `POST /api/portal/auth/admin-provisioned/identity/confirm` | 관리자등록 NICE 연결 |
| `POST /api/portal/me/phone/identity/confirm` | 마이페이지 연락처 변경 |
| `POST /api/homepage/**/signup` · identity confirm 계열 | 일반/교사 가입 |

(실제 409 발생 API path는 BE 로그로 확인 부탁.)

### 요청 (BE)

1. **중복 휴대폰** 전용 `error.code` (예: `PHONE_ALREADY_REGISTERED` · `IDENTITY_PHONE_CONFLICT`).
2. **사용자 메시지** (예): `이미 가입된 휴대폰 번호입니다. 다른 번호로 인증해 주세요.`
3. 범용 `CONFLICT` 는 개발자용으로 두더라도, 위 케이스는 **구분 code + 한국어 message** 필수.
4. OpenAPI 409 response 예시 추가.

### 수락 기준

- [ ] 타 계정에 등록된 번호로 인증 → 409 + 위 한국어 메시지
- [ ] FE 추가 가공 없이 사용자에게 이해 가능

---

## BE 회신 부탁 (공통)

1. §3 **500** stack trace / 감사로그 실패 여부  
2. §5 **403 allowlist** — 온보딩 중 허용 API 목록  
3. §6 complete API **필수 선행 조건** 및 플래그 갱신 시점  
4. §7 409 발생 **정확한 operationId**  
5. 수정 일정 · 스테이징 검증 계정 (관리자등록 일반 1 · 강사 1 · CMS 관리자 1)

---

## 验收 체크리스트 (BE)

- [ ] §1 CMS 관리자 상세 `identityVerified` Portal 연동
- [ ] §2 CMS 강사 소속 → Portal GET 동기화
- [ ] §3 일반 회원 주소 PATCH 200 (500 X)
- [ ] §4 비밀번호 변경 — 현재 비밀번호 오류 전용 message
- [ ] §5 온보딩 이탈 후 재진입 403 X
- [ ] §6 login `identitySelfSignupCompletedAfterAdminRegistration: true`
- [ ] §7 중복 휴대폰 409 한국어 message

**Last updated:** 2026-08-18
