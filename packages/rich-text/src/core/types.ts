/** 저장·API 경계 포맷 (Toast UI 마이그레이션 계약 유지) */
import type { Extensions } from '@tiptap/core'

export type RichTextContentFormat = 'markdown' | 'html'

/** Tiptap EditorContent에 넘길 contentType */
export type RichTextEditorContentType = RichTextContentFormat

/**
 * imperative getter — 기존 `useNoticeWysiwygEditor` / `useTemplateEditor` 호환용
 * 커스텀 툴바는 `editor` 인스턴스 + chain API로 구현 (headless)
 */
export type RichTextEditorApi = {
  getMarkdown: () => string
  getHTML: () => string
  getText: () => string
  getCharacterCount: () => number
  getImageTotalBytes: () => number
  insertText: (text: string) => void
  focus: () => void
  blur: () => void
}

/**
 * 에디터에서 끌 수 있는 서식 기능. 끄면 확장 자체가 빠져서
 * 툴바뿐 아니라 단축키·입력 규칙(`# `, `---`)·붙여넣기로도 들어오지 않는다.
 */
export type RichTextDisabledFeature =
  | 'textColor'
  | 'fontFamily'
  | 'fontSize'
  | 'lineHeight'
  | 'highlight'
  | 'textAlign'
  | 'superscript'
  | 'horizontalRule'
  | 'table'
  /** 제목 1 (제목 2·3은 유지) */
  | 'heading1'

export type CreateRichTextExtensionsOptions = {
  /** 끌 서식 기능. 기본은 전부 켜짐(빈 배열). 공통 CMS/Platform 에디터는 지정하지 않는다. */
  disabledFeatures?: readonly RichTextDisabledFeature[]
  placeholder?: string
  /** 읽기 전용 뷰어에서 링크 클릭 허용 */
  openLinksOnClick?: boolean
  /** `full`: superscript·emoji·filehandler 포함 (기본) */
  preset?: 'full' | 'basic'
  /** 앱별 추가 확장 (메일 변수 atom 등) */
  extraExtensions?: Extensions
  /** 드롭·붙여넣기 시점에 업로드 함수를 읽는다. 없으면 data URL */
  getResolveImageSrc?: () =>
    | ((file: File) => Promise<import('./insert-actions').ResolvedRichTextImageSrc>)
    | undefined
  /**
   * Homepage Admin 시각 편집 전용.
   * 공통 CMS/Platform 에디터에서는 켜지 않는다.
   */
  visualImagePosition?: boolean
}
