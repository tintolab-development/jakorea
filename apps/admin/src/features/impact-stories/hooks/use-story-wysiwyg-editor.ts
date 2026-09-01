import type { Editor } from '@/shared/rich-text'
import { useCallback, useRef } from 'react'
import {
  useRichTextEditor,
  type RichTextContentFormat,
  type RichTextEditorApi,
} from '@/shared/rich-text'

const DEFAULT_EDITOR_HEIGHT = '369px'
const DEFAULT_PLACEHOLDER = '게시글 내용을 입력하세요'

export type StoryWysiwygEditorOptions = {
  height?: string
  placeholder?: string
  contentFormat?: RichTextContentFormat
  /**
   * 인라인 이미지·YouTube 등 (기본 true — full preset)
   */
  allowInlineMedia?: boolean
}

/**
 * 임팩트 스토리 WYSIWYG — Tiptap headless.
 * remote 응답(HTML)은 contentFormat='html', local mock은 markdown.
 */
export function useStoryWysiwygEditor(
  open: boolean,
  initialMarkdown: string = '',
  resetKey?: string | number,
  options?: StoryWysiwygEditorOptions
) {
  const apiRef = useRef<RichTextEditorApi | null>(null)
  const editorMinHeight = options?.height ?? DEFAULT_EDITOR_HEIGHT
  const placeholder = options?.placeholder ?? DEFAULT_PLACEHOLDER
  const contentFormat = options?.contentFormat ?? 'markdown'
  const allowInlineMedia = options?.allowInlineMedia ?? true

  const { editor, api } = useRichTextEditor({
    enabled: open,
    initialContent: initialMarkdown,
    contentFormat,
    resetKey,
    placeholder,
    autofocus: false,
    preset: allowInlineMedia ? 'full' : 'basic',
    onReady: readyApi => {
      apiRef.current = readyApi
    },
  })

  const getMarkdown = useCallback(
    () => apiRef.current?.getMarkdown() ?? api?.getMarkdown() ?? '',
    [api]
  )

  const getHTML = useCallback(
    () => apiRef.current?.getHTML() ?? api?.getHTML() ?? '',
    [api]
  )

  return {
    editor: editor as Editor | null,
    editorMinHeight,
    getMarkdown,
    getHTML,
    contentFormat,
    allowInlineMedia,
  }
}
