# CMS 회원 신규 등록 — 동의서 작성 후 pre-register HTTP 500 · BE 수정 요청

**작성일:** 2026-08-26  
**우선순위:** **P0** (등록 차단)  
**요청 대상:** Members API · `POST /api/admin/users/pre-register/individual` · `POST /api/admin/users/pre-register/instructor`  
**관련 FE:** `attach-filled-documents.ts` · `map-pre-register-request.ts` · `add-user-individual.tsx` · `instructor-register-modal.tsx` · `upload-consent-evidence-file.ts`  
**선행 계약:** [member-consent-filled-document-backend-handoff-2026-08-25.md](./member-consent-filled-document-backend-handoff-2026-08-25.md) (옵션 A — `termsAgreements[].filledDocument`)  
**관련 정책:** [members-pre-register-terms-required-policy-backend-request-2026-08-11.md](./members-pre-register-terms-required-policy-backend-request-2026-08-11.md) · `.cursor/rules/terms-and-consent-policy.mdc`  
**OpenAPI:** `apps/cms/openapi/members.openapi.json` — `TermsAgreementRequest.filledDocument` · `FilledDocumentRequest` · `JsonNode`

---

## 1. 요약

CMS **회원 신규 등록**(개인 · 강사/교사)에서 「약관 및 동의」의 **동의서 작성형 항목**을 작성·제출한 뒤 등록하면, 서버가 **HTTP 500**을 반환합니다.

| | |
|---|---|
| **화면** | 회원 관리 → 회원 신규 등록 / 강사 신규 등록 → 약관 및 동의 → 「동의서 작성」 → 등록 |
| **재현 조건** | 동의서 5종 중 1건 이상 `agreed: true` + 작성 본문(`filledDocument` 또는 성범죄 `evidenceFileObjectId`) 동봉 |
| **관측** | 등록 API **HTTP 500** (회원 미생성) |
| **대조** | 동일 폼에서 동의서 항목을 **미동의**(`agreed: false`, 본문 없음)로 두면 등록은 통과하는 경우가 있음 |

FE는 [2026-08-25 핸드오프 옵션 A](./member-consent-filled-document-backend-handoff-2026-08-25.md)대로 `WritingFormDraft` 전체 객체를 `filledDocument.schemaJson`에 **객체로** 실습니다(이중 stringify 없음). OpenAPI `FilledDocumentRequest`와 동일합니다.

**요청:** 작성 본문이 포함된 pre-register가 **200(또는 201)으로 회원 생성**되고, consent-record에 본문이 남아 상세 「동의서 보기」로 복원될 것. 검증 실패는 **500이 아니라 4xx + `error.code`**.

**FE 우회 금지:** `filledDocument`를 빼고 boolean만 보내는 방식으로 500을 숨기지 말 것. 그러면 상세 「동의서 보기」가 다시 불가해진다.

---

## 2. 재현

관리자 CMS, 실 API (`members` remote).

1. 회원 관리 → **회원 신규 등록**(개인) 또는 **강사 신규 등록**.
2. 기본정보 필수값 입력.
3. 약관 및 동의에서 등록 필수 2건(`SERVICE_TERMS`, `PRIVACY_COLLECTION`) 동의.
4. 동의서 작성형 중 **1건 이상** 「동의서 작성」→ 작성완료 → 해당 항목 **동의**.
   - 최소 재현: **초상권**(`PORTRAIT_RIGHTS`)만 작성해도 충분.
5. 나머지 선택 항목은 미동의여도 됨.
6. 등록 제출.

**기대:** 회원 생성 성공 · 상세 「약관 및 동의 > 동의서 보기」에 제출본 복원.  
**실제:** pre-register **HTTP 500**. 회원 미생성.

동일 스텝에서 4번을 건너뛰고 동의서 항목을 전부 미동의로 두면, 등록 자체는 되는 경우가 있어 **`filledDocument` / `evidenceFileObjectId` persist 경로**가 1순위입니다.

---

## 3. API

