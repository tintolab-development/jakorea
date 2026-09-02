# 폼 양식 문서 다운로드 — Java BE 이전 핸드오프

> 작성: 2026-09-02  
> 범위: CMS `/templates/form-management` **문서 다운로드** (작성·발급 양식)  
> 목적: 현재 FE 생성 로직을 Java 백엔드로 옮길 때 필요한 **분기·입력·페이지 분할·PDF 파라미터** SSOT  
> **제품 제약 (고정):** 서버가 내려주는 파일은 **지금 CMS에서 「문서 다운로드」로 받는 결과와 동일**해야 한다. iText 등으로 레이아웃을 새로 그리는 경로는 이 제약을 만족하지 못한다.

**관련 문서**

- [form-template-json-contract.md](./form-template-json-contract.md) — `schemaJson` / `settingsJson` 계약
- [certificate-image-storage-handoff.md](./certificate-image-storage-handoff.md) — 인증서 이미지 URL
- [issuance-form-api-follow-up.md](./issuance-form-api-follow-up.md) — 발급 양식 Payload A/D
- [a4-paragraph-transform-rules.md](../../src/features/template/docs/a4-paragraph-transform-rules.md) — A4 `contentOnly` 단락 변환

---

## 0. 핵심 전제 (BE가 반드시 알아야 할 점)

### 0.1 「프론트 다운로드와 그대로」의 의미

수용 기준은 **지금 관리자가 CMS에서 받는 파일과 같은 문서**다.

| 맞출 것 | 세부 |
|---------|------|
| 페이지 나눔 | 같은 단락이 같은 페이지에 있어야 함 (`useA4ParagraphPages` 결과) |
| 레이아웃·타이포 | Pretendard, A4 크롬, 표, 서명, 인증서 절대좌표 |
| 캡처 방식 | 엔진 A: JPEG 0.92 + A4 **stretch-fill**. 엔진 B: PNG + A4 **contain 중앙**. 엔진 C: 원본 바이트 |
| 숨김/강제 나눔 | 타이틀 단락 hidden, 강의보고서 교육사진 강제 페이지 등 §3.3 |
| 입력 | 같은 `schemaJson` / `settingsJson` / 런타임 덮어쓰기 |

Java에서 schema만 읽고 iText·PDFBox·OpenHTMLToPDF로 **다시 그리면 이 기준을 통과할 수 없다.** 페이지 나눔이 DOM 높이에 묶여 있고, 본문 UI는 React+CSS다.

### 0.2 현재 구현

현재 CMS는 **서버 PDF API가 없다.** 브라우저가 React DOM을 그린 뒤 **html2canvas로 찍어** PDF/이미지를 만든다.

| 사실 | 「그대로」에 대한 함의 |
|------|------------------------|
| 생성기는 html2canvas + jsPDF (또는 `fetch` blob) | **그 함수와 그 DOM을 그대로 돌려야** 결과가 같다 |
| 페이지 나눔은 렌더된 단락 높이 | FE `useA4ParagraphPages`를 실행해야 한다. Java에서 높이를 추정하지 말 것 |
| A4 문서는 schema JSON → PDF가 아님 | 렌더는 기존 CMS 미리보기 컴포넌트가 SSOT |

이전 전략은 **§7**. 그리는 일은 브라우저(관리자 FE 또는 Headless)의 기존 생성기다. Java는 JSON만으로 레이아웃을 그리지 않는다.

---

## 1. 생성 엔진 3종

| ID | 엔진 | 산출물 | FE 함수 |
|----|------|--------|---------|
| **A** | A4 멀티페이지 DOM 캡처 | `application/pdf` | `generateFormDocumentPdfBlobFromPageElements` |
| **B** | 인증서 단일 캔버스 캡처 + A4 fit | `application/pdf` | `generatePdfBlobFromHtmlElement` |
| **C** | 원본 이미지 패스스루 | 원본 MIME (기본 PNG) | `fetch(url)` → `downloadBlob` |

레거시 `generateCertificatePdf`(배경 비트맵 + 텍스트 좌표 오버레이)는 **폼 양식 관리 다운로드에 사용하지 않는다.** (`features/certificate-template` 구 UI 전용)

### 1.1 엔진 A — A4 멀티페이지

**코드:** `apps/cms/src/features/template/lib/generate-form-document-pdf.ts`

