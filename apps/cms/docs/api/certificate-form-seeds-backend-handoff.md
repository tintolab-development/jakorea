# 인증서 양식 시드 JSON — 백엔드 전달 (Payload D · 5종 전체)

> 작성: 2026-09-02  
> 범위: CMS `/templates/form-management` **발급 → 서류 양식** 중 **인증서·수료증 계열 5종**  
> 목적: BE DB 시드·API round-trip·이미지 저장·프로그램 실발급까지 **모든 templateCode 케이스**를 누락 없이 대응

**상위 문서**

- [form-template-db-seed-backend-handoff.md](./form-template-db-seed-backend-handoff.md) — 47종 전체 시드
- [certificate-image-storage-handoff.md](./certificate-image-storage-handoff.md) — 이미지 업로드·재진입
- [form-template-json-contract.md](./form-template-json-contract.md) §5-C — `settingsJson` 계약

**FE SSOT**

- 카탈로그: `packages/form-schema/src/catalog/form-template-catalog.ts` → `CERTIFICATE_ISSUANCE_TEMPLATE_CODES`
- settings 파서: `apps/cms/src/features/template/lib/certificate-form-settings.ts`
- 시드 생성: `exportIssuanceFormTemplateSeeds()` → `form-template-seeds/document-*.json`

---

## 1. 요약 — 5종 전부 시드 필수

| # | templateCode | templateName | FE 양식관리 목록 | 프로그램 실발급 | 시드 JSON |
|---|--------------|--------------|-----------------|----------------|-----------|
| 1 | `document-2` | 휴가 인증서 | ✗ (레거시) | — | [document-2.json](./form-template-seeds/document-2.json) |
| 2 | `document-3` | 수료증 | ☑ | 학생 수료증 | [document-3-certificate.json](./form-template-seeds/document-3-certificate.json) |
| 3 | `document-participation-certificate` | 참가인증서 | ☑ | 학생 참가인증서 | [document-participation-certificate.json](./form-template-seeds/document-participation-certificate.json) |
| 4 | `document-4` | 강사 활동 인증서 | ☑ | 강사 활동 인증 | [document-4.json](./form-template-seeds/document-4.json) |
| 5 | `document-5` | 봉사 활동 인증서 | ☑ | UJAT·일반 봉사 활동 | [document-5.json](./form-template-seeds/document-5.json) |

**BE 완료 조건 (인증서만)**

- 위 **5종 모두** `formType=ISSUANCE`, Payload **D**, `schemaJson=null`, `settingsJson` string 존재
- 목록 API 4종(목록 노출) + `document-2`(레거시) 각각 **독립** `templateId` / `latestVersionId`
- 5종 간 `settingsJson`·업로드 이미지 **공유 금지** (한 종 수정이 다른 종에 섞이면 Fail)
- `PUT settingsJson` → 재조회 → CMS 미리보기·PDF 캡처·프로그램 실발급에 동일 반영

---

## 2. Payload D 저장 규칙

| API/DB 필드 | 인증서 5종 |
|-------------|-----------|
| `schemaJson` | **`null`** (빈 paragraphs object 아님) |
| `extensionJson` | `{"overlay":{},"editorState":{},"uiState":{}}` string |
| `settingsJson` | **필수** — 아래 §3 전체 필드 object → JSON string |
| `formType` | `ISSUANCE` |
| `category` | FE catalog: `ISSUANCE` (서브분류 DOCUMENT는 FE-only) |

**금지**

- 5종을 하나의 template row로 합치기
- `schemaJson`에 paragraphs 넣기 (FE는 `settingsJson` only 경로)
- 이미지 URL을 5종 공통 단일 필드로만 저장

---

## 3. `settingsJson` 전체 스키마 (5종 공통 키)

FE `parseCertificateFormSettings` / `buildCertificateFormSettings` SSOT.

### 3.1 이미지 필드 (4) — `null` 또는 file ref object

| 필드 | UI 라벨 | 시드 기본 | 업로드 후 형태 |
|------|---------|-----------|----------------|
| `orgLogo` | 기관 로고 | `null` | §4 |
| `orgLogo02` | 기관 로고 02 | `null` | §4 |
| `certificateBackground` | 수료증 배경 | `null` | §4 |
| `chairmanSeal` | 회장 직인 | `null` | §4 |

