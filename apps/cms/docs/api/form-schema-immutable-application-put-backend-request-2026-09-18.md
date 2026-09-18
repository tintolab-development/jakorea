# Forms-Surveys — 신청 양식 `FORM_SCHEMA_IMMUTABLE` PUT 거부 백엔드 수정 요청

| 항목 | 값 |
|------|-----|
| 작성일 | 2026-09-18 |
| 대상 | Forms-Surveys · `PUT /api/admin/form-template-versions/{versionId}` |
| 우선순위 | **P0** — CMS 신청 양식(학교/기관 등) 저장 불가 |
| error.code | `FORM_SCHEMA_IMMUTABLE` |
| 관련 문서 | [programs-registration-form-program-scoped-copy-backend-request-2026-09-15.md](./programs-registration-form-program-scoped-copy-backend-request-2026-09-15.md) |
| FE 시드 ID | `program-application-institution-seed-basic-info` 등 (`packages/form-schema`) |

---

## 1. 한 줄 요약

신청 양식 `schemaJson`을 `PUT`하면 BE가 **`FORM_SCHEMA_IMMUTABLE`** 로 거부합니다.  
메시지상 “안내 텍스트 수정·신규 항목 추가만 허용”이지만, 실제로는 **시스템 시드 단락(특히 기본 정보)만으로도** 거부가 납니다.

**어제는 저장되던 흐름이 오늘은 실패** → FE 핫픽스 대상이 아니라 **BE 불변 검증(또는 배포된 whitelist) 회귀**로 판단합니다.  
제품 요구: **신청 양식은 수정 가능**해야 합니다(시드 구조 해체 제외).

---

## 2. 실측 응답 (스테이징)

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

---

## 3. 제품·CMS 기대 동작

### 3.1 허용되어야 하는 변경 (신청 양식)

| 허용 | 설명 |
|------|------|
| 시드 단락 **제목·설명(paragraphTitle / paragraphDescription)** | 관리자가 안내 문구 수정 |
| 안내/표 **텍스트 셀** 등 카피성 필드 | “일부 안내 텍스트 수정”에 해당 |
| **신규 단락 추가** | 시드 뒤에 사용자 정의 항목 |
| (프로그램 전용 copy인 경우) 해당 프로그램 binding version에만 반영 | 공용 카탈로그 오염 방지 — [program-scoped copy](./programs-registration-form-program-scoped-copy-backend-request-2026-09-15.md) |

### 3.2 거부해도 되는 변경 (의도적 잠금)

| 거부 | 설명 |
|------|------|
| 시드 단락 **삭제·복제로 시드 ID 제거** | 시스템 항목 유지 |
| 시드 단락 **variant / 타입 변경** | 예: 표 → 객관식 |
| 시드 **필수 구조 해체**(동의 단락 제거, 개인정보 표 컬럼 체계 파괴 등) | 플랫폼 fill 계약 보호 |

### 3.3 FE UI와의 정합

- CMS **양식 관리**·**프로그램 상세 신청 양식 수정**: 위 3.1은 저장 성공해야 함.
- CMS **프로그램 등록 위저드**: 신청 단계는 주로 **localStorage 임시저장**이며, 공용 version PUT을 전제로 하지 않음(전용 copy 계약은 별도 문서).
- FE는 시드 단락에 대해 **구조 잠금 UI**를 이미 두고 있음. BE 검증은 그와 **같은 허용 범위**여야 하며, GET→normalize→PUT만으로 거부되면 안 됨.

---

## 4. FE 시드 구조 참고 (오탐 주의)

지목된 `program-application-institution-seed-basic-info` 는:

- `horizontal_table` **셸**(표 껍데기)
- `tableFlavor: "text"`, `columnFields` / `fieldDataRows` 는 비어 있거나 최소
- 실제 입력 UI는 CMS가 **커스텀 본문**(`DetailInfoForm`)으로 렌더 — 표 셀에 필드 정의를 두지 않음

동일 패턴 단락 예:

| paragraph id | 역할 |
|--------------|------|
| `program-application-institution-seed-basic-info` | 기본 정보 (커스텀 본문) |
| `program-application-institution-seed-sex-offense-consent-submission` | 성범죄 동의서 제출 요청 |
| `program-application-institution-seed-sex-offense-consent-inquiry` | 조회 방식 |

**요청:** BE immutable 비교가 “열 개수·columnFields·fieldDataRows·정규화로 채운 기본값” 등 **셸 표 미세 diff**를 구조 변경으로 오인하지 말 것.  
특히 FE `normalizeWritingFormDraft` / `normalizeHorizontalTableParagraph` 가 GET payload에 기본 키를 보강한 뒤 그대로 PUT하는 **무해한 라운드트립**은 통과해야 함.

시드 SSOT: `packages/form-schema` · `createProgramApplicationFormInstitutionDraft()`  
(`PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.basicInfo`)

---

## 5. 원인 가설 (BE 확인 요청)

1. **신규/강화된 `FORM_SCHEMA_IMMUTABLE` 검증 배포**  
   - 어제까지 PUT 성공 → 오늘 동일 조작 실패와 부합.
2. **화이트리스트가 너무 좁음**  
   - 메시지와 달리 `paragraphTitle` / `paragraphDescription` / 안내 텍스트만 바꿔도, 또는 **변경 없이 재저장**만 해도 거부.