```
입력: HTMLElement[]  (data-form-document-pdf-page 가 붙은 A4 페이지 루트, 위에서 아래 순)
처리:
  1. 빈 배열이면 실패 ("PDF로보낼 페이지가 없습니다")
  2. jsPDF: portrait, unit=mm, format=a4, compress=true
  3. 각 페이지:
       html2canvas(el, { scale: 2, useCORS: true, allowTaint: true,
                         backgroundColor: '#ffffff', logging: false })
       canvas → JPEG data URL quality 0.92
       pdf.addImage(JPEG, 0, 0, pageWidthMm, pageHeightMm, compression=FAST)
       ※ 이미지는 A4에 stretch-fill (비율 유지 없음)
  4. 2페이지부터 addPage()
출력: PDF Blob
```

A4 물리 크기: **210 × 297 mm**. 디자인 캔버스는 **1464 × 2072 CSS px** (`a4-document-page-layout.css`). html2canvas `scale: 2`이므로 캡처 해상도는 약 2928 × 4144 px → A4 mm에 늘려 붙인다.

### 1.2 엔진 B — 인증서 단일 페이지 fit

**코드:** `apps/cms/src/shared/utils/certificate-pdf-generator.ts` (`generatePdfBlobFromHtmlElement`)  
**래퍼:** `apps/cms/src/pages/templates/use-form-certificate-pdf-download.ts`

```
입력: 인증서 흰색 캔버스 HTMLElement (회색 바깥 래퍼 제외)
전처리: waitForCertificatePreviewCaptureReady
        — rAF 2회 + CSS --certificate-bg-url 이미지 + img 로드 대기 (error도 resolve)
처리:
  html2canvas(el, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff' })
  canvas → PNG quality 1.0
  jsPDF: portrait, unit=mm, format=a4  (compress 기본)
  이미지를 A4 안에 비율 유지로 맞춤 (letterbox):
    fit = min(pageW / imgWmm, pageH / imgHmm)
    중앙 배치
    px → mm: px * 25.4 / 96
  addImage(PNG, compression=SLOW)
출력: PDF Blob, 항상 1페이지
```

캡처 대상 캔버스: **1144 × 1618 CSS px** (`aspect-ratio: 1144 / 1618`). 회색 프레임 1208×1682는 PDF에 넣지 않는다.

인증서 파일명: `generateFilename(title, 'pdf')` → `{title}_{yyyyMMdd}.pdf` (ISO 날짜, 하이픈 제거).

### 1.3 엔진 C — 이미지 패스스루

**코드:** `crime-record-consent-document-fullpage-modal.tsx`

```
입력: displaySrc (settingsJson.documentImageUrl 또는 기본 에셋)
처리: HTTP GET → Blob 그대로 저장 (재인코딩·PDF 변환 없음)
파일명: settingsJson.replacementFileName 있으면 그 값,
        없으면 성범죄_경력조회_동의서.png
```

기본 에셋: `apps/cms/src/assets/images/template/성범좌 경력 조회.png`  
표시 크기: 1146 × 1618.

---

## 2. templateCode → 엔진 라우팅

### 2.1 작성 양식 (`formType=WRITING`)

| templateCode | 엔진 | 다운로드 UI | 입력 |
|--------------|------|-------------|------|
| `agreement-notice` | A | 미리보기 모달 「문서 다운로드」 | `schemaJson` draft |
| `agreement-expense` | A | 동일 | `schemaJson` draft |
| `agreement-portrait` | A | 동일 | `schemaJson` draft |
| `agreement-third-party` | A | 동일 | 지급조서 사전 동의 draft (`createPaymentStatementPreConsentDraft`) |
| `agreement-crime` | C | 전용 모달 「문서 다운로드」 | `settingsJson.documentImageUrl` |
| 그 외 등록·모집·신청·설문 | **없음** | 에디터/미리보기에 다운로드 버튼 없음 | — |

작성 에디터(`templateTabType=writing`)에는 다운로드가 없다. 동의 4종은 **미리보기**에서만 엔진 A를 탄다.

`agreement-third-party`와 발급 `document-payment-order-pre-consent`는 **같은 사전 동의 초안**을 쓴다. 탭만 다르다.

### 2.2 발급 양식 (`formType=ISSUANCE`) — 목록 노출 9종

| templateCode | 이름 | Payload | 엔진 |
|--------------|------|---------|------|
| `issuance-2` | UJAT 교육계획서 | A | A |
| `issuance-ujat-edu-journal` | UJAT 교육일지 | A | A |
| `issuance-3` | 강의보고서 | A | A |
| `issuance-4` | 정산 신청서 | A | A |
| `document-payment-order-issue` | 지급조서 (발급용) | A | A |
| `document-participation-certificate` | 참가인증서 | D | B |
| `document-3` | 수료증 | D | B |
| `document-4` | 강사 활동 인증서 | D | B |
| `document-5` | 봉사 활동 인증서 | D | B |

