# [BE] 회원 동의 내역 — 작성본 열람 가능 여부를 "이유"까지 내려주기

## 목표
CMS 회원 상세 > 약관 및 동의에서 FE가 여러 필드를 조합해 추측하지 않고, **BE가 내려준 값만으로**
1) 상태 문구(동의 / 부분 동의 / 미동의 / 동의 만료 / 철회)와
2) 「동의서 보기」로 작성본을 열 수 있는지와 열 수 없다면 그 이유
를 정할 수 있게 한다.

## 배경 (로컬 재현)
- 회원 190111, `PORTRAIT_RIGHTS` 기록 1696357: 목록에 `filledDocumentAvailable=false`로 오지만 FE가 확인하지 않고 조회해서 404 `CONSENT_FILLED_DOCUMENT_NOT_FOUND`가 났다.
  → FE에서 `false`이면 조회하지 않도록 이미 고쳤다(BE 변경과 무관).
- 그런데 `false`의 이유가 여러 가지라 FE가 화면 표시를 정할 수 없다.
  - 작성본이 원래 없음(시드/과거 데이터/관리자가 대신 받은 동의)
  - 보관 기간 만료로 파기
  - 철회
  - 동의 유효기간 만료
  - 약관 버전 불일치(초상권)
- 지금 FE가 쓰는 값:
  - 상태: `GET /api/admin/users/{memberId}/consents` (`MemberPortalConsentSummary`)의 `agreed`, `consentStatus`, `expired`, `expiresAt`
  - 작성본: `GET /api/admin/users/{memberId}/consent-records` (`MemberConsentRecordResponse[]`)의 `filledDocumentAvailable`, `filledDocumentRevealEndpoint`
- 문제 1: Summary에는 작성본 열람 가능 여부가 없다. 그래서 FE가 records 이력 중 하나를 골라 붙이는데, 같은 유형에 기록이 여러 개면 어느 것을 골라야 하는지 FE가 추측한다.
  - 예: 회원 190114 `PAYMENT_STATEMENT_CONSENT`
    - 1696594: 작성본 없음(`false`)
    - 1696589: 작성본 있음(`true`, `filledDocumentId=194`)
    - 두 기록의 `consentedAt`이 `2026-11-14T14:20:09.870317Z`로 같다. `FACILITATOR_PLEDGE` 1696595 / 1696590도 마찬가지다.
- 문제 2: Summary의 `status`(string)는 허용 값이 문서화돼 있지 않다. 그래서 FE는 `agreed`와 `expired`를 조합해서 쓰고 있다.

## 요청 사항

### 1. Summary에 "현재 유효한 작성본" 정보 추가 (필수)
`MemberPortalConsentSummary`(관리자 `GET /api/admin/users/{memberId}/consents`)에 아래 필드를 추가한다.
기존 필드는 이름, 타입, 의미를 바꾸지 않는다.

| 필드 | 타입 | 설명 |
|---|---|---|
| `currentConsentRecordId` | number \| null | 이 유형의 현재 상태를 결정한 동의 기록 id |
| `filledDocumentAvailable` | boolean | 위 기록의 작성본을 지금 열람할 수 있으면 true |
| `filledDocumentRevealEndpoint` | string \| null | `filledDocumentAvailable=true`일 때만 값이 있다. records와 같은 형식이다 |
| `filledDocumentUnavailableReason` | enum \| null | `filledDocumentAvailable=false`일 때만 값이 있다. 아래 표 참고 |

`filledDocumentUnavailableReason` 값:

| 값 | 의미 | 대응하는 기존 오류 코드 |
|---|---|---|
| `NOT_SUPPORTED` | 작성본이 없는 유형(MARKETING, SERVICE_TERMS, PRIVACY_COLLECTION 등) | `CONSENT_FILLED_DOCUMENT_TYPE_NOT_SUPPORTED` |
| `NOT_SUBMITTED` | 작성본을 지원하는 유형이지만 저장된 작성본이 없음 | `CONSENT_FILLED_DOCUMENT_NOT_FOUND` |
| `NOT_AGREED` | 동의하지 않았거나 동의 기록이 없음 | - |
| `CONSENT_EXPIRED` | 동의 유효기간 만료 | `PORTRAIT_CONSENT_CONTENT_UNAVAILABLE` 등 |
| `WITHDRAWN` | 철회 | `CONSENT_FILLED_DOCUMENT_RESTRICTED` 등 |
| `RETENTION_EXPIRED` | 보관 기간이 지나 파기 | `CONSENT_FILLED_DOCUMENT_RETENTION_EXPIRED` |
| `TERMS_VERSION_MISMATCH` | 초상권 약관 버전 불일치 | `PORTRAIT_CONSENT_CONTENT_UNAVAILABLE` |

