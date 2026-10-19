# 수정 요청: 포털 만 14세 미만 일반회원 가입 — `SIGNUP_INVALID_REQUEST`

**대상:** 백엔드  
**앱:** Platform (사용자 홈페이지)  
**일시:** 2026-10-13  
**우선순위:** 가입 차단 (미성년 일반회원 전 구간)

---

## 1. 요약

`POST /api/portal/auth/signup/general` 로 **만 14세 미만(under14)** 일반회원 가입을 완료할 때, FE가 화면·OpenAPI 계약에 맞는 body를 보내도 **HTTP 400** + `SIGNUP_INVALID_REQUEST`(필드·상세 없음) 로 거절됩니다.

**요청:** 포털 미성년 가입 플로우는 **현재 Platform UI 규격**과 **`MemberSignupRequest` OpenAPI**에 맞게 검증·저장되도록 서버를 수정해 주세요.

**명시 정책 (FE·기획):**

- 동의서 `filledDocument` **본문(성명·소속 등)** 과 회원 프로필 `name` / `affiliationName` **내용 일치 검사는 하지 않습니다.** 값이 달라도 가입은 완료되어야 합니다.
- 거절 사유는 가능하면 **`error.field` / `error.details`** 또는 구체 `message`로 내려 주세요. (`traceId`만으로 FE·QA가 원인 추적하기 어렵습니다.)

---

## 2. Platform 미성년 가입 화면 규격 (서버가 맞춰야 하는 SSOT)

| 단계 | 화면 | 사용자 동작 | API 반영 |
| --- | --- | --- | --- |
| 2 | 생년월일 | 만 14세 미만 확정 | `birthDate`(아동), `under14: true`, `identityVerified: false`, **가입자 `identityVerificationSessionId` 없음** |
| 3 | 보호자 약관 | 체크 + HTML 전문(모달) | `termsAgreements` — `SERVICE_TERMS`, `CHILD_PRIVACY_COLLECTION`, **`GUARDIAN_CONSENT`** 등 catalog 필수 항목 |
| 3 | 보호자 NICE | 본인인증 | **`guardianVerificationSessionId`** (필수) |
| 3 | 초상권 | 선택 — **미동의 가능** | `PORTRAIT_RIGHTS`: `agreed: false` 이면 **`filledDocument` 없음** |
| 4 | 보호자 확인 | NICE 이름·휴대폰(readonly), **관계** 입력 | 현재 OpenAPI `MemberSignupRequest`에 **관계·보호자명 필드 없음** → **세션에서 보호자 식별** 전제 |
| 7~8 | 프로필·확인 | 아동 이름·주소·재학/미재학 | `name`, 주소 필드, `schoolEnrollmentStatus`, 재학 시 학교, 미재학 시 **`affiliationName` 선택** |

**법정대리인(`GUARDIAN_CONSENT`) UI:**

- 초상권(`PORTRAIT_RIGHTS`)과 달리 **WritingForm 작성 화면·`filledDocument` 제출 UI가 없습니다.**
- 보호자 **HTML 약관 동의 + NICE 세션**으로 동의를 완료합니다.

관련 FE:

- 위저드: `apps/platform/src/pages/auth/sign-up/step-registry.tsx`
- 요청 매핑: `apps/platform/src/features/auth/sign-up/model/mapper/map-signup-request.ts`
- 약관 매핑: `apps/platform/src/features/auth/sign-up/model/mapper/map-terms-agreements.ts`
- 엔드포인트: `apps/platform/src/features/auth/sign-up/api/endpoints.ts` → `/api/portal/auth/signup/*`

OpenAPI 참고: `apps/cms/openapi/members.openapi.json` — `MemberSignupRequest`, `TermsAgreementRequest`, `HomepageGeneralSignupRequest`

---

## 3. 재현 — 실패 응답

```http
POST /api/portal/auth/signup/general
Content-Type: application/json
```

```json
{
  "success": false,
  "data": null,
  "message": "회원가입 입력값을 확인해 주세요.",
  "error": {
    "code": "SIGNUP_INVALID_REQUEST",
    "message": "회원가입 입력값을 확인해 주세요.",
    "field": null,
    "traceId": "<요청별 traceId>",
    "details": null
  }
}
```

약관 catalog는 아동 생년월일 기준으로 조회:

```http
GET /api/portal/auth/signup/terms?memberType=GENERAL&birthDate=2019-07-07
```

---

## 4. 재현용 요청 body (FE가 실제 전송한 형태)

### 4.1 미재학 · 초상권 미동의 · 신규 이메일 (가장 단순 케이스)

