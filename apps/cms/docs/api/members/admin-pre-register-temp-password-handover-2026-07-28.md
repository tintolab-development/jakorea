# Handover: 관리자 사전등록 — 임시 비밀번호(`rawPassword`) 수용

**대상:** 백엔드  
**앱:** CMS (관리자) · Platform (회원·관리자등록회원 비밀번호 UX)  
**일시:** 2026-07-28  
**도메인:** `members` · 개인 / 강사 pre-register · 관리자 `createAdmin`  
**정책:** 관리자가 등록해 주는 회원은 **계정 아이디(email) = 임시 비밀번호** (모든 로그인 가능 회원 유형 공통)

**관련 API:**

| Method | Path | 스키마 | 현황 |
|--------|------|--------|------|
| `POST` | `/api/admin/…/pre-register/individual` (또는 동등) | `AdminPreRegisterIndividualRequest` | **`password` / `rawPassword` 없음** |
| `POST` | `/api/admin/instructors/pre-register` (또는 동등) | `AdminPreRegisterInstructorRequest` | **`password` / `rawPassword` 없음** |
| `POST` | `/api/admin/admin-accounts` | `AdminAccountCreateRequest` | ✅ 이미 `rawPassword` 수용 — **비밀번호 정책 불일치 (§2.4)** |
| `POST` | `/api/admin/…/pre-register/school` | `AdminPreRegisterSchoolRequest` | 기관은 로그인 email 미사용 — **본 요청 대상 아님** |

**관련 FE:**

- 규칙 헬퍼: `apps/cms/src/features/user/lib/admin-provisioned-temp-password.ts`
- 공통 적용: `apps/cms/src/entities/user/api/user-service.ts` → `createUser` (email 있으면 password = email)
- 호출: 개인 `add-user-individual.tsx` · 강사/관리자 `user-list-page.tsx`
- 매핑: `apps/cms/src/features/user/api/map-pre-register-request.ts` — **OpenAPI에 필드 생기면 `rawPassword` 전송 예정**
- Platform 비밀번호 검증: `apps/platform/src/features/auth/sign-up/lib/utils.ts` → `isValidPassword`

---

## 1. 요약

CMS는 관리자 사전등록 시 임시 비밀번호를 **계정 아이디(email)와 동일**하게 둡니다.

- **관리자:** `createAdmin` → `rawPassword`로 이미 전송 중 (값 = email)
- **개인·강사:** FE는 동일 규칙으로 password를 준비하지만, pre-register 요청 스키마에 필드가 없어 **서버로 전달되지 않음**
- **학교(기관):** 로그인 계정/email 없음 → 임시 비밀번호 발급 대상 아님 ([school handover](./school-pre-register-list-detail-handover-2026-07-28.md))
- **비밀번호 정책:** 서버가 **최소 12자**를 강제해 CMS 관리자 등록이 실패함 → **Platform과 동일 규칙(8자·영문·숫자·특수문자)으로 통일 요청** (§2.4)

---

## 2. 서버 수정 요청

### 2.1 요청 스키마

`AdminPreRegisterIndividualRequest` · `AdminPreRegisterInstructorRequest`에 다음을 추가:

| 필드 | 타입 | required | 설명 |
|------|------|----------|------|
| `rawPassword` | `string` | **yes** (로그인 계정 발급 시) | 초기(임시) 비밀번호. CMS는 **email과 동일 값**을 보냄 |

필드명은 관리자 계정과 맞춰 **`rawPassword`** 를 권장합니다. (`password`로 통일해도 되나 OpenAPI·문서에 하나로 고정 부탁)

### 2.2 서버 동작

1. pre-register 시 `rawPassword`를 받아 **회원 로그인 초기 비밀번호로 저장**(해시)
2. 계정 아이디는 기존과 같이 `email`
3. 로그인 가능 여부·강제 비밀번호 변경 정책이 있으면 문서화 (예: 최초 로그인 시 변경 유도)
4. OpenAPI 반영 후 FE `generate:api` → mapper에 `rawPassword` 연결
5. 비밀번호 검증은 **§2.4 Platform 규칙**을 모든 등록·변경 path에 동일 적용

### 2.3 요청 예시 (개인·강사·관리자 공통 패턴)

```json
{
  "email": "member@example.com",
  "rawPassword": "member@example.com",
  "name": "홍길동"
}
```

`rawPassword` **값 = `email`** (계정 아이디 = 임시 비밀번호).

### 2.4 비밀번호 정책 — Platform과 통일 (P0)

#### 관측 (CMS 관리자 신규 등록, 2026-07-28)

- API: `POST /api/admin/admin-accounts` (`createAdmin`)
- FE: `rawPassword` = 등록 email (계정 아이디 = 임시 비밀번호)
- 응답 예:

```json
{ "message": "Password must be at least 12 characters." }
```

