# GET `/api/admin/me` 응답 보강 · 백엔드 전달 (내 정보 확인)

**작성일:** 2026-09-16  
**우선순위:** P1  
**요청 대상:** Admin Auth / Members · `GET/PATCH /api/admin/me` · (참고) `GET/PUT /api/admin/me/marketing-consent` · `POST /api/admin/me/sso/accounts`  
**FE 화면:** CMS 헤더 → **내 정보 확인** 모달 (`ProfileEditModal`)

이 문서만으로 구현·검수할 수 있다.

---

## 0. 질문에 대한 답 — PATCH 있는가?

**있다.** OpenAPI(`backend.openapi.json`) 기준:

| Method | Path | operationId | 비고 |
|--------|------|-------------|------|
| `GET` | `/api/admin/me` | `me` | 본인 프로필 조회 |
| **`PATCH`** | **`/api/admin/me`** | **`updateMe`** | 본인 부분 수정 |
| `GET` | `/api/admin/me/marketing-consent` | `marketingConsent` | 마케팅 동의만 조회 |
| `PUT` | `/api/admin/me/marketing-consent` | `updateMarketingConsent` | 마케팅 동의만 변경 |

`PATCH /api/admin/me` 요청 body (`AdminMeUpdateRequest`)는 현재 스키마상 다음만 허용한다.

```json
{ "name?": "string", "phone?": "string", "email?": "string" }
```

마케팅 동의 변경은 **`PATCH /api/admin/me`가 아니라** `PUT /api/admin/me/marketing-consent` 를 쓰는 계약이다.

> FE members Orval 서브셋(`members.openapi.json`)에는 `/api/admin/me` 경로가 빠져 있을 수 있다.  
> FE는 `GET`을 `fetchAdminMe()`(axios)로 호출 중. codegen 포함 여부는 별도 정리해도 된다.

---

## 1. 무엇을 바꾸는가 (이번 요청의 핵심)

CMS **내 정보 확인** 모달은 로그인 세션의 `GET /api/admin/me` 응답을 SSOT로 쓰고 싶다.  
지금 응답에는 프로필 표시에 필요한 필드가 부족하거나, 스키마에 있어도 실데이터가 비어 있어 FE가 `GET /api/admin/admin-accounts/{adminAccountId}`를 **추가 호출**하는 우회를 하고 있다.

| 화면 필드 | 필요한 데이터 | 현재 `AdminMeResponse` | 문제 |
|-----------|---------------|------------------------|------|
| 성명 / 연락처 / 이메일 / 가입일 | name, phone, email, createdAt | ✅ 스키마 있음 | — |
| 성별 및 생년월일 | gender, birthDate | ✅ 스키마 있음 | **실응답이 비어 있으면** `-` 표시 |
| 권한 유형 | roleCode (MASTER/PM/MIDDLE/PARTNER/VIEWER) | ✅ | — |
| 담당 프로그램 수 | active / total managed counts | ❌ 없음 | 상세 API에만 있음 |
| 약관·동의 4종 | termsAgreements[] | ❌ 없음 | 상세 API에만 있음 → 마케팅 라디오 오표기 |
| 연동 소셜 | `POST /api/admin/me/sso/accounts` 등 | — | **비마스터(뷰어·중간관리자) 연동 시 403** → §3.3 |

**요청:**  
1. `GET /api/admin/me` 응답을 관리자 계정 상세(`AdminAccountApprovalDetailResponse`)와 **본인 프로필에 필요한 범위로 정렬**한다. 특히 **`termsAgreements`** 와 **담당 프로그램 수**를 포함한다.  
2. **본인 소셜 계정 연동**은 역할(MASTER / 중간관리자 / 뷰어 등)과 무관하게 허용한다. (§3.3)

---

## 2. 현재 OpenAPI 계약 (AS-IS)

### 2.1 `GET /api/admin/me` → `AdminMeResponse`

```text
adminAccountId, uuid, email, name, phone,
gender, birthDate, status,
roleCode, roleName, mfaRequired, permissionCodes[],
lastLoginAt, createdAt, updatedAt
```

- `termsAgreements` **없음**
- managed program count **없음**

### 2.2 `PATCH /api/admin/me` → `AdminMeUpdateRequest`

```text
name?, phone?, email?
```

- 마케팅·약관·성별·생년월일 수정 필드 **없음** (의도일 수 있음)

### 2.3 마케팅 전용 API (이미 존재)

- `GET /api/admin/me/marketing-consent` → `AdminMarketingConsentResponse`  
  (`agreed`, `agreedAt`, `version`, …)
- `PUT /api/admin/me/marketing-consent` → body `{ agreed, version?, consentTextSnapshot? }`

### 2.4 상세 API (FE 우회 중)

- `GET /api/admin/admin-accounts/{adminId}`  
  → `termsAgreements[]` (SERVICE_TERMS, PRIVACY_COLLECTION, MFA_SETUP_CONSENT, MARKETING)  
  → `activeManagedProgramCount`, `totalManagedProgramCount`, …

---

## 3. 요청하는 TO-BE

### 3.1 `GET /api/admin/me` 응답 확장

