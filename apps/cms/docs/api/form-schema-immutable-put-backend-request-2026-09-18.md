# Forms-Surveys — 신청·등록·모집 양식 `FORM_SCHEMA_IMMUTABLE` PUT 오탐 백엔드 수정 요청

| 항목 | 값 |
|------|-----|
| 최초 작성일 | 2026-09-18 |
| 최근 갱신 | 2026-09-22 |
| 대상 | Forms-Surveys · `PUT /api/admin/form-template-versions/{versionId}` — **신청(APPLICATION) + 등록/모집(REGISTRATION·RECRUITMENT) 전체** |
| 우선순위 | **P0** — CMS 신청 양식·프로그램 등록 임시저장/저장 불가 |
| error.code | `FORM_SCHEMA_IMMUTABLE` |
| error.message (관측) | 신청: `신청 양식의 기존 시스템 항목 구조는 변경할 수 없습니다. 일부 안내 텍스트 수정과 신규 항목 추가만 허용됩니다: {seedParagraphId}` · 등록/모집: `등록/모집 시스템 양식의 기존 구조와 항목은 수정·추가·삭제할 수 없습니다.` |
| 관련 문서 | [programs-registration-form-program-scoped-copy-backend-request-2026-09-15.md](./programs-registration-form-program-scoped-copy-backend-request-2026-09-15.md) |
| FE 시드 ID | `program-application-*-seed-*` (`packages/form-schema/src/paragraph-ids/program-application-form-*-draft.ts`) · `program-registration-seed-*` (`.../program-registration-draft.ts`) |
| 통합 이력 | 09-18 신청 양식 최초 리포트 → 09-21 등록/모집 양식 확장 관측(별도 문서) → 09-22 `paragraphTitle` 단독 트리거 재현 + **본 문서로 통합** |

> 이 문서는 원래 `form-schema-immutable-application-put-backend-request-2026-09-18.md`(신청 양식)와
> `form-schema-immutable-registration-put-backend-request-2026-09-21.md`(등록/모집 양식) **두 개로 나뉘어 있었으나**,
> **동일한 BE 판정 로직의 오탐(false positive)**으로 확인되어 하나로 통합했다. 두 원본 문서는 삭제되었다.

---

## 0. 적용 범위 — 신청 + 등록 + 모집 전체, 전 프로그램 유형 공통 (필수)

| | |
|---|---|
| **적용** | 이 수정 요청은 **신청(APPLICATION) 양식 하나, 일반 프로그램 하나에만 국한되지 않는다.** 신청·등록·모집 **시스템 양식을 쓰는 모든 프로그램 유형**에 동일하게 적용해야 한다. |
| **포함 유형** | `GENERAL`(일반) · `COMPANY_SCHOOL`(1사1교) · `TRAINED_TEACHER`(교육받은 교사) · `UJAT` |
| **포함 templateCode** | §7.5 표 참고 (신청 + 등록 + 모집 전체) |
| **금지** | 신청 양식만, 또는 일반 프로그램 등록(`registration-general`)만 화이트리스트에 반영하고 나머지는 그대로 두는 **부분 수정** — 이 경우 오늘과 동일한 장애가 대상만 바뀌어 재발한다. |

---

## 1. 한 줄 요약

CMS가 시드 `schemaJson`을 **전혀 편집하지 않았거나(무해한 라운드트립)**, 혹은 **시드 단락의 `paragraphTitle`처럼 명시적으로 "허용"이라고 안내되는 카피 필드만** 수정해도 `PUT`이 **`FORM_SCHEMA_IMMUTABLE`**로 거부된다. 신청 양식과 등록/모집 양식 양쪽에서 동일한 패턴이 관측됐다.

1. **신청 양식** — 시드 단락(`program-application-*-seed-*`)만으로도 거부. 09-22 정밀 재현으로 **트리거가 `paragraphTitle` 텍스트 수정 단독**임을 특정(§3 참고).
2. **등록/모집 양식** — 사용자가 모집양식 구조를 **전혀 편집하지 않았는데도** 등록 위저드 임시저장/등록 완료 시 거부(§4 참고). FE가 보낸 `schemaJson`은 시드와 필드 단위로 완전히 동일.

