import { useEditor } from '@tiptap/react'
import { useEffect, useMemo, useRef } from 'react'
import { createRichTextExtensions } from './extensions'
import { createRichTextEditorApi } from './lib/editor-api'
import { isRichTextEditorReady } from './lib/editor-ready'
import { getInitialEditorContent } from './lib/content'
import type { RichTextEditorApi, UseRichTextEditorOptions } from './types'

const EMPTY_CONTENT = ''

/**
 * Headless Tiptap 에디터 훅 — 툴바/UI 없음.
 * `RichTextEditor` + 커스텀 `toolbar` 슬롯 또는 `editor`로 chain API 직접 사용.
 */
export function useRichTextEditor({
  enabled,
  initialContent = EMPTY_CONTENT,
  contentFormat = 'markdown',
  resetKey,
  placeholder,
  autofocus = false,
  onReady,
}: UseRichTextEditorOptions) {
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady

  const extensions = useMemo(
    () => createRichTextExtensions({ placeholder }),
    [placeholder]
  )

  const { content, contentType } = useMemo(
    () => getInitialEditorContent(initialContent, contentFormat),
    [initialContent, contentFormat]
  )

  const editor = useEditor(
    {
      extensions,
      content,
      contentType,
      editable: enabled,
      autofocus: enabled && autofocus,
      immediatelyRender: false,
      shouldRerenderOnTransaction: false,
      editorProps: {
        attributes: {
          class: 'rich-text-content',
          tabindex: '-1',
        },
      },
      onCreate: ({ editor: instance }) => {
        if (!isRichTextEditorReady(instance)) return
        onReadyRef.current?.(createRichTextEditorApi(instance))
      },
    },
    [resetKey, placeholder]
  )

  useEffect(() => {
    if (!isRichTextEditorReady(editor) || !enabled) return
    editor.commands.setContent(content, {
      emitUpdate: false,
      contentType,
    })
    if (!autofocus) {
      editor.commands.blur()
    }
  }, [editor, enabled, resetKey, content, contentType, autofocus])

  useEffect(() => {
    if (!isRichTextEditorReady(editor)) return
    editor.setEditable(enabled)
    if (!enabled) {
      editor.commands.blur()
    }
  }, [editor, enabled])

  const api: RichTextEditorApi | null = useMemo(
    () => (isRichTextEditorReady(editor) ? createRichTextEditorApi(editor) : null),
    [editor]
  )

  return { editor, api }
}