`AdminMeResponse`에 아래를 **추가**한다. (기존 필드 유지)

#### A. `termsAgreements` (필수 · P0)

관리자 등록 약관 4종의 **최신 동의 상태**.  
상세 API와 **동일 스키마** (`AdminTermsAgreementResponse[]`)를 권장한다.

| termsType (또는 consentType) | 화면 라벨 | 편집 |
|------------------------------|-----------|------|
| `SERVICE_TERMS` | 서비스 이용약관 | 읽기 전용 |
| `PRIVACY_COLLECTION` | 개인정보 수집·이용 동의 | 읽기 전용 |
| `MFA_SETUP_CONSENT` | 2단계 인증(MFA) 설정 동의 | 읽기 전용 |
| `MARKETING` | 마케팅 제공 동의 | 화면에서 변경 가능 |

각 항목 최소 필드:

| 필드 | 타입 | 설명 |
|------|------|------|
| `termsType` 또는 `consentType` | string | 위 4종 |
| `version` | string? | 약관 버전 |
| `required` | boolean? | 필수 여부 |
| `agreed` | boolean | **true=동의, false=미동의** (null 금지 권장) |
| `agreedAt` | date-time? | 동의 시각 (미동의면 null 가능) |
| `sourceFlow` | string? | 가입/등록 경로 |

**규칙**

1. 4종이 **항상 배열에 존재**하면 FE가 샘플 폴백을 쓰지 않아도 된다.  
2. 마케팅 `agreed=false`인데 FE가 “동의”로 보이던 버그는, me에 terms가 없어 폴백한 것이 원인이다.  
3. `GET /api/admin/me`에 terms를 넣으면 FE는 **추가 상세 GET 없이** 모달을 채울 수 있다.

#### B. 담당 프로그램 수 (권장 · P1)

상세와 동일 키를 권장:

```text
activeManagedProgramCount?: number   // 진행 중
totalManagedProgramCount?: number    // 전체(과거 포함)
```

(이미 쓰는 별칭 `managedProgramCount`만 있을 경우, 문서에 매핑을 명시해 달라.)

#### C. gender / birthDate (확인 · P1)

스키마에는 이미 있다. **실응답에 항상 채워 주세요.**  
비어 있으면 내 정보 확인의 「성별 및 생년월일」이 `-`로 남는다.

권장 형식:

- `gender`: `M` | `F` (또는 상세와 동일한 코드; FE는 `M/F/MALE/FEMALE/남성/여성` 정규화 가능)
- `birthDate`: `YYYY-MM-DD`

---

### 3.2 `PATCH /api/admin/me` (변경 요청은 선택)

**현재 PATCH는 존재하며** name/phone/email만 받는다.  
내 정보 확인 모달의 기본 정보는 대부분 읽기 전용이고, 연락처는 본인인증 재인증 플로우를 탄다.

이번 핸드오프에서 PATCH body 확장은 **필수가 아니다.**  
다만 정책을 명확히 해 달라:

| 항목 | 권장 |
|------|------|
| 이름/이메일/전화 수정 | 기존 `PATCH /api/admin/me` 유지 또는 identity-contact API |
| 마케팅 동의 변경 | **`PUT /api/admin/me/marketing-consent` 유지** (PATCH me에 섞지 않음) |
| 필수 약관(서비스·개인정보·MFA) | 본인 PATCH로 변경 불가 |

---

### 3.3 본인 소셜 계정 연동 권한 수정 (필수 · P0)

**현상**

어드민 **마스터가 아닌** 계정(뷰어 · 중간관리자 등)으로 내 정보 확인에서 소셜 계정 연동을 시도하면 403이 난다.

```http
POST /api/admin/me/sso/accounts
```

```json
{
  "code": "PERMISSION_DENIED",
  "message": "이 작업을 수행할 권한이 없습니다.",
  "field": null
}
```

**요청**

- `/api/admin/me/sso/**` 는 **본인(self) 계정**에 대한 연동·조회·해제다.
- **roleCode가 MASTER가 아니어도**(VIEWER / MIDDLE / PM / PARTNER 등) 로그인된 관리자라면 본인 소셜 연동이 가능해야 한다.
- `ADMIN_WRITE`·마스터 전용 권한 체크를 본인 SSO 연동 경로에 걸지 말아 달라.
- OpenAPI상 `POST /api/admin/me/sso/accounts`는 「별도 세부 권한 없음」인데, 실제 응답이 `PERMISSION_DENIED`인 것과 맞지 않는다 → **구현을 계약에 맞게 수정**해 달라.

**기대 동작**

| 역할 | 본인 소셜 연동 (`POST /api/admin/me/sso/accounts`) |
|------|-----------------------------------------------------|
| MASTER | ✅ 허용 |
| 중간관리자 (MIDDLE / PM 등) | ✅ 허용 (현재 ❌ 403) |
| 뷰어 (VIEWER) | ✅ 허용 (현재 ❌ 403) |
| 파트너 등 기타 로그인 관리자 | ✅ 허용 (동일 정책) |