3. **셸 표 + 커스텀 본문 단락을 “표 구조”로 비교**  
   - `basic-info` 를 일반 field 표와 동일 규칙으로 diff → 오탐.
4. **대상 version이 공용 카탈로그인지 프로그램 copy인지 미구분**  
   - 공용 보호는 타당할 수 있으나, 그 경우에도 **허용 범위(3.1) 내 수정은 통과**하거나, 프로그램 편집은 **전용 copy에만 PUT**하도록 [program-scoped copy](./programs-registration-form-program-scoped-copy-backend-request-2026-09-15.md) 와 정책을 맞출 것.

---

## 6. BE 수정 요청 (계약)

### 6.1 `FORM_SCHEMA_IMMUTABLE` 판정 규칙 (신청 APPLICATION)

시드 paragraph id(예: `program-application-institution-seed-*`)에 대해:

| 비교 대상 | 불변(거부) | 가변(허용) |
|-----------|------------|------------|
| `id` / `kind` / `variant` | ✅ 불변 | — |
| `tableFlavor` (시드 정의값) | ✅ 불변 | — |
| 개인정보·제3자 등 **필드형 표의 컬럼 개수·역할** | ✅ 불변(의도적) | 셀 **텍스트 value** 는 가변 |
| `paragraphTitle`, `paragraphDescription`, `bottomText` 등 카피 | — | ✅ 허용 |
| `columnFields` / `fieldDataRows` 가 **시드상 빈 셸**인 단락 | 빈 배열↔정규화 기본값 수준의 diff는 **무시** | 제목·설명만 바뀌면 통과 |
| draft에 **없는 id의 신규 paragraph** | — | ✅ 허용(추가) |
| 시드 id **삭제** | ✅ 거부 | — |

동일 규칙을 다음 templateCode 계열에도 적용(대표):

- `application-participant-school` (기관)
- `application-participant-individual`
- `application-instructor` / `application-volunteer`
- 1사1교·UJAT·교육받은 교사 등 **동일 패턴 신청 시드**

### 6.2 무해한 라운드트립

```text
GET version → FE normalize → 동일 의미 schemaJson PUT
```

→ **200 / success: true** (시드 구조 미변경으로 간주)

### 6.3 에러 메시지

거부 시:

- `error.code`: `FORM_SCHEMA_IMMUTABLE` 유지 가능
- `message` / `details`: **어떤 필드·어떤 diff** 인지 포함 권장  
  (현재는 단락 id만 있어 FE/QA가 허용 편집인지 오탐인지 구분 불가)

### 6.4 공용 vs 프로그램 전용 (정책 정렬)

| version 성격 | 기대 |
|--------------|------|
| 공용 카탈로그 (`systemTemplate` / 고정 templateCode) | 6.1 허용 범위 내 수정은 저장 가능 **또는** 공용 PUT 전면 금지 + copy API만 허용(팀 정책 택1, OpenAPI에 명시) |
| 프로그램 binding 전용 copy | 6.1 허용 범위로 **반드시** 저장 가능. 프로그램 A 수정이 공용·프로그램 B에 영향 없음 |

---

## 7. 수락 기준 (QA)

- [ ] **AC1** 신청 양식(학교) 에디터에서 시드 「기본 정보」`paragraphDescription`만 수정 후 PUT → **성공**
- [ ] **AC2** 동일 화면에서 신규 단락 1개 추가 후 PUT → **성공**, 시드 id 유지
- [ ] **AC3** 시드 「기본 정보」단락 삭제 시도 PUT → `FORM_SCHEMA_IMMUTABLE` (또는 동등 4xx) **거부**
- [ ] **AC4** GET 직후 수정 없이 재PUT(라운드트립) → **성공**
- [ ] **AC5** 거부 시 `details` 또는 message에 **구체 diff** 확인 가능
- [ ] **AC6** (정책이 copy인 경우) 프로그램 상세 신청 수정은 **전용 version**에만 반영, 공용 `application-participant-school` payload 불변

---

## 8. FE 측 상태 (참고 — BE 수정과 병행)

| 항목 | 상태 |
|------|------|
| 본 error.code FE 매핑/우회 | 없음 — 서버 응답 그대로 실패 |
| 오늘 FE fill 잠금(등록 위저드) | UI만 잠금, `schemaJson` 시드 구조 변경 없음 |
| 등록 위저드 신청 임시저장 | 기본 localStorage (`localOnlyDraftPersistence`) |
| version `101` remote PUT | 양식 관리 또는 프로그램 상세 remote 저장 경로 |

**FE만으로 해결하지 않음.** BE 검증/화이트리스트 수정(및 필요 시 program-scoped copy) 필요.

---

## 9. 체크리스트 (BE)

- [ ] `FORM_SCHEMA_IMMUTABLE` 비교 로직·화이트리스트 위치 확인
- [ ] `program-application-institution-seed-basic-info` 오탐 여부 재현(라운드트립)
- [ ] 셸 표(`tableFlavor: text` + 빈 field rows) 예외 처리
- [ ] 신청 전 templateCode에 동일 규칙 적용
- [ ] 스테이징에 AC1–AC4 통과 후 FE에 traceId/`versionId` 공유

---

**Last updated:** 2026-09-18