목록 비노출이지만 코드상 같은 엔진:

| templateCode | 엔진 | 비고 |
|--------------|------|------|
| `document-payment-order-pre-consent` | A | 발급 탭 핸들러 존재 |
| `document-2` | B | 휴가 인증서, Payload D, 목록 비노출 |
| `issuance-1`, `issuance-5`, `document-1` | **없음** | 편집기/다운로드 미구현 (Payload E) |

Payload A = `schemaJson` 단락 에디터. Payload D = `settingsJson` only (`schemaJson` 비어 있음).

---

## 3. 엔진 A 상세 — 페이지 레이아웃·분할

### 3.1 페이지 크롬

**코드:** `a4-document-page-layout.tsx` / `.css`

| 항목 | 값 |
|------|-----|
| 페이지 박스 | 1464 × 2072 px, padding 100, background `#fff`, gap 40 |
| 1페이지 헤더 | 제목(민트 `#296075`, Pretendard 40/700) + 브랜드 로고 SVG 154×48. **2페이지부터 헤더 없음** |
| 문서 제목 | `getA4DocumentTitle(draft, fallback)` — 첫 단락 `surveyTitle` 또는 `paragraphTitle` |
| PDF 캡처 마커 | `data-form-document-pdf-page` (`pdfCapture=true`) |

내부 본문 폭: `1464 - 200 = 1264 px`.

### 3.2 페이지 분할 알고리즘 (Java로 옮길 수 있는 부분)

**코드:** `use-a4-paragraph-pages.tsx`, `a4-document-pagination-constants.ts`

상수:

| 상수 | px | 의미 |
|------|-----|------|
| `A4_DOCUMENT_FIRST_PAGE_BODY_MAX_PX` | 1650 | 1페이지 본문 최대 높이 (헤더·gap 차감 보수값) |
| `A4_DOCUMENT_CONTINUATION_PAGE_BODY_MAX_PX` | 1872 | 2페이지 이후 (`2072 - 200`) |
| `A4_DOCUMENT_PARAGRAPH_GAP_PX` | 32 | 기본 단락 간격 |
| 측정 폭 | 1264 | 숨은 measure layer 폭 |

의사코드:

```
pages = []
page = []
used = 0
isFirstPage = true

maxH() = isFirstPage ? 1650 : 1872
flush():
  if page not empty:
    pages.append(page)
    page = []; used = 0; isFirstPage = false

for p in visibleParagraphs:          # hidden ids 제외 후 순서 유지
  h = measuredHeight(p)              # offsetHeight와 scrollHeight의 max
  if h > maxH(): mark overflow(p)    # 단락은 잘리지 않고 통째로 다음 페이지 (페이지를 넘으면 overflow 표시만)

  if p in pageBreakBeforeIds and page not empty:
    flush()

  gap = gapBefore(p, page)           # 페이지 첫 단락은 0
  if page not empty and used + gap + h > maxH():
    flush()
    gap = gapBefore(p, page)

  page.append(p)
  used += gap + h

flush()
```

**단락을 페이지 중간에서 자르지 않는다.** 한 단락이 maxH보다 크면 overflow로만 표시하고 그 페이지에 그대로 넣는다.

측정은 **미리보기와 동일한 `contentOnly` 마크업**을 폭 1264px 숨은 레이어에 그린 뒤 DOM 높이로 한다. 폰트 로드(`document.fonts.ready`) 후 rAF 2회 뒤에 잰다.

### 3.3 숨김 단락·강제 페이지 나눔·gap

공통: A4에서는 **타이틀 단락 id를 hidden** 해서 페이지 헤더와 중복되지 않게 한다.

| templateCode | hidden | pageBreakBefore | gap |
|--------------|--------|-----------------|-----|
| `agreement-notice` | title | — | 시드 32 / 그 외 16 + closing 스택 0 |
| `agreement-expense` | title | — | 동일 |
| `agreement-portrait` | title | — | 동일 |
| `agreement-third-party` / `document-payment-order-pre-consent` | title | — | 시드 32/16 + closing 스택 0 |
| `document-payment-order-issue` | title | — | 시드 32 / 그 외 16 |
| `issuance-4` | title | — | 시드 32 / 그 외 16 |
| `issuance-2` / `issuance-ujat-edu-journal` | title | — | 시드 32 / 그 외 16 |
| `issuance-3` | title | **교육 사진 단락 직전 강제 새 페이지** | 시드 32 / 그 외 16 |

