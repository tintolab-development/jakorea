# 회원 포탈 마이페이지 동의 관리 — 백엔드 구현 요청

**작성일:** 2026-10-06  
**우선순위:** P1  
**요청 대상:** Portal Members (`/api/portal/me/*`) · 회원 동의 원장 · 초상권 `consentStatus`  
**화면:** Platform 마이페이지 → 약관 및 정책 동의 관리  
**인증:** 회원 Bearer. 본인(`SELF_OWNED`)만. 관리자 토큰으로 호출하지 않는다.

이 문서만으로 구현·OpenAPI 반영·검수할 수 있다.  
다른 핸드오프, 프론트 레포, Notion을 **읽지 말고** 아래 계약만 따른다.  
현재 OpenAPI 발췌는 이 문서 §2에 모두 적는다.

---

## 0. 이번에 할 일 / 하지 말 일

### 할 일 (필수)

| #   | 작업                                           | Path                                                     |
| --- | ---------------------------------------------- | -------------------------------------------------------- |
| 1   | **신규** 마케팅 동의 변경                      | `PUT /api/portal/me/marketing-consent`                   |
| 2   | 초상권 상태 **`FULL` 제거 → `PARTIAL` 통일**   | 원장 + 조회/완료 응답. path 추가 없음                    |
| 3   | **`documentId` 없는 선택 동의 철회**           | `POST /api/portal/me/consents/{consentType}/withdraw`    |
| 4   | `GET /api/portal/me/consents` **행 구성 계약** | 기존 path. 유형별 행 + 문서 4종 항상                     |
| 5   | 미성년 판별 필드 명시                          | `GET /api/portal/auth/me` · `GET /api/portal/me/profile` |

### 하지 말 일 (이번 범위 밖)

- 문서 4종(지급조서·교육진행자 서약·행정정보·성범죄)의 **작성 / 확인 / 재작성 / 유형 철회** API
- 보호자 본인인증 재수행
- 보호자 통지·알림
- 필수 약관(`SERVICE_TERMS`, `PRIVACY_COLLECTION`, `TEACHER_INFO_COLLECTION`, `GUARDIAN_CONSENT`) 철회
- 관리자 `PUT /api/admin/me/marketing-consent` 변경 (참고만. 회원 포털에서 쓰지 않음)
- `PATCH /api/portal/me/profile`에 마케팅 필드 추가

---

## 1. 무엇을 바꾸는가

마이페이지 동의 관리가 **실제 회원 동의 원장**을 읽고, **마케팅 철회·재동의**와 **documentId 없는 초상권/아동개인정보 철회**를 저장한다.  
초상권은 항목 1·2·3을 전부 동의해도 `consentStatus`를 `FULL`이 아니라 **`PARTIAL`**로 내린다. 프로그램 참여는 `programEligible`만 본다.

철회·재동의 주체는 **회원 본인**(만 14세 미만 포함). 보호자에게 알리지 않는다.

---

## 2. 현재 계약 (AS-IS) — 이 절만 보면 된다

### 2.1 이미 있는 Portal 동의 API

| Method  | Path                                                      | 용도                                                                         | 이번 작업                             |
| ------- | --------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------- |
| `GET`   | `/api/portal/me/consents`                                 | 통합 동의 목록 `MemberPortalConsentSummary[]`                                | **행 구성만 수정**                    |
| `GET`   | `/api/portal/me/consents/{consentType}`                   | 유형 1건 상세                                                                | 목록과 동일 필드. path 유지           |
| `POST`  | `/api/portal/me/consents/documents/{documentId}/withdraw` | 전자서명 문서 철회                                                           | **유지**. `documentId` 있을 때만 동작 |
| `GET`   | `/api/portal/auth/me`                                     | `HomepageMeResponse` (`ageGroup`, `teacher`, `memberType`)                   | **enum·필수 명시**                    |
| `GET`   | `/api/portal/me/profile`                                  | `PortalProfileResponse` (`birthDate`, `teacher`, `instructor`, `memberType`) | **`under14` 또는 `ageGroup` 추가**    |
| `PATCH` | `/api/portal/me/profile`                                  | 주소·소속 등                                                                 | 마케팅 필드 **없음. 넣지 말 것**      |

없는 것: `PUT /api/portal/me/marketing-consent`, `POST /api/portal/me/consents/{consentType}/withdraw`.

### 2.2 기존 문서 철회 (유지)

