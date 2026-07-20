# 발급 양식 API 전환 — 후속 작업 (FE/BE)

발급 양식 14종 API load/save·프로그램 실발급 동기화 **1차 구현 완료** 이후 남은 항목을 정리합니다.

**관련 문서**

- [form-template-json-contract.md](./form-template-json-contract.md) — JSON 계약 SSOT (§8 발급 14종)
- [writing-form-seeds-backend-handoff.md](./writing-form-seeds-backend-handoff.md) — 작성 양식 시드 전달 (동일 패턴 참고)
- [certificate-image-storage-handoff.md](./certificate-image-storage-handoff.md) — 인증서·수료증 이미지 저장 연동 계약
- [form-template-draft-loading-handoff.md](./form-template-draft-loading-handoff.md) — draft mock→API 로딩·시드 id 일치
- [forms-surveys-api-backend-gaps.md](./forms-surveys-api-backend-gaps.md) — API 갭 목록 (§8 발급 — **본 문서로 일부 대체**)
- [forms-surveys-api-migration-guide.md](./forms-surveys-api-migration-guide.md) — PHASE 5 발급 양식

**코드 SSOT (구현 완료)**

| 영역 | 경로 |
|------|------|
| 발급 목록 | `src/features/template/hooks/use-issuance-form-sections.ts` |
| 발급 탭 | `src/pages/templates/issuance-form-tab.tsx` |
| Payload A 에디터 훅 | `src/features/template/hooks/use-*-issuance-editor.ts` (5종) |
| 인증서 settings | `src/features/template/lib/certificate-form-settings.ts` |
| 인증서 공통 훅 | `src/features/template/hooks/use-certificate-template-modal-state.ts` |
| 인증서 UI (양식 관리) | `src/pages/templates/form-template-fullpage-modal.tsx` |
| draft API | `src/features/template/api/admin-form-templates-service.ts` |
| 시드 보정 레지스트리 | `src/features/template/lib/form-template-seed-registry.ts` (Payload A 6종) |
| 프로그램 실발급 | `student-certificate-pdf-export-host.tsx`, `activity-certificate-issuance-preview-modal.tsx`, `participating-volunteer-activity-certificate-preview-modal.tsx` |

---

## 1. FE 구현 현황 (2026-07-09)

### 1.1 완료

| 구분 | templateCode | load | save | 비고 |
|------|--------------|:----:|:----:|------|
| Payload A | `document-payment-order-issue` | O | O | 지급조서(발급용) |
| Payload A | `document-payment-order-pre-consent` | O | O | 지급조서 사전 동의서 |
| Payload A | `issuance-4` | O | O | 정산 신청서 |
| Payload A | `issuance-3` | O | O | 강의보고서 |
| Payload A | `issuance-2` | O | O | UJAT 교육계획서 |
| Payload A | `issuance-ujat-edu-journal` | O | O | UJAT 교육일지 |
| Payload D | `document-2` ~ `document-5`, `document-participation-certificate` | O | O | `settingsJson` only |
| 목록 | 14종 전체 | O | — | `GET formType=ISSUANCE` + mock fallback |
| 프로그램 PDF | `document-3`, `document-participation-certificate`, `document-4`, `document-5` | O | — | 템플릿 설정 + `participantInfo` 런타임 덮어쓰기 |
| 인프라 | settings-only 로드 | O | — | `schemaJson: null` + `settingsJson` 응답 지원 |

### 1.2 의도적 미구현 (Payload E)

| templateCode | templateName | 상태 |
|--------------|--------------|------|
| `issuance-1` | UJAT 결과리포트 | 편집기·저장 UI 없음 (플레이스홀더 카드) |
| `issuance-5` | 결과보고서 | 미리보기만 (`getIssuanceUserPreviewDraft` 시드) |
| `document-1` | 지출증빙서류(필수폼) | 편집기·저장 UI 없음 |

---

## 2. BE 협업 필수 (P0)

### 2.1 발급 14종 시드·`templateCode` 확정

[forms-surveys-api-backend-gaps.md §8](./forms-surveys-api-backend-gaps.md) 기준 **BE 시드·매핑표 없음** 상태. FE는 아래 `templateCode`를 SSOT로 사용 중이며, BE 시드가 다르면 adapter·캐시 키가 깨집니다.

**카탈로그 SSOT:** `src/features/template/api/form-template-catalog.ts` → `ISSUANCE_TEMPLATE_CODE_CATALOG`

