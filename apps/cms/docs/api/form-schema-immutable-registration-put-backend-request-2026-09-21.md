# Forms-Surveys — 등록/모집 양식 `FORM_SCHEMA_IMMUTABLE` PUT 거부 백엔드 수정 요청

| 항목 | 값 |
|------|-----|
| 작성일 | 2026-09-21 |
| 대상 | Forms-Surveys · `PUT /api/admin/form-template-versions/{versionId}` (등록/모집 양식) |
| 우선순위 | **P0** — CMS 프로그램 등록 임시저장/저장 불가 |
| error.code | `FORM_SCHEMA_IMMUTABLE` |
| error.message (관측) | `등록/모집 시스템 양식의 기존 구조와 항목은 수정·추가·삭제할 수 없습니다.` |
| 선행 문서 | [form-schema-immutable-application-put-backend-request-2026-09-18.md](./form-schema-immutable-application-put-backend-request-2026-09-18.md) — **동일 버그 클래스**, 대상이 APPLICATION → REGISTRATION으로 확장 관측 |
| FE 시드 ID | `program-registration-seed-basic-info` 등 (`packages/form-schema/src/paragraph-ids/program-registration-draft.ts`) |
| templateCode | `registration-general` (1사1교: `registration-economy`, 교육받은 교사: 별도 시드) |

### 적용 범위 — 전 프로그램 유형·전 등록/모집 templateCode 공통 (필수)

| | |
|---|---|
| **적용** | 이 문서의 수정 요청은 **일반 프로그램 하나에만 국한되지 않는다.** `등록`(REGISTRATION) **및** `모집`(RECRUITMENT) 시스템 양식을 쓰는 **모든** 프로그램 유형에 **동일하게** 적용해야 한다. |
| **포함 유형** | `GENERAL`(일반) · `COMPANY_SCHOOL`(1사1교) · `TRAINED_TEACHER`(교육받은 교사) · `UJAT` |
| **포함 templateCode — 등록(REGISTRATION)** | `registration-general` · `registration-economy` · `registration-trained-teachers` · `registration-ujat` |
| **포함 templateCode — 모집(RECRUITMENT)** | `recruitment-participant-school`(일반) · `recruitment-economy` · `recruitment-trained-teachers` · `recruitment-ujat-school` · `recruitment-ujat-volunteer` 등 동일 패턴 시드를 쓰는 전 모집 양식 |
| **금지** | 일반 프로그램(`registration-general`)만 화이트리스트에 반영하고 나머지 3개 유형(1사1교·교육받은 교사·UJAT)이나 모집(RECRUITMENT) 계열은 그대로 두는 **부분 수정** — 이 경우 오늘과 동일한 장애가 유형만 바뀌어 재발한다. |

> 오늘 관측된 케이스는 일반 프로그램 등록(`registration-general`)이지만, **동일한 무해 라운드트립 검증 로직**이 4개 프로그램 유형의 등록 templateCode 전부와, 에러 메시지가 함께 지목하는 **모집(RECRUITMENT) templateCode 전부**에 공통으로 쓰인다(§6 표 참고). BE는 templateCode 하나만 패치하지 말고, 이 시드 패턴(시드 paragraph id + `tableFlavor: "text"` 빈 셸 표)을 쓰는 **모든 등록·모집 양식**에 규칙을 일괄 적용해야 한다.

---

## 1. 한 줄 요약

일반 프로그램 **등록 위저드**에서 모집양식(`schemaJson`) 구조를 **전혀 편집하지 않았는데도** `PUT`이 `FORM_SCHEMA_IMMUTABLE`로 거부된다.
FE가 보낸 `schemaJson`은 `packages/form-schema`의 `createProgramRegistrationDraft()` 시드와 **필드 단위로 동일**하다(아래 3절 비교). 실제 사용자가 입력한 값(사업명, KPI, 강사비 등)은 `schemaJson`이 아니라 `extensionJson.overlay`에 담겨 있다.

**신청(APPLICATION) 양식에서 2026-09-18에 리포트한 것과 동일한 BE 회귀/화이트리스트 누락**이 **등록/모집(REGISTRATION) 계열 templateCode**에도 적용되지 않은 것으로 보인다.

---

## 2. 실측 응답 (CMS 프로그램 등록, 2026-09-21)

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

---

## 3. FE `schemaJson`이 시드와 동일함 (오탐 증거)

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

## 4. 제품 기대 동작

등록/모집 위저드는 **매 임시저장·등록 완료 시마다** 동일한 시드 `schemaJson`을 재전송한다(사용자가 실제로 편집하는 값은 `extensionJson.overlay`뿐). 따라서:

| 시나리오 | 기대 |
|---|---|
| 시드 구조 미변경 + overlay 값만 채움 (오늘 관측 케이스) | **PUT 성공** |
| 시드 단락 제목·설명만 관리자가 수정 | **PUT 성공** |
| 시드 단락 삭제·variant 변경 | 거부 유지 (`FORM_SCHEMA_IMMUTABLE`) 가능 |

현재는 **첫 번째(가장 기본적인) 시나리오조차 실패**하여 프로그램 등록 자체가 막힌다.

---

## 5. 원인 가설 (BE 확인 요청)

