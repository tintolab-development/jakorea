# 회원 동의서 세부 내용 저장·조회 — 백엔드 전달

**작성일:** 2026-08-25  
**우선순위:** P1 (등록은 boolean만으로 가능 · 상세 「동의서 보기」 복원 불가)  
**요청 대상:** Members API · consent-records · (택1) form-responses  
**관련 FE:** `member-register-consent-write-snapshot.ts` · `map-pre-register-request.ts` · `use-form-response-draft-query.ts` · `member-consent-template-map.ts`  
**관련 정책:** `.cursor/rules/terms-and-consent-policy.mdc`  
**선행 문서:** [members-pre-register-terms-required-policy-backend-request-2026-08-11.md](./members-pre-register-terms-required-policy-backend-request-2026-08-11.md) §5.3 (`formResponseId` P1만 언급, draft 계약 없음)

---

## 1. 요약

CMS **회원·강사 신규 등록**에서 작성한 동의서 **세부 내용**이 서버에 남지 않습니다. 지금 저장·조회되는 것은 **항목 전체 동의여부(`agreed`) + 시각**뿐입니다.

회원 상세 「약관 및 동의 > 동의서 보기」는 등록/가입 시 제출한 본문을 복원해야 합니다.

| 필요 | 현재 |
|------|------|
| 전체 동의여부 | `termsAgreements` / `consent-records.consentValue` |
| 단락·항목별 동의 라디오 | **미저장** |
| 지급조서 기본정보(성명·주민번호·계좌 등) | **미저장** (세션 메모리만) |
| 행정정보 대상자 본인·식별번호 | **미저장** |
| 성범죄 동의서 첨부 파일 | `evidenceFileObjectId` 필드는 있으나 등록 payload에 안 실림 |

**요청:** 동의서 5종의 **작성 본문**을 DB에 저장하고, 상세 「동의서 보기」가 `WritingFormDraft`( + 지급조서 sidecar / 성범죄 파일)로 되돌릴 수 있는 조회 API를 제공할 것.

**이번 문서 범위:** 계약·UI 기준 저장 항목만. CMS/OpenAPI 구현은 FE 후속.

**UI 기준:** CMS 작성(fill) 모달 + `@jakorea/form-schema` seed. Platform 화면은 기준이 아님.

---

## 2. 목적

CMS 등록·상세 작성, (가능하면) 포털 가입/강사신청에서 작성한 동의서 세부를 DB에 남기고, 회원 상세 「동의서 보기」에서 **제출본 그대로** 복원한다.

- 등록 폼 기본정보 → 동의서 **자동 채움 금지**. 보기는 **제출본만**.
- 선택 항목 `agreed: false`(미작성)는 [선행 문서 §5.2](./members-pre-register-terms-required-policy-backend-request-2026-08-11.md)대로 **등록 허용**. 보기 시 빈 상태.
- 「동의」는 동의서 작성·제출 완료 후에만 인정 (`terms-and-consent-policy.mdc`).

---

## 3. 현재 구현 (코드·OpenAPI 기준)

```
동의서 작성 모달
  → 세션 메모리 snapshot (탭 닫으면 소실)
  → pre-register termsAgreements[]   ※ draft 미전송
  → consent-records (agreed boolean만)
  → 동의서 보기
       formResponseId 거의 없음
       useFormResponseDraftQuery queryFn = 항상 null
```

### 3.1 저장 (등록)

CMS 신규 등록은 `termsAgreements[]`만 보낸다.

| 필드 | 의미 |
|------|------|
| `termsType` | 약관/동의 유형 |
| `version` | 약관 문서 버전 |
| `required` | 등록 필수 여부 |
| `agreed` | 항목 전체 동의여부 |

작성 완료 draft는 `member-register-consent-write-snapshot.ts`에만 있고, `map-pre-register-request.ts` / `build-pre-register-terms-agreements.ts`는 **draft를 붙이지 않는다**.

OpenAPI `TermsAgreementRequest.termsSnapshotJson`은 **게시 약관 원장** 스냅샷용이며, 스펙상 **클라이언트를 신뢰하지 않음**. 작성 양식(`WritingFormDraft`)과 무관하다.

### 3.2 조회 (상세)

`GET /api/admin/users/{memberId}/consent-records` → `MemberConsentRecordResponse`:

| 필드 | 본문 복원 |
|------|-----------|
| `consentValue` / `consentedAt` | 전체 동의여부만 |
| `formResponseId` | optional · 현재 등록에서 안 채움 |
| `evidenceFileObjectId` | optional · 성범죄 파일용으로 보이나 등록에서 안 채움 |

회원 상세 `termsAgreements`(`TermsAgreementRow`)도 `agreed` / `agreedAt`만.

「동의서 보기」는 `formResponseId`가 있으면 `useFormResponseDraftQuery`를 치지만 **queryFn이 항상 `null`** (TODO: API 미연동).

기존 `GET /api/admin/form-responses/{responseId}` 의 `answers` map(`questionKeySnapshot` + `answerValueJson`)만으로는 CMS 미리보기 복원이 **불가**하다. fill UI는 단락 id·표 셀·`bottomConsent`·sidecar를 가진 **`WritingFormDraft` 원문**이 필요하다.

`form-responses` submit / `document-snapshot`은 **프로그램 설문용**이며, 회원 등록 동의서와 연결되어 있지 않다.

### 3.3 포털 (참고)

- `/api/portal/me/consents/documents*` — 전자서명 문서(`content` 문자열). CMS 관리자 대리 작성 `WritingFormDraft`와 **다른 계약**.
- 회원가입 `termsSnapshotJson` — 약관 원문. 동의서 fill이 아님.

---

## 4. 대상 5종

| CMS 라벨 | `termsType` | `templateCode` | 저장 단위 |
|----------|-------------|----------------|-----------|
| 초상권 수집·이용 동의 | `PORTRAIT_RIGHTS` | `agreement-portrait` | `WritingFormDraft` |
| 지급조서 사전 동의서 | `PAYMENT_STATEMENT_PRE_CONSENT` | `agreement-third-party` | `WritingFormDraft` + **sidecar `paymentBasicInfo`** |
| 교육진행자 동의 서약서 | `FACILITATOR_PLEDGE` | `agreement-expense` | `WritingFormDraft` |
| 행정정보 공동이용 사전동의서 | `ADMINISTRATIVE_INFO_CONSENT` | `agreement-notice` | `WritingFormDraft` |
| 성범죄 경력 조회 동의서 | `CRIMINAL_HISTORY_CHECK_CONSENT` | `agreement-crime` | **파일** (`evidenceFileObjectId`). draft 아님 |

시드 JSON: [writing-form-seeds-backend-handoff.md](../writing-form-seeds-backend-handoff.md) 「동의 양식 (5)」.

`PAYMENT_STATEMENT_PRE_CONSENT` 원장 별칭 `PAYMENT_STATEMENT_CONSENT`는 선행 문서와 동일. 저장 본문은 `agreement-third-party` / `document-payment-order-pre-consent`와 같은 schema.

---

## 5. 공통 저장 규칙

| 항목 | 위치 | 비고 |
|------|------|------|
| 항목 전체 `agreed` + `agreedAt` | `termsAgreements` / consent-records | **기존 계약 유지** |
| 작성 본문 | **전체 `WritingFormDraft`(`schemaJson`)** | 고정 문구·표 셀도 포함하면 「보기」가 시드 overlay 없이 복원 가능 |
| 지급조서 기본정보 | sidecar `paymentBasicInfo` | draft `paymentRecord` 단락 **밖** |
| 성범죄 첨부 | `evidenceFileObjectId` (+ 원본 파일명) | snapshot `displaySrc`는 FE 전용 |
| 날짜 `agreement_date` / 서명 `agreement_signature` | draft 시스템 단락 | 제출 시각·서명 이미지가 있으면 함께 저장. 없으면 보기에서 시드 복원 |

**권장:** answers map만 저장하지 말 것. `schemaJson`에 **작성 완료 시점의 `WritingFormDraft` 전체**를 남긴다. `schemaJson`은 object → API 저장 시 **JSON string** (이중 stringify 금지). 계약은 [form-template-json-contract.md](../form-template-json-contract.md)와 동일.

표 컬럼 공통 의미:

| 컬럼 | 값 |
|------|-----|
| 분류 | **사용자 입력** / **UI 고정(시드)** / **sidecar** / **파일** |
| 제출 필수 | 작성완료(`agreed: true`) 시 FE 검증. `agreed: false`면 본문 없어도 등록 가능 |

---

## 6. 동의서별 저장 필요 항목 (현재 CMS UI 기준)