```json
{
  "member": {
    "email": "minorminor@test.com",
    "password": "password1!",
    "name": "신영서",
    "birthDate": "2019-07-07",
    "gender": "F",
    "under14": true,
    "identityVerified": false,
    "schoolEnrollmentStatus": "NOT_ENROLLED",
    "address": "서울특별시 강남구 논현로150길 13 (논현동)",
    "addressDetail": "ddd",
    "postalCode": "06047",
    "regionSido": "서울특별시",
    "regionSigungu": "강남구",
    "guardianVerificationSessionId": 49,
    "termsAgreements": [
      {
        "termsType": "SERVICE_TERMS",
        "version": "2026-01",
        "required": true,
        "agreed": true
      },
      {
        "termsType": "CHILD_PRIVACY_COLLECTION",
        "version": "2026-01",
        "required": true,
        "agreed": true
      },
      {
        "termsType": "GUARDIAN_CONSENT",
        "version": "2026-01",
        "required": true,
        "agreed": true
      },
      {
        "termsType": "MARKETING",
        "version": "2026-01",
        "required": false,
        "agreed": true
      },
      {
        "termsType": "PORTRAIT_RIGHTS",
        "version": "2026-01",
        "required": false,
        "agreed": false
      }
    ]
  }
}
```

→ **기대:** 201/200 + 가입 완료. **실제:** 400 `SIGNUP_INVALID_REQUEST`.

### 4.2 과거 이슈 (참고) — 성인 생년 + under14 불일치

FE 버그로 `birthDate`가 보호자 NICE 생년으로 덮인 경우가 있었음. 현재 FE는 아동 생년 SSOT를 고정해 **`birthDate` = 아동**으로 전송합니다. 서버는 **`under14` 플래그만이 아니라 `birthDate`·보호자 세션으로 재판정**하는 기존 OpenAPI 설명과 일치해야 합니다.

---

## 5. 백엔드 점검·수정 요청 항목

### 5.1 (최우선) `GUARDIAN_CONSENT` + `documentRequired: true`

signup terms catalog 스냅샷 예:

- `termsType`: `GUARDIAN_CONSENT`
- `documentRequired`: **true**
- FE body: **`agreed: true`**, **`filledDocument` 없음** (UI에 작성 폼 없음)

**요청:**

- 포털 **회원가입** 경로에서는 `GUARDIAN_CONSENT`를 **HTML 동의 + `guardianVerificationSessionId`** 로 처리하고, **`filledDocument`를 필수로 요구하지 말 것.**
- 또는 **`GET /api/portal/auth/signup/terms`** 미성년 catalog에서 `GUARDIAN_CONSENT.documentRequired`를 **false**로 내려 UI·서버 정합을 맞출 것.
- `TermsAgreementRequest.filledDocument` OpenAPI 설명상 “동의서 4종”은 PORTRAIT/PAYMENT/FACILITATOR/ADMINISTRATIVE — **GUARDIAN은 동일 규칙 적용 금지** 권장.

### 5.2 보호자 인증 세션

- `guardianVerificationSessionId`가 **만 14세 미만 일반 가입**용 NICE 세션인지 검증.
- 세션의 flow/provider/만료/완료 상태와 **`member.birthDate`(아동)** 조합 거절 시 **구체 필드·코드** 반환.
- (선택) step 4에서 수집하는 **가입자와의 관계**를 저장하려면 OpenAPI에 필드 추가 후 FE 연동 — **현재는 세션만 전송.**

### 5.3 under14 분기 전체

- `under14: true` 일 때 **`identityVerificationSessionId` 없음** 허용 (OpenAPI와 동일).
- `phone` **omit** 허용 (미성년 FE는 전송하지 않음).
- **`termsAgreements`**: 미성년 catalog 필수 항목(`CHILD_PRIVACY_COLLECTION`, `GUARDIAN_CONSENT` 등) **누락·미동의**만 거절; **선택 항목 `PORTRAIT_RIGHTS` `agreed: false`** 는 가입 허용.

### 5.4 하지 말아야 할 검증

- 초상권 `filledDocument.schemaJson` 표 **성명·소속** ↔ `member.name` / `affiliationName` **내용 일치 강제**
- 미성년 가입 시 **필수 `phone`** 또는 **가입자 본인 NICE 세션** 요구

### 5.5 에러 응답

- `SIGNUP_INVALID_REQUEST` 시 **`error.field`** (예: `termsAgreements`, `guardianVerificationSessionId`, `birthDate`) 또는 **`details[]`** 제공.

---

## 6. 수용 기준 (QA)

- [ ] `birthDate=2019-07-07`, `under14=true`, 유효한 `guardianVerificationSessionId`, 필수 terms 동의, `PORTRAIT_RIGHTS agreed=false` → **가입 성공**
- [ ] `GUARDIAN_CONSENT` **`filledDocument` 없이** 가입 성공
- [ ] 초상권 `agreed=true` + `filledDocument` 제출 시, 표 성명이 `member.name`과 **다르더라도** 가입 성공
- [ ] `schoolEnrollmentStatus=NOT_ENROLLED`, `affiliationName` 생략 → 가입 성공 (선택 입력)
- [ ] 실패 시 traceId + **필드 단위** 메시지로 원인 식별 가능

---

## 7. FE 측 (참고 — 본 요청의 범위 밖)

- 아동 생년월일이 보호자 NICE에 덮이지 않도록 session/메시지 격리 적용됨.
- 문서↔회원 **내용 일치** 클라이언트 검증은 **의도적으로 하지 않음.**

---

## 8. 연락·추적

실패 시 Network Response의 **`error.traceId`** 를 BE 로그와 매칭해 주세요.  
동일 traceId를 QA/FE에 공유하면 재현 body와 1:1 대조 가능합니다.

**Last updated:** 2026-10-13
