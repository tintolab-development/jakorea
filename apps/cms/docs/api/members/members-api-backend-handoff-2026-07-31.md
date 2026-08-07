# CMS 회원 관리 API — 백엔드 전달 (통합 · 2026-07-31)

JaKorea **CMS 회원 관리** LNB(회원 목록 · 권한 승인 · 권한 설정) FE 연동 기준 **백엔드 확인·구현 요청**을 **본 문서 하나**에 모았습니다.  
(2026-07-23·28·29 분할 handoff 내용 중 **아직 유효한 항목**과 **7/30·7/31 갱신**을 통합·반영했습니다.)

| 항목 | 값 |
|------|-----|
| **작성일** | 2026-07-31 |
| **대상 BE** | `members` · `admin-accounts` · `instructor-role-requests` · `admin-approval-requests` · (unmask 감사로그) `logs` |
| **FE 앱** | `apps/cms` |
| **OpenAPI snapshot** | `apps/cms/openapi/members.openapi.json` (선택 첨부) |
| **전달 방식** | 본 파일 + (선택) OpenAPI JSON — **추가 handoff md 불필요** |

---

## 0. TL;DR (BE 액션)

1. **P0 — 관리자 회원 개인정보 unmask**  
   관리자 상세는 `admin-accounts` 축인데 unmask만 members/`users` legacy로 떨어져 **401/404**.  
   → 아래 **§2 Option A(권장) 또는 Option B** 중 **하나** 확정·구현·OpenAPI 반영.
2. **P0 — 관리자 코멘트**  
   `GET/POST /api/admin/users/{memberId}/comments` 는 **숫자 memberId** 필요. admin-accounts 상세에 memberId 없으면 코멘트 조회·저장 불가 → §2.3.
3. **P0 — 강사 권한 박탈 목록**  
   revoke 성공 후 목록 item에 `instructorStatus=REVOKED`(또는 `revokedAt`) 미하달 → 새로고침 시 UI 회귀 (§3.1).
