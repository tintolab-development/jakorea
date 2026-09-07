# CMS 회원 동의 — 상세 수정 404 · 성범죄 파일 업로드 401 · BE 수정 요청

**작성일:** 2026-08-31  
**우선순위:** **P0** (상세 저장 차단 · 신규 등록 차단)  
**요청 대상:** Terms documents · Members consent ledger · Admin files upload  
**관련 FE:** `fetch-current-terms-document.ts` · `resolve-pre-register-terms-agreement-versions.ts` · `upload-consent-evidence-file.ts` · `attach-filled-documents.ts` · `user-service.ts` (기본정보 PATCH) · `add-user-individual.tsx` · `instructor-register-modal.tsx`  
**선행 계약:** [members-pre-register-terms-required-policy-backend-request-2026-08-11.md](./members-pre-register-terms-required-policy-backend-request-2026-08-11.md) · [member-consent-filled-document-backend-handoff-2026-08-25.md](./member-consent-filled-document-backend-handoff-2026-08-25.md) · [member-pre-register-filled-document-500-backend-request-2026-08-26.md](./member-pre-register-filled-document-500-backend-request-2026-08-26.md)  
**관련 정책:** `.cursor/rules/terms-and-consent-policy.mdc`  
**OpenAPI:** `apps/cms/openapi/members.openapi.json` — `TermsAgreementRequest` · `TermsDocumentResponse` · `FileUploadPrepareRequest`

---

## 1. 요약

CMS에서 동의서 작성형 항목을 한 건 이상 동의·제출한 뒤 흐름이 끊깁니다.

| # | 화면 | 관측 | 영향 |
|---|------|------|------|
| 1 | 일반 회원 **상세 수정** 저장 | `GET /api/public/terms-documents/PAYMENT_STATEMENT_CONSENT/current` → **404** `TERMS_DOCUMENT_NOT_FOUND` | 상세 저장 실패 |
| 2 | 회원 **신규 등록** → 약관 및 동의 → 성범죄 경력 조회 동의서 파일 업로드 | 업로드 API **401** | 파일 미첨부 → 등록 자체 불가 |

**공통 원인 후보:** 약관 문서 카탈로그 키(`PAYMENT_STATEMENT_PRE_CONSENT`)와 회원 원장 키(`PAYMENT_STATEMENT_CONSENT`) 불일치, 그리고 회원 생성 **전** 성범죄 파일 업로드 인증/owner 계약.

FE는 문서 타입을 지어내지 않습니다. 상세 PATCH는 GET 상세의 `termsAgreements[].termsType`을 그대로 version resolve에 쓰고, 성범죄 업로드는 관리자 Bearer + `POST /api/admin/files/upload-requests`를 탑니다.

---

## 2. 이슈 1 — 상세 수정 404 `PAYMENT_STATEMENT_CONSENT`

### 2.1 재현

관리자 CMS, 실 API (`members` remote).

1. 회원 관리 → 회원 신규 등록(일반/개인).
2. 등록 필수 2건(`SERVICE_TERMS`, `PRIVACY_COLLECTION`) 동의.
3. 동의서 작성 필요 항목 중 **1건 이상** 작성 후 동의로 제출. (지급조서만이 아님 — 초상권·지급조서·교육진행자·행정정보·성범죄 중 하나여도 재현됨)
4. 등록 성공 후 해당 회원 상세 → 수정 → 저장.

**기대:** 기본정보 PATCH 성공. version resolve는 게시 중인 약관 문서를 찾음.  
**실제:** 저장 직전

```
GET /api/public/terms-documents/PAYMENT_STATEMENT_CONSENT/current
```

```json
{
  "success": false,
  "data": null,
  "message": "약관 문서를 찾을 수 없습니다.",
  "error": {
    "code": "TERMS_DOCUMENT_NOT_FOUND",
    "message": "약관 문서를 찾을 수 없습니다.",
    "field": "termsType",
    "traceId": "790ac59adf2744e993f2605da11f014b",
    "details": null
  }
}
```

지급조서를 작성하지 않았어도, 원장에 `PAYMENT_STATEMENT_CONSENT` 행이 있으면(미동의 포함) 저장 시 같은 404가 납니다.

### 2.2 FE가 이 URL을 치는 이유