```
POST /api/portal/me/consents/documents/{documentId}/withdraw
Authorization: Bearer (회원)
Idempotency-Key: (optional)
```

요청 (`MemberPortalConsentWithdrawRequest`, `reason` 필수, 0~500자):

```json
{ "reason": "회원 마이페이지에서 직접 철회" }
```

응답 200 (`MemberPortalConsentMutationResponse`):

```json
{
  "documentId": 9001,
  "consentType": "PORTRAIT_RIGHTS",
  "status": "WITHDRAWN",
  "changedAt": "2026-10-06T02:00:00"
}
```

문제: 가입 때 체크만 한 초상권 등은 목록의 `documentId`가 null이라 이 API를 호출할 수 없다. → §5.

### 2.3 `MemberPortalConsentSummary` (목록/상세 공통, 필드 유지)

| 필드                      | 타입              | 설명                                               |
| ------------------------- | ----------------- | -------------------------------------------------- |
| `consentType`             | string            | §2.4 canonical                                     |
| `title`                   | string            | 화면 제목. 없어도 FE 카탈로그 제목 사용            |
| `applicable`              | boolean           | 해당 여부. **false여도 문서 4종은 행을 내려 준다** |
| `required`                | boolean           | 필수 여부                                          |
| `agreed`                  | boolean           | 동의 여부. null 금지 권장                          |
| `signed`                  | boolean           | 전자서명 완료                                      |
| `status`                  | string            | 서버 원본 상태. 화면 라벨과 분리                   |
| `agreedAt`                | date-time \| null | 동의 시각                                          |
| `expiresAt`               | date-time \| null | 만료 시각                                          |
| `expired`                 | boolean           | 만료 여부                                          |
| `withdrawable`            | boolean           | 철회 가능. 필수는 `false`                          |
| `participationRestricted` | boolean           | 미동의 시 프로그램 참여 제한                       |
| `paymentRestricted`       | boolean           | 미동의 시 급여 지급 제한                           |
| `reconsentRequired`       | boolean           | 재동의 필요                                        |
| `documentId`              | int64 \| 없음     | 전자서명 문서 ID. 없으면 필드 생략 또는 null       |
| `termsVersion`            | string            | 동의한 약관 버전                                   |
| `currentTermsVersion`     | string            | 현재 약관 버전                                     |
| `policyUpdated`           | boolean           | 약관 개정                                          |
| `consentStatus`           | string            | **`PORTRAIT_RIGHTS`만**. §4                        |
| `programEligible`         | boolean           | **`PORTRAIT_RIGHTS`만**. 항목 1·2 모두 동의면 true |

응답 envelope: 기존 Portal 동의 GET과 **동일하게** 맞춘다.  
배열 직접 반환이든 `{ "success": true, "data": [ ... ] }` 이든, 지금 `GET /consents`와 같은 형태를 유지한다.  
신규 PUT/POST도 **같은 envelope 규칙**을 쓴다.

### 2.4 canonical `TERMS_TYPE` (회원 원장에 저장 가능한 값)

입력·조회에 아래만 쓴다. `PAYMENT_STATEMENT_PRE_CONSENT` 입력은 원장에서 `PAYMENT_STATEMENT_CONSENT`로 정규화한다.

```
SERVICE_TERMS
PRIVACY_COLLECTION
MARKETING
GUARDIAN_CONSENT
CHILD_PRIVACY_COLLECTION
TEACHER_INFO_COLLECTION
PORTRAIT_RIGHTS
SOCIAL_CONNECTION
PROGRAM_PRIVACY_CONSENT
PROGRAM_THIRD_PARTY_CONSENT
INSTRUCTOR_VERIFICATION_CONSENT
PAYMENT_STATEMENT_PRE_CONSENT   // 입력 별칭만. 저장·조회는 PAYMENT_STATEMENT_CONSENT
PAYMENT_STATEMENT_CONSENT
FACILITATOR_PLEDGE
ADMINISTRATIVE_INFO_CONSENT
CRIMINAL_HISTORY_CHECK_CONSENT
```

### 2.5 회원 유형 판별 (서버 SSOT)

| 개념      | 판정                                                 | 쓰는 필드                                     |
| --------- | ---------------------------------------------------- | --------------------------------------------- |
| 교사      | `teacher == true` **또는** `memberType == "TEACHER"` | `HomepageMeResponse`, `PortalProfileResponse` |
| 교사 겸직 | 교사 + `instructor == true`                          | profile                                       |
| 강사만    | `instructor == true` 이고 교사 아님                  | profile. **교사 약관은 넣지 않음**            |
| 미성년    | `ageGroup == "UNDER_14"`                             | me. 없으면 생년월일로 만 14세 미만            |

