# 학교(기관) 상세 관리자 코멘트 404 · 관리자 본인 탈퇴 API · BE 수정 요청

**작성일:** 2026-09-07  
**요청 대상:** Members API · Admin comment · Admin self-withdraw  
**OpenAPI:** `apps/cms/openapi/members.openapi.json` · (포털 탈퇴 참고) `apps/cms/openapi/backend.openapi.json`

이 문서는 **같은 전달 묶음**의 BE 요청 2건입니다.

| 이슈 | 우선순위 | 요약 | 절 |
|------|----------|------|-----|
| **A** 학교 상세 관리자 코멘트 | **P1** | `GET/POST /api/admin/users/{organizationId}/comments` → **404** `ADMIN_COMMENT_TARGET_NOT_FOUND` | §1–§9 |
| **B** 관리자 본인 탈퇴 | **P1** | CMS 「내 정보 확인」 회원탈퇴용 **관리자 self-withdraw API 없음**. 기존 DELETE는 타인 삭제 전용·자기 자신 불가 | §10–§16 |

---

# 이슈 A — 학교(기관) 상세 관리자 코멘트 404

**관련 FE:** `resolve-admin-comment-resource.ts` · `members-api-client.ts` (`fetchMemberCommentsRemote` · `upsertMemberAdminCommentRemote`) · `use-member-detail-subresource-queries.ts` · `user-detail-fullpage-basic-tab-content.tsx`  
**OpenAPI:** `listMemberComments` · `createMemberComment` · `updateMemberComment`

---

## 1. 요약

학교(기관) 회원 상세에서 **관리자 코멘트** 조회·작성 시 **HTTP 404**가 발생합니다.

| API | 관측 |
|-----|------|
| `GET /api/admin/users/{id}/comments?screenCode=SCR_MEMBER` | **404** |
| `POST /api/admin/users/{id}/comments` | **404** |

```json
{
  "code": "ADMIN_COMMENT_TARGET_NOT_FOUND",
  "message": "요청한 정보를 찾을 수 없습니다."
}
```

**판단:** FE는 OpenAPI·학교 상세 계약에 맞게 **`organizationId`를 path `{id}`로 전달**하고 있습니다.  
BE가 path 값을 **회원 `memberId`만** 조회하는 것으로 보이며, 학교 organization 대상 코멘트를 찾지 못해 404를 반환하는 **서버 측 이슈**입니다.

`screenCode=SCR_MEMBER`는 개인·학교 상세 공통 값이며, 이번 404의 직접 원인은 아닙니다.

---

## 2. 재현

관리자 CMS, 실 API (`members` remote).

1. 회원 관리 → **학교(기관)** 목록/상세 진입 (예: `organizationId = 171503`).
2. 학교 상세 정보 탭 — **관리자 코멘트** 영역 로드.
3. Network 확인.

**기대:** 코멘트 목록 **200** (없으면 빈 배열). 작성 시 **200/201**.  
**실제:** 조회·작성 모두 **404** · `ADMIN_COMMENT_TARGET_NOT_FOUND`.

**예시 URL (관측):**

```
GET  /api/admin/users/171503/comments?screenCode=SCR_MEMBER
POST /api/admin/users/171503/comments
```

동일 학교의 다른 API는 정상인 경우가 많습니다 (아래 §5 참고).

---

## 3. FE 계약 (현재 구현)

### 3.1 path `{id}` — 회원 ID가 아님

OpenAPI path 파라미터 이름은 `memberId`이나, 설명은 **「대상 리소스 식별자 — 목록/상세 화면에서 받은 id」**이며 Swagger 메모에 **학교/회원 상세 관리자 코멘트**를 명시합니다.

FE SSOT (`resolve-admin-comment-resource.ts`):

| 역할 | path `{id}` |
|------|-------------|
| 일반·강사 등 `memberId` 있는 회원 | `memberId` |
| **학교(SCHOOL)** | **`organizationId`** (CMS 학교 organization PK) |
| legacy 학교 member (`organizationId` 없음) | `memberId` fallback |

