import { EditorContent } from '@tiptap/react'
import { RichTextToolbar } from './rich-text-toolbar'
import { isRichTextEditorReady } from './lib/editor-ready'
import type { RichTextEditorProps } from './types'
import './rich-text-content.css'
import './rich-text-editor.css'

/**
 * Headless 에디터 셸 — Pro Simple Editor / UI Components 미사용.
 * 기본 `RichTextToolbar` 포함; `toolbar` prop으로 교체 가능.
 */
export function RichTextEditor({
  editor,
  className,
  minHeight,
  showToolbar = true,
  toolbar,
  'aria-label': ariaLabel = '본문 편집',
}: RichTextEditorProps) {
  const rootClass = ['rich-text-editor', className].filter(Boolean).join(' ')

  if (!isRichTextEditorReady(editor)) {
    return (
      <div
        className={rootClass}
        style={minHeight != null ? { minHeight } : undefined}
        data-rich-text-editor=""
        aria-busy="true"
      >
        <div className="rich-text-editor__body rich-text-editor__body--loading">로딩 중…</div>
      </div>
    )
  }

  const toolbarNode =
    toolbar ?? (showToolbar ? <RichTextToolbar editor={editor} /> : null)

  return (
    <div
      className={rootClass}
      style={minHeight != null ? { minHeight } : undefined}
      data-rich-text-editor=""
    >
      {toolbarNode ? (
        <div className="rich-text-editor__toolbar">{toolbarNode}</div>
      ) : null}
      <div className="rich-text-editor__body">
        <EditorContent editor={editor} aria-label={ariaLabel} />
      </div>
    </div>
  )
}