`memberType` 예: `GENERAL`, `TEACHER`.  
교사는 가입 정책상 만 14세 이상이다. **미성년 + 교사 조합은 만들지 않는다.**

만 14세 미만 계산(서버, `ageGroup` 없을 때 폴백):

```
today = 서버 현재 날짜(KST)
ageYears = today.year - birthDate.year
if (today.month, today.day) < (birthDate.month, birthDate.day): ageYears -= 1
under14 = ageYears < 14
```

### 2.6 `HomepageMeResponse` (AS-IS 발췌)

| 필드         | 타입    | 예          | 이번 요청                   |
| ------------ | ------- | ----------- | --------------------------- |
| `memberId`   | int64   | 12001       | 유지                        |
| `memberType` | string  | `"GENERAL"` | 유지. 교사는 `"TEACHER"`    |
| `ageGroup`   | string  | `"OVER_14"` | **enum 고정, 항상 채움** §7 |
| `teacher`    | boolean | false       | 유지                        |

`ageGroup`은 지금 자유 문자열이다. 예시는 `OVER_14` / `UNDER_14`만 쓰인다.

### 2.7 `PortalProfileResponse` (AS-IS 발췌)

| 필드                   | 타입              | 이번 요청              |
| ---------------------- | ----------------- | ---------------------- |
| `birthDate`            | date `YYYY-MM-DD` | 유지                   |
| `memberType`           | string            | 유지                   |
| `teacher`              | boolean           | 유지                   |
| `instructor`           | boolean           | 유지                   |
| `ageGroup` / `under14` | 없음              | **둘 중 하나 추가** §7 |

### 2.8 관리자 마케팅 API (참고 · 회원 포털에 복사하지 말 것)

이미 있는 것: `PUT /api/admin/me/marketing-consent`  
body `{ agreed, version?, consentTextSnapshot? }`  
응답 `{ adminAccountId, consentType, version, agreed, agreedAt, withdrawnAt, updatedAt }`

회원용은 **별도 path** §3. 관리자 path를 회원 토큰으로 열지 않는다.

---

## 3. 마케팅 동의 변경 (신규)

지금 회원 포털에는 마케팅을 바꾸는 API가 없다.

```
PUT /api/portal/me/marketing-consent
Authorization: Bearer (회원)
Content-Type: application/json
```

권한: 로그인 회원 본인. 감사로그 **필수**.

### 3.1 요청 `PortalMarketingConsentUpdateRequest`

```json
{ "agreed": false }
```

| 필드      | 타입    | 필수   | 설명                                                          |
| --------- | ------- | ------ | ------------------------------------------------------------- |
| `agreed`  | boolean | 예     | `true` = 재동의, `false` = 철회                               |
| `version` | string  | 아니오 | 있으면 해당 약관 버전으로 저장. 없으면 현재 게시 버전         |
| `reason`  | string  | 아니오 | 철회 사유. 없으면 서버 기본 `"회원 마이페이지에서 직접 철회"` |

`agreed` 누락·null → **400**.

### 3.2 응답 200 `PortalMarketingConsentResponse`

기존 관리자 응답에서 회원에 맞게 축소. **`withdrawnAt`은 필수에 가깝다**(철회 완료 팝업 일자).

```json
{
  "consentType": "MARKETING",
  "agreed": false,
  "agreedAt": null,
  "withdrawnAt": "2026-10-06T02:00:00",
  "updatedAt": "2026-10-06T02:00:00",
  "version": "2026-05-18"
}
```

재동의 예:

```json
{
  "consentType": "MARKETING",
  "agreed": true,
  "agreedAt": "2026-10-06T02:05:00",
  "withdrawnAt": null,
  "updatedAt": "2026-10-06T02:05:00",
  "version": "2026-05-18"
}
```

| 필드          | 규칙                                                          |
| ------------- | ------------------------------------------------------------- |
| `consentType` | 항상 `"MARKETING"`                                            |
| `agreed`      | 요청과 동일                                                   |
| `agreedAt`    | `agreed=true`면 이번 동의 시각. `false`면 null                |
| `withdrawnAt` | `agreed=false`면 이번 철회 시각(ISO date-time). `true`면 null |
| `updatedAt`   | 원장 갱신 시각                                                |
| `version`     | 저장된 약관 버전                                              |

