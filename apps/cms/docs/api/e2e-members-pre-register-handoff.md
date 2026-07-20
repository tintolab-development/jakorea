# 회원 사전등록(`pre-register`) · E2E 관측 갭 — 백엔드 수정 요청

CMS **회원 관리 → 회원 목록**(전체·학교·강사·관리자) E2E에서 확인된 `pre-register` 관련 이슈입니다.  
(회원 **권한 관리** LNB는 E2E 범위에서 제외)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-07-20 |
| **도메인** | `members` |
| **우선순위** | **P0** |
| **Method / Path** | `POST /api/admin/users/pre-register` |
| **OpenAPI schema** | `AdminPreRegisterMemberRequest` |
| **관련 계약** | [members-api-integration.md](./members-api-integration.md) · [members-api-backend-gaps.md](./members-api-backend-gaps.md) |
| **인덱스** | [e2e-backend-fixes-index.md](./e2e-backend-fixes-index.md) |
| **종합 핸드오프 (권장 전달본)** | [members-api-backend-handoff-2026-07-20.md](./members-api-backend-handoff-2026-07-20.md) |

> **2026-07-20 FE 업데이트:** 관리자 신규 등록은 `POST /api/admin/admin-accounts` (`createAdmin`) 로 전환했습니다. M1(pre-register 500)은 FE에서 우회했으나, **createAdmin ↔ users 목록 정합**과 **M2(role)** 는 여전히 BE 확인이 필요합니다. 종합본 §2 P0 참고.


---

## 이슈 요약

| ID | 우선순위 | 증상 | E2E 영향 |
|----|----------|------|----------|
| **M1** | P0 | 관리자 등록 시 `INTERNAL_SERVER_ERROR` (HTTP 500) | `admin-member-crud` **skip** |
| **M2** | P0 | `pre-register` 요청에 **role / memberType 없음** → SCHOOL·INSTRUCTOR·ADMIN 이 kind 목록에 안 뜸 | 강사·학교 등은 전체 회원으로 폴백해 CRUD |

---

## M1 — 관리자 신규 등록 → `INTERNAL_SERVER_ERROR`

### 관측

| | |
|---|---|
| **화면** | `/users/list?kind=admins` → 「관리자 등록」 → 「관리자 신규 등록」 |
| **FE 호출** | `createUser` → `preRegisterMemberRemote` → `POST …/pre-register` |
| **HTTP** | `500` |
| **에러 코드** | `INTERNAL_SERVER_ERROR` |
| **메시지** | `unexpected server error` |
| **관측 traceId (예)** | `097b0f775d264f12b33ae94a5c44714b` |
| **발생 시각 (예)** | 2026-07-20 (KST) E2E `admin-member-crud` |

응답 예시:

```json
{
  "success": false,
  "data": null,
  "message": "INTERNAL_SERVER_ERROR: unexpected server error",
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "unexpected server error",
    "field": null,
    "traceId": "097b0f775d264f12b33ae94a5c44714b"
  }
}
```

### FE가 보내는 값 (관리자 모달)

`handleAdminRegisterSubmit` → `mapCreateUserRequestToPreRegister`:

| UI | CreateUserRequest | pre-register body |
|----|-------------------|-------------------|
| 한글 성명 | `name` | `name` |
| 이메일 | `email` | `email` |
| 연락처 | `phone` (예: `01012345678`) | `phone` |
| 성별 | `gender`: `"남성"` / `"여성"` | `gender` |
| 생년월일 | `birthDate`: `YYYYMMDD` 8자리 | `birthDate` |
| 역할 | `role: 'ADMIN'` · `adminLevel` | **전송 안 됨** (스키마에 필드 없음) |

동의 항목은 FE 폼에만 있고 **pre-register body에는 포함되지 않습니다**.

### BE 점검 요청

