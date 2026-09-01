# CMS 회원 등록(유형별) — 약관 `required` 정책 불일치 · BE 수정 요청

**작성일:** 2026-08-11  
**우선순위:** P0 (등록 차단)  
**요청 대상:** Members API · 약관 문서(`terms-documents`) · pre-register validation  
**관련 FE:** `build-pre-register-terms-agreements.ts` · `resolve-pre-register-terms-agreement-versions.ts`  
**관련 정책:** `.cursor/rules/terms-and-consent-policy.mdc` (2026-08-11)  
**관련 정책 SSOT:** `.cursor/rules/terms-and-consent-policy.mdc` · FE `build-pre-register-terms-agreements.ts`

---

## 1. 요약

CMS **회원 신규 등록(개인)** · **강사 신규 등록** 시, 제품 정책상 **선택 약관**임에도 서버에서 **필수 동의 미충족**으로 등록이 거절되는 것으로 관측됩니다.

| 구분 | FE·정책 | BE(추정·관측) |
|------|---------|----------------|
| 등록 필수 | `SERVICE_TERMS`, `PRIVACY_COLLECTION` 2건만 | 선택 약관(`MARKETING`, 동의서 5종 등)까지 필수 검증 |
| `termsAgreements[].required` | FE는 선택 항목 `required: false` 송신 | `GET …/terms-documents/…/current`의 `requiredYn`으로 덮어쓴 뒤 서버가 `required: true`로 검증 |
| `agreed: false` (선택) | **등록 완료 허용** (기능 제한만) | 400 `BAD_REQUEST` / 「입력값을 확인해 주세요」 등 |

**요청:** 등록 API·약관 메타·검증 로직을 **「가입·등록 컨텍스트별 필수 약관」** SSOT에 맞출 것.

---

## 2. 제품 정책 SSOT (등록 시 필수 vs 선택)

> 출처: `terms-and-consent-policy.mdc` · CMS 등록 UI (`add-user-individual.tsx`, `instructor-register-modal.tsx`)

### 2.1 공통

- 모든 항목: UI에서 **동의 / 미동의** 중 하나 선택 (미선택 시 FE가 등록 차단).
- **등록 완료를 막는 필수 항목**과 **미동의 시 기능만 제한하는 선택 항목**을 구분한다.

### 2.2 유형별 — 「등록 필수」(`agreed: true` 없으면 등록 불가)

| 등록 유형 | CMS 화면 | 등록 필수 `termsType` |
|-----------|----------|------------------------|
| **개인(전체 회원)** | 회원 신규 등록 | `SERVICE_TERMS`, `PRIVACY_COLLECTION` |
| **강사** | 강사 신규 등록 | `SERVICE_TERMS`, `PRIVACY_COLLECTION` |
| **관리자** | 관리자 신규 등록 | `SERVICE_TERMS`, `PRIVACY_COLLECTION`, `MFA_SETUP_CONSENT` |
| **학교(기관)** | 학교 등록 | *(UI·정책 미확정 — 현재 약관 섹션 없음)* |

### 2.3 유형별 — 「등록 선택」(`agreed: false`여도 등록 완료 가능)

| CMS 라벨 | `termsType` | 미동의 시 제한 (등록 이후) |
|----------|-------------|---------------------------|
| 마케팅 제공 | `MARKETING` | 알람 수신 불가 |
| 초상권 | `PORTRAIT_RIGHTS` | 프로그램 참여 불가 |
| 지급조서 사전 동의 | `PAYMENT_STATEMENT_PRE_CONSENT` → 원장 `PAYMENT_STATEMENT_CONSENT` | 급여 지급 불가 · 정산 최초 신청 시 작성 |
| 교육진행자 서약 | `FACILITATOR_PLEDGE` | UJAT·프로그램 강의 참여 불가 |
| 행정정보 공동이용 | `ADMINISTRATIVE_INFO_CONSENT` | UJAT·프로그램 강의 참여 불가 |
| 성범죄 경력 조회 | `CRIMINAL_HISTORY_CHECK_CONSENT` | UJAT·프로그램 강의 참여 불가 |

**주의:** 동의서 작성형은 「동의」 선택 시 작성·제출 완료 후에만 `agreed: true`로 인정 — **등록 API 검증과는 별도** (§5.3).

---

## 3. 영향 API