`null` → FE 번들 기본 에셋 표시 (오류 아님).

### 3.2 문자열 필드 (8)

| 필드 | 설명 | 시드 기본값 (5종 공통) | 비고 |
|------|------|----------------------|------|
| `titleName` | 캔버스 타이틀 | **종별 상이** — §5 표 | 최대 9자(한글) |
| `bodyContent` | 본문 | `귀하는 위의 과정에 참여하여\n교육과정을 수료하였음을 확인합니다.` | `\n` 유지 |
| `chairmanName` | 회장명 | `이은형` | |
| `orgAddress` | 기관 주소 | `서울특별시 강서구 마곡중앙로 171 714호` | |
| `orgPhone` | 전화 | `Tel.02-783-2367` | |
| `orgFax` | 팩스 | `Fax.070-4275-5115` | |
| `orgWebsite` | 홈페이지 | `http://www.jakorea.org` | |
| `participantInfo` | 참여자 정보 블록 | 6줄 예시 (성명~발급목적) | 실발급 시 runtime 덮어쓰기 |

### 3.3 `participantRowVisibility` — boolean[6]

참여자 정보 행 노출 (인덱스 = 라벨):

| index | 라벨 |
|-------|------|
| 0 | 성명 |
| 1 | 생년월일 |
| 2 | 소속 |
| 3 | 프로그램명 |
| 4 | 활동기간 |
| 5 | 발급목적 |

시드: `[true, true, true, true, true, true]`

### 3.4 시드 JSON 예시 (수료증 — `document-3`)

```json
{
  "orgLogo": null,
  "orgLogo02": null,
  "certificateBackground": null,
  "chairmanSeal": null,
  "titleName": "수료증",
  "bodyContent": "귀하는 위의 과정에 참여하여\n교육과정을 수료하였음을 확인합니다.",
  "chairmanName": "이은형",
  "orgAddress": "서울특별시 강서구 마곡중앙로 171 714호",
  "orgPhone": "Tel.02-783-2367",
  "orgFax": "Fax.070-4275-5115",
  "orgWebsite": "http://www.jakorea.org",
  "participantInfo": "홍길동\n1990.01.01\nOO고등학교\nJA 직업캠프\n2025.01.01 ~ 2025.12.31\n기관 및 학교 제출용",
  "participantRowVisibility": [true, true, true, true, true, true]
}
```

나머지 4종은 **`titleName`만** §5 표 값으로 바꾸고 동일 구조.

---

## 4. 이미지 file ref 계약 (업로드 후)

[`certificate-image-storage-handoff.md`](./certificate-image-storage-handoff.md)

```json
{
  "fileId": 123,
  "url": "https://cdn.example.com/templates/document-3/org-logo.png",
  "fileName": "org-logo.png",
  "fileSize": 12345,
  "uploadedAt": "2026-07-20T00:00:00.000Z"
}
```

| 규칙 | 설명 |
|------|------|
| FE 파서 | **`url` string 필수**. `fileId`만 있으면 미복원 |
| GET version | 저장된 ref에 **브라우저 표시 가능한 url** 포함 |
| 독립성 | `document-3` 로고 변경이 `document-4`에 영향 없음 |
| PDF | html2canvas 캡처(엔진 B)에 동일 URL 사용 |

---

## 5. 종별 `titleName` · 사용 맥락

| templateCode | titleName (시드) | CMS 양식관리 | 프로그램 실발급 |
|--------------|------------------|-------------|----------------|
| `document-2` | 휴가 인증서 | 목록 비노출, API·레거시 | — |
| `document-3` | 수료증 | 서류 양식 탭 | 일반 프로그램 — 학생 **수료증** (`student-certificate-template.ts`) |
| `document-participation-certificate` | 참가인증서 | 서류 양식 탭 | 일반 프로그램 — 학생 **참가인증서** |
| `document-4` | 강사 활동 인증서 | 서류 양식 탭 | 프로그램 — **강사** 활동 인증 (`INSTRUCTOR_ACTIVITY_CERTIFICATE_TEMPLATE_CODE`) |
| `document-5` | 봉사 활동 인증서 | 서류 양식 탭 | UJAT·일반 — **봉사자** 활동 인증 (`VOLUNTEER_ACTIVITY_CERTIFICATE_TEMPLATE_CODE`) |