근거: `@jakorea/form-schema` seed · CMS fill 모달. 단락 id는 시드와 동일해야 한다.

### 6.1 초상권 — `PORTRAIT_RIGHTS` / `agreement-portrait`

작성 UI: 「초상권 수집·이용 동의서」. factory: `createPortraitRightsConsentDraft`.

| UI 라벨 | 저장 위치 | 분류 | 제출 필수 | 비고 |
|---------|-----------|------|-----------|------|
| 안내문 하단 동의/미동의 | `agreement-portrait-intro`.`bottomConsent` (`agree` \| `disagree`) | 사용자 입력 | Y | `showBottomConsent: true` |
| 성명 | `agreement-portrait-personal-consent-table` 1행 셀[0] | 사용자 입력 | Y | |
| 소속 | 동일 표 1행 셀[1] | 사용자 입력 | Y (택1) | 텍스트 **또는** 「소속 없음」. 없음이면 셀 값 `"소속 없음"` (`portrait-consent-cell.ts`) |
| 수집 항목 / 수집 목적 / 보유 기간 | 동일 표 이후 행 셀 | UI 고정(시드) | — | |
| 표 하단 동의/미동의 | 동일 표 `bottomConsent` | 사용자 입력 | Y | |
| 위탁 업체 / 위탁 업무 / 위탁 기간 | `agreement-portrait-delegated-consent-table` 셀 | UI 고정(시드) | — | |
| 표 하단 동의/미동의 | 동일 표 `bottomConsent` | 사용자 입력 | Y | |
| 초상권 이용 목적·범위 등 | `agreement-portrait-usage-table` 셀 | UI 고정(시드) | — | |
| 표 하단 동의/미동의 | 동일 표 `bottomConsent` | 사용자 입력 | Y | |
| 확인 문구·날짜·서명 | closing / system 단락 | UI 고정·시스템 | — | §5 |

작성완료: 성명 + (소속 또는 소속 없음) + 필수 `bottomConsent === agree`.

### 6.2 지급조서 — `PAYMENT_STATEMENT_PRE_CONSENT` / `agreement-third-party`

작성 UI: 사전 동의 가로표 + **지급조서 기본정보 폼**(sidecar).  
sidecar 타입: `PaymentStatementBasicInfoValues` (`packages/form-schema/src/consent/payment-statement-basic-info.ts`).  
검증: `isPaymentStatementBasicInfoIncomplete`.

#### 6.2.1 단락 동의 라디오 (`WritingFormDraft`)

| UI 라벨 | 저장 위치 | 분류 | 제출 필수 | 비고 |
|---------|-----------|------|-----------|------|
| 개인정보 수집·이용 하단 동의 | `payment-statement-pre-consent-seed-p1-collection`.`bottomConsent` | 사용자 입력 | Y | `showBottomConsent: true` |
| 고유식별번호 수집·이용 하단 동의 | `…-p2-rrn-collection`.`bottomConsent` | 사용자 입력 | Y | |
| 개인정보 제3자 제공·이용 하단 동의 | `…-p3-third-party`.`bottomConsent` | 사용자 입력 | Y | |
| 고유식별번호 제3자 제공·이용 하단 동의 | `…-p4-rrn-third-party`.`bottomConsent` | 사용자 입력 | Y | |
| 표 본문 (항목·목적·보유기간) | 위 4개 표 셀 | UI 고정(시드) | — | |
| 중간/최종 안내문 | `…-intro` / `…-mid-consent-line` / `…-final-confirm` | UI 고정(시드) | — | |
| 지급조서 표 슬롯 | `…-payment-record` | UI 고정(빈 셀) | — | **값은 sidecar**. 표 셀에 넣지 않음 |
| 날짜·서명 | mid/tail system 단락 | 시스템 | — | §5 |

#### 6.2.2 sidecar `paymentBasicInfo`