```typescript
// 학교 organization
if (user.role === 'SCHOOL') {
  const organizationId = user.organizationId ?? parseOrganizationIdFromUserId(user.id)
  if (organizationId != null) {
    return { resourceId: organizationId, target: 'schoolOrganization' }
  }
}
```

학교 상세 User 모델:

- `id`: `organization-{organizationId}` (예: `organization-171503`)
- `organizationId`: 숫자 PK (예: `171503`)
- `memberId`: **없음** (organization-only 상세)

→ 코멘트 API에 **`171503` = organizationId** 전달이 **의도된 동작**입니다.

### 3.2 screenCode

| 값 | 용도 |
|----|------|
| `SCR_MEMBER` | 회원 관리 상세(개인·강사·**학교**) 관리자 코멘트 |

### 3.3 호출 흐름

```
학교 상세 진입
  → resolveAdminCommentResource(user)  // resourceId = organizationId
  → GET  /api/admin/users/{resourceId}/comments?screenCode=SCR_MEMBER
  → POST /api/admin/users/{resourceId}/comments  (작성)
     body: { "screenCode": "SCR_MEMBER", "comment": "..." }
```

코멘트 upsert: `upsertMemberAdminCommentRemote(resourceId, …)` — 주석에 **「학교는 organizationId를 전달」** 명시.

---

## 4. BE 요청 (필수)

다음 중 **하나**로 계약을 맞춰 주세요. (FE는 OpenAPI 확정 후 codegen·경로 분기만 조정)

### 옵션 A — 기존 path 유지 (권장 · OpenAPI와 일치)

`GET/POST/PATCH/DELETE /api/admin/users/{resourceId}/comments` 에서:

- `{resourceId}`가 **회원 `memberId`** 이면 기존 member 코멘트 대상
- `{resourceId}`가 **학교 `organizationId`** 이면 school organization 코멘트 대상

→ `171503`이 organization PK일 때 **404가 아닌 200** (목록) / 작성 성공.

### 옵션 B — 학교 전용 path 추가

예:

```
GET/POST /api/admin/organizations/schools/{organizationId}/comments?screenCode=SCR_MEMBER
```

FE는 학교일 때만 이 path 사용. (OpenAPI·codegen 갱신 필요)

### 옵션 C — 학교 상세 GET에 코멘트용 `memberId` 제공

학교가 별도 member row와 연결되어 있다면, 상세 응답에 **`commentTargetMemberId`** 등을 내려 FE가 그 ID로 기존 API 호출.

→ organization-only 모델이면 A 또는 B가 적합.

---

## 5. 대조 — 같은 학교 상세에서 동작하는 API

학교 상세는 **organization 중심** API가 이미 동작합니다. 코멘트만 member lookup으로 실패하는 패턴입니다.

| Method | Path (예) | FE 용도 |
|--------|-----------|---------|
| `GET` | `/api/admin/organizations/schools/{organizationId}` | 학교 상세 |
| `GET` | `/api/admin/organizations/schools/{organizationId}/teachers` | 소속 교사 |
| `GET` | `/api/admin/organizations/schools/{organizationId}/program-enrollment-history` | 수강 이력 |
| `PATCH` | `/api/admin/organizations/schools/{organizationId}` | 기본정보 수정 |

**확인:** 위 API가 `organizationId=171503`으로 **200**인데 코멘트만 404이면, BE 코멘트 resolver가 **member만 조회**하는 것이 원인입니다.

---

## 6. 수용 테스트

**Given:** CMS에 등록된 학교 organization `organizationId = 171503` (또는 스테이징 동등 데이터).

1. `GET /api/admin/users/171503/comments?screenCode=SCR_MEMBER` → **200**, `AdminCommentResponse[]` (없으면 `[]`).
2. `POST /api/admin/users/171503/comments`  
   `{ "screenCode": "SCR_MEMBER", "comment": "테스트 코멘트" }` → **200/201**.
3. (1) 재호출 → (2) 내용 포함.
4. 개인 회원 `memberId = M`에 대해 `GET /api/admin/users/M/comments?screenCode=SCR_MEMBER` → **기존과 동일 200** (회귀 없음).
5. 존재하지 않는 id → **404** + `ADMIN_COMMENT_TARGET_NOT_FOUND` (유지 가능).

