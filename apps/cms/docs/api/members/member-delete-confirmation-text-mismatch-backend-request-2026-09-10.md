# 회원 삭제 `confirmationText` 허용값 불일치 · BE 수정 요청

**작성일:** 2026-09-10  
**우선순위:** **P0** (회원 목록 삭제/일괄 삭제가 정상 UI에서도 실패)  
**요청 대상:** Members API · 회원·계정 디렉터리 삭제 확인 문구 검증  
**관련 FE:**  
- `DELETE_GUIDE_TYPED_CONFIRM_VALUE` (`apps/cms/src/shared/constants/delete-guide-modal.ts`) = **`"삭제"`**  
- `DeleteGuideModal` / 회원 목록 삭제 가이드 (`user-list-page.tsx`)  
- `deleteUsersByListKind` / `deleteUser` (`entities/user/api/user-service.ts`)  
- `bulkDeleteAllAccountsRemote` · `bulkDeleteMembersRemote` · `deleteMemberRemote` (`members-api-client.ts`)  
**OpenAPI:** `apps/cms/openapi/members.openapi.json` · `AccountDirectoryBulkDeleteRequest` · `AdminMemberBulkDeleteRequest` · `AdminMemberDeleteRequest`

---

## 1. 요약

CMS 회원 관리에서 삭제 확인 모달에 **`[삭제]`** 를 입력한 뒤 API를 호출하면, FE는 `confirmationText: "삭제"` 를 전송합니다.  
아래 **3개 API 모두** 동일하게 **`CMS_MEMBER_DELETE_CONFIRMATION_MISMATCH`** 로 거절됩니다.

| API | 관측 |
|-----|------|
| `POST /api/admin/members/all/bulk-delete` | ❌ 동일 이슈 |
| `POST /api/admin/users/bulk-delete` | ❌ 동일 이슈 |
| `POST /api/admin/users/{memberId}/delete` | ❌ 동일 이슈 |

| 항목 | 값 |
|------|-----|
| FE UI 입력 요구 | `삭제` |
| FE 요청 payload | `confirmationText: "삭제"` |
| BE 응답 | `success: false` · `CMS_MEMBER_DELETE_CONFIRMATION_MISMATCH` |

**정책 유지:** FE는 앞으로도 **`confirmationText`를 서버에 전송**합니다.  
**요청:** BE가 위 3개 API의 허용값을 **`"삭제"` | `"탈퇴"`** 로 맞추고, OpenAPI에 명시해 주세요. (공통 validator면 한 곳에서 수정)

- 목록 삭제 UI → `"삭제"`
- 상세 회원 탈퇴 UI → `"탈퇴"` (동일 단건 delete API)

---

## 2. 재현

관리자 CMS · members remote. 삭제 안내 모달에 **`삭제`** 입력 후 확인.

| 화면 | Network |
|------|---------|
| 전체 탭 일괄(혼합) 삭제 | `POST /api/admin/members/all/bulk-delete` |
| 개인·강사 등 탭 일괄 삭제 | `POST /api/admin/users/bulk-delete` |
| 단건 삭제 (목록/상세 등) | `POST /api/admin/users/{memberId}/delete` |

**기대:** 각 API **200** · 삭제(또는 익명화) 성공 · FE 「삭제 완료」 안내.  
**실제:** 세 API 모두 `CMS_MEMBER_DELETE_CONFIRMATION_MISMATCH` (§2.2와 동일 형태).

### 2.1 관측 Request 예시

#### A. 전체 탭 혼합 일괄

```http
POST /api/admin/members/all/bulk-delete
Content-Type: application/json
```

```json
{
  "targets": [
    {
      "accountType": "ADMIN_ACCOUNT",
      "id": 172202
    },
    {
      "accountType": "ADMIN_ACCOUNT",
      "id": 172201
    }
  ],
  "reason": "CMS 관리자 회원 삭제",
  "confirmationText": "삭제"
}
```

#### B. 회원 일괄 삭제

```http
POST /api/admin/users/bulk-delete
Content-Type: application/json
```

```json
{
  "ids": [/* memberId … */],
  "reason": "CMS 관리자 회원 삭제",
  "confirmationText": "삭제"
}
```

#### C. 회원 단건 삭제

```http
POST /api/admin/users/{memberId}/delete
Content-Type: application/json
```

```json
{
  "reason": "CMS 관리자 회원 삭제",
  "confirmationText": "삭제"
}
```

### 2.2 관측 Response (공통)

```json
{
  "success": false,
  "data": null,
  "message": "회원 삭제 확인 문구를 정확히 입력해 주세요.",
  "error": {
    "code": "CMS_MEMBER_DELETE_CONFIRMATION_MISMATCH",
    "message": "회원 삭제 확인 문구를 정확히 입력해 주세요.",
    "field": "confirmationText",
    "traceId": "bb7710c123d34f9fbd8ae01b7c7f4de6",
    "details": null
  }
}
```

(`traceId`는 호출마다 다름. `all/bulk-delete`에서 최초 관측.)

---

## 3. FE 계약 (현재 · 변경 없음)

### 3.1 상수 SSOT

```ts
// apps/cms/src/shared/constants/delete-guide-modal.ts
export const DELETE_GUIDE_TYPED_CONFIRM_VALUE = '삭제'
export const DELETE_GUIDE_TYPED_CONFIRM_PLACEHOLDER =
  '삭제하시려면 해당란에 [삭제]를 입력해 주세요.'
```

- 모달 `requiredConfirmInput` = `"삭제"`
- API body `confirmationText` = 동일 상수 (사용자 입력과 일치할 때만 제출)

### 3.2 동일 이슈 관측 · `confirmationText: "삭제"` 전송 API (전부 수정 대상)