closing 스택 gap 0 (`getAgreementClosingStackGapBefore`):

- 확인 문구 → 날짜 (`systemPreset=agreement_date`)
- 날짜 → 서명 (`systemPreset=agreement_signature`)
- 확인 문구 구분선 단락 직전

### 3.4 A4 본문 렌더 (`contentOnly`)

단락 variant → UI 매핑은 [a4-paragraph-transform-rules.md](../../src/features/template/docs/a4-paragraph-transform-rules.md)가 SSOT.

BE가 Headless로 FE 미리보기를 캡처하면 이 변환을 다시 구현하지 않아도 된다. iText 네이티브 PDF면 이 표를 **전부** 포팅해야 한다.

엔진 A 파일명 (`safePdfFileName`):

```
base = title.trim()
       .replace(/[^\w가-힣-]+/gu, '_')
       .replace(/_+/g, '_')
       .slice(0, 80) || 'form'
return `${base}.pdf`
```

(인증서 `generateFilename`과 달리 **날짜 접미사가 없다.**)

---

## 4. 엔진 B 상세 — 인증서 입력

Payload D. `schemaJson`은 비어 있고 `settingsJson`만 쓴다.

### 4.1 settingsJson 필드

문자열:

| key | 용도 |
|-----|------|
| `titleName` | 큰 제목 |
| `bodyContent` | 확인 문구 (`\n` 줄바꿈) |
| `chairmanName` | 「회장」 고정 라벨 + 이 이름 |
| `participantInfo` | 줄바꿈으로 최대 6행 |
| `orgAddress`, `orgPhone`, `orgFax`, `orgWebsite` | 푸터 |
| `participantRowVisibility` | `boolean[]` 행 표시 |

이미지 (객체 또는 `null`). `url` 없으면 FE 기본 에셋:

| key | 슬롯 | 기본 에셋 |
|-----|------|-----------|
| `orgLogo` | JA 로고 | `template-logo.png` |
| `orgLogo02` | 교육기부 로고 | `template-education.png` |
| `certificateBackground` | 캔버스 배경 (`background-size: 100% 100%`) | `templatge-background.png` |
| `chairmanSeal` | 직인 | `template-stamp.png` |

이미지 객체 계약은 [certificate-image-storage-handoff.md](./certificate-image-storage-handoff.md). 최소 `url` 필수.

### 4.2 레이아웃

절대 좌표 CSS (`form-certificate-preview.css`). 캔버스 1144×1618 기준 예:

- 태그: top 142 / left 34
- 로고: top 208 / left 76
- 교육기부: top 193, 150×130
- 제목: top 301, height 150, letter-spacing 16px
- 본문 프레임: top 507 / left 170 / width 618
- 발급일: `yyyy년 M월 d일` (로컬 타임존, 제로패딩 없음)

PDF 캡처 시 편집용 닷·점선 프레임은 `--pdf-export` 클래스로 숨긴다.

프로그램 실발급은 **같은 엔진 B**에 `participantInfo` 등 런타임 값만 덮어쓴다.

---

## 5. 엔진 C 상세 — 성범죄 동의

`settingsJson`:

```json
{
  "documentImageUrl": "https://…/crime-consent.png",
  "replacementFileName": "성범죄_경력조회_동의서.png"
}
```

- `documentImageUrl` 없음 → 기본 PNG 에셋
- BE는 저장된 파일을 **재생성하지 않고** Content-Disposition으로 내려주면 현행과 동일
- 이미지가 바뀌면 `settingsJson`만 갱신 (문서 변경 UI)

---

## 6. 현행 호출 흐름 (참고)

```mermaid
flowchart TD
  click[문서 다운로드 클릭]
  click --> route{templateCode}

  route -->|agreement-crime| C[엔진 C fetch blob]
  route -->|certificate Payload D| B[엔진 B html2canvas 1장 + A4 fit]
  route -->|A4 동의·발급 Payload A| paginate[useA4ParagraphPages]
  paginate --> pages[페이지별 A4DocumentPageLayout]
  pages --> A[엔진 A html2canvas N장 stretch A4]

  C --> file[브라우저 저장]
  B --> file
  A --> file
```

FE 진입점:

| 화면 | 파일 |
|------|------|
| 동의 미리보기 | `agreement-template-preview-modal.tsx` |
| 성범죄 전용 | `crime-record-consent-document-fullpage-modal.tsx` |
| 발급 A4 5+1종 | `issuance-form-tab.tsx` `handleDownload*` |
| 인증서 | `form-template-fullpage-modal.tsx` → `useFormCertificatePdfDownload` |

---

## 7. Java 이전 — 「프론트 다운로드와 동일」을 지키는 방법

레이아웃을 Java에서 다시 그리면 안 된다. 그리는 일은 **브라우저의 기존 CMS 미리보기 + html2canvas**가 한다.

서버가 파일을 다루는 경로는 두 가지다. 둘 다 내용은 FE 캡처다.

| 경로 | 누가 그리나 | Java가 하는 일 | 브라우저 없는 재생성 |
|------|-------------|----------------|----------------------|
| **F. FE 캡처 업로드** | 관리자 브라우저 (지금과 동일) | 받은 페이지 이미지로 PDF 조립, 또는 완성 PDF 저장 | **불가** (그때 찍은 캡처/파일이 있어야 함) |
| **H. Headless** | 서버 Chromium이 같은 FE 라우트 | API 후 렌더러 호출·스트리밍 | 가능 |

**금지:** iText / PDFBox / OpenHTMLToPDF로 schema·HTML을 다시 그리는 것. Playwright `page.pdf()`만 쓰고 html2canvas/jsPDF를 건너뛰는 것.

### 7.0 경로 F — 프론트가 백엔드로 넘겨서 생성

**가능.** 넘기는 것은 `schemaJson`이 아니라 **이미 찍힌 페이지 그림(또는 완성 PDF)** 이어야 한다.

```
관리자 브라우저
  1. 지금과 동일: 미리보기 DOM + useA4ParagraphPages / 인증서 캔버스
  2. 지금과 동일: html2canvas (scale 2, …)
  3. POST 페이지 이미지[] 또는 PDF Blob → Java
Java
  엔진 A: 각 JPEG를 A4 stretch-fill로 PDF에 붙임 (jsPDF addImage와 동일 규칙)
  엔진 B: PNG 1장을 A4 contain 중앙 (generatePdfBlobFromHtmlElement와 동일 수식)
  엔진 C: 이미지 파일 그대로 저장
```

| FE가 보내는 것 | BE 생성 | 「그대로」 |
|----------------|---------|------------|
| html2canvas JPEG/PNG 페이지 배열 + 엔진 A/B | 가능. BE는 래스터를 PDF에 붙이기만 함 | **내용 동일.** PDF 메타/압축기는 jsPDF와 바이트가 다를 수 있음 |
| FE가 만든 **완성 PDF Blob** | 가능. BE는 저장·재다운로드 | **파일 동일** (생성은 여전히 FE) |
| `schemaJson` / `settingsJson`만 | 레이아웃 재구현 | **불가** |
| 미리보기 HTML 문자열 | Java HTML→PDF ≠ html2canvas | **불가** |

권장 페이로드 (엔진 A):

```
POST multipart/form-data 또는 JSON
  engine: "A"
  mime: "image/jpeg"
  pages: [ { index: 0, imageBase64 }, … ]   // html2canvas JPEG quality 0.92
  fileName: "행정정보_공동이용_사전동의서.pdf"
```

엔진 B: `engine: "B"`, `mime: "image/png"`, 페이지 1장 (회색 프레임 제외).

BE 조립 규칙:

- A: A4 portrait 210×297mm, 이미지 (0,0)에서 페이지 전체 stretch, JPEG
- B: A4, `fit = min(pageW/imgWmm, pageH/imgHmm)`, 중앙, PNG, px→mm = px × 25.4 / 96

한계:

- 클릭 시점에 **브라우저가 문서를 그려야** 한다. 배치·만료 후 서버만 재발급하려면 경로 H이거나, 올려 둔 PDF를 재사용.
- scale 2 JPEG라 요청이 수~수십 MB. 타임아웃·업로드 한도 합의 필요.
- 완성 PDF 업로드가 시각 동등성은 가장 확실하다. 그때 Java 「생성」은 스토리지에 가깝다.

### 7.1 경로 H — Headless 목표 아키텍처

