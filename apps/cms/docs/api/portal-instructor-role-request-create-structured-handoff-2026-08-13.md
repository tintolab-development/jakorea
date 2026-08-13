# Portal 강사 권한 신청 CREATE — SnapshotJson → 구조체 (breaking)

**작성일:** 2026-08-13  
**우선순위:** P0 (포털 강사 신청 제출)  
**요청 대상:** Portal Members API  
**관련 FE (Platform):** `apps/platform/src/features/mypage/instructor-apply/api/*`  
**OpenAPI:** `InstructorRoleRequestCreateRequest` (`apps/cms/openapi/backend.openapi.json` 등)

---

## 1. 요약

`POST /api/portal/me/instructor-role-requests` body를 CMS 강사 사전등록(`AdminPreRegisterInstructorRequest`)과 동일한 **구조체**로 맞춥니다.

| 항목 | Before | After |
|------|--------|-------|
| identity | `nameSnapshot`, `genderSnapshot`, … | `name`, `gender`, `birthDate`, `phone`, `email` |
| 프로필·학력·경력 등 | `*Snapshot` / `careerTextSnapshot` JSON string | `profile: InstructorCmsProfile` |
| 계좌·사업소득 | `bankAccountSnapshotJson` + `businessIncomeYn` | `settlement: InstructorCmsSettlement` |
| 동의 | `agreementSnapshotJson` string | `termsAgreements: TermsAgreementRequest[]` |

**제거 필드:** `nameSnapshot`, `genderSnapshot`, `birthDateSnapshot`, `phoneSnapshot`, `emailSnapshot`, `homeAddressSnapshot`, `bankAccountSnapshotJson`, `educationLevelSnapshot`, `careerTextSnapshot`, `businessIncomeYn`, `selfIntroductionSnapshot`, `youthEconomyEducationOpinionSnapshot`, `youthCommunicationOpinionSnapshot`, `unexpectedSituationResponseSnapshot`, `oneLineIntroSnapshot`, `agreementSnapshotJson`.

BE 미반영 시 Platform 제출은 **400** 가능합니다.

---

## 2. 요청 스키마 (목표)

```ts
{
  requestedActivityType: string // 예: "JA 강사단"
  name: string
  gender: string // M | F
  birthDate: string // YYYY-MM-DD
  phone: string
  email: string
  profile: InstructorCmsProfile
  settlement: InstructorCmsSettlement
  termsAgreements: TermsAgreementRequest[]
}
```

- `profile` / `settlement` / `TermsAgreementRequest`는 CMS 강사 등록과 **동일 `$ref`**.
- 포털에 불필요한 `email`/`rawPassword`/`certifications` 등 pre-register 전용 필드는 포함하지 않음 (`email`은 identity에만 존재).

### termsAgreements (포털 강사 신청)

동의서 4건 — `version: "1.0"`:

- `PAYMENT_STATEMENT_PRE_CONSENT`
- `FACILITATOR_PLEDGE`
- `ADMINISTRATIVE_INFO_CONSENT`
- `CRIMINAL_HISTORY_CHECK_CONSENT`

---

## 3. FE 상태

- OpenAPI `InstructorRoleRequestCreateRequest` 갱신됨.
- Platform 매퍼는 stringify 없이 `profile` / `settlement` / `termsAgreements` 객체를 전송.

---

## 4. BE 요청

1. Portal create DTO를 위 구조체로 교체·검증.
2. 저장 시 CMS `InstructorCmsProfile` / `InstructorCmsSettlement` / 동의 원장과 동일 매핑 사용 권장.
3. 구 SnapshotJson 필드 수신 중단 (또는 단기 dual-read 후 deprecate — FE는 구조체만 전송).