| templateCode | templateName | Payload | BE 시드 JSON | FE 시드 factory |
|--------------|--------------|---------|--------------|-----------------|
| `issuance-1` | UJAT 결과리포트 | E | [issuance-1.json](./form-template-seeds/issuance-1.json) | 없음 (빈 DRAFT) |
| `issuance-2` | UJAT 교육계획서 | A | [issuance-2.json](./form-template-seeds/issuance-2.json) | `createUjatEducationPlanIssuanceDraft()` |
| `issuance-ujat-edu-journal` | UJAT 교육일지 | A | [issuance-ujat-edu-journal.json](./form-template-seeds/issuance-ujat-edu-journal.json) | `createUjatEducationJournalIssuanceDraft()` |
| `issuance-3` | 강의보고서 | A | [issuance-3.json](./form-template-seeds/issuance-3.json) | `createLectureReportIssuanceDraft()` |
| `issuance-4` | 정산 신청서 | A | [issuance-4.json](./form-template-seeds/issuance-4.json) | `createSettlementApplicationIssuanceDraft()` |
| `issuance-5` | 결과보고서 | E | [issuance-5.json](./form-template-seeds/issuance-5.json) | 없음 (빈 DRAFT) |
| `document-payment-order-issue` | 지급조서(발급용) | A | [document-payment-order-issue.json](./form-template-seeds/document-payment-order-issue.json) | `createPaymentStatementIssuanceDraft()` |
| `document-payment-order-pre-consent` | 지급조서 사전 동의서 | A | [document-payment-order-pre-consent.json](./form-template-seeds/document-payment-order-pre-consent.json) | `createPaymentStatementPreConsentDraft()` |
| `document-1` | 지출증빙서류(필수폼) | E | [document-1.json](./form-template-seeds/document-1.json) | 없음 (빈 DRAFT) |
| `document-2` | 휴가 인증서 | D | [document-2.json](./form-template-seeds/document-2.json) | `settingsJson` only |
| `document-3` | 수료증 | D | [document-3-certificate.json](./form-template-seeds/document-3-certificate.json) | `settingsJson` only |
| `document-participation-certificate` | 참여인증서 | D | [document-participation-certificate.json](./form-template-seeds/document-participation-certificate.json) | `settingsJson` only |
| `document-4` | 강사 활동 인증서 | D | [document-4.json](./form-template-seeds/document-4.json) | `settingsJson` only |
| `document-5` | 봉사 활동 인증서 | D | [document-5.json](./form-template-seeds/document-5.json) | `settingsJson` only |

**백엔드 전달 SSOT:** [issuance-form-seeds-backend-handoff.md](./issuance-form-seeds-backend-handoff.md)

**BE 요청**

1. 위 `templateCode` 14종을 `form_templates` 시드에 등록 (`formType=ISSUANCE`)
2. Payload A 6종 + Payload D 5종 — 초기 DRAFT 버전에 JSON 시드 삽입
3. Payload E 3종 — 메타만 등록 또는 빈 DRAFT (제품 스펙 확정 후)
4. 목록 응답에 `templateId`, `latestVersionId` 포함 (작성 양식과 동일)

**시드 JSON 작성 가이드**

- Payload A: [writing-form-seeds-backend-handoff.md](./writing-form-seeds-backend-handoff.md)와 동일 — `schemaJson` = `WritingFormDraft` object
- Payload D: [document-3-certificate.json](./form-template-seeds/document-3-certificate.json) 복제 후 `titleName`·`bodyContent`만 인증서별 수정, `schemaJson: null`
- `extensionJson`: 인증서·Payload A 기본은 `{ "overlay": {}, "editorState": {}, "uiState": {} }` 또는 null

### 2.2 인증서 `schemaJson: null` vs 빈 `schemaJson` PUT

| 구분 | 값 |
|------|-----|
| BE 시드 (권장) | `schemaJson: null` |
| FE 저장 시 PUT | `schemaJson: "{\"schemaVersion\":1,\"formSettings\":{\"titleNumbering\":\"none\"},\"paragraphs\":[]}"` (빈 draft) |

**확인 필요 (BE)**

- [ ] PUT partial update 시 `schemaJson`만내도 `settingsJson`이 유지되는가?
- [ ] 최초 `null`인 `schemaJson`을 빈 JSON string으로 저장해도 문제 없는가?
- [ ] 게시(publish) 후에도 인증서는 `settingsJson`만 의미 있는가?

**FE 대응 옵션 (BE 응답 후)**

- A) BE가 `schemaJson` 생략 허용 → FE는 `settingsJson`만 PUT
- B) 현행 유지 — 빈 `schemaJson` + `settingsJson` 동시 PUT

