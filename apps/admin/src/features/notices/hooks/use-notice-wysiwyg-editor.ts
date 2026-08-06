import type { Editor } from '@/shared/rich-text'
import { useCallback, useRef } from 'react'
import {
  useRichTextEditor,
  type RichTextEditorApi,
} from '@/shared/rich-text'

const DEFAULT_EDITOR_HEIGHT = '369px'
const DEFAULT_PLACEHOLDER = '공지사항 내용을 입력하세요'

export type NoticeWysiwygEditorOptions = {
  height?: string
  placeholder?: string
}

/**
 * 공지 Markdown WYSIWYG — Tiptap headless.
 */
export function useNoticeWysiwygEditor(
  open: boolean,
  initialMarkdown: string = '',
  resetKey?: string | number,
  options?: NoticeWysiwygEditorOptions
) {
  const apiRef = useRef<RichTextEditorApi | null>(null)
  const editorMinHeight = options?.height ?? DEFAULT_EDITOR_HEIGHT
  const placeholder = options?.placeholder ?? DEFAULT_PLACEHOLDER

  const { editor, api } = useRichTextEditor({
    enabled: open,
    initialContent: initialMarkdown,
    contentFormat: 'markdown',
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

  return {
    editor: editor as Editor | null,
    editorMinHeight,
    getMarkdown,
  }
}