---

## 7. 원인 가설 (BE 확인용)

1. Comment service가 path `{id}`를 **항상 `members.id`** 로만 resolve.
2. Admin comment 테이블에 **target type**(member vs school_organization) 구분 없이 member FK만 사용.
3. OpenAPI는 「대상 리소스 식별자」·학교 코멘트를 문서화했으나 **구현은 member-only**.
4. (legacy) 학교 pre-register member row와 organization row가 분리되어 있고, FE는 organization SSOT를 쓰지만 BE 코멘트는 member row만 인식.

---

## 8. FE 참고 (수정하지 말 것 · 현재 정상)

| 파일 | 역할 |
|------|------|
| `apps/cms/src/features/user/api/resolve-admin-comment-resource.ts` | 학교 → `organizationId` |
| `apps/cms/src/features/user/api/members-api-client.ts` | comments GET/POST/PATCH |
| `apps/cms/src/features/user/api/map-member-comments.ts` | `SCR_MEMBER` |
| `apps/cms/src/features/user/api/hooks/use-member-detail-subresource-queries.ts` | 상세 코멘트 query |
| `apps/cms/src/features/user/detail/lib/fetch-member-detail-basic-tab-resources.ts` | detail-info 탭 fetch |

**FE 추가 우회(다른 id로 호출 등)는 하지 않습니다.** BE가 organization 또는 전용 path를 지원해야 합니다.

OpenAPI 계약 변경 시: `pnpm --filter cms generate:api` 후 FE path 분기만 조정.

---

## 9. 전달 체크리스트 (이슈 A)

- [ ] `organizationId`로 `/api/admin/users/{id}/comments` **200** (옵션 A) **또는** 학교 전용 comments path (옵션 B)
- [ ] POST 작성·PATCH 수정·DELETE 삭제 round-trip
- [ ] 개인/강사 `memberId` 코멘트 **회귀 없음**
- [ ] (선택) OpenAPI path·description·error code 문서와 구현 일치
- [ ] 스테이징 검증용 학교 organizationId 1건 회신

---

# 이슈 B — 관리자 본인 탈퇴 API 신규

**우선순위:** **P1** (CMS 상단바·마이페이지 「내 정보 확인」 회원탈퇴가 서버에 반영되지 않음)  
**요청 대상:** Members API · Admin account self-service  
**관련 FE:** `apps/cms/src/shared/ui/profile-edit-modal.tsx` (`handleWithdraw`) · `member-withdraw-guide-modal.tsx` (`self_withdraw`) · `widgets/layout/main-header.tsx` · `pages/mypage/profile-page.tsx`  
**OpenAPI (현재 없음):** 관리자 본인 탈퇴 operation 없음. 아래 기존 API는 **대체 불가**.

---

## 10. 요약

CMS에 로그인한 **관리자**가 상단바 「내 정보 확인」 또는 마이페이지에서 **회원탈퇴**를 확인해도, **서버 탈퇴 API가 호출되지 않습니다.**

현재 FE는 확인 모달 후 로컬에서만 `isActive: false`를 찍고 `logout()` 합니다. 새로고침·다른 기기·재로그인 시 **계정이 그대로**입니다.

**판단:** 포털 회원 탈퇴·마스터의 **타인** 관리자 삭제는 이미 있습니다. **관리자 본인 탈퇴**만 계약이 없습니다. FE에서 기존 DELETE를 자기 ID로 호출하는 우회는 OpenAPI상 금지라 하지 않습니다. **신규 self-withdraw API**가 필요합니다.

---

## 11. 재현

관리자 CMS, 실 API.

1. 관리자 로그인 (MASTER가 아닌 일반 관리자 포함).
2. 상단바 프로필 → **내 정보 확인** → 하단 **회원탈퇴**.
3. 안내 모달에서 `탈퇴` 입력 후 확인.
4. Network — 탈퇴 관련 POST/DELETE **없음**. 세션만 로컬 로그아웃.

