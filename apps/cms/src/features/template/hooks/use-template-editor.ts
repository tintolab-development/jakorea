import type { Editor } from '@tiptap/react'
import { useCallback, useMemo, useRef } from 'react'
import {
  useRichTextEditor,
  type RichTextEditorApi,
} from '@/shared/rich-text'

const DEFAULT_MIN_HEIGHT = '420px'

/**
 * 프로그램 상세 「추가 내용」 등 HTML WYSIWYG — Tiptap headless.
 * UI: `<RichTextEditor editor={editor} minHeight={editorMinHeight} />`
 */
export function useTemplateEditor(
  open: boolean,
  initialValue: string = '',
  /** HTML 초기값 */
  initialHtml?: string
) {
  const apiRef = useRef<RichTextEditorApi | null>(null)
  const initialContent = initialHtml?.trim() ? initialHtml : initialValue

  const resetKey = useMemo(
    () => `${open ? 'open' : 'closed'}:${initialContent.length}:${initialContent.slice(0, 48)}`,
    [open, initialContent]
  )

  const { editor, api } = useRichTextEditor({
    enabled: open,
    initialContent,
    contentFormat: 'html',
    resetKey,
    autofocus: false,
    onReady: readyApi => {
      apiRef.current = readyApi
    },
  })

  const getHTML = useCallback(() => apiRef.current?.getHTML() ?? api?.getHTML() ?? '', [api])

  const getMarkdown = useCallback(
    () => apiRef.current?.getMarkdown() ?? api?.getMarkdown() ?? '',
    [api]
  )

  const insertVariable = useCallback((key: string) => {
    apiRef.current?.insertText(`{{${key}}}`)
  }, [])

  /** Toast UI 호환 — 외부 미사용, no-op */
  const setMarkdown = useCallback((_value: string) => {}, [])

  return {
    editor: editor as Editor | null,
    editorMinHeight: DEFAULT_MIN_HEIGHT,
    getHTML,
    getMarkdown,
    insertVariable,
    setMarkdown,
  }
}