성공 직후 `GET /api/portal/me/consents`의 `MARKETING` 행과 **값이 같아야** 한다.

- `agreed` 동일
- `agreedAt` / 만료 필드 일치
- `required: false`, `withdrawable: true`(이미 미동의하면 재동의만 해당. 철회 반복은 409)

### 3.3 오류

| 조건                               | HTTP | `error.code` 권장   | message 예                        |
| ---------------------------------- | ---- | ------------------- | --------------------------------- |
| 비로그인                           | 401  | `UNAUTHORIZED`      | 인증이 필요합니다.                |
| 타인 계정 조작                     | 403  | `PERMISSION_DENIED` | 이 작업을 수행할 권한이 없습니다. |
| `agreed` 없음                      | 400  | `VALIDATION_ERROR`  | agreed는 필수입니다.              |
| 이미 `agreed=false`인데 또 `false` | 409  | `CONFLICT`          | 이미 철회된 상태입니다.           |
| 이미 `agreed=true`인데 또 `true`   | 409  | `CONFLICT`          | 이미 동의된 상태입니다.           |

원장에 `MARKETING` 행이 없으면 **생성 후** 요청 상태로 저장한다(가입 때 빠진 계정).

미성년도 본인 토큰으로 **동일하게 허용**. 보호자 확인 없음.

---

## 4. 초상권 상태 통일 (`FULL` → `PARTIAL`)

대상 유형: **`PORTRAIT_RIGHTS`만**. 다른 약관에 `consentStatus`를 확장하지 않는다.

양식 코드: `agreement-portrait`  
판정 단락(표 하단 `bottomConsent` = `"agree"` \| `"disagree"`):

| #   | 단락 id                                      | 제목                              |
| --- | -------------------------------------------- | --------------------------------- |
| 1   | `agreement-portrait-personal-consent-table`  | 개인정보 및 초상권 수집·이용 동의 |
| 2   | `agreement-portrait-delegated-consent-table` | 개인정보처리위탁 제공 동의        |
| 3   | `agreement-portrait-usage-table`             | 초상권 제공·이용 동의             |

서버가 `filledDocument.schemaJson`에서 다시 계산한다. 요청 `consentStatus` / `programEligible`은 힌트다.

```text
item1 = paragraphs[id=agreement-portrait-personal-consent-table].bottomConsent
item2 = paragraphs[id=agreement-portrait-delegated-consent-table].bottomConsent
item3 = paragraphs[id=agreement-portrait-usage-table].bottomConsent

programEligible = (item1 == "agree") AND (item2 == "agree")

agreed =
  true  → 동의서 작성·제출 완료 (항목 일부 비동의여도 제출됐으면 true)
  false → 미작성 또는 명시 거부 (DISAGREED)

consentStatus =
  DISAGREED  → agreed=false (미작성·거부)
  PARTIAL    → agreed=true  (작성 완료. 항목 1·2·3 전부 동의여도 PARTIAL)
```

### 4.1 변경 표

| 상황                                  | 변경 전 `consentStatus` | 변경 후       | `programEligible` |
| ------------------------------------- | ----------------------- | ------------- | ----------------- |
| 항목 1·2·3 전부 동의 + 성명·소속 완료 | `FULL`                  | **`PARTIAL`** | `true`            |
| 1·2 동의, 3 비동의                    | `PARTIAL`               | `PARTIAL`     | `true`            |
| 1 또는 2 비동의 (작성 완료)           | `PARTIAL`               | `PARTIAL`     | `false`           |
| 미작성·명시 미동의                    | `DISAGREED`             | `DISAGREED`   | `false`           |

**프로그램 신청·참여 게이트:** `programEligible == true`만 통과.  
`consentStatus == "FULL"` 또는 `agreed == true`만 보면 **이번 변경 후 전부 막히거나 전부 열린다.**  
CMS 회원 상세, 프로그램 참여 게이트, Portal `GET /consents`, 동의 완료 API를 모두 `PARTIAL` + `programEligible`로 바꿔라.

### 4.2 적용 위치