**어제는 저장되던 흐름이 오늘은 실패**하는 사례가 있어 FE 핫픽스 대상이 아니라 **BE 불변 검증(또는 배포된 whitelist) 회귀**로 판단한다.
제품 요구: **신청·등록·모집 양식은 안내 문구·데이터 수정이 가능**해야 한다(시드 구조 해체 자체를 막는 것만 의도적 잠금).

---

## 2. 실측 사례 A — 신청 양식 (2026-09-18 최초 신고)

### 요청

```http
PUT /api/admin/form-template-versions/101
Content-Type: application/json
```

body: `{ "schemaJson": "<WritingFormDraft JSON string>", … }`
(템플릿: 신청 · 학교/기관 계열로 추정, `templateVersionId = 101`)

### 응답

```json
{
  "success": false,
  "data": null,
  "message": "신청 양식의 기존 시스템 항목 구조는 변경할 수 없습니다. 일부 안내 텍스트 수정과 신규 항목 추가만 허용됩니다: program-application-institution-seed-basic-info",
  "error": {
    "code": "FORM_SCHEMA_IMMUTABLE",
    "message": "신청 양식의 기존 시스템 항목 구조는 변경할 수 없습니다. 일부 안내 텍스트 수정과 신규 항목 추가만 허용됩니다: program-application-institution-seed-basic-info",
    "field": "schemaJson",
    "traceId": "ddfb2cd9272c439285adb915ff2368d0",
    "details": null
  }
}
```

| 항목 | 값 |
|------|-----|
| HTTP | (FE 관측) 실패 — `success: false` |
| `error.code` | `FORM_SCHEMA_IMMUTABLE` |
| `error.field` | `schemaJson` |
| 지목 단락 id | `program-application-institution-seed-basic-info` |

지목된 `program-application-institution-seed-basic-info`는:

- `horizontal_table` **셸**(표 껍데기)
- `tableFlavor: "text"`, `columnFields` / `fieldDataRows` 는 비어 있거나 최소
- 실제 입력 UI는 CMS가 **커스텀 본문**(`DetailInfoForm`)으로 렌더 — 표 셀에 필드 정의를 두지 않음

동일 패턴 단락 예:

| paragraph id | 역할 |
|--------------|------|
| `program-application-institution-seed-basic-info` | 기본 정보 (커스텀 본문) |
| `program-application-institution-seed-sex-offense-consent-submission` | 성범죄 동의서 제출 요청 |
| `program-application-institution-seed-sex-offense-consent-inquiry` | 조회 방식 |

**요청:** BE immutable 비교가 "열 개수·columnFields·fieldDataRows·정규화로 채운 기본값" 등 **셸 표 미세 diff**를 구조 변경으로 오인하지 말 것. 특히 FE `normalizeWritingFormDraft` / `normalizeHorizontalTableParagraph`가 GET payload에 기본 키를 보강한 뒤 그대로 PUT하는 **무해한 라운드트립**은 통과해야 한다.

시드 SSOT: `packages/form-schema` · `createProgramApplicationFormInstitutionDraft()` (`PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.basicInfo`)

---

## 3. 실측 사례 B — 신청 양식, `paragraphTitle` 단독 트리거 재현 (2026-09-22)

같은 날 저장한 **강사 신청양식(거부)** vs **봉사자 신청양식(성공)** 두 PUT을 대조해 **정확한 트리거 필드**를 특정했다.

### 3.1 실측 — 강사 신청양식 (거부됨)

```json
{
  "code": "FORM_SCHEMA_IMMUTABLE",
  "message": "신청 양식의 기존 시스템 항목 구조는 변경할 수 없습니다. 일부 안내 텍스트 수정과 신규 항목 추가만 허용됩니다: program-instructor-application-seed-personal-info",
  "traceId": "f21e6f0acf70467ea5e31033f7a00a10"
}
```

지목된 `program-instructor-application-seed-personal-info`의 제출 `paragraphTitle`:

```text
"rkdyk개인정보 수집·이용"
```

FE 시드 원본(`createInstructorPersonalInfoHorizontalTable()`, `packages/form-schema/src/paragraph-ids/program-application-form-instructor-draft.ts`):

```text
"개인정보 수집·이용"
```

→ **`paragraphTitle`에 `"rkdyk"`가 앞에 추가된 것 외에는** `columnHeaders`/`tableFlavor`/`columnFields`/`fieldDataRows`/`bottomText` 전부 시드와 **동일**. 같은 요청에 신규 단락(`agreement_explanation_text`, id `a7f4f92b-...`)도 추가돼 있었음.