**기대:** 서버에서 해당 관리자 계정 탈퇴(비활성·세션 무효화) 후 로그인 불가.  
**실제:** 로컬 로그아웃만. 동일 계정으로 재로그인 가능.

---

## 12. FE 현재 구현 (API 없음)

`ProfileEditModal.handleWithdraw`:

```typescript
updateUser({ isActive: false })  // 로컬 auth store만
setWithdrawModalOpen(false)
onCancel()
logout()
```

확인 모달 (`self_withdraw`):

| 항목 | 값 |
|------|-----|
| 제목 | `회원 탈퇴 처리 안내` |
| 본문 | `JA KOREA 서비스에서 탈퇴하시겠습니까?` / 계정·이용 내역·저장 데이터 **영구 삭제** / 복구 불가 |
| 입력 확인 | `탈퇴` (`WITHDRAW_GUIDE_TYPED_CONFIRM_VALUE`) |
| 비밀번호 재입력 | **없음** (포털 탈퇴 `currentPassword`와 다름) |

진입점: CMS 헤더 「내 정보 확인」, 마이페이지 개인정보 관리.

**FE 연동 시점:** OpenAPI에 self-withdraw가 생기면 codegen 후 `handleWithdraw`에서 호출 → 200 뒤에만 `logout()`. 그 전에는 우회 호출하지 않습니다.

---

## 13. 기존 API — 사용하면 안 되는 이유

| API | 용도 | 본인 탈퇴에 쓸 수 없는 이유 |
|-----|------|------------------------------|
| `POST /api/portal/me/withdrawals` | 포털 회원 탈퇴·PII 비식별화 | 호출 계정: **일반/교사/강사**. 범위 `MEMBER_SELF`. CMS 관리자 Bearer로 호출 대상 아님 |
| `DELETE /api/admin/admin-accounts/{adminAccountId}` | 마스터가 **다른** 관리자 soft delete | OpenAPI: **마스터만**, **자기 자신 삭제 불가**. 소셜 DISCONNECTED · `tokenVersion` 증가 |
| `POST /api/admin/admin-accounts/bulk-delete` | 관리자 일괄 삭제 | 마스터만 · 타인 대상 |
| `POST /api/admin/users/{memberId}/delete` | 관리자가 **회원** 탈퇴 처리 | 회원 `memberId`. 관리자 계정 self-service 아님 |
| `PATCH /api/admin/admin-accounts/{adminAccountId}/status` | 관리자 사용 상태 변경 | 마스터만 · 타인 운영 액션. 본인 탈퇴 UX와 불일치 |

포털 탈퇴 body (`PortalWithdrawalRequest`) 참고 — **관리자 API에 그대로 복사하지 말 것** (비밀번호 필드는 CMS 모달에 없음).

```json
{
  "currentPassword": "…",
  "reason": "…",
  "confirmationText": "…"
}
```

---

## 14. BE 요청 (필수) — 신규 self-withdraw

다음 중 **하나**. **옵션 A 권장.**

### 옵션 A — `POST /api/admin/me/withdrawals` (권장)

포털 `POST /api/portal/me/withdrawals`와 대칭. **path에 본인 ID를 넣지 않음** (세션 주체만 탈퇴).

**인증:** 관리자 Bearer. 별도 `ADMIN_WRITE`/마스터 권한 **불필요** (본인만).

**Request (제안):**

```json
{
  "confirmationText": "탈퇴",
  "reason": ""
}
```

| 필드 | 필수 | 설명 |
|------|------|------|
| `confirmationText` | **필수** | FE 입력값. 서버도 `"탈퇴"`만 허용 권장 |
| `reason` | 선택 | max 500. 없으면 `""` 또는 omit |
| `currentPassword` | **넣지 말 것** (기본) | CMS 모달에 비밀번호 없음. 재인증이 정책상 필요하면 OpenAPI에 명시하고 FE에 알려 주세요 |

**Response 200 (제안):**

```json
{
  "adminAccountId": 12345,
  "status": "WITHDRAWN",
  "withdrawnAt": "2026-09-07T07:00:00Z"
}
```

`status`는 BE enum에 맞추되, FE는 **2xx면 로그아웃**하면 됩니다.

