# CMS 파일 업로드 안내 문구 — 브라우저 경로 기준

로컬 기준: `http://localhost:3000{경로}`  
공통: 다중 업로드 기본 ON · **첨부 합계 총 최대 15MB** (`file-select-field-limits.ts`)

**Last updated:** 2026-07-30

---

## 경로별 안내 문구

### `/design-system`

| UI | 안내 문구 |
|----|-----------|
| FileSelectField (Forms) | `파일은 총 최대 15MB까지 업로드 가능합니다. (PDF, PNG, JPG)` |
| FileSelectField (Posts) | `- 파일은 총 최대 15MB까지 JPG, PNG 형식만 등록 가능합니다.` / `- 첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.` |

---

### `/programs/general`

목록에서 프로그램 행 클릭 → **상세 모달/풀페이지** 안.

| UI | accept | 안내 문구 |
|----|--------|-----------|
| 상세정보 · 썸네일 | JPG/PNG | `- 파일은 최대 15M까지 JPG, PNG 형식만 등록 가능합니다. / 가로 사이즈 500px 권장, 세로 사이즈 무관` |
| 상세정보 · 첨부 | JPG/PNG/PDF | `- 파일은 최대 15M까지 JPG, PNG 형식만 등록 가능합니다.` (+ 특수문자 줄) ※ PDF accept인데 문구는 JPG/PNG만 |
| 출결 정정 · 증빙 | JPG/PNG/PDF | **문구 없음** |
| 게시글 등록 · 첨부 | JPG/PNG | `- 파일은 총 최대 15MB까지 JPG, PNG 형식만 등록 가능합니다.` (+ 특수문자) |
| 참여 봉사자 추가 · 수료증 | JPG/PNG/PDF | `- 파일은 최대 15M까지 JPG, PNG, PDF 형식만 등록 가능합니다.` (+ 특수문자) |
| 신규 등록 플로우(모집 상세) | JPG/PNG | 가이드 미전달 → **기본**: 총 15MB + JPG/PNG + 특수문자 |

---

### `/programs/company-school`

상세·출결·게시글·등록 플로우는 `/programs/general`과 **동일 공유 컴포넌트·문구**.

---

### `/programs/ujat`

| UI | 안내 문구 |
|----|-----------|
| 상세 출결 정정 · 증빙 | **문구 없음** (JPG/PNG/PDF) |
| 게시글 등록 · 첨부 | 총 15MB · JPG/PNG (+ 특수문자) |
| 신청/모집 양식 첨부 | 양식 단락별 (아래 템플릿과 동일 패턴) |

---

### `/programs/ujat/regions`

목록만. 업로드 UI 없음. (업로드는 UJAT 프로그램 상세 `/programs/ujat` 쪽)

---

### `/programs/gemini/visiting-training`

| UI | accept | 안내 문구 |
|----|--------|-----------|
| 모집 · 썸네일 | JPG/PNG | 기본/단건 (`multiple=false`) |
| 모집 · 첨부 | JPG/PNG/PDF/HWP | `- 파일은 최대 15M까지 JPG, PNG, PDF, HWP 형식만 등록 가능합니다.` (+ 특수문자) |

---

### `/programs/gemini/performance`

| UI | accept | 안내 문구 |
|----|--------|-----------|
| 실적 엑셀 import | `.xlsx,.xls` | **문구 없음** (hidden file input) |

---

### `/programs/trained-teachers`

상세에 공유 상세정보 탭이 있으면 `/programs/general` 상세정보와 **동일 문구** (썸네일 15M JPG/PNG · 첨부).

---

### `/programs/new` · `/programs/:id/edit`

프로그램 등록/수정 폼. Ant Upload 등 — **공통 FileSelectField 가이드와 별도**(필드별 help).

---

### `/programs/:id/apply`

| UI | accept | 안내 문구 |
|----|--------|-----------|
| 학생 명단 (학교) | `.xlsx,.xls` | `엑셀 파일(.xlsx, .xls)을 업로드해주세요. (최대 5MB)` |
| 이력서 (강사) | `.pdf,.doc,.docx,.hwp` | `PDF, DOC, DOCX, HWP 파일을 업로드해주세요. (최대 10MB)` |
| 성범죄 동의 (강사) | 동일 | 동일 (최대 10MB) |