### 2.3 `settingsJson` 이미지 필드 형식

현재 FE는 mock `FileUploadResult` (`url`, `fileName`, `fileSize`, `uploadedAt`)를 `settingsJson`에 그대로 저장합니다.

```json
{
  "orgLogo": { "url": "/uploads/image/...", "fileName": "logo.png", "fileSize": 12345, "uploadedAt": "..." },
  "certificateBackground": null
}
```

**BE 확인 TODO**

- [ ] 파일 스토리지 연동 후 `{ fileId, url }` 또는 `fileId` only로 변경할지
- [ ] 관리자 업로드 API 엔드포인트 (forms-surveys vs 공통 file API)
- [ ] CDN URL 만료·권한 정책

### 2.4 ISSUANCE `category` enum

FE 목록 adapter는 `REPORT` / `DOCUMENT` 서브분류를 [form-template-catalog.ts](../../src/features/template/api/form-template-catalog.ts)에서 기대합니다.

- [ ] BE `category` 값: `ISSUANCE` 단일 vs `REPORT` + `DOCUMENT` 분리
- [ ] 목록 필터 `category` query 지원 여부

### 2.5 플레이스홀더 3종 제품·시드 스펙

| templateCode | 현재 FE 동작 | BE/기획 확인 |
|--------------|-------------|--------------|
| `issuance-1` | 좌측 카드 3개 플레이스홀더, 저장 없음 | 실제 에디터·schemaJson 필요 여부 |
| `issuance-5` | `createSingleItemPreviewDraft()` 미리보기만 | Payload A 전환 여부 |
| `document-1` | 좌측 카드 플레이스홀더, 저장 없음 | 지출증빙 필수폼 스펙 |

---

## 3. FE 후속 작업 (P1)

### 3.1 문서 갱신

| 문서 | 작업 | 상태 |
|------|------|------|
| [form-template-json-contract.md](./form-template-json-contract.md) 부록 B | 발급·인증서·extensionJson 항목 **완료/미완료 분리** (본 문서 §4 참고) | **완료** (2026-07-09~10) |
| [forms-surveys-api-backend-gaps.md](./forms-surveys-api-backend-gaps.md) §8 | «시드 없음» → «FE 연동 완료, BE 시드 대기» + P0 JSON 링크 | **완료** (2026-07-10) |
| [forms-surveys-api-migration-guide.md](./forms-surveys-api-migration-guide.md) PHASE 5 | DoD 체크리스트 갱신 (P0 FE 시드 반영) | **완료** (2026-07-10) |

### 3.2 발급 시드 JSON 파일 생성 (14종) — **완료** (2026-07-13)

`docs/api/form-template-seeds/` + 핸드오프: [issuance-form-seeds-backend-handoff.md](./issuance-form-seeds-backend-handoff.md)

| Payload | 파일 | 상태 |
|---------|------|------|
| A (6) | `issuance-2/3/4`, `issuance-ujat-edu-journal`, 지급조서 2종 | **완료** |
| D (5) | `document-2/4/5`, `document-participation-certificate`, `document-3-certificate` | **완료** |
| E (3) | `issuance-1`, `issuance-5`, `document-1` (빈 DRAFT) | **완료** |

**생성 방법**

- `exportIssuanceFormTemplateSeeds()` (`export-writing-form-template-seeds.ts`) — 14종 전체

### 3.3 단위 테스트

| 대상 | 테스트 내용 |
|------|-------------|
| `certificate-form-settings.ts` | `parseCertificateFormSettings` / `buildCertificateFormSettings` round-trip |
| `resolveCertificateStringPreviewValues` | API 로드 후 `participantInfo`만 런타임 덮어쓰기 |
| `admin-form-templates-service` | `schemaJson: null` + `settingsJson` only → record 반환 |
| `a4-preview-template-options.ts` | 인증서 판별 **templateCode 우선** (`수료증 (API)` 이름에도 Payload D 모달) — **완료** (2026-07-13) |
| `form-template-seed-registry.ts` | 인증서 코드는 빈 paragraphs 시드 보정 제외 — **완료** (2026-07-13) |

### 3.3.1 FE 라우팅·빈 paragraphs 가드 (2026-07-13)