- 이유가 여러 개 겹치면 하나만 내려준다. 우선순위를 정해서 응답에 적어 주세요(제안: `WITHDRAWN` > `CONSENT_EXPIRED` > `RETENTION_EXPIRED` > `TERMS_VERSION_MISMATCH` > `NOT_SUBMITTED`).
- 같은 유형에 기록이 여러 개일 때 어떤 기록을 `currentConsentRecordId`로 고를지 BE가 정하고, 규칙을 응답에 적어 주세요.
  - 190114처럼 시각이 같은 기록이 있으면 무엇을 고르는지
  - 최신 기록에 작성본이 없고 이전 기록에만 있으면, 이전 작성본을 "현재 작성본"으로 볼 수 있는지 정책 판단이 필요하다

### 2. Summary `status` 허용 값 문서화 (필수)
- 지금 `status: string`에 실제로 오는 값을 OpenAPI enum으로 정의한다.
- 제안 값: `AGREED` / `PARTIAL` / `NOT_AGREED` / `EXPIRED` / `WITHDRAWN`
- 만료와 철회가 다른 값으로 구분돼야 한다. 효력으로는 둘 다 미동의와 같지만, 관리자 화면에서는 "재동의가 필요한 회원"을 따로 보여 준다.
- `agreed`와 `expired`의 관계를 명시해 주세요. 지금 FE는 `agreed=true`, `expired=true`인 조합이 올 수 있다고 가정하고 있다. 만료되면 `agreed`가 false로 오는지, true로 오는지 알려 주세요.
- 기존 `agreed`, `expired`, `consentStatus`, `programEligible`은 그대로 둔다(포털 등 다른 소비처).

### 3. records 응답에도 같은 이유 필드 추가 (선택)
- `MemberConsentRecordResponse`에도 `filledDocumentUnavailableReason`을 같은 enum으로 추가한다.
- 프로그램 상세(봉사자 등록 동의 항목)는 Summary 없이 records만 쓰기 때문이다.

### 4. 데이터 확인 (확인 후 보고)
- 190114의 `PAYMENT_STATEMENT_CONSENT` 1696594 / 1696589, `FACILITATOR_PLEDGE` 1696595 / 1696590이 같은 시각으로 두 번씩 생긴 이유를 알려 주세요. 시드 문제인지, 실제 흐름에서도 생길 수 있는지 궁금하다.
- 회원 190007의 `CRIMINAL_HISTORY_CHECK_CONSENT` 1694304는 목록상 작성본이 있는 기록이다. 그런데 `POST .../CRIMINAL_HISTORY_CHECK_CONSENT/signed-document?consentRecordId=1694304`가 404 `SIGNED_CONSENT_DOCUMENT_NOT_FOUND_OR_UNAVAILABLE`을 돌려준다. 시드 데이터 문제인지 확인해 주세요.

## 하지 말 것
- 기존 필드의 이름, 타입, 의미를 바꾸거나 지우지 않는다.
- `filled-document` / `signed-document` 조회 API의 메서드(POST), 요청 본문(`reason`), 오류 코드는 바꾸지 않는다.
- 재시드나 대량 데이터 수정은 하지 않는다. 필요하면 먼저 질문으로 남긴다.

## 로컬 QA 데이터
| memberId | consentType | 현재 records | 기대 Summary |
|---|---|---|---|
| 190111 | PORTRAIT_RIGHTS | 1696357, 작성본 없음 | `filledDocumentAvailable=false`, `NOT_SUBMITTED` |
| 190119 | PORTRAIT_RIGHTS | 1696393, 작성본 없음 | `false`, `NOT_SUBMITTED` |
| 190076 | PORTRAIT_RIGHTS | 1696576, 작성본 있음 | `true`, endpoint 있음 |
| 190114 | PAYMENT_STATEMENT_CONSENT | 1696594(없음) / 1696589(있음) | 4번 확인 결과에 따름 |
| 190118 | ADMINISTRATIVE_INFO_CONSENT | 1696582, 작성본 있음 | `true` |
| 동의 만료 회원 | (로컬 DB에서 하나 찾아 기재) | - | `status=EXPIRED`, `CONSENT_EXPIRED` |
| 철회 회원 | (로컬 DB에서 하나 찾아 기재) | - | `status=WITHDRAWN`, `WITHDRAWN` |

## 완료 기준
- OpenAPI에 새 필드와 enum이 반영된다(FE는 orval로 다시 생성).
- 위 QA 데이터로 `GET /api/admin/users/{id}/consents` 응답 예시를 첨부한다.
- 이유 판정 규칙과 대표 기록 선택 규칙을 단위 테스트로 고정한다.
- 전체 테스트가 아니라 관련 테스트만 실행하고, 실행 목록을 보고한다.
- 4번 확인 결과와 정책 판단이 필요한 항목은 질문으로 정리한다.

## 참고: BE 반영 후 FE 계획 (BE 작업 범위 아님)
- 상태 문구는 Summary `status`로만 정한다.
- 「동의서 보기」 버튼은 `filledDocumentAvailable=true`일 때만 동작한다. 열 수 없을 때 어떻게 보여 줄지(숨김/비활성/안내)는 이유별로 시안을 받아 반영한다.
- 회원 정보를 넣어 만든 미리보기는 이유 필드가 없는 예전 응답에만 남기거나 없앤다.