| UI 라벨 | 저장 위치 | 분류 | 제출 필수 | 비고 |
|---------|-----------|------|-----------|------|
| 성명 | `paymentBasicInfo.nameKo` | sidecar | Y | |
| 영문 성명 | `paymentBasicInfo.nameEn` | sidecar | N | UI 입력 있음. 현재 FE 검증 필수 아님 |
| 주민등록번호 앞 6자리 | `paymentBasicInfo.residentFront` | sidecar | Y | |
| 주민등록번호 뒤 7자리 | `paymentBasicInfo.residentBack` | sidecar | Y | |
| 소속 | `paymentBasicInfo.affiliation` | sidecar | Y (택1) | `noAffiliation === true`이면 소속 텍스트 불필요 |
| 소속 없음 | `paymentBasicInfo.noAffiliation` | sidecar | Y (택1) | boolean |
| 자택 도로명·지번 | `paymentBasicInfo.addressRoad` | sidecar | Y | |
| 자택 상세 주소 | `paymentBasicInfo.addressDetail` | sidecar | Y | |
| 은행명 | `paymentBasicInfo.bankName` | sidecar | Y | |
| 계좌번호 | `paymentBasicInfo.accountNumber` | sidecar | Y | |
| 예금주명 | `paymentBasicInfo.accountHolder` | sidecar | Y | |
| 지급 목적 | `paymentBasicInfo.paymentPurpose` | sidecar · **UI 잠금** | 저장은 함 | 기본값 `강사비 또는 활동비 지급` (`PAYMENT_STATEMENT_DEFAULT_PURPOSE`). 사용자 편집 아님 |

```ts
type PaymentStatementBasicInfoValues = {
  nameKo: string
  nameEn: string
  residentFront: string
  residentBack: string
  affiliation: string
  noAffiliation: boolean
  addressRoad: string
  addressDetail: string
  bankName: string
  accountNumber: string
  accountHolder: string
  paymentPurpose: string
}
```

### 6.3 교육진행자 동의 서약 — `FACILITATOR_PLEDGE` / `agreement-expense`

작성 UI: 조항별 객관식(동의 / 동의하지 않음). ids: `EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS`.

| UI 라벨 | 저장 위치 | 분류 | 제출 필수 | 비고 |
|---------|-----------|------|-----------|------|
| 아동·청소년 보호와 성범죄 예방 | `agreement-expense-pledge-clause-1`.`selectedPreviewSingleId` | 사용자 입력 | Y (동의) | option id `…-1-agree` / `…-1-disagree` |
| 종교적 정치적 중립성 유지 | `agreement-expense-pledge-clause-2`.`selectedPreviewSingleId` | 사용자 입력 | Y (동의) | |
| 개인정보 보호 | `agreement-expense-pledge-clause-3`.`selectedPreviewSingleId` | 사용자 입력 | Y (동의) | |
| 품위 유지 및 성실한 교육 수행 | `agreement-expense-pledge-clause-4`.`selectedPreviewSingleId` | 사용자 입력 | Y (동의) | |
| 서약 안내문 | `agreement-expense-pledge-intro`.`bodyText` | UI 고정(시드) | — | |
| 위반 시 안내 | `agreement-expense-pledge-violation-closing` | UI 고정(시드) | — | |
| 날짜·서명 | system 단락 | 시스템 | — | §5 |

작성완료: 4개 조항 모두 **동의** 선택. 「동의하지 않음」이면 작성완료 불가(`agreed: true` 불가).

### 6.4 행정정보 공동이용 사전 동의 — `ADMINISTRATIVE_INFO_CONSENT` / `agreement-notice`

작성 UI: **현재 CMS fill** — 이용기관·이용사무는 disabled 인풋, 식별번호 종류는 주민등록번호 고정. 주민번호 **유효성검사 없음**, 미입력해도 제출 가능.

| UI 라벨 | 저장 위치 | 분류 | 제출 필수 | 비고 |
|---------|-----------|------|-----------|------|
| 이용기관 명칭 | `agreement-notice-institution`.`bodyText` | UI 고정(시드) | N | **빈 문자열**. 사용자 입력 아님 (disabled) |
| 이용사무(이용목적) | `agreement-notice-purpose`.`bodyText` | UI 고정(시드) | N | 고정값 `범죄경력 유무 조회` |
| 공동이용 행정정보 표 | `agreement-notice-table` 셀 | UI 고정(시드) | — | `showBottomConsent` 없음 |
| 식별번호 종류 | `agreement-notice-table.idTypeWithInput.selectedOptionId` | UI 고정(시드) | N | 고정 `agreement-notice-id-resident` (`AGREEMENT_NOTICE_ID_TYPE_RESIDENT_OPTION_ID`). 라디오 잠금 |
| 식별번호(주민등록번호) | `idTypeWithInput.inputValue` | 사용자 입력 | N | 입력 가능. 미입력·형식 오류여도 작성완료 가능 |
| 대상자 본인 — 성명 | `agreement-notice-subject` item `agreement-notice-subj-name`.`bodyText` | 사용자 입력 | Y | |
| 대상자 본인 — 생년월일 | item `agreement-notice-subj-birth`.`bodyText` | 사용자 입력 | Y | UI placeholder: 8자리 |
| 대상자 본인 — 전화번호 | item `agreement-notice-subj-phone`.`bodyText` | 사용자 입력 | Y | |
| 정보주체(본인) 동의사항 | `agreement-notice-consent-static` | UI 고정(시드) | — | |
| 날짜·서명 | system 단락 | 시스템 | — | §5 |

