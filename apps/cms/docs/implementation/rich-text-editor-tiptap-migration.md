# Rich Text 에디터·뷰어 마이그레이션 (Toast UI → Tiptap)

**작성일**: 2026-06-02  
**상태**: **마이그레이션 완료** (단계 2~6) + **기본 툴바** (`RichTextToolbar`). fixture·화면별 QA는 후속.  
**범위**: `apps/cms` only (`@toast-ui/editor` ^3.2.2 + `@tiptap/*` ^3.24.0)  
**목적**: Toast UI Editor/Viewer를 Tiptap 기반 공통 모듈로 교체하고, 화면별 중복·CSS·포커스 이슈를 줄인다.

---

## 목차

1. [배경 및 목표](#1-배경-및-목표)
2. [현재 구조](#2-현재-구조)
3. [영향 화면·라우트](#3-영향-화면라우트)
4. [저장 포맷 계약](#4-저장-포맷-계약)
5. [목표 아키텍처](#5-목표-아키텍처)
6. [마이그레이션 단계](#6-마이그레이션-단계)
7. [Tiptap 스택 권장안](#7-tiptap-스택-권장안)
8. [CSS·스타일 이전](#8-css스타일-이전)
9. [콘텐츠 호환·검증](#9-콘텐츠-호환검증)
10. [PR 분할·체크리스트](#10-pr-분할체크리스트)
11. [하지 말 것](#11-하지-말-것)
12. [부록: 파일 인벤토리](#12-부록-파일-인벤토리)

---

## 1. 배경 및 목표

### 배경

- CMS는 `@toast-ui/editor`를 **imperative API**(`new Editor({ el })`, `new Viewer({ el })`)로 마운트한다.
- 에디터 훅이 2종(`use-notice-wysiwyg-editor`, `use-template-editor`)이고, 뷰어는 별도 컴포넌트(`ToastUiMarkdownViewer`)다.
- 프로그램 상세 「추가 내용」은 `use-template-editor`에 **포커스·스크롤 방지** 로직이 ~180줄 수준으로 쌓여 있다.
- 읽기 모드는 Markdown(뷰어) vs HTML(`dangerouslySetInnerHTML` + `.toastui-editor-contents`)로 **렌더 경로가 분리**되어 있다.

### 목표

| 항목 | 내용 |
|------|------|
| 라이브러리 | Toast UI 제거 → Tiptap (`@tiptap/react` 등) |
| 구조 | `shared/rich-text` 단일 모듈, Strangler(어댑터) 교체 |
| API | 기존 훅 시그니처는 1차 PR에서 유지 가능 (`editorHostRef` → 점진적 컴포넌트 API) |
| 포맷 | **경계별 Markdown/HTML 유지**(백엔드 계약 변경 없음) |
| 스타일 | `.toastui-editor-contents` → `.rich-text-content` 등 단일 prose 클래스 |
| 범위 외 | `apps/lms`, `packages/*` (Toast UI 미사용) |

### 비목표 (이번 마이그레이션에서 하지 않음)

- DB/API 필드명 일괄 변경 (`content` → `contentHtml` 등)
- 전사 Markdown/HTML 단일 포맷 통일(별 프로젝트로 분리)
- 이미지 업로드·파일 정책 전면 재설계(기존 동작 유지 전제)

---

## 2. 현재 구조

### 2.1 레이어 요약

```
┌─────────────────────────────────────────────────────────────┐
│ 화면 (pages / features)                                      │
│  notice-form-modal, admin-*-detail, program-detail, template │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
 use-notice-wysiwyg    use-template-editor   ToastUiMarkdownViewer
        │                   │                   │
        └─────────┬─────────┘                   │
                  ▼                             ▼
           @toast-ui/editor (Editor)    @toast-ui/editor (Viewer)
```

### 2.2 에디터 훅 A — `use-notice-wysiwyg-editor.ts`

| 항목 | 내용 |
|------|------|
| 경로 | `src/features/posts/hooks/use-notice-wysiwyg-editor.ts` |
| API | `editorHostRef`, `getMarkdown()`, `getHTML()` |
| 라이프사이클 | `open === false` 시 `destroy()`; `resetKey`·`initialMarkdown` 변경 시 재마운트 |
| 마운트 | `useLayoutEffect` + rAF/timeout 재시도(모달 DOM 타이밍) |
| 툴바 | heading, bold, italic, strike, hr, quote, ul, ol, table, link, image, code, codeblock |
| 저장 | 호출부가 **`getMarkdown()`** 사용 |

### 2.3 에디터 훅 B — `use-template-editor.ts`

| 항목 | 내용 |
|------|------|
| 경로 | `src/features/template/hooks/use-template-editor.ts` |
| API | `editorHostRef`, `getMarkdown()`, `getHTML()`, `setMarkdown`, `insertVariable` |
| 초기값 | `initialHtml` → `setHTML` (프로그램 `additionalContentHtml`) |
| 특이사항 | autofocus 방지, focusin/MutationObserver/다중 blur 타임아웃 |
| 저장 | 프로그램 상세는 **`getHTML()`** → `additionalContentHtml` |
| `insertVariable` | `{{key}}` 삽입 — **현재 다른 파일에서 미사용** |

### 2.4 뷰어 — `toast-ui-markdown-viewer.tsx`

| 항목 | 내용 |
|------|------|
| 경로 | `src/shared/components/toast-ui-markdown-viewer.tsx` |
| 입력 | `markdown: string` |
| CSS | `toast-ui-markdown-viewer.css` (`.toastui-editor-contents` 타이포) |

### 2.5 프로그램 상세 읽기(비뷰어)

| 항목 | 내용 |
|------|------|
| 경로 | `project-info-detail-info-section.tsx` → `AdditionalContentRow` |
| 렌더 | `dangerouslySetInnerHTML` + class `toastui-editor-contents` |
| 데이터 | `program.additionalContentHtml` (HTML) |

### 2.6 미사용·레거시

| 파일 | 비고 |
|------|------|
| `use-template-preview.ts` | Viewer 직접 사용, **import 없음** — 제거 후보 |
| `notice-register-modal.tsx` | `NoticeFormModal` 래퍼, deprecated 이름 호환 |
| `types/toast-ui-editor.d.ts` | 로컬 타입 보강 — Tiptap 전환 후 삭제 |

### 2.7 전역·colocated CSS (Toast 클래스 의존)

| 파일 | 선택자 예 |
|------|-----------|
| `src/index.css` | `.toastui-editor-defaultUI .toastui-editor-contents` |
| `notice-register-modal.css` | `.toastui-editor` |
| `admin-inquiry-detail-modal.css` | `.toastui-editor-contents` |
| `admin-notice-detail-page.css`, `admin-faq-detail-page.css` | 뷰어 래퍼 간격 주석 |
| `project-info-form-shared.css` | `.program-detail-info-tab__editor-content .toastui-editor-contents` |
| `program-detail-fullpage-modal.tsx` 등 | `@toast-ui/editor/dist/toastui-editor.css` import only |

---

## 3. 영향 화면·라우트

### 3.1 Markdown 뷰어 (`ToastUiMarkdownViewer`)

| 화면 | 라우트 | 파일 |
|------|--------|------|
| 관리자 공지 상세 | `/admin/posts/notices/:id` | `pages/posts/admin-notice-detail-page.tsx` |
| 관리자 FAQ 상세 | `/admin/posts/faq/:id` | `pages/posts/admin-faq-detail-page.tsx` |
| 관리자 1:1 문의 상세 모달 | `/admin/posts/inquiries` | `features/posts/ui/admin-inquiry-detail-modal.tsx` |

### 3.2 Markdown 에디터 (`useNoticeWysiwygEditor`)

| 화면 | 라우트 | 진입 UI |
|------|--------|---------|
| 관리자 공지 목록 | `/admin/posts/notices` | `NoticeFormModal` (등록) — `admin-notice-list-page.tsx` |
| 관리자 공지 상세 | `/admin/posts/notices/:id` | `NoticeFormModal` (수정) |
| Gemini 방문연수 모집 등록 | `/programs/gemini/visiting-training` | `GeminiRecruitmentAddFullpageModal` → `add-form.tsx` |
| 템플릿 양식 관리 (모집 양식) | `/templates/form-management?mode=edit&id=…` | `RecruitDetailInfoParagraph` 등 — `recruit-detail-info-paragraph.tsx` |

**모집 템플릿 registry 키** (`resolve-template-editor-panels.tsx`):

- `recruit-instructor`, `recruit-volunteer`
- `applicant-recruit-institution`, `applicant-recruit-individual`
- `ujat-recruit-institution`, `ujat-recruit-volunteer`

UJAT 학교 모집 **프로그램 컨텍스트**에서는 `UjatRecruitDetailInfoParagraph`가 `DetailInfoSection`을 쓰므로 HTML 에디터 경로(§3.3)와 겹친다.

### 3.3 HTML 에디터 (`useTemplateEditor`)

| 화면 | 라우트 | 모달 |
|------|--------|------|
| 일반·기업·학교·봉사 프로그램 목록 | `/programs/general`, `/programs/company-school/*`, `/programs/volunteer` 등 | `ProgramDetailFullPageModal` |
| 경제교육(일반) 프로그램 | `/programs/general` | `GeneralProgramDetailFullPageModal` |
| UJAT 프로그램 | `/programs/ujat` | `UjatProgramDetailFullPageModal` |

**편집 위치**: 프로젝트 정보 탭 → 상세 정보 → **「추가 내용」** (`DetailInfoSection` / `useDetailInfoEditorBlock`).

---

## 4. 저장 포맷 계약

마이그레이션 시 **아래 계약을 유지**한다(권장: 옵션 A).

### 옵션 A — 경계별 이중 포맷 유지 ✅ 권장

| 도메인 | 필드·파라미터 | 포맷 | 읽기 | 쓰기 API |
|--------|----------------|------|------|----------|
| 공지 | `notice.content` | Markdown | `ToastUiMarkdownViewer` | `getMarkdown()` → `contentMarkdown` |
| FAQ | `faq.answer` | Markdown | 동일 | (FAQ 폼은 별도 — 에디터 미사용 시 뷰어만) |
| 문의 | `body`, `answerMarkdown` | Markdown | 동일 | 답변 textarea / 읽기 뷰어 |
| Gemini 모집 | `trainingContentMarkdown` | Markdown | — | `getMarkdown()` |
| 프로그램 | `additionalContentHtml` | HTML | `dangerouslySetInnerHTML` | `getHTML()` |
| 모집 템플릿 초안 | WYSIWYG 브릿지 | Markdown(저장 스냅샷) | view `-` | `useNoticeWysiwygEditor` |

공통 모듈은 `contentFormat: 'markdown' | 'html'`와 `getMarkdown()` / `getHTML()`를 모두 제공하되, **호출부는 기존과 동일한 메서드만 사용**한다.

### 옵션 B / C (이번 범위 비권장)

- **B**: 전 필드 HTML 통일 → 기존 Markdown 데이터 변환·API 협의 필요
- **C**: 전 필드 Markdown 통일 → `additionalContentHtml` mock/실데이터 대량 변환 필요

---

## 5. 목표 아키텍처

### 5.1 디렉터리 (안)

```
apps/cms/src/shared/rich-text/
├── extensions.ts          # StarterKit + Link + Image + Table + Placeholder …
├── rich-text-editor.tsx   # 편집 UI (Toolbar + EditorContent)
├── rich-text-viewer.tsx   # 읽기 전용 (동일 extensions, editable: false)
├── use-rich-text-editor.ts
├── rich-text-content.css  # .rich-text-content prose (구 .toastui-editor-contents 대체)
├── types.ts               # RichTextFormat, RichTextEditorProps, …
└── index.ts
```

FSD: **features/posts, program, template는 `shared/rich-text`만 import** — Tiptap 패키지 직접 import 금지(규칙화 권장).

### 5.2 Strangler 어댑터

1차: 기존 훅·컴포넌트 이름 유지, 내부만 Tiptap.

```ts
// features/posts/hooks/use-notice-wysiwyg-editor.ts (래퍼)
export function useNoticeWysiwygEditor(...) {
  return useRichTextEditor({ format: 'markdown', ... })
}
```

2차(선택): `RichTextEditor` / `RichTextViewer` JSX API로 호출부 단순화.

### 5.3 권장 공개 API (목표)

```tsx
<RichTextEditor
  open={open}
  initialContent={string}
  contentFormat="markdown" | "html"
  resetKey={string | number}
  placeholder?: string
  minHeight?: number | string
  autofocus={false}
  toolbar?: RichTextToolbarPreset
  onReady?: (api: { getMarkdown; getHTML; insertText }) => void
/>

<RichTextViewer
  content={string}
  contentFormat="markdown" | "html"
  className?: string
/>
```

- 모달: `open === false` → `editor.destroy()` (Tiptap `useEditor` cleanup).
- 프로그램 상세: **`autofocus={false}` 필수** — Toast UI blur 해킹 제거 후 회귀 QA.

### 5.4 읽기 경로 통일

| 현재 | 목표 |
|------|------|
| Markdown → Toast Viewer | `RichTextViewer` `format="markdown"` |
| HTML → innerHTML + toast class | `RichTextViewer` `format="html"` 또는 동일 prose wrapper |

프로그램 「추가 내용」 읽기·쓰기가 **동일 extension/스타일**을 쓰도록 한다.

---

## 6. 마이그레이션 단계

리스크 **낮음 → 높음** 순서. 각 단계는 독립 PR 가능.

| 단계 | 작업 | 완료 기준 |
|------|------|-----------|
| **0** | 본 문서 합의, fixture Markdown/HTML 샘플 10~20건 수집 | QA 데이터셋 |
| **1** | `shared/rich-text` 스캐폴딩 + Tiptap deps | ✅ `pnpm typecheck` 통과 (`src/shared/rich-text/`) |
| **2** | `RichTextViewer` 교체 `ToastUiMarkdownViewer` | ✅ 공지/FAQ/문의 상세 |
| **3** | `use-notice-wysiwyg-editor` 내부 Tiptap화 | ✅ 공지 모달·Gemini·모집 템플릿 (`RichTextEditor` 렌더) |
| **4** | `use-template-editor` Tiptap화 + 프로그램 읽기 통일 | ✅ `RichTextEditor`/`RichTextViewer` (HTML), blur 해킹 제거 |
| **5** | CSS: `.toastui-*` 제거, `rich-text-content.css` | ✅ inquiry·notice·program-detail CSS |
| **6** | `@toast-ui/editor` 제거, `toast-ui-editor.d.ts` 삭제, `use-template-preview.ts` 삭제 | ✅ `grep @toast-ui` src 기준 0건 |

---

## 7. Tiptap 스택 (무료 플랜 · headless)

> [Overview](https://tiptap.dev/docs/editor/getting-started/overview) · [React 설치](https://tiptap.dev/docs/editor/getting-started/install/react)  
> **Pro Simple Editor / UI Components 템플릿은 사용하지 않음** — `RichTextEditor` + `toolbar` 슬롯으로 CMS 커스텀.

### 7.1 설치된 패키지 (`apps/cms/package.json`)

| 패키지 | 용도 |
|--------|------|
| `@tiptap/react`, `@tiptap/core`, `@tiptap/pm` | headless `useEditor`, `EditorContent` |
| `@tiptap/starter-kit` | heading, bold, italic, strike, lists, blockquote, code, hr, … |
| `@tiptap/extension-link` | 링크 |
| `@tiptap/extension-image` | 이미지(URL; 업로드는 별도) |
| `@tiptap/extension-table` | Table + TableRow + TableHeader + TableCell |
| `@tiptap/extension-placeholder` | placeholder |
| `@tiptap/extension-underline` | 밑줄 |
| `@tiptap/markdown` | `getMarkdown()` / `contentType: 'markdown'` (MIT) |
| `marked` | 뷰어 Markdown→HTML 폴백 (`lib/content.ts` 한 곳) |

**미설치(유료·Cloud)**: Collaboration, Comments, AI, Pages, Import/Export Pro, Drag Handle Pro, paid UI templates.

### 7.1.1 구현 위치

| 파일 | 역할 |
|------|------|
| `src/shared/rich-text/extensions.ts` | `createRichTextExtensions()` — 무료 extension만 |
| `src/shared/rich-text/use-rich-text-editor.ts` | headless 훅 |
| `src/shared/rich-text/rich-text-editor.tsx` | `EditorContent` + 기본 `RichTextToolbar` |
| `src/shared/rich-text/rich-text-toolbar.tsx` | Toast UI parity 툴바 (headless) |
| `src/shared/rich-text/rich-text-viewer.tsx` | `editable: false` 뷰어 |
| `src/shared/rich-text/rich-text-content.css` | `.rich-text-content` prose |

### 7.1.2 사용 예 (커스텀 툴바)

```tsx
import {
  RichTextEditor,
  useRichTextEditor,
  type RichTextEditorApi,
} from '@/shared/rich-text'

function NoticeBodyEditor({ open, initialMarkdown, resetKey }: Props) {
  const apiRef = useRef<RichTextEditorApi | null>(null)
  const { editor } = useRichTextEditor({
    enabled: open,
    initialContent: initialMarkdown,
    contentFormat: 'markdown',
    resetKey,
    placeholder: '공지사항 내용을 입력해 주세요.',
    autofocus: false,
    onReady: api => {
      apiRef.current = api
    },
  })

  return (
    <RichTextEditor
      editor={editor}
      minHeight="369px"
      toolbar={<MyNoticeToolbar editor={editor} />}
    />
  )
}
```

저장 시: `apiRef.current?.getMarkdown()` (공지) / `getHTML()` (프로그램 추가 내용).

### 7.2 툴바 parity (Toast UI 대비)

| Toast UI | Tiptap |
|----------|--------|
| heading | StarterKit Heading |
| bold, italic, strike | StarterKit |
| hr | StarterKit HorizontalRule |
| quote | Blockquote |
| ul, ol | BulletList, OrderedList |
| table | Table extension |
| link, image | Link, Image |
| code, codeblock | Code, CodeBlock |

### 7.3 포커스·모달 (프로그램 상세)

Toast UI `use-template-editor` 제거 후 Tiptap 설정 예:

```ts
useEditor({
  autofocus: false,
  editorProps: {
    attributes: {
      tabindex: '-1',
      class: 'rich-text-content',
    },
  },
})
```

- 사용자 클릭 전 autofocus 금지.
- 풀페이지 모달 탭 전환·수정 모드 진입 시 **페이지 스크롤이 에디터로 점프하지 않는지** 수동 QA (과거 `ProseMirror-focused` 이슈 참고).

### 7.4 번들

- `RichTextEditor`만 route/modal 단 **dynamic import** 검토.
- Viewer는 가벼우나 extension 세트는 Editor와 공유 권장.

---

## 8. CSS·스타일 이전

### 8.1 클래스 매핑

| 제거(예) | 대체 |
|----------|------|
| `.toastui-editor-contents` | `.rich-text-content` |
| `.toast-ui-markdown-viewer` | `.rich-text-viewer` |
| `.toastui-editor-defaultUI` | `.rich-text-editor` (툴바+본문 래퍼) |

### 8.2 이전 대상 파일

- `src/shared/components/toast-ui-markdown-viewer.css` → `shared/rich-text/rich-text-content.css`로 흡수
- `src/index.css` (전역 toast 타이포)
- `notice-register-modal.css` (에디터 border 1px #e0e0e0, radius 8px — [admin-notice-form-modal-spec](../../.cursor/rules/process/admin-notice-form-modal-spec.md) 준수)
- `admin-inquiry-detail-modal.css`
- `project-info-form-shared.css`

### 8.3 import 제거

다음 파일의 `@toast-ui/editor/dist/toastui-editor.css` import 삭제:

- `notice-form-modal.tsx`
- `recruit-detail-info-paragraph.tsx`
- `add-form.tsx` (Gemini)
- `program-detail-fullpage-modal.tsx`

---

## 9. 콘텐츠 호환·검증

### 9.1 Markdown (공지·문의·Gemini)

| 위험 | 대응 |
|------|------|
| 테이블·코드블록·이미지 URL 문법 차이 | fixture로 편집 → 저장 → 뷰어 스냅샷 |
| 빈 본문·줄바꿈만 있는 케이스 | trim 후 저장 로직 유지 (`notice-form-modal`) |

### 9.2 HTML (`additionalContentHtml`)

| 위험 | 대응 |
|------|------|
| HTML 파서 차이 (태그 정리) | `data/mock/programs.ts` 등 mock HTML round-trip |
| 읽기 innerHTML vs Tiptap read-only 불일치 | §5.4 통일 후 before/after 스크린샷 |

### 9.3 자동 테스트 (권장)

- `getMarkdown` / `getHTML` 단위: 고정 입력 문자열 → 스냅샷 또는 normalize 비교
- (선택) Vitest + jsdom에서 `RichTextViewer` render smoke

---

## 10. PR 분할·체크리스트

### 10.1 PR 제안

| PR | 제목(예) | 범위 |
|----|----------|------|
| PR1 | feat(cms): add shared rich-text (Tiptap) + viewer | `shared/rich-text`, Viewer 3화면, deps |
| PR2 | refactor(cms): migrate notice/gemini/recruit editor | `use-notice-wysiwyg-editor` |
| PR3 | refactor(cms): migrate program additional content editor | `use-template-editor`, HTML read path |
| PR4 | chore(cms): remove toast-ui editor | CSS, package.json, types, dead code |

### 10.2 수동 QA 체크리스트

- [ ] **공지** 등록/수정 모달: open/close, 다른 글 `resetKey`, 첨부 행 레이아웃
- [ ] **공지/FAQ 상세**: 본문 Markdown (제목, 리스트, 테이블, 링크, 코드)
- [ ] **문의 상세**: 본문 뷰어 + 답변 뷰어(있을 때)
- [ ] **템플릿** `/templates/form-management` 모집 양식 「추가 내용」 WYSIWYG
- [ ] **Gemini** `/programs/gemini/visiting-training` 모집 등록 에디터·저장
- [ ] **프로그램 풀페이지** 수정 진입 시 스크롤 점프 없음
- [ ] **프로그램** 읽기 모드 추가 내용 HTML + 썸네일 레이아웃
- [ ] 데스크톱·좁은 폭 툴바 overflow
- [ ] 빈 본문·로딩 placeholder

### 10.3 UI 회귀 가능 화면 (요약)

- 관리자 게시글 상세·문의 모달 (타이포·간격)
- 공지 등록 모달 에디터 border/높이
- 프로그램 상세 정보 탭 추가 내용 블록

---

## 11. 하지 말 것

- 화면마다 Tiptap을 직접 붙여 extension/툴바가 분기되는 것
- 1차 PR에서 DB Markdown→HTML 일괄 변환
- `use-template-editor`의 blur/MutationObserver를 Tiptap PR에 **그대로 복사** (원인 제거 후 최소 보완만)
- 뷰어만 Tiptap, 프로그램 읽기는 `innerHTML` 유지 (스타일 불일치 재발)
- `apps/lms`에 동일 패키지 선제 도입(이번 범위 밖)

---

## 12. 부록: 파일 인벤토리

### 12.1 런타임 (교체 대상)

| 구분 | 경로 |
|------|------|
| 훅 | `features/posts/hooks/use-notice-wysiwyg-editor.ts` |
| 훅 | `features/template/hooks/use-template-editor.ts` |
| 컴포넌트 | `shared/components/toast-ui-markdown-viewer.tsx` |
| 타입 | `types/toast-ui-editor.d.ts` |
| 미사용 | `features/template/hooks/use-template-preview.ts` |

### 12.2 호출부 (에디터)

| 경로 |
|------|
| `features/posts/ui/notice-form-modal.tsx` |
| `features/template/ui/form-set/recruit-form/shared/recruit-detail-info-paragraph.tsx` |
| `features/program/gemini/hooks/use-gemini-recruitment-add-form.ts` |
| `features/program/shared/ui/program-detail/project-info/detail-info/project-info-detail-info-section.tsx` |

### 12.3 호출부 (뷰어)

| 경로 |
|------|
| `pages/posts/admin-notice-detail-page.tsx` |
| `pages/posts/admin-faq-detail-page.tsx` |
| `features/posts/ui/admin-inquiry-detail-modal.tsx` |

### 12.4 저장·매핑 참고

| 경로 | 비고 |
|------|------|
| `features/posts/model/notice-form-mapper.ts` | `contentMarkdown` |
| `features/posts/ui/notice-form-modal.tsx` | `getMarkdown().trim()` |
| `features/program/general/hooks/use-program-detail-info-save.ts` | `additionalContentHtml` getter |
| `features/program/shared/model/program-detail-edit-schema.ts` | `additionalContentHtml` zod |
| `types/domain.ts` | `Program.additionalContentHtml` |

### 12.5 관련 스펙·규칙

- [admin-notice-form-modal-spec.md](../../.cursor/rules/process/admin-notice-form-modal-spec.md) — 에디터 border·높이
- [form-surface-refactoring-guide.md](./form-surface-refactoring-guide.md) — 템플릿/응답 surface (모집 양식 문맥)
- [ui-merge.mdc](../../../../.cursor/rules/ui-merge.mdc) — CSS 병합 시 회귀 요약

---

## 변경 이력

| 날짜 | 내용 |
|------|------|
| 2026-06-02 | 초안 작성 (Toast UI 인벤토리·Tiptap Strangler 계획) |
| 2026-06-02 | 단계 1: Tiptap 무료 deps + `shared/rich-text` headless 스캐폴딩 |
| 2026-06-02 | 단계 2: `RichTextViewer` — 공지/FAQ/문의 상세 |
| 2026-06-02 | 단계 3: `use-notice-wysiwyg-editor` → Tiptap, `editor` + `RichTextEditor` |
| 2026-06-02 | 단계 4: `use-template-editor` → Tiptap, 프로그램 추가 내용 읽기/쓰기 통일 |
| 2026-06-02 | `use-template-preview.ts` 삭제 (미사용) |
| 2026-06-02 | 단계 5~6: Toast UI 패키지·타입·전역 CSS 제거 |
| 2026-06-02 | `RichTextToolbar` 기본 탑재 (`showToolbar` 기본 true) |
| 2026-06-04 | Figma 스펙 커스텀 툴바(글꼴·크기·색상·하이라이트·정렬); Markdown 서식은 인라인 HTML/`==highlight==` 보존 |
| 2026-06-04 | 삽입: 이미지(URL·파일·리사이즈·정렬), YouTube(`@tiptap/extension-youtube`), 링크·표·구분선 |