4. **P0~P1 — 역할별 등록·상세 path 분리(B안)** · 마스킹 · pre-register — §4~§5 (2026-07-23 이후 미해결 항목 유지).
5. **P0 — CMS 관리자 등록 약관 `termsAgreements`** — 학교/강사/관리자/개인 **4유형** round-trip · `consent-records` — §4.1 · [강사 handoff §3.4](./instructor-pre-register-detail-roundtrip-handoff-2026-08-06.md#34-관리자-등록--약관동의-p0)
6. **P0 — unmask `reason` 최소 길이** — OpenAPI `minLength: 5` → **1** 허용 (§2.7)
7. **P0 — API 에러 메시지 사용자 문구** — CMS·Platform 공통 ([backend-handoff §에러 응답](../backend-handoff.md#에러-응답--사용자-노출-메시지-p0--cms--platform-공통))

FE는 BE가 §2 확정 후 Orval 재생성 → admin unmask·코멘트 분기 연동 예정.

---

## 1. FE 현행 연동 (2026-07-30 기준)

### 1.1 관리자 회원 — `admin-accounts` 축 (7/30 전환 완료)

| 화면/동작 | FE 호출 (현행) | 식별자 |
|-----------|----------------|--------|
| 관리자 **목록** (`kind=admins`) | `GET /api/admin/admin-accounts` | `adminAccountId` (= item.id), `User.id` = uuid 또는 `admin-account-{id}` |
| 관리자 **상세** | `GET /api/admin/admin-accounts/{adminId}` | URL/목록 id(uuid) → `adminId` 해석 |
| 관리자 **기본정보 저장** | `PATCH /api/admin/admin-accounts/{adminId}/basic-info` | `adminAccountId` |
| 관리자 **권한 유형** | `PATCH /api/admin/admin-accounts/{adminId}/role` | `adminAccountId` |
| 관리자 **삭제** | `DELETE /api/admin/admin-accounts/{adminId}` | `adminAccountId` |
| 관리자 **신규 등록** | `POST /api/admin/admin-accounts` | pre-register **미사용** |

**주의:** 위 경로는 **`memberId`(members 테이블 숫자 ID)를 쓰지 않습니다.**  
화면 `User.id`는 대개 **uuid** (`detail.uuid`)이며, 이는 **memberId와 다릅니다.**

### 1.2 그 외 회원 — `members` 축 (기존)

| 화면/동작 | FE 호출 |
|-----------|---------|
| 전체/개인/학교/강사 목록·상세 | `GET /api/admin/users` · `GET /api/admin/users/{memberId}/…` (역할별 path 분리 **예정**) |
| 개인정보 unmask (일반 회원) | `POST /api/admin/users/{memberId}/privacy/unmask` (역할별: `…/individual/…`, `…/instructor/…`) |
| 관리자 코멘트 | `GET/POST/PATCH /api/admin/users/{memberId}/comments` |
| 소속 교사 재직 | `PATCH …/affiliated-teachers/{teacherMemberId}/employment-status` |

### 1.3 FE 구현 위치 (참고)

| 주제 | 경로 |
|------|------|
| admin 상세·CRUD 분기 | `features/user/api/fetch-admin-member-detail.ts` · `entities/user/api/user-service.ts` |
| admin 목록 매핑 | `features/user/api/map-admin-account-list-item-to-user.ts` |
| 개인정보 unmask | `features/user/detail/lib/use-personal-info-reveal.ts` · `features/user/api/member-privacy-unmask.ts` · `features/logs/api/privacy-unmask-fetcher.ts` (legacy) |
| 등록 (임시 단일 pre-register) | `features/user/api/map-pre-register-request.ts` |

---

## 2. P0 — 관리자 회원 개인정보 unmask (7/30 블로커)

### 2.1 증상

- 화면: **관리자 회원 목록** → 상세 → 「개인정보 상세보기」
- 네트워크: `POST /api/users/{uuid}/privacy/unmask` (legacy logs 경로)  
  예: `POST /api/users/a1c1b91b-d1ce-4bec-a192-8b3290113227/privacy/unmask`
- 기대 members 경로: `POST /api/admin/users/{memberId}/privacy/unmask` — **숫자 memberId** 필요
- OpenAPI: **`/api/admin/admin-accounts/{adminId}/privacy/unmask` 없음**

### 2.2 원인 (FE 관점)

1. 관리자 상세는 **`adminAccountId`** 로 `admin-accounts` API 사용 (§1.1).
2. `AdminAccountListItemResponse` · `AdminAccountApprovalDetailResponse` 에 **`memberId` 필드 없음**.
3. unmask 분기: 숫자 `memberId` 없으면 uuid를 legacy `/api/users/{id}/privacy/unmask` 로 전달 → **관리자 계정 uuid는 members unmask 대상이 아님**.

### 2.3 BE 선택 — Option A vs Option B (택 1)

FE는 **어느 쪽이든** Orval 재생성 후 연동 가능. **일관성상 Option A 권장.**

#### Option A (권장) — admin-accounts 전용 unmask

| | |
|---|---|
| **Path** | `POST /api/admin/admin-accounts/{adminId}/privacy/unmask` |
| **Body** | `{ "reason": string }` (감사로그 사유, members unmask와 동일 정책) |
| **Response** | unmask된 관리자 기본정보 DTO (최소: `phone`, `email`, `birthDate`, `gender` 등 상세 화면에 쓰는 필드) |
| **권한** | CMS 관리자 · `PRIVACY_RAW_READ` (또는 members unmask와 동급) |
| **감사로그** | members unmask와 동일 — **실패 시 요청 차단** |
| **장점** | 상세·저장·삭제·role과 **동일 adminId 축** · member 레코드 없는 순수 CMS 관리자 계정도 처리 가능 |

**FE 후속:** `role === 'ADMIN'` && `adminAccountId` 있으면 위 path 호출. legacy `/api/users/{uuid}` **admin 에 대해 사용 중단**.

#### Option B — admin-accounts 응답에 memberId 연동

| | |
|---|---|
| **Path 변경 없음** | 기존 `POST /api/admin/users/{memberId}/privacy/unmask` (또는 ADMIN 전용 path가 있으면 명시) |
| **요청** | 아래 API 응답에 **숫자 `memberId`** 포함 (admin 계정 ↔ members row 1:1 가정) |
| | · `GET /api/admin/admin-accounts` list item |
| | · `GET /api/admin/admin-accounts/{adminId}` detail |
| | · (선택) `POST /api/admin/admin-accounts` create 응답 |
| **장점** | 기존 members unmask·comments API 재사용 |
| **조건** | **모든** CMS 관리자 계정에 members `memberId`가 **항상** 존재해야 함. 없는 계정이 있으면 Option A 필요 |

**FE 후속:** 목록·상세 매핑에 `memberId` 저장 → unmask·코멘트에 동일 id 사용.

### 2.4 동반 요청 — 관리자 코멘트 (memberId 의존)

| API | 현행 | 문제 |
|-----|------|------|
| `GET /api/admin/users/{memberId}/comments` | memberId | admin-accounts 상세에 memberId 없으면 **조회 skip/mock** |
| `POST/PATCH …/comments` | memberId | 저장 **실패·무반영** |

- **Option A 채택 시:** `POST /api/admin/admin-accounts/{adminId}/comments` (및 GET/PATCH) **추가** 또는 admin 코멘트를 admin-accounts DTO에 embed — BE 설계 선택.
- **Option B 채택 시:** §2.3의 `memberId` 하달로 **기존 comments API** 사용 가능.

### 2.5 수락 기준 (unmask)

- [ ] 관리자 회원 목록 → 상세 → 「개인정보 상세보기」 → **200** · 마스킹 해제된 연락처/이메일 등 표시
- [ ] **legacy** `POST /api/users/{uuid}/privacy/unmask` 로 admin uuid 호출 **불필요**
- [ ] 감사로그 저장 실패 시 unmask **4xx/5xx** (members와 동일)
- [ ] OpenAPI(members subset) 반영 → FE Orval 재생성

### 2.6 FE 재현

1. CMS 로그인 (관리자) → 회원 관리 → **관리자 회원 목록**
2. 임의 행 클릭 → 상세 → **개인정보 상세보기** → 사유 입력 → 확인
3. DevTools Network에서 unmask URL 확인 (현재: `/api/users/{uuid}/…` — 수정 후 Option A/B path)

### 2.7 unmask `reason` 길이 제한 (P0 · 2026-07-31 관측)

| | |
|---|---|
| **OpenAPI** | `AdminPrivacyUnmaskRequest.reason` — `minLength: 5`, `maxLength: 500` |
| **적용 path** | `POST …/users/{memberId}/privacy/unmask` · 역할별 `…/individual|instructor|school/…/privacy/unmask` · (Option A) `…/admin-accounts/{adminId}/privacy/unmask` |
| **증상** | CMS 「개인정보 상세보기」→ 사유 **1~4자** 입력 후 「정보 열람」→ **400** · 모달 **「열람 실패」** |
| **현재 BE 메시지 (그대로 UI 노출)** | `reason 크기가 5에서 500 사이여야 합니다` |
| **FE 동작** | `use-personal-info-reveal.ts` — `PrivacyUnmaskApiError.message`를 **가공 없이** alert 본문에 표시 |

**BE 요청**

1. `reason` **`minLength` 5 → 1** (또는 제거) — **1글자 이상**이면 unmask 허용. `maxLength: 500` 유지 가능.
2. OpenAPI `AdminPrivacyUnmaskRequest` · Bean Validation · 에러 메시지 **동시 갱신**.
3. 검증 실패 시 사용자 메시지 예: **`열람 사유를 입력해 주세요.`** / **`열람 사유는 500자 이내로 입력해 주세요.`** — [공통 에러 메시지 정책 §](../backend-handoff.md#에러-응답--사용자-노출-메시지-p0--cms--platform-공통)

**수락 기준**

- [ ] 사유 1글자(`"a"`) 입력 → unmask **200**
- [ ] 빈 문자열·공백만 → **400** + 사용자 문구 (필드명 `reason`·`minLength` **미노출**)
- [ ] 501자 이상 → **400** + 「500자 이내」 안내

---

## 3. P0 — 기타 운영 블로커 (7/29 관측 · 미해결)

### 3.1 강사 권한 박탈 — 목록 상태 미하달

| | |
|---|---|
| **증상** | `POST /api/admin/instructors/{memberId}/revoke` 성공 후 전체 목록에 잠시 `강사(권한박탈)` → **새로고침 시 다시 `강사`** |
| **원인** | 목록 item에 `instructorStatus=REVOKED` 또는 `revokedAt` 없음 |
| **요청** | `GET /api/admin/users` list item · 강사 목록 exclude 정책 · 상세 `instructorProfile.status` 정합 · OpenAPI enum |
| **기대 UI** | 전체 목록: `강사(권한박탈)` · 강사 전용 목록: **비노출** |

### 3.2 E2E 관측 (2026-07-29 · traceId 보관)

| Path | HTTP | 비고 |
|------|------|------|
| `POST …/instructors/{id}/evaluation-grade` | 500 `DATABASE_ERROR` | P0 |
| `GET /api/admin/users` (kind=all) | 500 | P0 |
| `GET …/users/{id}/school` (profile 없음) | 401 `School member profile not found` | **404 기대** (P1) |
| `POST …/pre-register/school` (email 공백) | 400 email 필수 | 학교 등록 email **optional** (P1) |

---

## 4. P0 — 등록·상세 API 역할별 분리 (canonical · 미해결)

**정책 (FE·BE 합의 유지):**

- **관리자:** 등록·목록·상세·CRUD = **`admin-accounts`** (pre-register **금지**)
- **개인·학교·강사:** 단일 `POST /api/admin/users/pre-register` 는 **임시** → **역할별 등록 path + 상세 GET path/DTO** 로 분리 (**B안**)

| CMS kind | 등록 (제안) | 상세 (제안) |
|----------|-------------|-------------|
| 개인 | `POST …/pre-register/individual` | `GET …/users/{memberId}/individual` |
| 학교(기관) | `POST …/pre-register/school` | `GET …/users/{memberId}/school` |
| 강사 | `POST …/pre-register/instructor` | `GET …/users/{memberId}/instructor` |
| 관리자 | `POST /api/admin/admin-accounts` (**유지**) | `GET /api/admin/admin-accounts/{adminId}` (**유지**) |

**추가:**

- 학교(기관) memberId vs 소속 교사 memberId · 관리자 코멘트 **저장 키 분리**
- `createAdmin` / admin 목록 / `GET users?role=ADMIN` **동일 계정 uuid·adminAccountId·(Option B 시) memberId** 정합
- pre-register 로 ADMIN 생성 시 **4xx**

### 4.1 CMS 관리자 등록 — 약관·동의 `termsAgreements` (P0)

**상세 (역할별 표·`termsType` 매핑·`consent-records` 요청):** [instructor-pre-register-detail-roundtrip-handoff §3.4](./instructor-pre-register-detail-roundtrip-handoff-2026-08-06.md#34-관리자-등록--약관동의-p0)

| 등록 유형 | CMS 화면 | FE → API (2026-07-31) | BE 잔여 |
|-----------|----------|------------------------|---------|
| **학교(기관)** | 약관 UI **없음** | 미전송 | OpenAPI `termsAgreements?`만 존재 · 정책·UI 확정 후 연동 |
| **강사** | 8건 (라디오 3 + 동의서 5) | **8건 전송** | pre-register 저장 → `GET …/consent-records` round-trip |
| **개인** | 8건 (강사와 동일) | **8건 전송** | 동일 |
| **관리자** | 4건 (MFA 포함) | **0건** — `AdminAccountCreateRequest`에 **`termsAgreements` 없음** | 스키마 추가 후 FE 연동 |

- FE 빌더: `apps/cms/src/features/user/api/build-pre-register-terms-agreements.ts`
- 동의서 작성형: 현재 `agreed: true`만 전송 — `formResponseId`·스냅샷은 BE API 확정 후
- 상세 동의 탭: `termsAgreements` → `consent-records` **`consentType` ↔ `termsType` 1:1** OpenAPI 명시

---

## 5. P1 — 목록·상세 DTO · 마스킹 · 필터

### 5.1 회원 정보 마스킹 (목록·상세 기본 응답)

「개인정보 상세보기」 전까지 아래 규칙 적용. unmask API 성공 시에만 원문.

| 항목 | 정책 |
|------|------|
| 회원명·성별 | **미마스킹** |
| 전화번호 | 가운데 4자리 `*` · `010-****-5678` |
| 이메일 | 로컬 앞 3글자 + `***@domain` (BE·기획 단일 규칙 확정) |
| 자택 주소 | 동(읍·면)까지 노출 · 이후 **블러** |
| 기관 주소 | **마스킹 없음** |
| 계좌 | 은행명 제외 · 번호 전부 `*` · 예금주 성만 |
| 1365 ID | 뒤 3자리 `*` |
| **강사 프로필 (비-PII)** | **마스킹 GET에서도 원문** — 아래 필드는 **CMS 화면 라벨과 API 키가 다름** ([강사 handoff §3.2](./instructor-pre-register-detail-roundtrip-handoff-2026-08-06.md#32-강사-프로필-공개-필드--마스킹-get-오적용-p0) 매핑표 참고) |
| | `careerText` → CMS 「강사 경력」(연차 요약) · `oneLineIntro` → 「한 줄 소개」 · `selfIntroduction` → 「자유작성 1」(≠ 한 줄 소개) · `educationLevel` → 「최종 학력」 코드 |

역할별 상세 DTO(M-P0-1) 확정 시 동일 정책 반복 명시. **`"마스킹"` placeholder 리터럴은 PII 필드에만** 사용.

### 5.2 기타 P1

| ID | 요청 |
|----|------|
| M-P1-1 | `affiliated-teachers` 행에 숫자 **`teacherMemberId`** (PATCH 필수) |
| M-P1-2 | 목록 고급 필터: 가입일·기관지역·JA등급·정산·adminPermissionVariant·순수강사 |
| M-P1-3 | `roleCode` / listMetrics 권한 표기 **SSOT** (MASTER/PARTNER/VIEWER) |
| M-P1-4 | 관리자 승인 **알림 재발송** API (`admin-approval-requests` 계열) |
| M-P1-5 | (선택) `GET users?role=ADMIN` 행에 **`adminAccountId`** — FE round-trip 감소 |

---

## 6. P2 — OpenAPI 있음 · FE UI 미배선 (참고)

신청/참여 이력 삭제 · program-roles · enrollment-summary · 강사 권한 박탈 UI · 수료증 일괄 · 동의서 public terms · PENDING 초기화 API 등 — **BE 우선순위 낮음**. 필요 시 별도 일정.

---

## 7. BE 확인 체크리스트 (통합)

### P0 (7/30)

- [ ] **§2** 관리자 unmask — **Option A 또는 B** 확정·구현·OpenAPI
- [ ] **§2.4** 관리자 코멘트 — Option에 맞는 API
- [ ] **§3.1** 강사 revoke 후 목록 `REVOKED` (또는 equivalent)
- [ ] **§4** 역할별 pre-register·상세 path (관리자 admin-accounts 유지)
- [ ] **§4.1** 등록 `termsAgreements` — **학교·강사·개인·관리자** 저장·`consent-records` round-trip ([instructor handoff §3.4](./instructor-pre-register-detail-roundtrip-handoff-2026-08-06.md#34-관리자-등록--약관동의-p0))
- [ ] **§2.7** unmask `reason` **minLength 1** · 사용자 친화 validation 메시지
- [ ] admin 계정 식별자 정합 (uuid · adminAccountId · memberId)

### P1

- [ ] **§5.1** 마스킹 필드 정책 OpenAPI 명시 · **강사 프로필 공개 필드 GET 원문** ([instructor handoff §3.2](./instructor-pre-register-detail-roundtrip-handoff-2026-08-06.md#32-강사-프로필-공개-필드--마스킹-get-오적용-p0))
- [ ] **§5.2** teacherMemberId · 필터 · roleCode · admin resend notification

---

## 8. FE 후속 (BE 납품 후)

1. `pnpm --filter cms filter:openapi:members` (또는 repo OpenAPI 갱신 절차) → Orval 재생성  
2. Option A: `unmaskAdminAccountPrivacyRemote` + `use-personal-info-reveal` ADMIN 분기  
3. Option B: `map-admin-account-*` 에 `memberId` 매핑 · registry 등록  
4. admin 코멘트 API 분기 · E2E `test:e2e:members` · 관리자 상세 수동 QA  

---

## 9. FE E2E · 로그

```bash
pnpm --filter cms test:e2e:members
pnpm --filter cms exec playwright test \
  tests/e2e/flows/members/admin-permission-type.spec.ts --project=chromium
```

- 터미널 `========== E2E 백엔드 에러 로그 ==========`
- `apps/cms/test-results/e2e-error-log-latest.json`
- `http://localhost:3000/e2e-error-log`

---

**Last updated:** 2026-07-31 (§2.7 unmask reason · §4.1 등록 약관 · [강사 handoff](./instructor-pre-register-detail-roundtrip-handoff-2026-08-06.md) cross-ref)  
**작성:** CMS FE (회원 관리 · admin-accounts 전환 · unmask 블로커 기준)