작성완료: 대상자 본인 3칸만 필수. 이용기관/이용사무/식별번호 종류는 시드 고정값을 그대로 저장.

### 6.5 성범죄 경력조회 동의 — `CRIMINAL_HISTORY_CHECK_CONSENT` / `agreement-crime`

작성 UI: 정적 A4 + 파일 교체 (`member-consent-crime-modal.tsx`). `schemaJson` paragraphs 빈 배열 허용. **WritingFormDraft 응답 없음.**

| UI 라벨 | 저장 위치 | 분류 | 제출 필수 | 비고 |
|---------|-----------|------|-----------|------|
| 동의서 첨부 파일 | `evidenceFileObjectId` | 파일 | Y | 미첨부 시 작성완료 불가. 메시지: `동의서 파일을 첨부해 주세요.` |
| 원본 파일명 | 파일 메타 (권장) | 파일 | — | FE 세션 `replacementFileName`. `displaySrc`(blob URL)는 **저장하지 말 것** |

기존 `MemberConsentRecordResponse.evidenceFileObjectId`를 사용해도 된다. 등록/상세 PATCH에서 **업로드 후 object id를 consent-record에 연결**해야 한다.

---

## 7. 저장 API (택1 — BE 확정)

`agreed: true`인 동의서 작성형에 본문을 남긴다. `agreed: false`는 본문 없이 기존처럼 등록 성공.

### 옵션 A — 등록/PATCH에 `filledDocument` 동봉

`POST /api/admin/users/pre-register/individual`  
`POST /api/admin/users/pre-register/instructor`  
상세 동의 PATCH (있는 경우)

`termsAgreements[]` 항목에 예:

```json
{
  "termsType": "PORTRAIT_RIGHTS",
  "version": "2026-01",
  "required": false,
  "agreed": true,
  "filledDocument": {
    "templateCode": "agreement-portrait",
    "schemaJson": { "schemaVersion": 1, "formSettings": {}, "paragraphs": [] },
    "paymentBasicInfo": null
  }
}
```

| 필드 | 조건 |
|------|------|
| `filledDocument.templateCode` | §4와 일치 |
| `filledDocument.schemaJson` | `WritingFormDraft` (crime 제외) |
| `filledDocument.paymentBasicInfo` | `PAYMENT_STATEMENT_PRE_CONSENT`만. 그 외 omit/`null` |
| 성범죄 | `filledDocument` 대신 `evidenceFileObjectId` (선행 업로드) |

서버가 본문을 저장한 뒤 `formResponseId`(또는 동등 PK)를 발급하고 consent-record에 연결.

### 옵션 B — form-responses 선제출 후 id만 연결

1. `POST /api/admin/form-responses/submit` (또는 **회원 동의서 전용 path**)에 `WritingFormDraft` + optional `paymentBasicInfo` 제출
2. 응답 `formResponseId`를 `termsAgreements[].formResponseId`에 실어 pre-register
3. 성범죄는 파일 업로드 → `evidenceFileObjectId`

기존 submit이 `programId` / 설문 `answers`만 받으면 **회원 동의서용 path 또는 확장 필드가 필요**하다. `answers` map만 저장하면 「보기」 복원 불가(§3.2).

**최소 수용:** A 또는 B 중 하나로, §6 표의 사용자 입력·sidecar·파일이 round-trip 된다.

---

## 8. 조회 API

상세 「동의서 보기」가 한 번에 필요한 것:

| `termsType` | 조회 결과 |
|-------------|-----------|
| portrait / expense / notice | `formResponseId` + **`WritingFormDraft` 원문** (`schemaJson`) |
| payment | 위 + **`paymentBasicInfo`** |
| crime | `evidenceFileObjectId` + 파일 다운로드 URL(또는 object GET) |