OpenAPI/`AdminAccountPasswordResetRequest` 등에도 **「12자 이상 · 대/소문자·숫자·특수문자 중 3종」** 문구가 있어 Platform UX와 불일치합니다.  
또한 `AdminAccountCreateRequest` 주석의 **「이메일과 달라야 함」** 은 FE 정책(email = 임시 비밀번호)과 **정면 충돌**합니다.

#### 목표 규칙 (Platform 기준)

| 항목 | 내용 |
|------|------|
| 안내 카피 | **영문, 숫자, 특수문자를 조합해 8자 이상 입력해 주세요.** |
| 최소 길이 | **8자** |
| 조합 | 영문(대/소 구분 없이 1자 이상) + 숫자 1자 이상 + 특수문자(`[^A-Za-z0-9]`) 1자 이상 |
| Platform 검증 | `/^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/` (`isValidPassword`) |
| 적용 화면 | Platform 회원가입·비밀번호 찾기·관리자등록회원 비밀번호 변경 등 |

#### 서버 수정 요청

1. **관리자 계정 생성** (`createAdmin` / `rawPassword`) 검증을 위 Platform 규칙으로 변경 (최소 12자 → **최소 8자 + 영문·숫자·특수문자**)
2. **회원 signup / 비밀번호 변경 / 관리자 비밀번호 초기화** 등 동일 도메인 정책도 Platform과 **한 규칙으로 통일** (지금처럼 path마다 12자·3종 조합이 남아 있으면 CMS·Platform UX가 계속 갈라짐)
3. **관리자 사전등록 임시 비밀번호 = email 허용**  
   - OpenAPI·검증에서 「email과 달라야 함」 제약을 **제거 또는 사전등록/createAdmin에 한해 예외**  
   - email에 `@` 등이 포함되면 Platform 특수문자 조건은 대체로 충족 가능. **8자 미만 email**은 FE/기획에서 별도 가드 필요 시 회신 부탁
4. 에러 메시지를 가능하면 한글 안내와 맞추기:  
   `영문, 숫자, 특수문자를 조합해 8자 이상 입력해 주세요.`
5. OpenAPI 주석(`AdminAccountCreateRequest`, `AdminAccountPasswordResetRequest` 등) 갱신 후 FE codegen

#### 수락 기준 (정책)

1. `createAdmin`에 `rawPassword = email`(8자 이상·영문·숫자·특수문자 포함 예: `member@example.com`) 으로 **200/성공**  
2. 12자 미만이어도 Platform 규칙을 만족하면 **거부하지 않음**  
3. Platform 회원가입·비밀번호 변경과 **동일 규칙·동일(또는 동등) 에러 메시지**

---

## 3. FE 현황 / 서버 반영 후 작업

| 구분 | 상태 |
|------|------|
| CMS UI·`createUser` 규칙 (email = temp password) | ✅ 적용됨 |
| 관리자 `createAdmin.rawPassword` | ✅ 전송 중 — **서버 12자 정책으로 실패 관측** |
| 개인·강사 pre-register body에 `rawPassword` | ❌ 스키마 부재로 미전송 |
| OpenAPI + mapper 연결 | 서버 반영 후 FE 후속 |
| CMS/Platform FE 비밀번호 검증 카피 정렬 | 서버 §2.4 반영 후 CMS 셀프가입(12자) 문구도 Platform(8자)에 맞출지 확인 |

---

## 4. 수락 기준

1. 개인 pre-register에 `rawPassword` 수용·저장 → 해당 email / rawPassword로 로그인 가능  
2. 강사 pre-register 동일  
3. OpenAPI `AdminPreRegisterIndividualRequest` / `AdminPreRegisterInstructorRequest`에 `rawPassword` 문서화  
4. (선택) `rawPassword` 누락 시 명확한 4xx  
5. **§2.4** 비밀번호 정책 Platform 통일 + email=임시비밀번호 허용 (`createAdmin` 포함)

---

## 5. 백엔드 회신 부탁

1. `rawPassword` 필드명·required 여부 확정  
2. 개인·강사 반영 ETA  
3. 최초 로그인 비밀번호 변경 강제 여부  
4. OpenAPI 배포 일정  
5. **§2.4** — 최소 8자·영문·숫자·특수문자로 통일 ETA / email=임시비번 허용 여부  
6. 관리자 비밀번호 초기화(`password-reset`)도 동일 규칙으로 바꿀지 확인

관련:

- [instructor-pre-register-detail-handover-2026-07-28.md](./instructor-pre-register-detail-handover-2026-07-28.md)
- [school-pre-register-list-detail-handover-2026-07-28.md](./school-pre-register-list-detail-handover-2026-07-28.md) (email optional · password N/A)
- [members-api-integration-2026-07-23.md](./members-api-integration-2026-07-23.md)

**Last updated:** 2026-07-28 (관리자 등록 12자 에러 → Platform 8자 규칙 통일 요청 §2.4 추가)
