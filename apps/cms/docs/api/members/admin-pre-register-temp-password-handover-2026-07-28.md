# Handover: 관리자 사전등록 — 임시 비밀번호(`rawPassword`) 수용

**대상:** 백엔드  
**앱:** CMS (관리자)  
**일시:** 2026-07-28  
**도메인:** `members` · 개인 / 강사 pre-register  
**정책:** 관리자가 등록해 주는 회원은 **계정 아이디(email) = 임시 비밀번호** (모든 로그인 가능 회원 유형 공통)

**관련 API:**

| Method | Path | 스키마 | 현황 |
|--------|------|--------|------|
| `POST` | `/api/admin/…/pre-register/individual` (또는 동등) | `AdminPreRegisterIndividualRequest` | **`password` / `rawPassword` 없음** |
| `POST` | `/api/admin/instructors/pre-register` (또는 동등) | `AdminPreRegisterInstructorRequest` | **`password` / `rawPassword` 없음** |
| `POST` | `/api/admin/admin-accounts` | `AdminAccountCreateRequest` | ✅ 이미 `rawPassword` 수용 |
| `POST` | `/api/admin/…/pre-register/school` | `AdminPreRegisterSchoolRequest` | 기관은 로그인 email 미사용 — **본 요청 대상 아님** |

**관련 FE:**

- 규칙 헬퍼: `apps/cms/src/features/user/lib/admin-provisioned-temp-password.ts`
- 공통 적용: `apps/cms/src/entities/user/api/user-service.ts` → `createUser` (email 있으면 password = email)
- 호출: 개인 `add-user-individual.tsx` · 강사/관리자 `user-list-page.tsx`
- 매핑: `apps/cms/src/features/user/api/map-pre-register-request.ts` — **OpenAPI에 필드 생기면 `rawPassword` 전송 예정**

---

## 1. 요약

CMS는 관리자 사전등록 시 임시 비밀번호를 **계정 아이디(email)와 동일**하게 둡니다.

- **관리자:** `createAdmin` → `rawPassword`로 이미 전송 중 (값 = email)
- **개인·강사:** FE는 동일 규칙으로 password를 준비하지만, pre-register 요청 스키마에 필드가 없어 **서버로 전달되지 않음**
- **학교(기관):** 로그인 계정/email 없음 → 임시 비밀번호 발급 대상 아님 ([school handover](./school-pre-register-list-detail-handover-2026-07-28.md))

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

### 2.3 요청 예시 (개인·강사 공통 패턴)

```json
{
  "email": "member@example.com",
  "rawPassword": "member@example.com",
  "name": "홍길동"
}
```

`rawPassword` **값 = `email`** (계정 아이디 = 임시 비밀번호).

---

## 3. FE 현황 / 서버 반영 후 작업

| 구분 | 상태 |
|------|------|
| CMS UI·`createUser` 규칙 (email = temp password) | ✅ 적용됨 |
| 관리자 `createAdmin.rawPassword` | ✅ 전송 중 |
| 개인·강사 pre-register body에 `rawPassword` | ❌ 스키마 부재로 미전송 |
| OpenAPI + mapper 연결 | 서버 반영 후 FE 후속 |

---

## 4. 수락 기준

1. 개인 pre-register에 `rawPassword` 수용·저장 → 해당 email / rawPassword로 로그인 가능  
2. 강사 pre-register 동일  
3. OpenAPI `AdminPreRegisterIndividualRequest` / `AdminPreRegisterInstructorRequest`에 `rawPassword` 문서화  
4. (선택) `rawPassword` 누락 시 명확한 4xx

---

## 5. 백엔드 회신 부탁

1. `rawPassword` 필드명·required 여부 확정  
2. 개인·강사 반영 ETA  
3. 최초 로그인 비밀번호 변경 강제 여부  
4. OpenAPI 배포 일정

관련:

- [instructor-pre-register-detail-handover-2026-07-28.md](./instructor-pre-register-detail-handover-2026-07-28.md)
- [school-pre-register-list-detail-handover-2026-07-28.md](./school-pre-register-list-detail-handover-2026-07-28.md) (email optional · password N/A)
- [members-api-integration-2026-07-23.md](./members-api-integration-2026-07-23.md)

**Last updated:** 2026-07-28
