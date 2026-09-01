import { EditorContent } from '@tiptap/react'
import { isRichTextEditorReady } from '../core/editor-ready'
import type { RichTextEditorProps } from './types'

/**
 * Headless 에디터 셸 — Pro Simple Editor / UI Components 미사용.
 * 툴바는 `toolbar` 슬롯으로 앱별 주입 (Ant Design, PF 등).
 */
export function RichTextEditor({
  editor,
  className,
  minHeight,
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

  return (
    <div
      className={rootClass}
      style={minHeight != null ? { minHeight } : undefined}
      data-rich-text-editor=""
    >
      {toolbar ? (
        <div className="rich-text-editor__toolbar">{toolbar}</div>
      ) : null}
      <div
        className="rich-text-editor__body"
        onMouseDown={event => {
          if (event.target !== event.currentTarget) return
          event.preventDefault()
          const pos = editor.view.posAtCoords({ left: event.clientX, top: event.clientY })
          editor
            .chain()
            .focus()
            .setTextSelection(pos?.pos ?? editor.state.doc.content.size)
            .run()
        }}
      >
        <EditorContent
          editor={editor}
          className="rich-text-editor__content"
          aria-label={ariaLabel}
        />
      </div>
    </div>
  )
}