### 3.2 실측 — 봉사자 신청양식 (같은 날, 성공)

동일 패턴(시드 그대로 + 신규 `agreement_explanation_text` 단락 추가)이지만, `program-volunteer-application-seed-personal-info`의 `paragraphTitle`은 시드 원본 `"개인정보 수집·이용"`에서 **전혀 수정하지 않음** → PUT **성공**.

### 3.3 대조 결론

| 변경 항목 | A (강사, 거부) | B (봉사자, 성공) |
|---|---|---|
| 시드 단락 `paragraphTitle` 텍스트 수정 | ✅ 있음 (`"rkdyk"` 접두) | ❌ 없음 |
| 신규 단락(`agreement_explanation_text`) 추가 | ✅ 있음 | ✅ 있음 |
| 기타 필드(표 구조·값) | 시드와 동일 | 시드와 동일 |
| 결과 | `FORM_SCHEMA_IMMUTABLE` | 성공 |

신규 단락 추가는 **양쪽 다 있었는데 B만 통과**했으므로 트리거가 아니다(§6.1 허용 항목 정상 동작 확인). **유일한 변수는 시드 단락 `paragraphTitle` 수정 여부**이며, 이것이 있으면 100% 거부되는 것으로 재현된다 — "간헐적"으로 보이는 이유는 사용자가 매번 시드 제목을 건드리지는 않기 때문일 뿐, 실제로는 **결정적(deterministic)** 트리거다.

→ §6.1에서 이미 "`paragraphTitle` 등 카피는 허용"으로 요청했으나, **실측상 `paragraphTitle`만은 여전히 화이트리스트에서 빠져 있음**(`paragraphDescription`/`bottomText`는 별도 검증인지 불명 — 필요 시 BE가 3필드 각각 단독 diff로 재확인). BE는 `paragraphTitle` diff를 **텍스트 카피 변경으로 취급해 통과**시켜야 한다.

---

## 4. 실측 사례 C — 등록/모집 양식 (2026-09-21)

### 요청 (관측된 request body — 요약)

```json
{
  "schemaJson": "{\"schemaVersion\":1,\"formSettings\":{\"titleNumbering\":\"numeric\"},\"paragraphs\":[{\"id\":\"program-registration-seed-basic-info\", ...}, ...]}",
  "extensionJson": "{\"overlay\":{\"generalRegistration.basicInfo.localProgramTitleKo\":\"...\", ...},\"editorState\":{...},\"uiState\":{}}"
}
```

### 응답

```json
{
  "success": false,
  "error": {
    "code": "FORM_SCHEMA_IMMUTABLE",
    "message": "등록/모집 시스템 양식의 기존 구조와 항목은 수정·추가·삭제할 수 없습니다."
  }
}
```

| 항목 | 값 |
|------|-----|
| `error.code` | `FORM_SCHEMA_IMMUTABLE` |
| 편집 이력 | **없음** — 사용자가 직접 확인한 그대로, 모집양식 편집을 시도한 적 없음 |
| 재현 화면 | 일반 프로그램 등록 위저드 → 임시저장/등록 완료 (`useProgramRegistrationEditor` → `persistWritingFormTemplateDraft` → `saveFormTemplateVersionDraft(ByVersionId)`) |

### FE `schemaJson`이 시드와 동일함 (오탐 증거)

관측된 요청의 `schemaJson.paragraphs[n]` 각 항목은 시드 생성기(`createProgramRegistrationDraft`, `createSeedParagraph`)가 만드는 값과 **1:1 동일**하다.

| 필드 | 시드 값 (`createSeedParagraph`) | 관측된 PUT 값 |
|------|-------------------------------|----------------|
| `dataRows` | `[['', '']]` | `[["",""]]` (동일) |
| `columnFields` | `[]` | `[]` (동일) |
| `fieldDataRows` | `[]` | `[]` (동일) |
| `columnHeaders` | `['항목', '내용']` | `["항목","내용"]` (동일) |
| `tableFlavor` | `'text'` | `"text"` (동일) |
| `paragraphTitle` / `paragraphDescription` | 시드 상수(`PROGRAM_REGISTRATION_GENERAL_SECTION_META`) | 동일 문구 (변경 없음) |
| paragraph `id` 목록 | `program-registration-seed-basic-info`, `-business-kpi`, `-wage-info`, `-type-settings`, `-education-curriculum`, `-education-schedule-settings` | 동일 6개, 순서·개수 동일 |