동일하게 본인 연동 플로우에 쓰이는 관련 API(`GET /api/admin/me/sso/accounts`, `DELETE …/{provider}`, `POST …/link/sessions/consume` 등)도 **본인 self 스코프**면 역할과 무관하게 허용인지 함께 확인해 달라.

---

## 4. FE 사용 시나리오

1. 로그인 / MFA 완료 후 `GET /api/admin/me` → 세션 하이드레이트  
2. 헤더 **내 정보 확인** 오픈  
3. 표시:
   - 기본 정보: me 응답 (gender/birthDate/roleCode/program counts)
   - 약관: me.`termsAgreements`
   - 마케팅 라디오: terms 중 `MARKETING.agreed`
4. 마케팅 변경 시: `PUT /api/admin/me/marketing-consent` → 성공 후 me 또는 marketing-consent 재조회

현재 FE 임시 우회: 모달 오픈 시 `GET /api/admin/admin-accounts/{adminAccountId}`.  
me가 보강되면 이 호출을 제거한다.

---

## 5. 응답 예시 (TO-BE)

```json
{
  "success": true,
  "data": {
    "adminAccountId": 162001,
    "uuid": "…",
    "email": "admin@example.com",
    "name": "홍길동",
    "phone": "01012345678",
    "gender": "M",
    "birthDate": "1990-09-15",
    "status": "ACTIVE",
    "roleCode": "PM",
    "roleName": "중간 관리자",
    "mfaRequired": true,
    "permissionCodes": ["dashboard.view"],
    "activeManagedProgramCount": 2,
    "totalManagedProgramCount": 5,
    "lastLoginAt": "2026-09-16T01:00:00Z",
    "createdAt": "2026-01-15T00:15:42Z",
    "updatedAt": "2026-09-16T01:00:00Z",
    "termsAgreements": [
      {
        "termsType": "SERVICE_TERMS",
        "version": "1.0",
        "required": true,
        "agreed": true,
        "agreedAt": "2026-01-15T00:15:42Z"
      },
      {
        "termsType": "PRIVACY_COLLECTION",
        "version": "1.0",
        "required": true,
        "agreed": true,
        "agreedAt": "2026-01-15T00:15:42Z"
      },
      {
        "termsType": "MFA_SETUP_CONSENT",
        "version": "1.0",
        "required": true,
        "agreed": true,
        "agreedAt": "2026-01-15T00:15:42Z"
      },
      {
        "termsType": "MARKETING",
        "version": "1.0",
        "required": false,
        "agreed": false,
        "agreedAt": null
      }
    ]
  }
}
```

---

## 6. 검수 체크리스트

- [ ] `GET /api/admin/me`에 `termsAgreements` 4종 항상 포함
- [ ] 마케팅 `agreed=false`인 계정으로 내 정보 확인 시 **미동의** 라디오 선택
- [ ] `agreedAt`이 있으면 `YYYY.MM.DD HH:mm:ss`로 표시 가능 (ISO date-time)
- [ ] `gender` · `birthDate` 실데이터 반환 (비어 있지 않음 — 등록 시 수집한 경우)
- [ ] (권장) `activeManagedProgramCount` / `totalManagedProgramCount` 반환
- [ ] `PATCH /api/admin/me`는 name/phone/email 동작 유지
- [ ] 마케팅 변경은 `PUT /api/admin/me/marketing-consent`로 가능 (기존 계약 유지)
- [ ] 온보딩 중(`passwordChangeRequired`) 403 정책은 기존과 동일
- [ ] **VIEWER / 중간관리자**로 `POST /api/admin/me/sso/accounts` 호출 시 **403 `PERMISSION_DENIED` 없음** (본인 연동 성공)
- [ ] MASTER 계정 소셜 연동은 기존과 동일하게 동작

---

## 7. BE 회신 요청

1. `GET /api/admin/me`에 `termsAgreements` 추가 **일정 / 가능 여부**  
2. managed program count 필드명 확정  
3. `gender`/`birthDate` 미적재 계정이 있으면 원인(미수집 vs 미매핑)  
4. members OpenAPI 서브셋에 `/api/admin/me` GET·PATCH 포함 여부  
5. `PATCH /api/admin/me` body 확장 계획이 있는지 (없으면 “마케팅은 PUT marketing-consent 고정”으로 문서화)  
6. **§3.3** 비마스터 본인 SSO 연동 403 — 원인(권한 가드 / `ADMIN_WRITE` 등)과 **수정 일정**

---

## 8. 관련 FE 코드

| 용도 | 경로 |
|------|------|
| me 조회 | `apps/cms/src/features/auth/api/fetch-admin-me.ts` |
| 세션 반영 | `apps/cms/src/features/auth/lib/apply-admin-me-to-session-user.ts` |
| 내 정보 확인 모달 | `apps/cms/src/shared/ui/profile-edit-modal.tsx` |
| 상세 우회 | `fetchAdminAccountDetailRemote` + `mapAdminAccountDetailToUser` |
| 소셜 연동 | `POST /api/admin/me/sso/accounts` (내 정보 확인 · 온보딩 공통) |

**Last updated:** 2026-09-16 (§3.3 비마스터 SSO 연동 403 추가)