| 위치                                                               | 할 일                                                                                     |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| 회원 원장 `PORTRAIT_RIGHTS.consentStatus`                          | 신규 저장에 `FULL` 쓰지 않음                                                              |
| 기존 `FULL` 행                                                     | 조회 시 `PARTIAL`로 정규화. 배치 마이그레이션 권장                                        |
| `GET /api/portal/me/consents` · `GET .../consents/PORTRAIT_RIGHTS` | `consentStatus: "PARTIAL"` \| `"DISAGREED"`만                                             |
| 동의 완료 요청 `MemberPortalConsentCompleteRequest.consentStatus`  | enum에서 `FULL` 제거. 클라이언트가 `FULL`을 보내면 **`PARTIAL`로 정규화**(4xx 하지 말 것) |
| CMS 회원 상세 `termsAgreements[]` / consent-records                | 동일                                                                                      |
| pre-register · 회원 PATCH의 `TermsAgreementRequest.consentStatus`  | 동일                                                                                      |

`agreed` 의미(`PORTRAIT_RIGHTS`만):  
`true` = 작성·제출 완료(`PARTIAL`). `false` = `DISAGREED`. 바꾸지 않는다.

### 4.3 OpenAPI enum (TO-BE)

```
consentStatus: "PARTIAL" | "DISAGREED"
```

`FULL`은 deprecated. 입력되면 `PARTIAL`로 저장·응답.

### 4.4 영향 범위 (반드시 같이 수정)

| 깨지는 조건                                              | 수정                                                                |
| -------------------------------------------------------- | ------------------------------------------------------------------- |
| CMS/포털 게이트가 `consentStatus === "FULL"`만 참여 허용 | `programEligible === true`로 변경                                   |
| 화면이 `FULL`만 「동의」로 표시                          | 이번 FE 배지는 넣지 않음. BE는 `PARTIAL`만 내리면 됨                |
| 통계가 `FULL` 건수                                       | `PARTIAL` + `programEligible`로 재정의하거나 `FULL` 카운트 = 0 허용 |

다른 `termsType`의 `agreed` boolean은 그대로.

---

## 5. `documentId` 없는 동의 철회 (신규)

```
POST /api/portal/me/consents/{consentType}/withdraw
Authorization: Bearer (회원)
Content-Type: application/json
```

가입 체크만 한 초상권 등, 목록에 `documentId`가 없어도 철회한다.  
기존 `POST .../documents/{documentId}/withdraw`는 **그대로 둔다.**

### 5.1 path

| 항목            | 값                           |
| --------------- | ---------------------------- |
| `{consentType}` | §2.4 문자열. 대소문자 그대로 |

### 5.2 요청

기존 `MemberPortalConsentWithdrawRequest`와 동일.

```json
{ "reason": "회원 마이페이지에서 직접 철회" }
```

| 필드     | 타입          | 필수                                           |
| -------- | ------------- | ---------------------------------------------- |
| `reason` | string, 0~500 | 예. 빈 문자열이면 서버 기본 문구로 저장해도 됨 |

### 5.3 이번 화면에서 허용하는 `consentType`

| consentType                | 허용                | 비고                    |
| -------------------------- | ------------------- | ----------------------- |
| `PORTRAIT_RIGHTS`          | 예                  | `documentId` 없어도 200 |
| `CHILD_PRIVACY_COLLECTION` | 예                  | 미성년 선택 항목        |
| `MARKETING`                | **받지 않음 → 400** | §3 PUT만 사용           |
| 문서 4종                   | **받지 않음 → 400** | 이번 범위 밖            |
| `SERVICE_TERMS`            | 400                 | 필수                    |
| `PRIVACY_COLLECTION`       | 400                 | 필수                    |
| `TEACHER_INFO_COLLECTION`  | 400                 | 필수                    |
| `GUARDIAN_CONSENT`         | 400                 | 필수                    |
| 그 외 §2.4                 | 400                 | 미지원                  |

미성년 본인 철회 **허용**. 보호자 확인·통지 없음.

`PORTRAIT_RIGHTS` 철회 후:

- `agreed: false`
- `consentStatus: "DISAGREED"`
- `programEligible: false`
- `documentId`가 있었으면 문서도 철회 상태

`CHILD_PRIVACY_COLLECTION` 철회 후: `agreed: false`.

### 5.4 응답 200

기존 `MemberPortalConsentMutationResponse` 재사용.

```json
{
  "documentId": null,
  "consentType": "PORTRAIT_RIGHTS",
  "status": "WITHDRAWN",
  "changedAt": "2026-10-06T02:00:00"
}
```

문서가 있으면 `documentId`를 채운다.

### 5.5 오류

