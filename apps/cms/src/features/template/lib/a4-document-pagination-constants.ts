/**
 * A4 본문 페이지 분할 — 디자인 px (`a4-document-page-layout.css`와 동기).
 * `A4DocumentPageLayout`: height 2072, padding 100, border-box → 세로 내부 1872px.
 * 1페이지: 헤더(타이틀·로고) + gap 40 차감. 2페이지 이후: 헤더 없음.
 */
export const A4_DOCUMENT_DESIGN_INNER_HEIGHT_PX = 2072 - 200

/** 1페이지 본문(`.a4-document-page-layout__content`) 최대 높이 — 헤더·gap 반영 보수값 */
export const A4_DOCUMENT_FIRST_PAGE_BODY_MAX_PX = 1650

/** 2페이지 이후 본문 최대 높이 */
export const A4_DOCUMENT_CONTINUATION_PAGE_BODY_MAX_PX = A4_DOCUMENT_DESIGN_INNER_HEIGHT_PX

/** `.a4-document-page-layout` 콘텐츠 가로(1464 - 좌우 padding 100*2) */
export const A4_DOCUMENT_CONTENT_INNER_WIDTH_PX = 1464 - 200

/** `form-editor-left` 카드 스택 gap과 맞춤 (`form-editor.css` .form-editor-left gap: 32px) */
export const A4_DOCUMENT_PARAGRAPH_GAP_PX = 32