1. 동일 `traceId` 서버 스택트레이스·원인 예외 공유  
2. `gender` 값 형식 (`남성`/`여성` vs `M`/`F`/`MALE`) 불일치 여부  
3. `birthDate` 형식 (`19900101` vs `1990-01-01`) 파싱 실패 여부  
4. 관리자 계정은 **`POST /api/admin/admin-accounts` (`createAdmin`)** 경로가 canonical 인지  
   - OpenAPI: 관리자 생성은 `AdminAccountCreateRequest` (`email`, `name`, `phone`, `gender`, `birthDate`, `roleCode` …)  
   - FE는 아직 목록 모달에서 `pre-register` 만 사용 → **BE가 pre-register 로 ADMIN을 받지 않는다면** 명확한 4xx + 가이드, 또는 pre-register 확장 / FE 전환 합의 필요  
5. 이메일 도메인·중복 제약으로 500이 나지 않는지 (기대: 409/400)

### 수락 기준

| # | 기대 |
|---|------|
| 1 | CMS 「관리자 신규 등록」 성공 (`success: true`) 또는 **의도된** business error (4xx) |
| 2 | 등록된 계정이 `GET …/users?role=ADMIN` (또는 admin-accounts 목록)에 노출 |
| 3 | 500 `INTERNAL_SERVER_ERROR` / `unexpected server error` 제거 |

---

## M2 — `AdminPreRegisterMemberRequest` 에 role 부재

### 관측

OpenAPI `AdminPreRegisterMemberRequest` 필드:

- `name` (필수)
- `email`, `phone`, `gender`, `birthDate`
- `organizationText`, `oneLineIntro`, `external1365Id`

**없음:** `role` / `primaryRole` / `memberType` / `adminLevel`

FE는 화면별로 `role: 'SCHOOL' | 'INSTRUCTOR' | 'ADMIN' | …` 를 넘기지만, 매퍼가 API body에 **넣지 못합니다** (`map-pre-register-request.ts`).

| 화면 kind | FE가 의도한 role | 실제 목록 노출 (E2E) |
|-----------|------------------|----------------------|
| `all` | INDIVIDUAL 계열 | 전체 회원에서 조회 가능 ✅ |
| `institutions` | SCHOOL (`organizationText` 설정) | kind 목록에 없을 수 있음 → **전체 회원 폴백** |
| `instructors` | INSTRUCTOR | kind 목록 **0건** → **전체 회원 폴백** ✅(폴백) |
| `admins` | ADMIN | M1(500)으로 등록 자체 실패 |

### BE 점검·제안

1. `pre-register` 에 **역할 지정 필드** 추가 (예: `role` / `roles[]` / `memberType`)  
   - 허용 값: `INDIVIDUAL` · `SCHOOL` · `INSTRUCTOR` · `ADMIN` (목록 kind 와 동일)  
2. 또는 역할별 **별도 생성 API** 를 canonical 로 문서화  
   - 학교: organization 전용  
   - 강사: instructor 전용  
   - 관리자: `POST /api/admin/admin-accounts`  
3. `organizationText` 만으로 SCHOOL 로 승격하는 규칙이 있다면 **OpenAPI·핸드오프에 명시**

### 수락 기준

| # | 기대 |
|---|------|
| 1 | 학교/강사/관리자 등록 후 **해당 kind 목록**에서 `keyword` 검색 시 1건 |
| 2 | FE가 role 을 body에 실어 보낼 수 있도록 스키마·Orval 반영 |
| 3 | role 없이 호출 시 기본값(INDIVIDUAL 등)을 문서화 |

---

## FE 임시 대응

| 항목 | 상태 |
|------|------|
| 관리자 CRUD E2E | `test.skip` (M1) |
| 강사·학교 CRUD E2E | kind 목록 미노출 시 **전체 회원**에서 RUD |
| MFA 병렬 | `test:e2e:members --workers=1` |

---

## 재현

```bash
pnpm --filter cms test:e2e:members
# 관리자: skip
# 강사/학교: 통과(폴백) — M2 는 목록 kind 필터로 재확인 가능
```

**Last updated:** 2026-07-20
