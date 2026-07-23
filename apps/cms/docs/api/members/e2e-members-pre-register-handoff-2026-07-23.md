# 회원 사전등록(`pre-register`) · E2E 관측 갭 — 백엔드 수정 요청

CMS **회원 관리 → 회원 목록**(전체·학교·강사·관리자) E2E에서 확인된 등록·목록 계약 이슈입니다.  
(회원 **권한 관리** LNB는 E2E 범위에서 제외)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-07-20 (등록·상세 path 분리 정책: 2026-07-23) |
| **도메인** | `members` · `admin-accounts` |
| **우선순위** | **P0** |
| **현행 (임시) Method / Path** | `POST /api/admin/users/pre-register` · `AdminPreRegisterMemberRequest` |
| **BE 확정 방향 (canonical)** | **역할별 등록 path + 상세 GET path/DTO 분리** — [members-api-backend-handoff-2026-07-23.md](./members-api-backend-handoff-2026-07-23.md) **§2 M-P0-1** |
| **관련 계약** | [members-api-integration-2026-07-23.md](./members-api-integration-2026-07-23.md) · [members-api-backend-gaps-2026-07-23.md](./members-api-backend-gaps-2026-07-23.md) |
| **인덱스** | [e2e-backend-fixes-index.md](../e2e-backend-fixes-index.md) |
| **종합 핸드오프 (권장 전달본)** | [members-api-backend-handoff-2026-07-23.md](./members-api-backend-handoff-2026-07-23.md) |

> **2026-07-20 FE:** 관리자 신규 등록은 `POST /api/admin/admin-accounts` (`createAdmin`) 로 전환 — **관리자는 pre-register와 이미 분리**.  
> **2026-07-23 FE·BE 합의 (canonical):** 개인·학교·강사는 **등록·상세 API path 분리(B안)**. 단일 pre-register에 `role`만 추가하는 A안은 **본 문서·종합 핸드오프에서 canonical 아님**.

---

## 이슈 요약

| ID | 우선순위 | 증상 | E2E 영향 |
|----|----------|------|----------|
| **M1** | P0 (과거) | 관리자 등록 시 pre-register → `INTERNAL_SERVER_ERROR` (HTTP 500) | FE는 **createAdmin** 전환 · `admin-member-crud` **skip** (목록 정합 M-P0-2) |
| **M2** | P0 | 단일 `pre-register` + 단일 상세 DTO → kind별 필드·목록 필터 불일치 | 강사·학교는 **전체 회원 폴백** CRUD · kind 목록 미노출 |

---

## M1 — 관리자 신규 등록 (과거: pre-register 500 · 현재: createAdmin)

### 관측 (2026-07-20 E2E, **현재 FE는 pre-register 미사용**)

| | |
|---|---|
| **화면** | `/users/list?kind=admins` → 「관리자 등록」 |
| **과거 FE** | `preRegisterMemberRemote` → `POST …/pre-register` → **500** |
| **현행 FE** | `createAdminAccountRemote` → `POST /api/admin/admin-accounts` |
| **에러 코드 (과거)** | `INTERNAL_SERVER_ERROR` · `unexpected server error` |
| **관측 traceId (예)** | `097b0f775d264f12b33ae94a5c44714b` |

과거 응답 예시:

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

### BE 점검 요청 (관리자 — **admin-accounts 유지**)

1. **Canonical:** `POST /api/admin/admin-accounts` (`AdminAccountCreateRequest`) — OpenAPI·핸드오프에 명시  
2. `POST …/pre-register` 로 ADMIN 생성 시 **4xx** (500 대신 의도된 business error)  
3. `createAdmin` 응답 ↔ `GET /api/admin/users?role=ADMIN` **동일 memberId/uuid** — 종합 핸드오프 **M-P0-2**  
4. (과거 500) 동일 traceId 스택트레이스·`gender`/`birthDate` 파싱·중복 이메일 409/400 여부

### 수락 기준

| # | 기대 |
|---|------|
| 1 | CMS 「관리자 신규 등록」이 **createAdmin** 으로 성공 또는 의도된 4xx |
| 2 | 등록 계정이 `GET …/users?role=ADMIN` (및 admin-accounts)에 노출 |
| 3 | pre-register 경로로 ADMIN 시도 시 500 없이 **4xx + 가이드** |