즉 **schemaJson 자체는 GET→normalize→PUT 라운드트립과 동일한 무해한 재저장**이다. 사용자가 실제로 입력한 값(사업명 `"ㄴㅇ"`, KPI 인원수 `2`, 강사비 `23` 등)은 모두 `extensionJson.overlay` 키(`generalRegistration.basicInfo.*`, `generalRegistration.kpi.*`, `generalRegistration.wageInfo.*` 등)에 있으며, `schemaJson` 구조와는 **분리된 채널**이다.

시드 SSOT: `packages/form-schema/src/paragraph-ids/program-registration-draft.ts` (`createProgramRegistrationDraft`, `PROGRAM_REGISTRATION_IDS`)

---

## 5. 제품·CMS 기대 동작 (신청 + 등록/모집 공통)

### 5.1 허용되어야 하는 변경

| 허용 | 설명 |
|------|------|
| 시드 단락 **제목·설명(`paragraphTitle` / `paragraphDescription`)** | 관리자가 안내 문구 수정 — **§3에서 `paragraphTitle`만은 실제로 거부됨을 확인, 수정 필요** |
| 안내/표 **텍스트 셀** 등 카피성 필드 | "일부 안내 텍스트 수정"에 해당 |
| **신규 단락 추가** | 시드 뒤에 사용자 정의 항목 |
| 시드 구조 **미변경 + overlay/데이터 값만 채움** (등록 위저드 매 저장 시 기본 패턴) | 라운드트립으로 간주, 반드시 성공 |
| (프로그램 전용 copy인 경우) 해당 프로그램 binding version에만 반영 | 공용 카탈로그 오염 방지 — [program-scoped copy](./programs-registration-form-program-scoped-copy-backend-request-2026-09-15.md) |

### 5.2 거부해도 되는 변경 (의도적 잠금)

| 거부 | 설명 |
|------|------|
| 시드 단락 **삭제·복제로 시드 ID 제거** | 시스템 항목 유지 |
| 시드 단락 **variant / 타입 변경** | 예: 표 → 객관식 |
| 시드 **필수 구조 해체**(동의 단락 제거, 개인정보 표 컬럼 체계 파괴 등) | 플랫폼 fill 계약 보호 |

### 5.3 FE UI와의 정합

- CMS **양식 관리**·**프로그램 상세 신청/등록 양식 수정**: 위 5.1은 저장 성공해야 함.
- CMS **프로그램 등록 위저드**: 등록/모집 단계는 **매 임시저장·등록 완료 시마다 동일한 시드 `schemaJson`을 재전송**한다(사용자가 실제로 편집하는 값은 `extensionJson.overlay`뿐) — 이 경로가 막히면 **프로그램 등록 자체가 항상 실패**한다.
- 신청 단계는 주로 **localStorage 임시저장**이며, 공용 version PUT을 전제로 하지 않음(전용 copy 계약은 별도 문서).
- FE는 시드 단락에 대해 **구조 잠금 UI**를 이미 두고 있음. BE 검증은 그와 **같은 허용 범위**여야 하며, GET→normalize→PUT만으로, 혹은 `paragraphTitle`만 바꿔서 거부되면 안 됨.

---

## 6. 원인 가설 (BE 확인 요청)

1. **신규/강화된 `FORM_SCHEMA_IMMUTABLE` 검증 배포**
   - 어제까지 PUT 성공 → 오늘 동일 조작 실패와 부합.
2. **화이트리스트가 너무 좁음 / 필드별로 불완전**
   - 메시지와 달리 `paragraphTitle`만 바꿔도(§3), 또는 **변경 없이 재저장**만 해도(§4) 거부. `paragraphDescription`/`bottomText`는 통과하는지 여부도 BE가 필드별로 재확인 필요.
3. **셸 표 + 커스텀 본문 단락을 "표 구조"로 비교**
   - `basic-info`류를 일반 field 표와 동일 규칙으로 diff → 오탐.
4. **대상 version이 공용 카탈로그인지 프로그램 copy인지 미구분**
   - 공용 보호는 타당할 수 있으나, 그 경우에도 **허용 범위(5.1) 내 수정은 통과**하거나, 프로그램 편집은 **전용 copy에만 PUT**하도록 [program-scoped copy](./programs-registration-form-program-scoped-copy-backend-request-2026-09-15.md)와 정책을 맞출 것.