- 등록 시 FE는 지급조서를 `PAYMENT_STATEMENT_PRE_CONSENT`로 보냄 (`build-pre-register-terms-agreements.ts`).
- OpenAPI `TermsAgreementRequest.termsType` 설명: `PAYMENT_STATEMENT_PRE_CONSENT` 입력은 회원 원장의 `PAYMENT_STATEMENT_CONSENT`로 **정규화**.
- 상세 GET `termsAgreements[]`에는 정규화된 `PAYMENT_STATEMENT_CONSENT`가 내려옴 (동의 여부와 무관하게 행이 있으면).
- 상세 수정 draft는 GET 행을 그대로 복사 (`termsAgreementRowsToRequests`).
- 저장 직전 `resolvePreRegisterTermsAgreementVersions`가 각 `termsType`에 대해 `GET /api/public/terms-documents/{termsType}/current`를 호출.

```
등록 FE:  PAYMENT_STATEMENT_PRE_CONSENT  ──정규화──►  원장: PAYMENT_STATEMENT_CONSENT
상세 GET: PAYMENT_STATEMENT_CONSENT
current:  /PAYMENT_STATEMENT_CONSENT/current  → 404
게시본:   /PAYMENT_STATEMENT_PRE_CONSENT/current 만 존재 (추정)
```

즉 FE는 **원장에 저장된 키**로 current를 조회합니다. 카탈로그에 `PAYMENT_STATEMENT_CONSENT` 게시본이 없으면 404입니다.

### 2.3 API

| Method | Path | 역할 |
|--------|------|------|
| `GET` | `/api/public/terms-documents/{termsType}/current` | 게시 버전 resolve. 공개. `termsType` path |
| `GET` | `/api/admin/users/{memberId}` (상세) | `termsAgreements[].termsType` — 원장 canonical |
| `PATCH` | `/api/admin/users/{memberId}` | 선택 약관 수정. version은 current로 맞춤 |

권한: current는 `PUBLIC_SIGNUP`. 상세/PATCH는 관리자 `MEMBER_WRITE`.

### 2.4 BE 요청 (필수)

1. `GET /api/public/terms-documents/PAYMENT_STATEMENT_CONSENT/current`
   - 게시된 `PAYMENT_STATEMENT_PRE_CONSENT` 문서와 **동일 200**을 반환하거나
   - 카탈로그에 `PAYMENT_STATEMENT_CONSENT` 게시본을 seed.
   - 별칭만 다르고 문서가 하나면 **alias resolve**가 맞음. **404 금지.**

2. 상세 GET의 `termsType`과 current path `termsType`을 **한 세트**로 맞출 것.
   - 원장이 `PAYMENT_STATEMENT_CONSENT`면 current도 그 키를 받거나
   - 상세 GET을 `PAYMENT_STATEMENT_PRE_CONSENT`로 내려 FE가 카탈로그 키만 쓰게 할 것.
   - **한쪽만 정규화하고 다른 쪽은 404**이면 상세 저장이 계속 실패함.

3. 같은 별칭이 있는 다른 타입도 점검 (예: 레거시 `PAYMENT_STATEMENT`).
   - 없는 타입만 `TERMS_DOCUMENT_NOT_FOUND`. 정규화 별칭은 **200**.

### 2.5 검증

- [ ] `GET .../PAYMENT_STATEMENT_PRE_CONSENT/current` **200**
- [ ] `GET .../PAYMENT_STATEMENT_CONSENT/current` **200** (동일 version/id 또는 명시적 alias)
- [ ] 동의서 1건만 작성한 일반 회원 상세 수정 저장 **성공**
- [ ] 지급조서 미동의 행만 있어도 상세 저장이 404로 죽지 않음

---

## 3. 이슈 2 — 성범죄 동의서 파일 업로드 401

### 3.1 재현

1. 회원 관리 → 회원 신규 등록(개인 또는 강사).
2. 약관 및 동의 → 성범죄 경력 조회 동의서 → 「동의서 작성」→ 파일 업로드(또는 서명 이미지 첨부).
3. Network에 **401**. 업로드 실패 → 해당 항목을 동의로 제출할 수 없음 → 등록 완료 불가.

**기대:** 관리자 세션으로 파일 object가 만들어지고 `evidenceFileObjectId`가 pre-register에 실림.  
**실제:** 업로드 **401**. 회원 미생성. (회원은 아직 없음 — `memberId` 없이 업로드)

### 3.2 FE 호출 순서

`upload-consent-evidence-file.ts` · [member-consent-filled-document-backend-handoff §5.2](./member-consent-filled-document-backend-handoff-2026-08-25.md)와 동일.