| Method | Path | 비고 |
|--------|------|------|
| `POST` | `/api/admin/users/pre-register/individual` | `AdminPreRegisterIndividualRequest.termsAgreements?` |
| `POST` | `/api/admin/users/pre-register/instructor` | `AdminPreRegisterInstructorRequest.termsAgreements?` |
| `GET` | `/api/public/terms-documents/{termsType}/current` | `TermsDocumentResponse.requiredYn` — FE version 갱신 시 참조 |
| *(예정)* | `POST /api/admin/admin-accounts` | 관리자 4종 약관 — 스키마·검증 동일 원칙 적용 요청 |

OpenAPI: `TermsAgreementRequest` — `termsType`, `version`, `required?`, `agreed?`  
(`apps/cms/openapi/members.openapi.json`)

---

## 4. FE 현행 동작 (2026-08-11)

### 4.1 payload 생성

`build-pre-register-terms-agreements.ts`:

| 항목 | FE가 설정하는 `required` |
|------|-------------------------|
| `SERVICE_TERMS` | `true` |
| `PRIVACY_COLLECTION` | `true` |
| `MARKETING` | `false` |
| 동의서 5종 (`PORTRAIT_RIGHTS`, `PAYMENT_STATEMENT_PRE_CONSENT`, `FACILITATOR_PLEDGE`, `ADMINISTRATIVE_INFO_CONSENT`, `CRIMINAL_HISTORY_CHECK_CONSENT`) | `false` |

### 4.2 제출 직전 version·required 갱신

`resolve-pre-register-terms-agreement-versions.ts`:

1. `GET /api/public/terms-documents/{termsType}/current` 로 **version** 확정
2. 응답 `requiredYn`이 있으면 **`termsAgreements[].required`를 덮어씀**

→ 약관 문서 DB/CMS에서 `PAYMENT_STATEMENT_PRE_CONSENT.requiredYn = true` 등이면, FE 정책과 무관하게 **송신 body에 `required: true`** 가 실립니다.

**관측 예 (강사 pre-register):**

```json
{
  "termsType": "PAYMENT_STATEMENT_PRE_CONSENT",
  "version": "2026-01",
  "required": true,
  "agreed": true
}
```

FE 빌더 기본값은 `required: false`이나, current API meta 반영 후 `true`로 변경된 사례.

### 4.3 FE 등록 UI 검증 (참고)

- 약관 8건 **미선택** → `필수 항목을 모두 작성해주세요`
- 필수 2건 **명시적 미동의** → `필수 동의 항목 안내` (항목명 나열)
- 선택 항목 **미동의** → FE는 등록 **허용** (`agreed: false` 송신)

---

## 5. BE 수정 요청 (상세)

### 5.1 `requiredYn` 의미 분리 (P0)

**문제:** `TermsDocumentResponse.requiredYn`이 「포털 회원가입 필수」와 「CMS 관리자 등록 필수」를 구분하지 않거나, 동의서 유형까지 `true`로 시드·운영 중일 가능성.

**요청 (택1 또는 병행):**

| 옵션 | 내용 |
|------|------|
| **A. 메타 정정** | current API `requiredYn`을 §2.2·§2.3 표와 일치하도록 CMS 약관 문서 데이터 정리 · `MARKETING` 및 동의서 5종은 **`requiredYn: false`** |
| **B. 컨텍스트 필드 추가** | `requiredYn` 외 `requiredForAdminPreRegisterYn` / `signupRequiredYn` 등 **등록 경로별** 필수 플래그 · OpenAPI·FE mapper 갱신 |
| **C. 검증 SSOT 내부화** | pre-register validation이 **`termsAgreements[].required` 요청값을 신뢰하지 않고**, 서버 코드에 **등록 유형×termsType 필수 매트릭스** 하드코딩(또는 설정 테이블) |

**최소 수용 기준:** 개인·강사 pre-register에서 §2.3 항목 **`agreed: false`** 단독으로는 **4xx 발생하지 않음**.

### 5.2 pre-register validation (P0)

**요청:**

1. **`required: true` + `agreed: false`** → 해당 **termsType만** 거절 (가능하면 `error.field` 또는 validation details에 `termsAgreements[i].termsType` 명시).
2. **`required: false` + `agreed: false`** → **등록 성공** · 동의 원장에 `agreed: false` 저장.
3. **`required: false` + `agreed: true`** → 등록 성공 (동의서 작성형 증빙은 §5.3).
4. 요청에 **없는** 선택 `termsType` → 등록 성공 (미전송 = 미동의 또는 미수집으로 처리 — 정책 문서화 필요).

**현재 추정 오류 패턴:**