| 조건                   | HTTP | `error.code` 권장  | message 예                      |
| ---------------------- | ---- | ------------------ | ------------------------------- |
| 비로그인               | 401  | `UNAUTHORIZED`     | 인증이 필요합니다.              |
| 필수·미지원 유형       | 400  | `VALIDATION_ERROR` | 철회할 수 없는 동의 항목입니다. |
| 이미 미동의            | 409  | `CONFLICT`         | 이미 철회된 상태입니다.         |
| 알 수 없는 consentType | 400  | `VALIDATION_ERROR` | 알 수 없는 동의 유형입니다.     |

### 5.6 권장 부가 (선택이지만 FE에 이득)

동의서 항목(`PORTRAIT_RIGHTS` 등)은 가입 체크만 해도 원장 문서를 만들고, `GET /consents`에 **항상 `documentId`**를 내려 준다.  
그러면 기존 문서 철회 path도 쓸 수 있다. **부가일 뿐, §5 POST는 필수.**

---

## 6. `GET /api/portal/me/consents` 행 구성 (기존 path)

path를 바꾸지 않는다. **배열에 어떤 행이 있는지만** 맞춘다.

없어도 FE는 카탈로그 행을 미동의로 그린다. 맞추면 배지·일자가 정확하다.

### 6.1 유형별 포함 행

| 조건                | 반드시 포함할 `consentType`      | `required` |
| ------------------- | -------------------------------- | ---------- |
| 전원                | `SERVICE_TERMS`                  | true       |
| 전원                | `PRIVACY_COLLECTION`             | true       |
| 전원                | `MARKETING`                      | false      |
| 전원                | `PORTRAIT_RIGHTS`                | false      |
| 교사 또는 교사 겸직 | `TEACHER_INFO_COLLECTION`        | true       |
| 미성년(`UNDER_14`)  | `GUARDIAN_CONSENT`               | true       |
| 미성년              | `CHILD_PRIVACY_COLLECTION`       | false      |
| 전원                | `PAYMENT_STATEMENT_CONSENT`      | false      |
| 전원                | `FACILITATOR_PLEDGE`             | false      |
| 전원                | `ADMINISTRATIVE_INFO_CONSENT`    | false      |
| 전원                | `CRIMINAL_HISTORY_CHECK_CONSENT` | false      |

문서 4종: 미작성·강사 아님·`applicable: false`여도 **행을 내려 준다.**

```json
{
  "consentType": "FACILITATOR_PLEDGE",
  "title": "교육진행자 동의 서약",
  "applicable": false,
  "required": false,
  "agreed": false,
  "signed": false,
  "withdrawable": false,
  "reconsentRequired": false
}
```

강사만 / 일반 성인 / 교사 / 미성년 **모두** 위 4행이 있다.  
`applicable: false`로 숨기지 마라. FE가 미동의 카드로 그린다.

일반 성인에게 `TEACHER_INFO_COLLECTION` / `GUARDIAN_CONSENT` / `CHILD_PRIVACY_COLLECTION`은 **넣지 않는다.**  
교사에게 미성년 2종을 넣지 않는다. 미성년에게 교사 1종을 넣지 않는다.

### 6.2 필수 행 필드

```json
{
  "consentType": "SERVICE_TERMS",
  "title": "서비스 이용약관",
  "applicable": true,
  "required": true,
  "agreed": true,
  "agreedAt": "2026-01-15T00:15:42",
  "withdrawable": false,
  "reconsentRequired": false
}
```

필수: `withdrawable: false`. FE는 약관 보기만 한다.

### 6.3 응답 예시 — 일반 성인 (행 8개)

`SERVICE_TERMS`, `PRIVACY_COLLECTION`, `MARKETING`, `PORTRAIT_RIGHTS` + 문서 4종.