| 순서 | Method | Path | 인증 |
|------|--------|------|------|
| 1 | `GET` | `/api/public/terms-documents/CRIMINAL_HISTORY_CHECK_CONSENT/current` | 공개. 응답 `id`를 임시 `ownerId`로 사용 |
| 2 | `POST` | `/api/admin/files/upload-requests` | 관리자 Bearer |
| 3 | `PUT` | presigned `uploadUrl` | 스토리지 직접. axios Bearer 없음 |
| 4 | `POST` | `/api/admin/files/{fileObjectId}/confirm` (또는 `confirmPath`) | 관리자 Bearer |

등록 전 prepare body:

```json
{
  "ownerDomain": "MEMBER",
  "ownerType": "CONSENT",
  "ownerId": "<CRIMINAL_HISTORY_CHECK_CONSENT current 문서 id>",
  "privacyLevel": "SENSITIVE",
  "originalFileName": "crime-consent.png",
  "contentType": "image/png",
  "fileSize": 12345
}
```

`ownerId`는 **회원 id가 아님**. 회원이 아직 없어서 게시 약관 문서 id를 씀.  
상세 PATCH처럼 `memberId`가 있으면 `ownerId = memberId`.  
pre-register에는 `termsAgreements[].evidenceFileObjectId`만 실음. `filledDocument` 없음.

### 3.3 401이 날 수 있는 지점

Network에서 어느 URL이 401인지 구분해 달라. 후보:

| 후보 | 의미 | BE에서 볼 것 |
|------|------|-------------|
| **A** | `GET .../CRIMINAL_HISTORY_CHECK_CONSENT/current` **401** | 공개 API가 관리자 Bearer를 보고 거절하는지. 공개 current는 토큰 있어도 **200**이어야 함. 문서 미게시면 **404**가 맞고 401이 아님 |
| **B** | `POST /api/admin/files/upload-requests` **401** | 관리자 토큰이 파일 API에서 거부됨. 다른 회원 API는 되는 세션이면 권한 매트릭스/owner 검증을 401로 내리는지 확인. 권한 부족은 **403 + code** |
| **C** | presigned PUT **401** | 스토리지 서명·헤더. OpenAPI상 upload-requests는 `PROVIDER_PENDING` |
| **D** | `POST .../files/{id}/confirm` **401** | confirm만 다른 권한을 요구하는지 |

FE는 current 실패를 swallow하고 `ownerId`가 없으면 업로드를 시작하지 않는다.  
화면에서 401이 보이면 대개 **B** 또는 **A**를 Network에 남긴 것.

### 3.4 BE 요청 (필수)

1. **신규 등록 전** 성범죄 파일 업로드를 허용할 것.
   - `ownerDomain=MEMBER`, `ownerType=CONSENT`, `privacyLevel=SENSITIVE`
   - `ownerId` = 게시된 `CRIMINAL_HISTORY_CHECK_CONSENT` 문서 id
   - 관리자 로그인 + 회원 등록 가능한 계정으로 **200** + presigned URL

2. `GET /api/public/terms-documents/CRIMINAL_HISTORY_CHECK_CONSENT/current` **200** + id + version + `publishedYn: true` seed.
   - 없으면 **404** + `TERMS_DOCUMENT_NOT_FOUND`. **401 금지.**
   - `Authorization` 헤더가 있어도 공개 current는 **200**.

3. 인증 실패가 아니면 **401을 쓰지 말 것.**
   - owner 불일치 · 문서 없음 · 권한 없음 → **400/403 + error.code** (`FILE_OWNER_INVALID`, `TERMS_DOCUMENT_NOT_FOUND`, `ACCESS_DENIED` 등)

4. 업로드된 object를 이어지는 pre-register가 같은 트랜잭션에서 **신규 member에 재연결**. 실패 시 회원만 남기지 말 것. ([2026-08-26 §6.1](./member-pre-register-filled-document-500-backend-request-2026-08-26.md))

5. OpenAPI `createUploadRequest` 준비도(`PROVIDER_PENDING`)가 스테이징 401/미구현의 원인이면 구현 완료 + seed 후 알려 줄 것.

### 3.5 검증

- [ ] 관리자 세션으로 성범죄 current **200**
- [ ] 동일 세션으로 upload-requests **200** (회원 없음, `ownerId` = 문서 id)
- [ ] presigned PUT + confirm **200**
- [ ] 그 `evidenceFileObjectId`로 개인/강사 pre-register **성공**
- [ ] 상세 「동의서 보기」에 첨부 복원
- [ ] 만료/없는 토큰만 **401**. 로그인된 등록 화면에서 401 없음

---

## 4. FE interim (2026-08-31)

S3·파일 API 미연결 환경에서 UI·payload wiring 검증을 위해 FE에서 다음을 적용했습니다.