| 화면/경로 | HTTP | body 스키마 | 관측 |
|-----------|------|-------------|------|
| 전체 탭 일괄·혼합 삭제 | `POST /api/admin/members/all/bulk-delete` | `AccountDirectoryBulkDeleteRequest` | ❌ MISMATCH |
| 개인·강사 등 회원 일괄 삭제 | `POST /api/admin/users/bulk-delete` | `AdminMemberBulkDeleteRequest` | ❌ MISMATCH |
| 회원 단건 삭제 | `POST /api/admin/users/{memberId}/delete` | `AdminMemberDeleteRequest` | ❌ MISMATCH |

위 **3개 API 전부** 허용값 **`"삭제"` | `"탈퇴"`** (trim 후 exact match)로 통일해 주세요. 공통 검증 함수 한 곳만 고쳐도 됩니다.

### 3.3 `confirmationText` 없이 호출하는 삭제 (참고)

동일 CMS 목록이라도 탭/유형에 따라 FE가 다른 엔드포인트를 씁니다. 이번 이슈의 직접 대상은 아니나, 확인 문구 정책을 정리할 때 참고용입니다.

| 경로 | HTTP | 비고 |
|------|------|------|
| 관리자 탭 다건 | `POST /api/admin/admin-accounts/bulk-delete` | `BulkDecisionRequest` — `confirmationText` 없음 |
| 학교 탭 다건 | `POST /api/admin/organizations/schools/bulk-delete` | 동일 |
| 관리자 단건 | admin-account DELETE 계열 | reason 위주 |

---

## 4. BE 수정 요청

1. **허용값:** CMS 회원·계정 디렉터리 **삭제/탈퇴** API의 `confirmationText` 검증을 **`"삭제"`와 `"탈퇴"`** 둘 다 허용할 것.  
   - 비교 전 `trim()` 권장.  
   - `"DELETE"`, 긴 안내 문장 등은 **거부 유지**해도 됨.
2. **적용 범위:** §3.2의 **3개 API 전부** (관측 완료).  
   - `POST /api/admin/members/all/bulk-delete`  
   - `POST /api/admin/users/bulk-delete`  
   - `POST /api/admin/users/{memberId}/delete`  
   - 내부 공통 validator면 한 곳에서 `"삭제"`로 맞추면 됨 (`ADMIN_ACCOUNT` / `MEMBER` 동일).
3. **OpenAPI:** `confirmationText` description에 예:  
   `CMS 삭제/탈퇴 확인 문구. 허용값: "삭제" | "탈퇴" (exact match after trim).`  
   - 가능하면 `enum: ["삭제", "탈퇴"]`.
4. **에러 코드:** 불일치 시 기존 `CMS_MEMBER_DELETE_CONFIRMATION_MISMATCH` 유지 가능.  
   - 메시지에 허용값을 노출할지 여부는 BE 정책 (보안상 미노출도 가능).
5. **FE 측:** 이번 건으로 `confirmationText` 전송을 제거하거나 UI 문구를 바꾸지 **않음**. 서버만 정렬.

---

## 5. 탈퇴와 구분 (혼동 주의)

| 플로우 | UI 입력 | API `confirmationText` | 비고 |
|--------|---------|------------------------|------|
| **회원/학교 목록·삭제** | `삭제` | `"삭제"` | 본 문서 대상 |
| **회원 상세 탈퇴 안내** | `탈퇴` | `"탈퇴"` (`WITHDRAW_GUIDE_TYPED_CONFIRM_VALUE`) | **동일** `POST /api/admin/users/{memberId}/delete` |
| **관리자 본인 탈퇴** | `탈퇴` | `"탈퇴"` | `POST /api/admin/me/withdrawals` 등 |

상세 「회원 탈퇴」도 단건 delete API를 씁니다. UI·payload는 `"탈퇴"`입니다.  
**요청:** 단건/일괄 delete의 `confirmationText`는 **`"삭제"`와 `"탈퇴"` 둘 다** 허용해 주세요 (trim exact).  
목록 삭제 UX는 `"삭제"`, 상세 탈퇴 UX는 `"탈퇴"`로 유지합니다. 한쪽만 허용하면 다른 화면이 깨집니다.

---

## 6. 인수 기준 (Acceptance)

- [ ] `POST /api/admin/members/all/bulk-delete` + `confirmationText: "삭제"` → **200** (대상·권한 충분 시).
- [ ] `POST /api/admin/users/bulk-delete` + `confirmationText: "삭제"` → **200**.
- [ ] `POST /api/admin/users/{memberId}/delete` + `confirmationText: "삭제"` → **200** (목록 삭제).
- [ ] `POST /api/admin/users/{memberId}/delete` + `confirmationText: "탈퇴"` → **200** (상세 회원 탈퇴).
- [ ] `"삭제 "` / `"탈퇴 "`(앞뒤 공백) → trim 후 성공(권장) 또는 문서화된 거부.
- [ ] `"DELETE"` / 빈 문자열 / 기타 → `CMS_MEMBER_DELETE_CONFIRMATION_MISMATCH` (또는 동등 4xx).
- [ ] OpenAPI에 허용값 `"삭제"` | `"탈퇴"` 명시 후 FE에 스펙 공유.

---

## 7. 비범위

- `confirmationText` 필드 자체 제거 · 확인 검증 폐지 (이번 요청 아님 — FE는 전송 유지).
- 관리자/학교 전용 bulk-delete에 `confirmationText` 신규 추가 여부 (별도 합의).
- 삭제 완료 UI 문구 (`삭제 완료` 모달) — FE 담당.

---

**Last updated:** 2026-09-11