```json
[
  {
    "consentType": "SERVICE_TERMS",
    "title": "서비스 이용약관",
    "applicable": true,
    "required": true,
    "agreed": true,
    "agreedAt": "2026-01-15T00:15:42",
    "withdrawable": false
  },
  {
    "consentType": "PRIVACY_COLLECTION",
    "title": "개인정보 수집·이용 동의",
    "applicable": true,
    "required": true,
    "agreed": true,
    "agreedAt": "2026-01-15T00:15:42",
    "withdrawable": false
  },
  {
    "consentType": "MARKETING",
    "title": "마케팅 제공 동의",
    "applicable": true,
    "required": false,
    "agreed": true,
    "agreedAt": "2026-01-15T00:15:42",
    "withdrawable": true
  },
  {
    "consentType": "PORTRAIT_RIGHTS",
    "title": "초상권 수집·이용 동의",
    "applicable": true,
    "required": false,
    "agreed": true,
    "agreedAt": "2026-03-01T10:00:00",
    "documentId": 9001,
    "consentStatus": "PARTIAL",
    "programEligible": true,
    "withdrawable": true
  },
  {
    "consentType": "PAYMENT_STATEMENT_CONSENT",
    "title": "지급조서 작성 동의",
    "applicable": false,
    "required": false,
    "agreed": false,
    "withdrawable": false
  },
  {
    "consentType": "FACILITATOR_PLEDGE",
    "title": "교육진행자 동의 서약",
    "applicable": false,
    "required": false,
    "agreed": false,
    "withdrawable": false
  },
  {
    "consentType": "ADMINISTRATIVE_INFO_CONSENT",
    "title": "행정정보 공동이용 사전 동의",
    "applicable": false,
    "required": false,
    "agreed": false,
    "withdrawable": false
  },
  {
    "consentType": "CRIMINAL_HISTORY_CHECK_CONSENT",
    "title": "성범죄 경력조회 동의",
    "applicable": false,
    "required": false,
    "agreed": false,
    "withdrawable": false
  }
]
```

초상권 미작성:

```json
{
  "consentType": "PORTRAIT_RIGHTS",
  "required": false,
  "agreed": false,
  "consentStatus": "DISAGREED",
  "programEligible": false,
  "withdrawable": false
}
```

`documentId`가 없으면 필드를 빼거나 null. FE는 그때 §5 API를 쓴다.

### 6.4 교사 추가 행 (위 8 + 1)

```json
{
  "consentType": "TEACHER_INFO_COLLECTION",
  "title": "교사 회원 가입 및 학교/기관 정보 수집·이용 동의",
  "applicable": true,
  "required": true,
  "agreed": true,
  "agreedAt": "2026-02-01T09:00:00",
  "withdrawable": false
}
```

### 6.5 미성년 추가 행 (일반 8 + 2)

```json
{
  "consentType": "GUARDIAN_CONSENT",
  "title": "법정대리인 동의",
  "applicable": true,
  "required": true,
  "agreed": true,
  "agreedAt": "2026-04-01T09:00:00",
  "withdrawable": false
}
```

```json
{
  "consentType": "CHILD_PRIVACY_COLLECTION",
  "title": "아동 개인정보 수집·이용 동의",
  "applicable": true,
  "required": false,
  "agreed": true,
  "agreedAt": "2026-04-01T09:00:00",
  "withdrawable": true
}
```

가입과 동일하게 선택이면 `required: false`, `withdrawable: true`.

### 6.6 `GET /api/portal/me/consents/{consentType}`

목록의 해당 원소와 **같은 객체**. 없는 유형은 404.  
일반 성인이 `TEACHER_INFO_COLLECTION`을 조회하면 404.

---

## 7. 미성년 판별 필드

### 7.1 `GET /api/portal/auth/me`

`ageGroup`을 enum으로 고정하고 **항상 채운다.**

```
ageGroup: "UNDER_14" | "OVER_14"
```

만 14세 미만 → `UNDER_14`. 그 외(만 14세 이상) → `OVER_14`.  
빈 문자열·null 금지. 생년월일이 없으면 서버 정책으로 하나를 정하고 §11에 회신.

### 7.2 `GET /api/portal/me/profile`

아래 **둘 중 하나 이상**을 넣는다. 둘 다 넣어도 된다.

| 필드       | 타입                        | 규칙                          |
| ---------- | --------------------------- | ----------------------------- |
| `under14`  | boolean                     | `ageGroup == UNDER_14`와 동일 |
| `ageGroup` | `"UNDER_14"` \| `"OVER_14"` | me와 같은 값                  |

FE는 지금은 `ageGroup`이 없으면 `birthDate`로 계산한다. 서버 값이 있으면 서버를 따른다.

---

## 8. 유효기간 (저장·조회 시 그대로)