| Method | Path | 화면 |
|--------|------|------|
| `POST` | `/api/admin/users/pre-register/individual` | 개인 회원 신규 등록 |
| `POST` | `/api/admin/users/pre-register/instructor` | 교사 · 강사 · 강사겸교사 신규 등록 |

권한: 관리자 · `MEMBER_WRITE`.  
상세 PATCH(`termsAgreements` + 본문)도 같은 persist를 타면 **동일 500**이 날 수 있으니 함께 확인.

관리자 등록(`POST /api/admin/admin-accounts`)은 동의서 5종 UI가 없어 **이번 범위 밖**.

---

## 4. 동의서 5종 ↔ payload

| `termsType` | `agreed: true`일 때 FE가 붙이는 것 | `templateCode` |
|-------------|-------------------------------------|----------------|
| `PORTRAIT_RIGHTS` | `filledDocument.schemaJson` = `WritingFormDraft` 객체 | `agreement-portrait` |
| `PAYMENT_STATEMENT_PRE_CONSENT` | 위 + `filledDocument.paymentBasicInfo` | `agreement-third-party` |
| `FACILITATOR_PLEDGE` | `filledDocument.schemaJson` | `agreement-expense` |
| `ADMINISTRATIVE_INFO_CONSENT` | `filledDocument.schemaJson` | `agreement-notice` |
| `CRIMINAL_HISTORY_CHECK_CONSENT` | `evidenceFileObjectId`(선행 업로드). **`filledDocument` 없음** | — |

공통 규칙 (계약 · FE 동일):

- `agreed: false` → 본문/`evidenceFileObjectId` **생략**.
- `agreed: true`(위 5종) → 본문 또는 파일 id **필수**. 없으면 FE가 등록을 막음.
- `schemaJson`은 JSON **문자열을 한 번 더 stringify하지 않음**. OpenAPI `JsonNode`.
- 선택 미동의 행도 `termsAgreements`에 `agreed: false`로 **포함**한다. (예전처럼 미전송 우회 없음)

---

## 5. FE가 보내는 body (핵심)

매퍼: `attachFilledDocumentsToTermsAgreements` (`mode: 'create'`).

초상권만 작성·동의한 **최소 형태**(실 payload의 `schemaJson.paragraphs`는 시드 양식 전체라 훨씬 큼):

```json
{
  "termsAgreements": [
    {
      "termsType": "SERVICE_TERMS",
      "version": "2026-05-18",
      "required": true,
      "agreed": true
    },
    {
      "termsType": "PRIVACY_COLLECTION",
      "version": "2026-05-18",
      "required": true,
      "agreed": true
    },
    {
      "termsType": "MARKETING",
      "version": "2026-05-18",
      "required": false,
      "agreed": false
    },
    {
      "termsType": "PORTRAIT_RIGHTS",
      "version": "2026-05-18",
      "required": false,
      "agreed": true,
      "filledDocument": {
        "templateCode": "agreement-portrait",
        "schemaJson": {
          "schemaVersion": 1,
          "formSettings": {},
          "paragraphs": []
        }
      }
    },
    {
      "termsType": "PAYMENT_STATEMENT_PRE_CONSENT",
      "version": "2026-05-18",
      "required": false,
      "agreed": false
    },
    {
      "termsType": "FACILITATOR_PLEDGE",
      "version": "2026-05-18",
      "required": false,
      "agreed": false
    },
    {
      "termsType": "ADMINISTRATIVE_INFO_CONSENT",
      "version": "2026-05-18",
      "required": false,
      "agreed": false
    },
    {
      "termsType": "CRIMINAL_HISTORY_CHECK_CONSENT",
      "version": "2026-05-18",
      "required": false,
      "agreed": false
    }
  ]
}
```

`version`은 `GET /api/public/terms-documents/{termsType}/current`에서 resolve한 게시 버전이다. 위 `2026-05-18`은 예시.

### 5.1 실 `schemaJson` 특성 (500 조사 시)

실 작성본은 빈 `paragraphs: []`가 아니다.