```
관리자 다운로드
    → Java API (auth, templateCode, version, filled JSON)
        → (엔진 C) 스토리지 원본 스트림 후 종료
        → (엔진 A/B) Headless Chrome
              → CMS 전용 export 라우트 (아래 컴포넌트 SSOT)
              → pagesReady / 이미지 로드 대기
              → window.__exportFormDocument()
                    엔진 A: generateFormDocumentPdfBlobFromPageElements
                    엔진 B: generatePdfBlobFromHtmlElement
              → PDF bytes
        → Content-Disposition 응답
```

캡처 DOM SSOT (새로 그리지 말 것):

| 엔진 | 재사용할 FE |
|------|-------------|
| A | `A4DocumentPageLayout` + `FormDocumentPreviewBody` + `useA4ParagraphPages` |
| B | `FormCertificatePreview` (`canvasRef` / `--pdf-export`, 회색 `__bg` 제외) |
| C | 생성 없음. `settingsJson.documentImageUrl` 파일 그대로 |

생성 함수 SSOT (재구현 금지):

- `apps/cms/src/features/template/lib/generate-form-document-pdf.ts`
- `apps/cms/src/shared/utils/certificate-pdf-generator.ts` 의 `generatePdfBlobFromHtmlElement`
- 인증서 대기는 `waitForCertificatePreviewCaptureReady`

html2canvas는 브라우저 Canvas API에 의존하므로 **Java 포팅이 아니라 Chromium 안에서 기존 JS를 호출**해야 결과가 같다.

### 7.2 CMS export 라우트 (FE 작업)

내부 전용 페이지 예: `/internal/form-document-export`

요구:

1. 에디터 크롬(닫기·미리보기·저장) 없이 **캡처 대상 DOM만** 마운트
2. 엔진 A: measure layer 포함, `pagesReady === true` 후에만 export
3. 엔진 B: `--pdf-export`로 닷/프레임 숨김, 배경·img 로드 후 export
4. `window.__exportFormDocument()`가 Blob을 만들고 `URL.createObjectURL` 또는 CDP로 bytes 반환
5. 뷰포트는 디자인 폭을 자르지 않을 것 (A4 1464px / 인증서 캔버스 1144px)
6. Pretendard·서명 폰트는 CMS와 동일 파일

Java(또는 Playwright Java)는 이 URL을 열고 ready를 기다린 뒤 위 함수만 호출한다.

### 7.3 하면 안 되는 것

| 방식 | 이유 |
|------|------|
| schema → iText 테이블 | 단락 variant 변환·간격·서명 폰트가 어긋남 |
| OpenHTMLToPDF에 React HTML dump | html2canvas와 줄바꿈·표 높이가 다름 |
| `page.pdf({ preferCSSPageSize })` | 엔진 A의 JPEG stretch-fill / 엔진 B contain과 불일치 |
| Java에서 단락 높이 추정 후 나눔 | `offsetHeight`/`scrollHeight`와 불일치 |
| 인증서를 배경 PNG + 텍스트 drawImage로 재구성 | 구 `generateCertificatePdf` 경로. 현행 다운로드가 아님 |

### 7.4 검증 (그대로인지 확인)

골든 파일은 **현재 CMS UI에서 받은 다운로드**로 만든다. 서버 결과와 비교:

1. 페이지 수
2. 각 페이지 래스터 diff (허용 오차 소량 — jpeg 압축 노이즈)
3. 엔진 C는 바이트 동일(또는 동일 파일 해시)

대표 회귀 templateCode: `agreement-notice`, `issuance-3`(교육사진 페이지 나눔), `document-payment-order-issue`, `document-3`, `agreement-crime`.

### 7.5 API 스케치

경로 F (FE 캡처 업로드):

```
POST /api/admin/form-templates/{templateCode}/document-from-capture
  body: { engine: "A"|"B", mime, pages: [{ index, imageBase64 }], fileName }
  또는 multipart: 완성 PDF / 원본 이미지 (엔진 C)
  response: 저장된 fileId + 재다운로드 URL
```

경로 H (서버가 JSON만 받고 Headless 생성):

```
POST /api/admin/form-templates/{templateCode}/document
  body: { versionId?, filledSchemaJson?, runtimeOverrides? }
  response: application/pdf | image/*  (Content-Disposition: attachment)
```

| 쿼리/필드 | 경로 | 설명 |
|-----------|------|------|
| `templateCode` | F, H | §2 라우팅 |
| `engine` / `pages` | F | html2canvas 산출물. schema 없음 |
| `versionId` | H | 저장된 템플릿 버전. 없으면 latest |
| `filledSchemaJson` | H | 작성 완료 draft. 없으면 시드/미리보기 |
| `runtimeOverrides` | H | 인증서 `participantInfo`, 발급일 등 |