**서버 처리 (필수):**

1. 요청 주체 관리자만 탈퇴. 다른 `adminAccountId` 지정 불가.
2. 계정 **soft delete / 비활성** (`isActive=false` 또는 withdrawn). 재로그인 **401/403**.
3. **세션 무효화** (`tokenVersion` 증가 등). 기존 토큰 사용 불가.
4. 소셜 연결 **DISCONNECTED** (기존 `deleteAdmin`과 동일 계열).
5. **감사로그 필수.** 실패 시 fail-closed (탈퇴 성공 처리 금지).
6. 이미 탈퇴된 계정 → **409**.

**마지막 MASTER:** 유일한 활성 마스터가 자기 탈퇴하면 운영 공백이 납니다.  
→ **409** + 코드 예: `LAST_MASTER_CANNOT_WITHDRAW`. 메시지: 다른 마스터를 지정한 뒤 탈퇴. (정책이 다르면 OpenAPI에 명시)

### 옵션 B — 기존 DELETE 확장 (비권장)

`DELETE /api/admin/admin-accounts/{adminAccountId}` 에서 **본인 ID이고 호출자가 본인일 때** self-withdraw 허용.

- 지금 계약(마스터만 · 자기 자신 불가)과 **충돌**.
- 일반 관리자는 `ADMIN_WRITE`가 없어 호출 불가할 수 있음.
- 쓸 경우: 본인은 마스터 권한 없이 허용, **타인 삭제는 마스터만** 유지. OpenAPI 메모를 반드시 고칠 것.

FE는 A를 전제로 연동합니다. B면 codegen 후 분기만 조정.

### 하지 말 것

- 포털 `POST /api/portal/me/withdrawals`에 관리자 토큰을 받는 식으로 섞기
- FE가 `DELETE …/admin-accounts/{자기id}`를 호출하도록 하기 (현재 계약 위반)
- 로컬 `isActive: false`만으로 탈퇴 완료로 보기

---

## 15. 수용 테스트 (이슈 B)

**Given:** 스테이징 관리자 계정 A (마지막 MASTER가 아닌 계정), 계정 B (검증용 마스터).

1. A로 로그인 → `POST /api/admin/me/withdrawals` `{ "confirmationText": "탈퇴" }` → **200**.
2. 같은 토큰으로 `GET /api/admin/admin-accounts/{A}` 또는 관리자 me → **401** (세션 무효).
3. A 이메일/비밀번호 재로그인 → **실패** (비활성/탈퇴).
4. B로 관리자 목록/상세에서 A가 탈퇴·비활성으로 보이거나 목록에서 제외 (BE 표시 정책 회신).
5. A가 다시 `POST …/me/withdrawals` → **409**.
6. **마지막 활성 MASTER**가 동일 API 호출 → **409** `LAST_MASTER_CANNOT_WITHDRAW` (옵션 A 정책 채택 시).
7. `DELETE /api/admin/admin-accounts/{타인}` — 마스터만, **자기 자신 DELETE는 계속 불가** (회귀).
8. `POST /api/portal/me/withdrawals` — 포털 회원만. 관리자 토큰으로 호출해도 관리자 탈퇴로 쓰이지 않음.

---

## 16. 전달 체크리스트 (이슈 B)

- [ ] `POST /api/admin/me/withdrawals` (옵션 A) **또는** OpenAPI에 명시한 동등 self-withdraw
- [ ] 본인만 탈퇴 · 세션 무효화 · 재로그인 불가
- [ ] 감사로그 필수 · 감사 실패 시 탈퇴 미완료
- [ ] 마지막 MASTER 409 정책 확정·문서화
- [ ] `DELETE /api/admin/admin-accounts/{id}` 자기 자신 불가 **유지**
- [ ] 포털 회원 탈퇴 회귀 없음
- [ ] OpenAPI 추가 후 FE에 spec 버전 회신 (`pnpm --filter cms generate:api`)
- [ ] 스테이징 검증용 비(非)유일 마스터 관리자 계정 1건 회신

**Last updated:** 2026-09-07 (이슈 B 관리자 본인 탈퇴 추가)
