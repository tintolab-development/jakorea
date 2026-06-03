import type { ReactNode } from 'react'
import type { Editor } from '@tiptap/react'

/** 저장·API 경계 포맷 (Toast UI 마이그레이션 계약 유지) */
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
}

export type UseRichTextEditorOptions = {
  /** false면 에디터 인스턴스 비활성(모달 닫힘 등) */
  enabled: boolean
  initialContent?: string
  contentFormat?: RichTextContentFormat
  /** 동일 enabled에서 다른 문서 로드 시 remount·setContent 트리거 */
  resetKey?: string | number
  placeholder?: string
  autofocus?: boolean
  onReady?: (api: RichTextEditorApi) => void
}

export type RichTextEditorProps = {
  editor: Editor | null
  className?: string
  /** 예: `369px` — notice-register-modal 에디터 높이 */
  minHeight?: string | number
  /**
   * 기본 `true` — `RichTextToolbar` 표시.
   * `toolbar`를 넘기면 해당 노드로 대체하고 `showToolbar`는 무시.
   */
  showToolbar?: boolean
  /** 커스텀 툴바(지정 시 `showToolbar` 무시) */
  toolbar?: ReactNode
  'aria-label'?: string
}

export type RichTextViewerProps = {
  /** Markdown 본문 (`markdown`과 동일, Toast `ToastUiMarkdownViewer` 호환) */
  content?: string
  markdown?: string
  contentFormat?: RichTextContentFormat
  className?: string
  /** 기본 `403px` — 구 공지 상세 뷰어 */
  maxHeight?: string | number
}