응답 MIME:

- 엔진 A/B → `application/pdf`
- 엔진 C → 원본 `image/png` (또는 업로드 MIME). 재인코딩 금지

---

## 8. 프로그램 실발급과의 관계

폼 양식 관리 다운로드와 **같은 엔진**을 프로그램 상세에서도 재사용한다.

| 실발급 | 엔진 |
|--------|------|
| 참가/수료/강사/봉사 인증서 | B (`useFormCertificatePdfDownload`) |
| 지급조서·강의보고서 미리보기/일괄 | A |
| 초상권 동의 일괄 PDF | A |

BE PDF 서비스 1개로 양식 관리 + 실발급을 같이 받는 편이 맞다. 차이는 입력(빈 템플릿 vs 작성 완료 JSON + 런타임 덮어쓰기)뿐이다.

---

## 9. 이전 시 체크리스트

- [ ] **그리는 일은 기존 FE DOM + html2canvas.** Java/iText로 페이지를 다시 그리지 않음
- [ ] 경로 F면 BE는 캡처 이미지만 PDF에 붙이거나 완성 PDF를 저장 (`schemaJson`만 받아 생성 금지)
- [ ] 경로 H면 Headless가 `generateFormDocumentPdfBlobFromPageElements` / `generatePdfBlobFromHtmlElement`를 호출 (`page.pdf()` 대체 금지)
- [ ] templateCode → 엔진 A/B/C 매핑을 BE enum으로 고정 (`CERTIFICATE_ISSUANCE_TEMPLATE_CODES` 포함 `document-2`)
- [ ] 엔진 A: `pagesReady` 후 캡처. 1페이지 헤더 / 2페이지+ 헤더 없음, 단락 미절단, 강의보고서 교육사진 강제 페이지
- [ ] 엔진 A vs B: stretch-fill JPEG vs contain PNG — 섞지 말 것
- [ ] 엔진 B: 회색 프레임 제외, `waitForCertificatePreviewCaptureReady` 후 캡처
- [ ] 엔진 C: PDF 재생성·리사이즈 금지, `replacementFileName` 유지
- [ ] 인증서 이미지 `settingsJson.url`이 실제 스토리지 URL인지 ([certificate-image-storage-handoff](./certificate-image-storage-handoff.md))
- [ ] Headless에 Pretendard·서명 폰트가 CMS와 동일하게 로드되는지
- [ ] 작성 양식 중 동의 외 종은 다운로드 없음 — API 404/미지원으로 맞출지 제품 확인
- [ ] 파일명: A는 제목 sanitizing, B는 `{title}_{yyyyMMdd}.pdf`
- [ ] §7.4 골든 파일 회귀 (현재 CMS 다운로드 vs 서버 응답)

---

## 10. FE 코드 인덱스

| 역할 | 경로 |
|------|------|
| 엔진 A | `apps/cms/src/features/template/lib/generate-form-document-pdf.ts` |
| 엔진 B | `apps/cms/src/shared/utils/certificate-pdf-generator.ts` |
| 엔진 B 훅 | `apps/cms/src/pages/templates/use-form-certificate-pdf-download.ts` |
| 페이지 분할 | `apps/cms/src/features/template/hooks/use-a4-paragraph-pages.tsx` |
| A4 상수 | `apps/cms/src/features/template/lib/a4-document-pagination-constants.ts` |
| A4 크롬 | `apps/cms/src/features/template/ui/layout/a4-document-page-layout.tsx` |
| 인증서 판별 | `packages/form-schema/src/catalog/form-template-catalog.ts` `CERTIFICATE_ISSUANCE_TEMPLATE_CODES` |
| 인증서 settings | `apps/cms/src/features/template/lib/certificate-form-settings.ts` |
| 성범죄 settings | `apps/cms/src/features/template/lib/agreement-crime-consent-settings.ts` |
| 발급 다운로드 분기 | `apps/cms/src/pages/templates/issuance-form-tab.tsx` |
| 인증서 고유번호 | `apps/cms/src/features/program/shared/api/certificate-serial-api.ts` |

---

## 11. 인증서 고유번호 (`YY-JA-NNNNN`)

PDF는 프론트가 그려도 **번호 장부는 백엔드**다. 프론트는 이전에 발급된 번호를 전부 갖고 있지 않으므로 **겹침 검증은 DB에서만** 한다.