5. **REGISTRATION·RECRUITMENT 계열 templateCode가 APPLICATION 계열과 별도 whitelist를 씀**
   - 신청 양식 리포트(§2, 09-18)와 동일한 버그가 등록/모집 templateCode에는 아직 반영되지 않은 것으로 추정 — whitelist/비교 로직이 templateCode 계열별로 분리돼 있고 REGISTRATION·RECRUITMENT 쪽이 누락된 것으로 보임.

---

## 7. BE 수정 요청 (계약)

### 7.1 `FORM_SCHEMA_IMMUTABLE` 판정 규칙 (신청 + 등록/모집 공통)

시드 paragraph id(예: `program-application-*-seed-*`, `program-registration-seed-*`)에 대해:

| 비교 대상 | 불변(거부) | 가변(허용) |
|-----------|------------|------------|
| `id` / `kind` / `variant` | ✅ 불변 | — |
| `tableFlavor` (시드 정의값) | ✅ 불변 | — |
| 개인정보·제3자 등 **필드형 표의 컬럼 개수·역할** | ✅ 불변(의도적) | 셀 **텍스트 value** 는 가변 |
| **`paragraphTitle`**, `paragraphDescription`, `bottomText` 등 카피 | — | ✅ 허용 — **§3 재현: 현재 `paragraphTitle`만 실제로 거부되고 있어 최우선 수정 대상** |
| `columnFields` / `fieldDataRows` 가 **시드상 빈 셸**인 단락(`dataRows: [["",""]]` 등) | 빈 배열↔정규화 기본값 수준의 diff는 **무시** | 제목·설명·데이터만 바뀌면 통과 |
| draft에 **없는 id의 신규 paragraph** | — | ✅ 허용(추가) |
| 시드 id **삭제** | ✅ 거부 | — |

### 7.2 무해한 라운드트립 (필수)

```text
GET version → FE normalize(변경 없음) → 동일 의미 schemaJson PUT
```

→ **200 / success: true** (시드 구조 미변경으로 간주). 등록/모집 위저드는 매 저장마다 이 라운드트립을 반복하므로, 이 규칙이 깨지면 **모든 프로그램 등록이 항상 실패**한다.

### 7.3 에러 메시지 개선

거부 시:

- `error.code`: `FORM_SCHEMA_IMMUTABLE` 유지 가능
- `message` / `details`: **어떤 필드·어떤 diff**인지 포함 요청 (현재는 단락 id만 있어 FE/QA가 허용 편집인지 오탐인지 구분 불가)

### 7.4 공용 vs 프로그램 전용 (정책 정렬)

| version 성격 | 기대 |
|--------------|------|
| 공용 카탈로그 (`systemTemplate` / 고정 templateCode) | 7.1 허용 범위 내 수정은 저장 가능 **또는** 공용 PUT 전면 금지 + copy API만 허용(팀 정책 택1, OpenAPI에 명시) |
| 프로그램 binding 전용 copy | 7.1 허용 범위로 **반드시** 저장 가능. 프로그램 A 수정이 공용·프로그램 B에 영향 없음 |

### 7.5 대상 templateCode 전체 — 신청 + 등록 + 모집, 4개 프로그램 유형 공통

동일 규칙을 아래 **모든** templateCode 계열에 적용해야 한다. **표의 어느 한 행만 고치는 부분 수정은 수락 조건을 만족하지 못한다.**

| 프로그램 유형 | 신청(APPLICATION) templateCode | 등록(REGISTRATION) templateCode | 모집(RECRUITMENT) templateCode |
|---|---|---|---|
| 일반 | `application-participant-school`, `application-participant-individual`, `application-instructor`, `application-volunteer` | `registration-general` | `recruitment-participant-school` 등 |
| 1사1교 (`COMPANY_SCHOOL`) | 동일 패턴(1사1교 전용 시드) | `registration-economy` | `recruitment-economy` |
| 교육받은 교사 (`TRAINED_TEACHER`) | 동일 패턴 | `registration-trained-teachers` | `recruitment-trained-teachers` |
| UJAT | 동일 패턴 | `registration-ujat` | `recruitment-ujat-school` / `recruitment-ujat-volunteer` |

시드 paragraph id prefix: `program-application-*-seed-*`(신청) · `program-registration-seed-*`(등록, 일반/1사1교/교육받은 교사 — 유형별 일부 단락 제외) · UJAT 전용 시드(`packages/form-schema/src/paragraph-ids/ujat-program-registration-draft.ts`)는 **동일 판정 규칙 적용**.