실발급 시 FE는 template `settingsJson`(로고·본문·타이틀) + runtime 참여자/일련번호를 merge한다.  
BE는 **template version API**로 settings만 제공하면 된다.

---

## 6. CMS 양식 관리 vs 프로그램 실발급

| 맥락 | 진입 | templateCode 소스 | settings 로드 |
|------|------|-------------------|---------------|
| **양식 관리 authoring** | `/templates/form-management` → 발급 → 서류 | 목록 row `id` | `GET form-template-versions/{id}` → `settingsJson` |
| **학생 수료/참가** | 프로그램 상세 → 참여 학생 | `document-3` / `document-participation-certificate` | 동일 API (templateCode 고정) |
| **강사 활동** | 프로그램 상세 → 강사 | `document-4` | 동일 |
| **봉사 활동** | UJAT/일반 봉사자 | `document-5` | 동일 |

시드·PUT·GET 계약은 **5종 동일**. 실발급만 runtime string override keys가 추가된다.

---

## 7. BE 시드 · 검증 체크리스트 (5종 × 항목)

각 templateCode에 대해:

- [ ] `form_template` row 존재 (`templateCode` UNIQUE)
- [ ] version 1 `DRAFT`, `schemaJson` null
- [ ] `settingsJson`에 §3 **전체 키** (누락 시 FE default merge지만 API parity QA는 시드 파일과 equal)
- [ ] `titleName`이 §5와 일치
- [ ] `participantRowVisibility.length === 6`
- [ ] 목록 API `latestVersionId` 반환
- [ ] (P1) 4개 이미지 필드 각각 업로드 → PUT → GET → url 유효
- [ ] (P1) **다른 종** settings 변경 없음 (독립성)
- [ ] (P2) 프로그램 실발급 미리보기에서 동일 template settings 반영

### API smoke (5종 loop)

```bash
for CODE in document-2 document-3 document-participation-certificate document-4 document-5; do
  VID=$(curl -s -H "Authorization: Bearer $JWT" \
    "$BASE/api/admin/form-templates?formType=ISSUANCE&size=50" \
    | jq -r ".items[] | select(.templateCode==\"$CODE\") | .latestVersionId")
  test -n "$VID" || echo "MISSING $CODE"
  curl -s -H "Authorization: Bearer $JWT" \
    "$BASE/api/admin/form-template-versions/$VID" \
    | jq -r '.schemaJson, (.settingsJson | fromjson | .titleName)'
done
```

기대: `schemaJson` = `null`, `titleName` = §5 값.

---

## 8. 지급조서·동의와의 구분 (인증서 아님)

| templateCode | Payload | 비고 |
|--------------|---------|------|
| `document-payment-order-issue` | **A** (`schemaJson` paragraphs) | A4 발급용 지급조서 — 인증서 UI 아님 |
| `document-payment-order-pre-consent` | **A** | 작성 `agreement-third-party`와 동일 schema |
| `agreement-crime` | **D** (`documentImageUrl`) | 정적 PNG 동의서 — `FormCertificatePreview` 미사용 |

본 문서 §1~7은 **`CERTIFICATE_ISSUANCE_TEMPLATE_CODES` 5종만** 해당.

---

## 9. FE 2차 QA (BE 시딩 후)

[`form-template-fe-gap-report.md`](../qa/form-template-fe-gap-report.md)

1. 양식 관리 — 서류 4종(목록) + `document-2`(API) open → 이미지 업로드 → save → reopen
2. `document-3` / `document-participation-certificate` — 학생 발급 PDF
3. `document-4` / `document-5` — 강사·봉사 발급 PDF
4. 5종 settings 상호 오염 없음

---

_Generated for BE DB seed · FE certificate SSOT · 2026-09-02_
