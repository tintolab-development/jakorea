# Portal 회원 동의서·서약서 API (Platform FE SSOT)

CMS Orval 타입과 동일한 계약을 Platform `settings/api`에서 hand-written으로 사용한다.

## Endpoints

| Method | Path | 용도 |
|--------|------|------|
| `POST` | `/api/portal/me/consents/documents` | 작성 중 문서 생성 (`consentType` 필수) |
| `GET` | `/api/portal/me/consents/documents/{documentId}` | 상세·`signatureFields` |
| `POST` | `/api/portal/me/consents/documents/{documentId}/signature-fields/{fieldKey}/sign` | 서명란 서명 (`signatureProfileId`) |
| `POST` | `/api/portal/me/consents/documents/{documentId}/complete` | 작성 완료 (`filledDocument` 등) |
| `PUT` | `/api/portal/me/signatures/current` | 전자서명 프로필 등록·교체 |

## Request / response (요약)

- **Create** — `MemberPortalConsentDocumentCreateRequest`: `{ consentType, targetType?, targetId? }`
- **Document** — `MemberPortalConsentDocumentResponse`: `documentId`, `signatureFields[]` (`fieldKey`, `required`, `signed`, …)
- **Sign field** — `MemberPortalConsentSignFieldRequest`: `{ signatureProfileId }`
- **Complete** — `MemberPortalConsentCompleteRequest`: `{ filledDocument?, identityVerificationSessionId?, consentStatus?, programEligible? }`  
  - `PORTRAIT_RIGHTS`: `filledDocument` + `consentStatus`(힌트 `PARTIAL`) + `programEligible`(1·2번 표 `bottomConsent` 기반 힌트, 서버 재계산)
  - `evidenceFileObjectId` — 성범죄 외 전송 금지(최신 OpenAPI)
- **Signature profile** — `MemberPortalSignatureProfileRequest`: `{ signatureType, fileObjectId, displayName?, fontStyleCode? }`

## `consentType` (마이페이지 동의서·서약서)

| 화면 | POST create 권장 값 |
|------|---------------------|
| 초상권 수집·이용 | `PORTRAIT_RIGHTS` |
| 지급조서 | `PAYMENT_STATEMENT_PRE_CONSENT` |
| 교육진행자 서약 | `FACILITATOR_PLEDGE` |
| 행정정보 공동이용 | `ADMINISTRATIVE_INFO_CONSENT` |
| 성범죄 경력 조회 | `CRIMINAL_HISTORY_CHECK_CONSENT` |

`GET /me/consents` summary는 `PAYMENT_STATEMENT_PRE_CONSENT`를 `PAYMENT_STATEMENT_CONSENT`로 normalize 할 수 있음 ([`map-consents.ts`](../../src/features/mypage/settings/lib/map-consents.ts)).

## `fieldKey` ↔ Platform 서명 state

서버가 내려주는 `signatureFields[].fieldKey`와 양식 paragraph id를 맞춘다.

- 지급조서: `payment-statement-pre-consent-seed-mid-signature` → `signatures.mid`, `payment-statement-pre-consent-seed-tail-signature` → `signatures.final`
- 교육진행자: `agreement-expense-pledge-system-signature` → `signatures.final`
- 행정정보: `agreement-notice-system-signature` → `signatures.final`
- 초상권: `agreement-portrait-system-signature` → `signatures.final` (확인 클로징 sidecar 서명과 별도 — 서버 `signatureFields` 기준)

## 파일 업로드

- 전자서명 이미지: `uploadMemberPortalFile` — `filePurpose: MEMBER_ELECTRONIC_SIGNATURE` (서버 enum과 불일치 시 BE 확인)
- 성범죄 증빙: `CRIMINAL_HISTORY_EVIDENCE` (마이페이지 complete는 evidence 미전송 정책 — 업로드·완료 플로우는 BE와 추가 정합 가능)

## FE 구현 위치

- HTTP: [`portal-consent-documents.ts`](../../src/features/mypage/settings/api/portal-consent-documents.ts)
- 제출 오케스트레이션: [`submit-portal-consent-document.ts`](../../src/features/mypage/settings/lib/submit-portal-consent-document.ts)
- 작성 UI: [`write-form.tsx`](../../src/features/mypage/instructor-apply/consent/write-form.tsx) — `isRemoteApiConfigured()` + 액세스 토큰 있으면 Portal 제출(마이페이지 설정·강사 신청 동의서 공통). 없으면 강사 신청은 sessionStorage `markInstructorApplyConsentAgreed`만.
- 초상권(마이페이지): [`mypage-portrait-consent-write-form.tsx`](../../src/features/mypage/settings/ui/mypage-portrait-consent-write-form.tsx) → `submitPortalPortraitConsentFromWriteState`