- `@jakorea/form-schema` `create*Draft()` 시드 전체(단락·표·고정 문구·라디오 선택값).
- 시스템 서명 단락에 **data URL(base64 이미지)** 가 들어갈 수 있음 → 본문이 **수백 KB~수 MB**.
- 중첩 객체·배열이 깊다. `JsonNode` / JSONB로 받아야 한다. `String` 컬럼·`VARCHAR`에 넣으면 overflow 또는 직렬화 예외.

지급조서(`PAYMENT_STATEMENT_PRE_CONSENT`) 추가 필드 예:

```json
"paymentBasicInfo": {
  "nameKo": "홍길동",
  "residentFront": "900101",
  "bankName": "국민",
  "paymentPurpose": "강사비 또는 활동비 지급"
}
```

OpenAPI `PaymentStatementBasicInfo`. 해당 `termsType`이 아니면 `paymentBasicInfo`는 **omit**.

### 5.2 성범죄 — 등록 전 파일 업로드

`CRIMINAL_HISTORY_CHECK_CONSENT` `agreed: true`이면 FE는 pre-register **전에**:

1. `POST /api/admin/files/upload-requests`  
   `ownerDomain: MEMBER`, `ownerType: CONSENT`, `privacyLevel: SENSITIVE`  
   `ownerId`: 회원 id가 없으면 `GET /api/public/terms-documents/CRIMINAL_HISTORY_CHECK_CONSENT/current`의 **약관 문서 id**
2. presigned PUT → confirm
3. 발급된 `fileObjectId`를 `termsAgreements[].evidenceFileObjectId`에 실어 pre-register

등록 트랜잭션에서 이 object를 **신규 member에 재연결**하지 못하면 500 후보.

---

## 6. 요청

### 6.1 기능 (필수)

1. 위 재현으로 **개인 · 강사** pre-register가 성공할 것.
2. `agreed: true`인 동의서 4종은 `filledDocument`를 **DB에 저장**. 성범죄는 `evidenceFileObjectId`를 consent-record에 **연결**.
3. `POST /api/admin/users/{memberId}/consent-records/{consentType}/filled-document` (`AdminPrivacyUnmaskRequest`)로 제출본 round-trip. `schemaJson`은 저장한 `WritingFormDraft` 객체.
4. 회원 insert와 본문 persist는 **한 트랜잭션**. 본문 저장 실패 시 회원만 생성된 채 남기지 말 것(부분 성공 금지).

### 6.2 에러 (필수)

| 상황 | HTTP | `error.code` (권장) |
|------|------|---------------------|
| 본문 persist 실패(스키마·FK·JSONB) | **4xx 또는 매핑된 5xx 금지에 가깝게 4xx/명확한 코드** — 최소 **unhandled 500 금지** | `FILLED_DOCUMENT_SAVE_FAILED` 등 |
| `agreed: true`인데 `filledDocument`/`evidenceFileObjectId` 없음 | **400** | `FILLED_DOCUMENT_REQUIRED` |
| `schemaJson` 형식 오류·이중 인코딩 문자열 | **400** | `INVALID_FILLED_DOCUMENT` |
| `templateCode` 원장 불일치 | **400** | `UNKNOWN_TEMPLATE_CODE` |
| `paymentBasicInfo` 누락(지급조서만) | **400** | 필드 지정 |
| 그 외 서버 버그 | 500이어도 `error.code` + `traceId` + 스택은 서버 로그만 | `INTERNAL_ERROR` |

검증 실패를 NPE/`ClassCastException`/`DataIntegrityViolation`으로 삼켜 **500 `DATABASE_ERROR`** 만 주지 말 것.

### 6.3 하지 말 것

- `schemaJson`을 `String`으로만 받고 객체가 오면 500.
- 본문 크기를 이유로 **필드 일부를  silently drop**.
- 선택 `agreed: false` 행이 배열에 있다고 등록 전체를 500.
- FE에 `filledDocument` 생략을 요구해 500을 회피.

---

## 7. BE 점검 체크리스트 (원인 미확정)

FE에는 서버 스택트레이스가 없다. 아래를 로그·`traceId`로 확인 요청한다.