| 항목 | FE 조치 | BE 미완 시 한계 |
|------|---------|-----------------|
| 이슈 1 current 404 | `terms-document-type-alias.ts` — `PAYMENT_STATEMENT_CONSENT` ↔ `PRE_CONSENT` ↔ `PAYMENT_STATEMENT` lookup fallback. PATCH body `termsType`은 **변경하지 않음** | BE에 **둘 다** 게시본이 없으면 여전히 resolve 실패 |
| 이슈 1 draft 중복 | `member-basic-info-terms-patch.ts` — GET `CONSENT` + UI `PRE_CONSENT` upsert dedupe | — |
| 이슈 2 upload 401 | `members` 또는 `files` 실 API일 때 prepare→PUT→confirm. 동의서 **제출 시** 업로드 후 `evidenceFileObjectId`를 스냅샷에 보관. 둘 다 꺼져 있을 때만 stub | stub id로 pre-register **persist**는 BE object 존재 검증·member 재연결 필요. S3 미연결·401 시 제출 단계에서 실패 |
| filledDocument 500 | — (별도 문서) | [member-pre-register-filled-document-500-backend-request-2026-08-26.md](./member-pre-register-filled-document-500-backend-request-2026-08-26.md) |

**환경 변수:** `VITE_REAL_API_MODULES`에 `members` 또는 `files`가 있으면 실 upload. 둘 다 없으면 stub.

---

## 5. 하지 말 것

- FE에 current를 `PRE_CONSENT`로만 치라고 해서 원장 키 404를 우회하게 하지 말 것. **서버가 별칭을 풀거나 게시본을 맞출 것.**
- 성범죄 업로드를 「회원 생성 후」로 미뤄 등록을 막지 말 것. 동의서 작성형 「동의」는 작성·업로드 완료 후만 인정 (`terms-and-consent-policy`).
- 공개 current에 관리자 토큰이 있다고 **401**.
- owner 오류를 **401**로 위장.
- `filledDocument`를 빼고 boolean만 보내 500/404를 숨기지 말 것.

---

## 6. FE 참고 경로

| 파일 | 역할 |
|------|------|
| `apps/cms/src/features/user/api/terms-document-type-alias.ts` | termsType 별칭 SSOT · current lookup 후보 |
| `apps/cms/src/features/user/api/fetch-current-terms-document.ts` | `GET .../terms-documents/{type}/current` (alias fallback) |
| `apps/cms/src/features/user/api/resolve-pre-register-terms-agreement-versions.ts` | 등록·상세 PATCH 직전 version 갱신 |
| `apps/cms/src/features/user/api/member-basic-info-terms-patch.ts` | GET 행 → PATCH draft (`termsType` 유지 · alias dedupe) |
| `apps/cms/src/features/user/api/upload-consent-evidence-file.ts` | 성범죄 prepare → PUT → confirm (또는 stub) |
| `apps/cms/src/features/user/api/attach-filled-documents.ts` | `agreed: true`일 때 본문/파일 id 부착 |
| `apps/cms/src/shared/config/real-api-modules.ts` | `files` 모듈 키 |
| `apps/cms/src/entities/user/api/user-service.ts` | 상세 PATCH 전 resolve + attach |

---

## 7. 전달 체크리스트

| # | 항목 | 담당 |
|---|------|------|
| 1 | `PAYMENT_STATEMENT_CONSENT` current alias 또는 seed | BE |
| 2 | 상세 GET `termsType` ↔ current path 키 일치 | BE |
| 3 | `CRIMINAL_HISTORY_CHECK_CONSENT` current 게시 + 공개 **200** | BE |
| 4 | 등록 전 CONSENT 파일 upload-requests **200** (관리자) | BE |
| 5 | 401은 진짜 미인증만. owner/권한은 4xx + code | BE |
| 6 | 스테이징에서 이슈 1·2 재현 계정 · traceId 샘플 | BE |

**선행 문서**

- [members-pre-register-terms-required-policy-backend-request-2026-08-11.md](./members-pre-register-terms-required-policy-backend-request-2026-08-11.md)
- [member-consent-filled-document-backend-handoff-2026-08-25.md](./member-consent-filled-document-backend-handoff-2026-08-25.md)
- [member-pre-register-filled-document-500-backend-request-2026-08-26.md](./member-pre-register-filled-document-500-backend-request-2026-08-26.md)

수정 일정 · 스테이징 검증 계정(일반 회원 1 · 동의서 작성본 있는 상세 1)을 회신해 주세요.
