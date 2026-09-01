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
  insertText: (text: string) => void
  focus: () => void
  blur: () => void
}

export type CreateRichTextExtensionsOptions = {
  placeholder?: string
  /** 읽기 전용 뷰어에서 링크 클릭 허용 */
  openLinksOnClick?: boolean
  /** `full`: superscript·emoji·filehandler 포함 (기본) */
  preset?: 'full' | 'basic'
  /** 앱별 추가 확장 (메일 변수 atom 등) */
  extraExtensions?: Extensions
}