---

## M2 — 개인·학교·강사 **등록·상세 path 분리** (canonical B안)

### 관측

OpenAPI `AdminPreRegisterMemberRequest` (단일 pre-register):

- `name` (필수), `email`, `phone`, `gender`, `birthDate`, `organizationText`, `oneLineIntro`, `external1365Id`
- **없음:** kind별 주소·NEIS·동의·강사 이력 등 — 화면과 DTO 불일치
- **없음:** `role` / `memberType` — FE 매퍼가 body에 넣지 못함 (`map-pre-register-request.ts`)

| CMS kind | 화면 | FE 의도 | E2E 목록 (현행) |
|----------|------|---------|-----------------|
| `all` | 회원 신규 등록 | INDIVIDUAL 계열 | 전체 회원 ✅ |
| `institutions` | 학교 신규 등록 | SCHOOL | kind 목록 미노출 가능 → **전체 회원 폴백** |
| `instructors` | 강사 추가 등록 | INSTRUCTOR | kind **0건** → **전체 회원 폴백** |
| `admins` | 관리자 등록 | ADMIN | **createAdmin** (M1 pre-register와 무관) |

상세: 단일 `GET /api/admin/users/{memberId}` — **학교(기관) vs 소속 교사** 코멘트·식별 축 혼선 위험 (종합 핸드오프 **M-P0-1**).

### BE 요청 (확정 — **B안만 canonical**)

**관리자:** 등록·상세 모두 **기존 분리 유지** (`admin-accounts` · ADMIN 목록/상세).

**개인 · 학교(기관) · 강사:** 역할별 **등록 POST path + 요청 스키마** · **상세 GET path + 응답 DTO**.

| CMS kind | 등록 API (제안) | 상세 API (제안) |
|----------|-----------------|-----------------|
| `all` | `POST …/pre-register/individual` (또는 `…/members/individual`) | `GET …/users/{memberId}/individual` |
| `institutions` | `POST …/pre-register/school` | `GET …/users/{memberId}/school` (+ affiliated-teachers) |
| `instructors` | `POST …/pre-register/instructor` | `GET …/users/{memberId}/instructor` (+ instructor-profile) |

- 단일 `POST /api/admin/users/pre-register` · `AdminPreRegisterMemberRequest` → **deprecated** 또는 individual 전용 한정 — BE 명시  
- **학교(기관) memberId** vs **소속 교사 memberId** · 관리자 코멘트 **별도 저장·조회**  
- ~~pre-register에 `role` 필드만 추가 (A안)~~ → **본 문서 canonical 아님**

**마스킹:** 목록·상세 기본 표시 규칙은 [members-api-backend-handoff-2026-07-23.md](./members-api-backend-handoff-2026-07-23.md) **§M-P1-5**.

상세 path·수락 기준 전체: [members-api-backend-handoff-2026-07-23.md](./members-api-backend-handoff-2026-07-23.md) **§2 M-P0-1**.

### 수락 기준

| # | 기대 |
|---|------|
| 1 | kind별 등록 후 **해당 kind 목록**에서 keyword 검색 1건 |
| 2 | OpenAPI에 역할별 등록·상세 스키마 → Orval · FE kind별 mapper 전환 가능 |
| 3 | 관리자는 pre-register 미사용 · createAdmin only |

---

## FE 임시 대응

| 항목 | 상태 |
|------|------|
| 관리자 CRUD E2E | `test.skip` (createAdmin ↔ 목록 정합 확인 전) |
| 강사·학교 CRUD E2E | kind 미노출 시 **전체 회원** RUD |
| 개인·학교·강사 등록 | 단일 `pre-register` + `map-pre-register-request.ts` (분리 path 전환 대기) |
| MFA 병렬 | `test:e2e:members --workers=1` |

---

## 재현

```bash
pnpm --filter cms test:e2e:members
# 관리자: skip
# 강사/학교: 통과(폴백) — M2 는 kind 목록 필터로 재확인
```

**Last updated:** 2026-07-23