| 유형                                                                                  | 유효기간                                             | 만료 시                                    |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------ |
| `SERVICE_TERMS`, `PRIVACY_COLLECTION`, `TEACHER_INFO_COLLECTION`, `GUARDIAN_CONSENT`  | 탈퇴 시까지                                          | `expired: false`                           |
| `MARKETING`                                                                           | 탈퇴 또는 철회 시까지                                | 철회 = `agreed: false`                     |
| `PORTRAIT_RIGHTS`                                                                     | 동의일로부터 **1년**                                 | `expired: true`, `reconsentRequired: true` |
| `CHILD_PRIVACY_COLLECTION`                                                            | 가입 정책과 동일하게. 별도 만료 없으면 탈퇴/철회까지 |                                            |
| `PAYMENT_STATEMENT_CONSENT`                                                           | 동의일로부터 **10년**                                | 만료 후 재작성 플래그(작성 API는 이번 밖)  |
| `FACILITATOR_PLEDGE`, `ADMINISTRATIVE_INFO_CONSENT`, `CRIMINAL_HISTORY_CHECK_CONSENT` | 동의일로부터 **1년**                                 | 동일                                       |

이번 요청에서 만료 배치를 새로 만들 필요는 없다. 조회 필드만 맞으면 된다.

---

## 9. 하지 말 것 (재확인)

- `PATCH /api/portal/me/profile`에 마케팅 섞기
- 관리자 마케팅 API를 회원 토큰에 열어 주기
- 필수 약관 철회 API
- 문서 4종 작성·확인·재작성·유형 철회
- `applicable: false`인 문서 4종 행 삭제
- 초상권 `FULL` 신규 저장
- 프로그램 게이트를 `consentStatus === "FULL"`에 고정
- 보호자 SMS/알림
- 다른 `termsType`에 `consentStatus` 확장

---

## 10. 검수 (로컬 Portal OpenAPI + 회원 Bearer)

- [ ] `PUT /api/portal/me/marketing-consent` `{ "agreed": false }` → 200, `withdrawnAt` 있음
- [ ] 직후 `GET /api/portal/me/consents`의 `MARKETING.agreed === false`
- [ ] 같은 계정에 다시 `agreed: false` → 409
- [ ] `{ "agreed": true }` → 200, `agreedAt` 있음, GET과 일치
- [ ] 미성년 계정으로 마케팅 PUT 200 (보호자 확인 없음)
- [ ] 교사 `GET /consents`에 `TEACHER_INFO_COLLECTION` 있고 `required: true`
- [ ] `ageGroup=UNDER_14`에 `GUARDIAN_CONSENT`, `CHILD_PRIVACY_COLLECTION` 있음
- [ ] 일반 성인 `GET /consents`에 문서 4종 행 4개 (미작성이면 `agreed: false`)
- [ ] 일반 성인 목록에 `TEACHER_INFO_COLLECTION` / `GUARDIAN_CONSENT` 없음
- [ ] 초상권 3항목 전부 동의 회원의 `consentStatus === "PARTIAL"`, `programEligible === true`
- [ ] CMS/포털 프로그램 참여가 `programEligible`만 보는지 (FULL 가드 제거)
- [ ] 동의 완료 body에 `consentStatus: "FULL"`을 넣어도 저장·응답은 `PARTIAL`
- [ ] `documentId` 없는 `PORTRAIT_RIGHTS`에 `POST /consents/PORTRAIT_RIGHTS/withdraw` → 200, 이후 `agreed: false`, `DISAGREED`
- [ ] `POST /consents/SERVICE_TERMS/withdraw` → 400
- [ ] `POST /consents/MARKETING/withdraw` → 400 (PUT만)
- [ ] `POST /consents/PAYMENT_STATEMENT_CONSENT/withdraw` → 400
- [ ] `GET /api/portal/auth/me`의 `ageGroup`이 `UNDER_14` 또는 `OVER_14` (null 아님)
- [ ] `GET /api/portal/me/profile`에 `under14` 또는 `ageGroup`

확인 기준: 로컬/스테이징 Portal OpenAPI + 일반·교사·미성년 회원 Bearer 각 1명.

---

## 11. BE 회신 요청

1. `PUT /api/portal/me/marketing-consent` 반영 일정
2. envelope을 배열 직접 vs `{ success, data }` 중 무엇으로 통일할지 (`GET /consents`와 동일하게)
3. 이미 같은 `agreed`로 PUT/철회할 때 409 vs 200 no-op
4. 기존 `FULL` 행: 조회 정규화만 vs DB 마이그레이션
5. 생년월일 없는 계정의 `ageGroup` 기본값
6. `profile`에 `under14` / `ageGroup` 중 무엇을 넣을지
7. 반영 브랜치

**Last updated:** 2026-10-06