---

### `/templates/form-management`

양식 편집·미리보기 풀페이지/모달.

| UI | accept | 안내 문구 |
|----|--------|-----------|
| 모집 상세 · 썸네일/첨부 | JPG/PNG | **기본** 총 15MB + JPG/PNG (+ 특수문자) |
| 봉사자 · 이전 JA 증빙 | JPG/PNG/PDF | `- 파일은 최대 15M까지 JPG, PNG, PDF 형식만 등록 가능합니다.` (+ 특수문자) |
| UJAT · 수료증 | JPG/PNG/PDF | 동일 |
| 강사 · 성범죄 파일 | `.pdf` | **문구 없음** (`guideLines={[]}`) |
| 파일첨부 단락 / 세로표 파일 | JPG/PNG | **기본** 총 15MB + JPG/PNG |
| 정산신청 · 교통비 증빙 | JPG/PNG | `- 파일은 총 최대 15MB까지 JPG, PNG 형식만 등록 가능합니다.` (+ 특수문자) |
| 정산신청 · 숙박비 영수증 | JPG/PNG | 동일 |
| 발급 양식 · 로고 이미지 | JPG/PNG | `-  파일은 최대 15M까지 JPG, PNG 형식만 등록 가능합니다.` |
| 성범죄동의 문서 모달 | `image/*` | 별도 모달 UI |

---

### `/users/list`  
예: `/users/list?kind=all` · `?kind=instructors`

| UI | 안내 문구 |
|----|-----------|
| 회원/강사 등록 · 성범죄 동의 이미지 | 모달 내 (accept `image/*`) |
| 수강 프로그램 상세 → 게시글 등록 | `- 파일은 총 최대 15MB까지 JPG, PNG 형식만 등록 가능합니다.` (+ 특수문자) |

---

### `/admin/posts/notices` · `/admin/posts/notices/:id`

| UI | 안내 문구 |
|----|-----------|
| 공지 등록/수정 · 첨부 | `파일은 최대 20MB까지 업로드 가능하며,` / `PDF, 이미지, 문서 파일 형식만 지원됩니다.` ※ **20MB · 공통 15MB와 불일치** |

---

### `/settlements/my`

| UI | 안내 문구 |
|----|-----------|
| 정산 제출 모달 · 증빙 | `정산에 필요한 증빙 파일을 업로드해주세요.` (형식·용량 문구 없음) |

---

### `/settlements/my/submit`

| UI | 안내 문구 |
|----|-----------|
| 증빙 파일 | `교통비, 숙박비 등 증빙이 필요한 항목의 증빙 파일을 업로드하세요.` |

---

### `/instructor/documents`

| UI | accept | 안내 문구 |
|----|--------|-----------|
| 이력서 / 성범죄조회동의서 | `.pdf,.doc,.docx,.hwp` | **문구 없음** (버튼 라벨만) |

---

### 리치텍스트 (경로 공용)

공지·모집「추가 내용」등 WYSIWYG가 있는 화면:

- Alert: `JPG, PNG, GIF, WebP 이미지만 삽입할 수 있습니다.`

예: `/admin/posts/notices`, `/programs/*/상세 모집`, `/templates/form-management`

---

## 공통 기본 문구 (가이드 미지정 시)

`ParagraphFileUpload` 기본:

```
- 파일은 총 최대 15MB까지 업로드 가능합니다.
- JPG, PNG 형식만 등록 가능합니다.
- 첨부파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.
```

초과 Alert: `파일은 총 최대 15MB까지 업로드 가능합니다.`

---

## 용량 정책이 다른 URL

| 브라우저 경로 | 용량 |
|---------------|------|
| 대부분 FileSelect / Paragraph | **총 15MB** |
| `/admin/posts/notices` | 문구상 **20MB** |
| `/programs/:id/apply` (학생명단) | **5MB**/파일 |
| `/programs/:id/apply` (강사 서류) | **10MB**/파일 |
| `/settlements/my*` | 문구에 용량 없음 |