1. **2026-09-18 APPLICATION 리포트와 동일한 버그가 REGISTRATION templateCode(`registration-general` 등)에는 아직 반영되지 않음** — whitelist/비교 로직이 templateCode 계열별로 분리되어 있고 REGISTRATION 쪽이 누락된 것으로 추정.
2. **변경 없이 재저장(라운드트립)만으로도 거부** — 시드 단락이 `tableFlavor: "text"` + 빈 `columnFields`/`fieldDataRows` 셸이라, BE가 이를 "필드형 표"로 오인해 구조 변경으로 판정할 가능성 (선행 문서 5.3과 동일 패턴).
3. 등록 위저드는 **매 저장마다 동일 schemaJson을 재전송**하는 구조이므로, 이 검증이 고쳐지지 않으면 **모든 프로그램 등록이 항상 실패**한다.

---

## 6. BE 수정 요청 (계약)

선행 문서 [form-schema-immutable-application-put-backend-request-2026-09-18.md](./form-schema-immutable-application-put-backend-request-2026-09-18.md) §6의 규칙을 **REGISTRATION·RECRUITMENT 계열 templateCode 전부(4개 프로그램 유형 공통)**에도 동일하게 적용해 달라는 요청이다. **이 표의 어느 한 행만 고치는 부분 수정은 수락 조건을 만족하지 못한다.**

| 프로그램 유형 | 등록(REGISTRATION) templateCode | 모집(RECRUITMENT) templateCode | 시드 paragraph id prefix |
|---|---|---|---|
| 일반 | `registration-general` | `recruitment-participant-school` 등 | `program-registration-seed-*` |
| 1사1교 (`COMPANY_SCHOOL`) | `registration-economy` | `recruitment-economy` | `program-registration-seed-*` (유형 설정 단락 제외) |
| 교육받은 교사 (`TRAINED_TEACHER`) | `registration-trained-teachers` | `recruitment-trained-teachers` | `program-registration-seed-*` (사업 KPI 제외) |
| UJAT | `registration-ujat` | `recruitment-ujat-school` / `recruitment-ujat-volunteer` | UJAT 전용 시드(`packages/form-schema/src/paragraph-ids/ujat-program-registration-draft.ts`) — **동일 판정 규칙 적용** |

### 6.1 필수 — 무해한 라운드트립 허용

```text
GET version → FE normalize(변경 없음) → 동일 schemaJson PUT
```

→ **200 / success: true** (시드 구조 미변경으로 간주)

### 6.2 판정 규칙

| 비교 대상 | 불변(거부) | 가변(허용) |
|-----------|------------|------------|
| `id` / `kind` / `variant` | ✅ 불변 | — |
| `tableFlavor` (시드 정의값 `text`) | ✅ 불변 | — |
| `columnFields` / `fieldDataRows` 가 시드상 **빈 셸**인 단락(`dataRows: [["",""]]`) | 빈 배열↔정규화 기본값 수준의 diff는 **무시** | — |
| `paragraphTitle`, `paragraphDescription` 등 카피 | — | ✅ 허용 |
| draft에 없는 id의 신규 paragraph | — | ✅ 허용(추가) |
| 시드 id 삭제 | ✅ 거부 | — |

### 6.3 에러 메시지 개선

거부 시 `error.details`에 **어떤 필드의 어떤 diff**로 거부됐는지 포함 요청 (현재는 사유 파악 불가 → FE/QA가 오탐인지 실제 구조 변경인지 구분 못 함).

---

## 7. 수락 기준 (QA)

- [ ] **AC1** 일반 프로그램 등록 위저드에서 시드 편집 없이 값만 입력 후 임시저장 → **성공**
- [ ] **AC2** 동일 시나리오, 등록 완료(POST 전 PUT 포함) → **성공**
- [ ] **AC3** **4개 프로그램 유형 전부** 동일 확인 — `registration-economy`(1사1교), `registration-trained-teachers`(교육받은 교사), `registration-ujat`(UJAT)
- [ ] **AC3-1** **모집(RECRUITMENT) templateCode**도 동일 확인 — `recruitment-participant-school`, `recruitment-economy`, `recruitment-trained-teachers`, `recruitment-ujat-school`, `recruitment-ujat-volunteer`
- [ ] **AC4** 시드 단락 삭제 시도 시 여전히 `FORM_SCHEMA_IMMUTABLE` 거부 유지 (의도적 잠금 보존 확인) — **4개 유형 공통**
- [ ] **AC5** 거부 시 `details`에 구체적 diff 포함
- [ ] **AC6** 위 AC1~AC5 중 **일부 유형만 통과**하고 나머지 유형은 여전히 거부되는 상태로 "해결됨" 처리하지 않는다 — 전 유형 통과가 완료 조건

---

## 8. FE 측 상태 (참고 — BE 수정과 병행)

| 항목 | 상태 |
|------|------|
| FE `schemaJson` 생성 로직 | 시드와 동일 — 사용자는 모집양식 구조를 편집한 적 없음 (재현 확인) |
| 사용자 입력 값 | 전부 `extensionJson.overlay`에 위치, `schemaJson`과 무관 |
| 본 error.code FE 매핑/우회 | 없음 — 서버 응답 그대로 실패 (`form-template-save-feedback.ts`) |

**FE만으로 해결하지 않음.** BE `FORM_SCHEMA_IMMUTABLE` 검증에 REGISTRATION 계열 templateCode 화이트리스트/무해 라운드트립 허용 반영 필요.

---

**Last updated:** 2026-09-21