| 이슈 | 대응 |
|------|------|
| API `templateName`이 `수료증 (API)`처럼 catalog와 다르면 name exact match만으로는 인증서 모달이 안 열림 | `isCertificateIssuanceTemplate({ templateCode, templateName })` — **code 우선** |
| 인증서 `schemaJson` empty 시 다른 factory와 혼동 위험 | `EMPTY_PARAGRAPHS_ALLOWED`에 Payload D 5종 포함 |
| Payload A vs D 필드 소비 | A=`schemaJson`→`draft`, D=`settingsJson` only (변경 없음, catalog에 `CERTIFICATE_ISSUANCE_TEMPLATE_CODES` 명시) |

**BE 시드 확인 (여전히 필요):** Payload A는 `schemaJson.paragraphs` 비어 있으면 FE가 로컬 시드로 보정할 수 있음. 인증서는 `settingsJson`에 `titleName`/`bodyContent`가 있어야 UI가 response를 반영한다.

### 3.4 dead code·개발용 화면

| 항목 | 경로 | 권장 |
|------|------|------|
| mock 저장 API | `src/pages/templates/form-template-api.ts` | 삭제 또는 `persistWritingFormTemplateDraft` 위임 |
| 양식 테스트 탭 인증서 모달 | `src/pages/templates/form-tab.tsx` | `templateCode` 미전달 → 저장 시 무음 실패. `document-5` 등 고정 code 전달 또는 저장 버튼 숨김 |

### 3.5 `getIssuanceUserPreviewDraft` (Payload E 전용)

경로: `issuance-form-tab.tsx`

Payload A 6종은 각 에디터 `vm.handlePreview()`가 API 로드 draft를 사용.  
`getIssuanceUserPreviewDraft`는 **플레이스홀더·fallback** 전용으로 유지. Payload E에 API 연동 시 이 함수를 `loadWritingFormTemplateDraft` 기반으로 교체.

---

## 4. 부록 B 갱신안 (`form-template-json-contract.md`)

아래로 [부록 B](./form-template-json-contract.md) 교체 권장.

### 완료 (2026-07-09)

- [x] `extensionJson` / `settingsJson` 파싱·저장 (`admin-form-templates-service.ts`)
- [x] PUT body — `schemaJson` + 선택 `extensionJson` / `settingsJson`
- [x] 발급 양식 탭 API load/save 11종 (`issuance-form-tab.tsx` + 에디터 훅)
- [x] 인증서 `settingsJson` 저장 (`form-template-fullpage-modal.tsx`, `certificate-form-settings.ts`)
- [x] 발급 Payload A — API `paragraphs: []` 시드 보정 (`form-template-seed-registry.ts`)
- [x] 프로그램 실발급 PDF — 템플릿 `settingsJson` 로드 (`use-certificate-template-modal-state.ts`)

### 미완료

- [ ] POST `/draft` 전용 엔드포인트 (제안안 — 현행 PUT 사용)
- [ ] 발급 Payload E 3종 save/load
- [ ] BE 발급 시드 11종 JSON (P0 지급조서 2종 제외 — FE 시드 완료)
- [ ] `settingsJson` 이미지 BE 파일 스토리지
- [x] `exportIssuanceFormTemplateSeeds()` — 발급 14종 + [issuance-form-seeds-backend-handoff.md](./issuance-form-seeds-backend-handoff.md)

---

## 5. 수동 검증 체크리스트

### 양식 관리 (CMS)

- [ ] `VITE_REAL_API_MODULES`에 `formsSurveys` + 관리자 JWT
- [ ] 발급 탭 목록 GET 14행
- [ ] `document-payment-order-issue` 편집 → 저장 → 재진입 시 단락 유지
- [ ] `document-3` 인증서 — 타이틀·본문·이미지 저장 → 재진입 시 좌·우 패널 일치
- [ ] 플레이스홀더 3종 — 저장 버튼 없음, 기존과 동일

### 프로그램 실발급

- [ ] 양식 관리에서 수료증 배경/본문 수정 후 저장
- [ ] 일반 프로그램 > 학교 상세 > 학생 수료증 PDF — 저장된 템플릿 반영
- [ ] `participantInfo`는 학생별 데이터 유지 (템플릿 덮어쓰기 안 됨)
- [ ] 강사 활동 인증서 (`document-4`), 봉사 활동 인증서 (`document-5`) 동일

---

## 6. 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-07-10 | §3.2 P0 — 지급조서 2종 시드 JSON + `exportIssuanceFormTemplateSeeds()` |
| 2026-07-13 | §2.1·§3.2 — 발급 14종 시드 JSON + [issuance-form-seeds-backend-handoff.md](./issuance-form-seeds-backend-handoff.md) |
| 2026-07-09 | 초안 — 발급 API 1차 구현·동기화 완료 후 남은 FE/BE 항목 정리 |
