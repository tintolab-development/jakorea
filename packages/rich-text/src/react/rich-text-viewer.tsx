import { EditorContent, useEditor } from '@tiptap/react'
import { useMemo } from 'react'
import { createRichTextExtensions } from '../core/extensions'
import { getInitialEditorContent } from '../core/content'
import type { RichTextViewerProps } from './types'

/**
 * 읽기 전용 Rich Text — 에디터와 동일 extension·`.rich-text-content` 스타일.
 */
export function RichTextViewer({
  content: contentProp,
  markdown,
  contentFormat = 'markdown',
  className,
  extraExtensions,
  maxHeight = '403px',
}: RichTextViewerProps) {
  const content = markdown ?? contentProp ?? ''

  const extensions = useMemo(
    () => createRichTextExtensions({ openLinksOnClick: true, extraExtensions }),
    [extraExtensions]
  )

  const { content: editorContent, contentType } = useMemo(
    () => getInitialEditorContent(content, contentFormat),
    [content, contentFormat]
  )

  const editor = useEditor(
    {
      extensions,
      content: editorContent,
      contentType,
      editable: false,
      immediatelyRender: false,
      shouldRerenderOnTransaction: false,
      editorProps: {
        attributes: {
          class: 'rich-text-content',
        },
      },
    },
    [editorContent, contentType, extraExtensions]
  )

  const rootClass = ['rich-text-viewer', className].filter(Boolean).join(' ')

  return (
    <div
      className={rootClass}
      style={maxHeight != null ? { maxHeight } : undefined}
      data-rich-text-viewer=""
    >
      <EditorContent editor={editor} />
    </div>
  )
}