---

## 8. 수락 기준 (QA)

- [ ] **AC1** 신청 양식(학교) 에디터에서 시드 「기본 정보」`paragraphDescription`만 수정 후 PUT → **성공**
- [ ] **AC1-1** 시드 단락 **`paragraphTitle`만** 수정(예: 「개인정보 수집·이용」→ 다른 문구) 후 PUT → **성공** (2026-09-22 재현: 현재 이 케이스만 단독으로 `FORM_SCHEMA_IMMUTABLE` 거부됨, §3 참고)
- [ ] **AC2** 동일 화면에서 신규 단락 1개 추가 후 PUT → **성공**, 시드 id 유지
- [ ] **AC3** 시드 단락 삭제 시도 PUT → `FORM_SCHEMA_IMMUTABLE`(또는 동등 4xx) **거부 유지** (의도적 잠금 보존 확인)
- [ ] **AC4** GET 직후 수정 없이 재PUT(라운드트립) → **성공**
- [ ] **AC5** 거부 시 `details` 또는 message에 **구체 diff** 확인 가능
- [ ] **AC6** (정책이 copy인 경우) 프로그램 상세 신청/등록 수정은 **전용 version**에만 반영, 공용 templateCode payload 불변
- [ ] **AC7** 일반 프로그램 등록 위저드에서 시드 편집 없이 값만 입력 후 임시저장/등록 완료 → **성공**
- [ ] **AC8** **4개 프로그램 유형 전부**(일반·1사1교·교육받은 교사·UJAT) × **신청·등록·모집 전 templateCode**(§7.5)에서 AC1~AC7 동일 통과 — 일부 유형/계열만 통과하고 나머지는 여전히 거부되는 상태로 "해결됨" 처리하지 않는다

---

## 9. FE 측 상태 (참고 — BE 수정과 병행)

| 항목 | 상태 |
|------|------|
| 본 error.code FE 매핑/우회 | 없음 — 서버 응답 그대로 실패 (`form-template-save-feedback.ts`) |
| FE `schemaJson` 생성 로직(등록/모집) | 시드와 동일 — 사용자는 모집양식 구조를 편집한 적 없음 (재현 확인) |
| 사용자 입력 값(등록/모집) | 전부 `extensionJson.overlay`에 위치, `schemaJson`과 무관 |
| 오늘 FE fill 잠금(등록 위저드) | UI만 잠금, `schemaJson` 시드 구조 변경 없음 |
| 등록 위저드 신청 임시저장 | 기본 localStorage (`localOnlyDraftPersistence`) |
| version `101` remote PUT | 양식 관리 또는 프로그램 상세 remote 저장 경로 |

**FE만으로 해결하지 않음.** BE `FORM_SCHEMA_IMMUTABLE` 검증/화이트리스트 수정(및 필요 시 program-scoped copy)이 신청 + 등록/모집 전 templateCode에 반영되어야 한다.

---

## 10. 체크리스트 (BE)

- [ ] `FORM_SCHEMA_IMMUTABLE` 비교 로직·화이트리스트 위치 확인
- [ ] `paragraphTitle` diff가 카피 변경으로 처리되는지 확인·수정 (§3, 최우선)
- [ ] `program-application-institution-seed-basic-info` 등 셸 표(`tableFlavor: text` + 빈 field rows) 오탐 여부 재현(라운드트립)
- [ ] 신청 전 templateCode에 동일 규칙 적용
- [ ] 등록/모집 전 templateCode(4개 프로그램 유형)에 동일 규칙 적용
- [ ] 스테이징에 AC1–AC8 통과 후 FE에 traceId/`versionId` 공유

---

## 11. 변경 이력

- **2026-09-18**: 최초 작성 (신청 양식, `form-schema-immutable-application-put-backend-request-2026-09-18.md`)
- **2026-09-21**: 등록/모집 양식 확장 관측 — 별도 문서로 작성 (`form-schema-immutable-registration-put-backend-request-2026-09-21.md`)
- **2026-09-22**: 신청 양식 `paragraphTitle` 단독 트리거 재현(강사/봉사자 A·B 대조) 추가 + **두 문서를 본 문서로 통합**, 원본 2건 삭제

**Last updated:** 2026-09-22