제안 (택1):

1. `GET /api/admin/users/{memberId}/consent-records/{consentType}/filled-document`  
   → `{ templateCode, schemaJson, paymentBasicInfo?, evidenceFileObjectId? }`
2. `GET /api/admin/form-responses/{formResponseId}` 를 **`schemaJson`(`WritingFormDraft`) 포함**으로 확장  
   + consent-records의 `formResponseId`를 실제로 채움  
   + 지급조서는 sidecar를 extension/별 필드에 포함

`document-snapshot`이 프로그램 렌더 전용이면 회원 동의 fill 미리보기와 맞지 않을 수 있다. CMS는 **작성 모달과 같은 `WritingFormDraft`** 가 필요하다.

---

## 9. 수용 테스트

### 9.1 강사 등록 — 지급조서·행정정보 작성 후 보기

**Given:** 강사 pre-register. 지급조서 §6.2 필수 필드 + 4개 `bottomConsent: agree`. 행정정보 대상자 본인 3칸.  
**When:** 등록 성공 후 회원 상세 → 각 「동의서 보기」  
**Then:** 성명·계좌·대상자 본인 등이 **작성값과 동일**. 지급 목적은 `강사비 또는 활동비 지급`. 이용사무는 `범죄경력 유무 조회`.

### 9.2 초상권·서약 — 항목별 라디오

**Given:** 초상권 성명/소속 + 하단 동의 4곳. 서약 조항 4개 모두 동의.  
**Then:** 보기에서 동일 라디오·셀 값.

### 9.3 성범죄 파일

**Given:** 파일 첨부 후 `agreed: true`  
**Then:** 보기에서 첨부본 표시. 미첨부는 작성완료 불가.

### 9.4 미작성 (`agreed: false`)

**Given:** 동의서 5종 미동의, 필수 약관만 동의  
**Then:** 등록 **성공**. 보기 시 제출본 없음(빈 상태). 4xx 아님 (선행 문서 §6.1·§6.2).

### 9.5 행정정보 주민번호 미입력

**Given:** 대상자 본인만 채움, 식별번호 `inputValue` 빈 값  
**Then:** 작성완료·등록 가능. 보기에서 식별번호 빈 칸.

---

## 10. FE 후속 (이 문서 범위 밖 · 구현하지 않음)

BE 계약 확정 후:

1. `member-register-consent-write-snapshot`을 등록 payload(`filledDocument` 또는 form-response submit)에 실기
2. 성범죄 파일을 object storage 업로드 후 `evidenceFileObjectId` 전송
3. `useFormResponseDraftQuery`를 조회 API에 연동 (항상 `null` 제거)
4. 회원 상세에서 동의서 재작성·제출 완료 시 동일 저장 API

OpenAPI 갱신 후 `pnpm --filter cms generate:api`.

---

## 11. BE 확인 체크리스트

- [ ] §4 `termsType` ↔ `templateCode` 매핑 문서·코드 일치
- [ ] `agreed: true` + 본문 저장 (A 또는 B)
- [ ] `agreed: false` 본문 없이 등록 성공
- [ ] 조회가 `WritingFormDraft` 원문을 반환 (`answers` map만 아님)
- [ ] 지급조서 `paymentBasicInfo` 12필드 round-trip (§6.2.2)
- [ ] 성범죄 `evidenceFileObjectId` 연결·다운로드
- [ ] 행정정보: 이용기관 빈 값 · 이용사무 고정 문구 · 주민번호 미입력 허용
- [ ] 등록 기본정보로 동의서 서버측 자동 채움 없음
- [ ] OpenAPI 갱신 후 CMS orval 재생성 가능

---

## 12. 참고

| 문서 | 관계 |
|------|------|
| [members-pre-register-terms-required-policy-backend-request-2026-08-11.md](./members-pre-register-terms-required-policy-backend-request-2026-08-11.md) | 등록 `required`/`agreed` · §5.3 `formResponseId` P1 |
| [writing-form-seeds-backend-handoff.md](../writing-form-seeds-backend-handoff.md) | 5종 templateCode·단락 id |
| [form-template-json-contract.md](../form-template-json-contract.md) | `schemaJson` = `WritingFormDraft` |
| `.cursor/rules/terms-and-consent-policy.mdc` | 필수/선택·미동의 제한·유효기간 |

**Last updated:** 2026-08-25
