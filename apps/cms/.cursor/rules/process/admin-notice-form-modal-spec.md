---
priority: medium
category: process
---

# 관리자 공지사항 등록·수정 모달 UI 스펙

**적용 코드**: `NoticeFormModal` (`apps/cms/src/features/posts/ui/notice-form-modal.tsx`), 스타일 `notice-register-modal.css`  
**쉘**: `ContentModal` — [`table-implementation.md` §모달](../tables/table-implementation.md)과 동일하게 **`ContentModal` 우선**, `TealHeaderModal` 직접 사용 금지.

구현·리디자인 시 **본 문서와 CSS를 단일 기준**으로 맞춘다. 수치를 바꿀 때는 CSS와 본 문서를 함께 갱신한다.

---

## 1. 모달 셸 (`ContentModal`)

| 항목 | 값 | 비고 |
|------|-----|------|
| `size` | `large` | 가로 **1400px** 계열 (프로젝트 large 토큰) |
| 루트 클래스 | `className="notice-register-modal"` | `content-modal.notice-register-modal.teal-header-modal--large` 로 스코프 |
| `.ant-modal-content` 패딩 | `18px 24px 20px` | 상·좌우·하 |
| 최대 높이 | `min(880px, 100vh)` | 뷰포트보다 커지지 않음 |
| 세로 레이아웃 | `flex` column | 헤더 → 바디(스크롤) → 푸터 |
| 바디 | `flex: 1`, `min-height: 0`, `overflow-y: auto` | 폼·에디터가 잘리지 않도록 **바디에서 세로 스크롤** |

- 헤더(타이틀)와 본문 사이: **`margin-bottom: 24px`**
- 푸터(취소·등록/수정) 위: **`margin-top: 24px`** (`ContentModal` 공통 푸터 여백과 병행 시 CSS 주석 확인)

---

## 2. 폼 (`Form` vertical)

- **`layout="vertical"`**, **`requiredMark={false}`**, 클래스 `notice-register-modal__form`
- **블록 간격**(필터 래퍼, 제목, 에디터, 첨부 등): 세로 **`24px`** — `.ant-form-item { margin-bottom: 24px }` (필터 내부 항목은 예외로 `0`)

### 2.1 라벨 ↔ 컨트롤 간격

- **10px** — `ant-form-vertical`에서 `.ant-form-item-label`에 `margin-bottom: 10px` (라벨 아래 패딩은 제거)
- **「내용」**은 `Form.Item` 라벨이 아니라 커스텀 `.notice-register-modal__editor-label` — 동일하게 **`margin-bottom: 10px`**

---

## 3. 상단 필터 한 줄

래퍼: `notice-register-modal__filter-wrap` / 내부: `notice-register-modal__filter-inner`

| 항목 | 스펙 |
|------|------|
| 정렬 | `flex`, `justify-content: flex-start`, `align-items: center`, `flex-wrap: wrap` |
| 항목 간 간격 | **`gap: 16px`** |
| 카테고리 (`CmsSelect`) | 컨트롤 **`240×44`** — `width={240}`, `inputSize="large"` (44px 높이) |
| 공개 여부 · 상단 고정 (`CmsRadioGroup`) | 각 필드 래퍼 **`200px`** — CSS로 `width`/`max-width` 고정 |
| 필터 내부 `Form.Item` | 바깥 블록 간격만 쓰고, 필터 줄 안에서는 **`margin-bottom: 0`** |

---

## 4. Toast UI 에디터(내용)

| 항목 | 값 |
|------|-----|
| 호스트 | `.notice-register-modal__editor-host` |
| 높이 | **`369px`** (`min-height` 동일) |
| 테두리 | 에디터 루트 `.toastui-editor`: `1px solid #e0e0e0`, `border-radius: 8px` |
| 동작 | `useNoticeWysiwygEditor(open, initialMarkdown, editorResetKey)` — 모달 open/모드·공지 전환 시 내용 동기화 |

---

## 5. 첨부 파일 행

레이아웃: 좌측 **th 스타일 라벨** + 우측 `FileSelectField` (하나의 테이블형 행, 상·좌·우 테두리 + 하단만 셀별로 맞춤).

| 영역 | 스펙 |
|------|------|
| 라벨 셀 (`.notice-register-modal__attachment-label`) | **`180px`** 고정, 세로 가운데, 배경 `#edf0f2`, 텍스트 **16px / 700**, 가운데 정렬, 패딩 `10px`, 우측·하단 보더 `#ddd` |
| 본문 셀 (`.notice-register-modal__attachment-body`) | `padding: 12px 16px`, `FileSelectField` 수평 정렬 |
| 안내 문구 (`.file-select-field__guide`) | 14px / 500, **`opacity: 0.6`**, 두 줄 (`guideLines` 배열) |
| 액션 영역 | 버튼·가이드 간 **`gap: 8px`**, 액션 내부 **`gap: 12px`** (클래스 `notice-register-modal__file-field`) |

- 파일 크기 제한 등 비즈니스 규칙은 코드 주석·`message`와 일치시킴 (예: **최대 20MB**).

---

## 6. 푸터 버튼

- **취소** `CmsButton` `variant="secondary"` `size="large"`
- **등록 / 수정** `variant="primary"` `size="large"` — `form.submit()` 연동

---

## 7. 래퍼·이름 규칙

- **`NoticeRegisterModal`**: `NoticeFormModal` + `mode="create"` 만 감싼 호환용 — **신규 화면은 `NoticeFormModal` 직접 사용** 권장.
- 스타일 파일명 `notice-register-modal.css`는 역사적 이유로 유지; **등록·수정 공통** 스타일이다.

---

## 관련 규칙

- [테이블·모달 구현](../tables/table-implementation.md) — `ContentModal`, 모달 내 테이블·Descriptions 라벨 폭 등
- [목록 페이지 구성](../coding/list-page-composition.mdc) — 공지 **목록**은 동일 피처 패턴; **등록·수정 모달**은 본 문서
