import type { Editor } from '@/shared/rich-text'
import { useCallback, useRef } from 'react'
import {
  useRichTextEditor,
  type RichTextEditorApi,
} from '@/shared/rich-text'

const DEFAULT_EDITOR_HEIGHT = '369px'
const DEFAULT_PLACEHOLDER = '공지사항 내용을 입력해 주세요.'

export type NoticeWysiwygEditorOptions = {
  /** 예: FAQ 모달은 `260px` 등으로 축소 */
  height?: string
  placeholder?: string
  /** 기본 markdown — 모집「추가 내용」등 HTML SSOT는 `html` */
  contentFormat?: 'markdown' | 'html'
}

/**
 * 공지·모집 템플릿·Gemini 등 WYSIWYG — Tiptap headless.
 * UI: 호출부에서 `<RichTextEditor editor={editor} minHeight={editorMinHeight} />` 렌더.
 */
export function useNoticeWysiwygEditor(
  open: boolean,
  initialContent: string = '',
  /** open·noticeId·mode 등 — 동일 open에서 다른 글 진입 시 재마운트 */
  resetKey?: string | number,
  options?: NoticeWysiwygEditorOptions
) {
  const apiRef = useRef<RichTextEditorApi | null>(null)
  const editorMinHeight = options?.height ?? DEFAULT_EDITOR_HEIGHT
  const placeholder = options?.placeholder ?? DEFAULT_PLACEHOLDER
  const contentFormat = options?.contentFormat ?? 'markdown'

  const { editor, api } = useRichTextEditor({
    enabled: open,
    initialContent,
    contentFormat,
    resetKey,
    placeholder,
    autofocus: false,
    onReady: readyApi => {
      apiRef.current = readyApi
    },
  })

  const getMarkdown = useCallback(
    () => apiRef.current?.getMarkdown() ?? api?.getMarkdown() ?? '',
    [api]
  )

  const getHTML = useCallback(() => apiRef.current?.getHTML() ?? api?.getHTML() ?? '', [api])

  return {
    editor: editor as Editor | null,
    editorMinHeight,
    getMarkdown,
    getHTML,
  }
}