- 모든 `termsAgreements` 항목에 대해 `agreed: true` 강제
- `requiredYn`만 보고 필수 판단 (등록 유형 무시)
- 동의서 항목에 `formResponseId` 없으면 400 (선택 항목·`agreed: false`와 무관하게 실패)

### 5.3 동의서 작성형 · `formResponseId` (P1, 등록 차단과 분리)

FE는 현재 동의서 5종에 **`agreed` boolean만** 전송 (`formResponseId` 없음).  
**선택 항목 + `agreed: false`** 는 §5.2에서 등록 허용.  
**선택 항목 + `agreed: true`** 는 BE가 증빙을 요구할 경우 **별도 422** + 명확 메시지 권장 (일괄 `BAD_REQUEST` 지양).

### 5.4 OpenAPI · 에러 응답 (P1)

- `TermsDocumentResponse`: `requiredYn` 설명에 「회원 포털 가입 / CMS pre-register 구분」 명시 또는 §5.1 B 반영
- pre-register 400 시 `error.field` = `termsAgreements` 또는 index·`termsType` 포함 (traceId만으로 디버깅 의존 축소)

---

## 6. 수용 테스트 시나리오

### 6.1 개인 pre-register — 선택 전부 미동의

**Given:** 필수 2건 `agreed: true`, 나머지 6건 `agreed: false`, `required`는 FE 표(§4.1) 준수  
**When:** `POST /api/admin/users/pre-register/individual`  
**Then:** **201/200 성공**

### 6.2 강사 pre-register — 동일

**When:** `POST /api/admin/users/pre-register/instructor`  
**Then:** **성공** (profile/settlement 검증은 별도 이슈)

### 6.3 필수 미동의

**Given:** `SERVICE_TERMS` 또는 `PRIVACY_COLLECTION` `agreed: false`  
**Then:** **4xx** · 메시지에 필수 약관 미동의 명시

### 6.4 current API meta

**When:** `GET /api/public/terms-documents/MARKETING/current`  
**Then:** `requiredYn: false`

**When:** `GET /api/public/terms-documents/PAYMENT_STATEMENT_PRE_CONSENT/current`  
**Then:** `requiredYn: false` *(등록 필수 아님 — 정산·지급 단계에서 별도 정책)*

### 6.5 관리자 (스키마 반영 후)

**Given:** MFA `agreed: false`, 나머지 필수 2건 `agreed: true`  
**Then:** **4xx** (MFA 등록 필수)

---

## 7. FE 후속 (BE 반영 전·후)

| 시점 | FE 조치 |
|------|---------|
| BE §5.1 A 완료 전 | `resolvePreRegisterTermsAgreementVersions`에서 **`required` 덮어쓰기 중단** 또는 등록 컨텍스트 매트릭스로 재계산 검토 |
| BE §5.2 완료 후 | E2E — 개인·강사 등록, 선택 미동의 payload 회귀 테스트 |
| BE §5.3 확정 후 | 동의서 `agreed: true` 시 `formResponseId` 연동 |

---

## 8. BE 확인 체크리스트

- [ ] §2.2 등록 유형별 필수 `termsType` 매트릭스 코드·문서 일치
- [ ] §2.3 선택 항목 `agreed: false` pre-register **성공**
- [ ] `terms-documents/.../current` — `MARKETING`·동의서 5종 `requiredYn: false` (또는 §5.1 B)
- [ ] validation이 요청 `required` / DB `requiredYn` / 등록 유형 **단일 SSOT** 사용
- [ ] 400 응답에 거절 `termsType` 식별 가능
- [ ] `consent-records` 저장 — `agreed: false` 선택 항목 round-trip
- [ ] OpenAPI 갱신 후 CMS orval 재생성 가능

---

## 9. 참고 — CMS 송신 `termsType` 목록 (개인·강사 8건)

| # | `termsType` | 등록 필수(정책) |
|---|-------------|-----------------|
| 1 | `SERVICE_TERMS` | **Y** |
| 2 | `PRIVACY_COLLECTION` | **Y** |
| 3 | `MARKETING` | N |
| 4 | `PORTRAIT_RIGHTS` | N |
| 5 | `PAYMENT_STATEMENT_PRE_CONSENT` | N |
| 6 | `FACILITATOR_PLEDGE` | N |
| 7 | `ADMINISTRATIVE_INFO_CONSENT` | N |
| 8 | `CRIMINAL_HISTORY_CHECK_CONSENT` | N |

**Last updated:** 2026-08-11