형식: `{연도 뒤 2자리}-JA-{5자리}` 예 `26-JA-00017`. **화면 미리보기는 `26-JA-00000` 플레이스홀더.** 실제 번호는 **파일 다운로드 클릭 시점**에만 발급한다.

### 다운로드 시 흐름 (실발급)

```
미리보기 오픈 → 태그는 26-JA-00000 (장부에 INSERT 하지 않음)
파일 다운로드 클릭
  → POST /api/admin/certificates/issues/serial
       { programId, participantId, certificateType }
  → 이미 있으면 그 번호(reused: true), 없으면 시퀀스 +1 후 UNIQUE 저장
  → 숨은 PDF 캡처 DOM에만 번호 반영 후 html2canvas
  → POST /api/admin/certificates/issues/{issueId}/download-logs  (fileName)
  → 서버가 GET /api/admin/logs/file-access 행을 남김
```

양식 관리 「문서 다운로드」도 같은 serial API를 친다. 대상 사람이 없으면 `{ certificateType, issuanceSource: "FORM_TEMPLATE" }` 만 보낸다. `00000` PDF로 폴백하지 않는다.

같은 (프로그램, 대상, 유형)으로 다시 다운로드하면 **새 번호를 뽑지 않는다.**

### 겹침 vs 재사용 (검증을 둘로 나눈다)

| 구분 | 의미 | DB 제약 | 기대 |
|------|------|---------|------|
| **전역 고유** | 새 일련번호가 **과거에 발급된 어떤 행과도** 문자열이 같으면 안 됨 | `UNIQUE (serial_number)` | 충돌 시 nextval 재시도 후 커밋. `26-JA-00000`은 INSERT 금지 |
| **대상 멱등** | 같은 사람·프로그램·유형은 **같은 번호** | `UNIQUE (program_id, participant_id, certificate_type)` | 있으면 그 `serial_number` 반환 (`reused: true`). 이건 겹침이 아니라 정상 |

연도가 문자열에 포함되므로 `26-JA-00001`과 `27-JA-00001`은 다른 값이다. 시퀀스는 연도별 리셋을 권장하되, **UNIQUE는 전체 문자열**이면 된다.

### 이전에 이미 나간 번호

장부가 비어 있는 상태에서 시퀀스만 1부터 올리면, **예전에 인쇄·다운로드된 번호와 충돌**할 수 있다.

1. 기존 발급분(엑셀·과거 PDF·타 시스템)을 같은 `serial_number` UNIQUE 테이블에 **적재**한다.
2. 해당 연도 시퀀스 시작값은 `MAX(해당 연도 NNNNN) + 1`.
3. 적재 전 중복이 있으면 UNIQUE 생성이 실패하므로, 먼저 `GROUP BY serial_number HAVING COUNT(*) > 1`로 정리한다.

런타임 검증은 애플리케이션 if가 아니라 **제약 위반 → 다음 번호 재시도**다. 동시 다운로드는 `SELECT … FOR UPDATE` 또는 sequence + UNIQUE로 직렬화한다.

### QA

- 동일인 2회 다운로드 → 번호 동일, 두 번째 `reused: true`
- 다른 사람 → 다른 번호
- 동시 다른 사람 → 두 번호 모두 UNIQUE, 둘 다 장부에 1행
- 동시 같은 사람 → 번호 하나, 장부 1행
- `SELECT serial_number FROM … GROUP BY 1 HAVING COUNT(*) > 1` → 0건
- 미리보기만 열고 닫기 → 장부 INSERT 0건 (`00000` 행 없음)

### BE 필수

| 항목 | 내용 |
|------|------|
| 원자성 | DB sequence / `SELECT … FOR UPDATE` 카운터. 프론트 증가 금지 |
| UNIQUE | `serial_number` 전체 문자열 (과거 적재분 포함) |
| 멱등 | unique `(program_id, participant_id, certificate_type)` |
| 연도 | 발급 확정 시각의 연도 2자리. 해가 바뀌면 시퀀스는 연도별 리셋 권장 |
| 플레이스홀더 | `26-JA-00000` INSERT 금지. API도 이 값을 발급 번호로 주지 않음 |

`certificateType` FE 값: `document-3`, `document-participation-certificate`, `document-4`, `document-5`.

응답 예: `{ "serialNumber": "26-JA-00017", "issueId": 12, "reused": false }`

FE(`allocateCertificateSerial`, generated OpenAPI 클라이언트)는 mock / 404·501 폴백 없이 이 API를 실호출한다. 실패하면 PDF를 만들지 않는다.