1. **`JsonNode` 역직렬화** — OpenAPI `JsonNode`가 `{}`(empty schema). Jackson이 `WritingFormDraft` 객체를 `JsonNode`로 받는지, DTO가 `String schemaJson`이라 객체 body에서 `ClassCastException`/`MismatchedInputException`이 나는지.
2. **컬럼 타입** — JSONB/`json` vs `TEXT`/`VARCHAR`. 서명 data URL 포함 시 길이 초과.
3. **Hibernate `@JdbcTypeCode(SqlTypes.JSON)` / `jsonb` 매핑** 예외.
4. **테이블·FK 미비** — filled-document / form-response 테이블 없음, consent-record FK, member 생성 전 persist 순서.
5. **`templateCode` 원장** — `agreement-portrait` 등이 서버 enum/원장에 없으면 unhandled.
6. **트랜잭션 순서** — member PK 발급 전 filled-document insert → FK 위반.
7. **요청 크기** — 게이트웨이·Tomcat `maxPostSize` / Spring `max-in-memory-size`. (이 경우 보통 413이지만 프록시에 따라 500).
8. **성범죄** — `ownerId` = terms-document id인 `file_object`를 신규 member에 attach할 때 owner 불일치 예외.
9. **지급조서 sidecar** — `paymentBasicInfo` null/부분 필드 NPE.
10. **A/B** — 동일 요청에서 `PORTRAIT_RIGHTS.filledDocument`만 제거하면 200인지. 200이면 persist가 원인.

수정 후 응답/로그에 **`traceId`** 를 남겨 주시면 FE E2E·스테이징에서 대조하겠습니다.

---

## 8. 수용 테스트

| # | 시나리오 | 통과 기준 |
|---|----------|-----------|
| 1 | 개인 등록 · 초상권만 작성·동의 | 200 · 회원 생성 · 상세 보기 = 제출 `schemaJson` |
| 2 | 개인 등록 · 동의서 5종 전부 미동의 | 200 (기존 정책) · 보기 빈 상태 |
| 3 | 개인 등록 · 지급조서 작성·동의 (`paymentBasicInfo` 포함) | 200 · sidecar round-trip |
| 4 | 강사 등록 · 서약 또는 행정정보 작성·동의 | 200 · 보기 복원 |
| 5 | 강사 등록 · 성범죄 파일 첨부·동의 | 업로드 성공 후 pre-register 200 · 보기에서 파일 다운로드 |
| 6 | 초상권 `agreed: true`인데 `filledDocument` 없음 | **400** (500 아님) |
| 7 | 상세 PATCH로 동일 본문 재제출 | 200 · 보기 갱신 |

1·3·4·5는 [filled-document 핸드오프 §10](./member-consent-filled-document-backend-handoff-2026-08-25.md) FE 후속과 동일 수용이다. **지금은 1번에서 500이라 등록 E2E가 막힌 상태**다.

---

## 9. 범위 밖

- Platform 가입 화면.
- 관리자 계정 등록 약관 4종(동의서 본문 없음).
- 선택 약관 `required` 정책(선행 2026-08-11 문서). 이번 건은 **본문 persist 500**.
- OpenAPI에 `filledDocument`가 이미 있으므로 **스펙 필드 추가 요청이 아님**. 구현·예외 처리 요청.

---

## 10. 관련 FE (참고 · 레포)

| 파일 | 역할 |
|------|------|
| `apps/cms/src/features/user/api/attach-filled-documents.ts` | `agreed: true` 행에 `filledDocument` / `evidenceFileObjectId` 부착 |
| `apps/cms/src/features/user/api/map-pre-register-request.ts` | 개인/강사 pre-register body. 선택 미동의도 배열에 포함 |
| `apps/cms/src/features/user/api/upload-consent-evidence-file.ts` | 성범죄 파일 prepare → PUT → confirm |
| `apps/cms/src/features/user/api/hooks/use-consent-filled-document-mutation.ts` | 상세 보기 Class G POST (캐시 없음) |

**Last updated:** 2026-08-26
