import { useCallback, useRef, useState } from 'react'
import { EditorContent } from '@tiptap/react'
import { isRichTextEditorReady } from '../core/editor-ready'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
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
  const rootRef = useRef<HTMLDivElement>(null)
  const [userHeight, setUserHeight] = useState<number | null>(null)
  const rootClass = ['rich-text-editor', className].filter(Boolean).join(' ')
  const rootStyle: CSSProperties | undefined =
    minHeight != null || userHeight != null
      ? {
          ...(minHeight != null ? { minHeight } : null),
          ...(userHeight != null ? { height: userHeight } : null),
        }
      : undefined
  const minResizeHeight =
    typeof minHeight === 'number'
      ? minHeight
      : typeof minHeight === 'string' && minHeight.endsWith('px')
        ? Number.parseFloat(minHeight)
        : 80

  const handleResizePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()

      const root = rootRef.current
      if (root == null) return

      const startY = event.clientY
      const startHeight = root.getBoundingClientRect().height

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const nextHeight = Math.max(minResizeHeight, startHeight + moveEvent.clientY - startY)
        setUserHeight(nextHeight)
      }

      const handlePointerUp = () => {
        document.removeEventListener('pointermove', handlePointerMove)
        document.removeEventListener('pointerup', handlePointerUp)
      }

      document.addEventListener('pointermove', handlePointerMove)
      document.addEventListener('pointerup', handlePointerUp, { once: true })
    },
    [minResizeHeight]
  )

  if (!isRichTextEditorReady(editor)) {
    return (
      <div
        ref={rootRef}
        className={rootClass}
        style={rootStyle}
        data-rich-text-editor=""
        aria-busy="true"
      >
        <div className="rich-text-editor__body rich-text-editor__body--loading">로딩 중…</div>
      </div>
    )
  }

  return (
    <div
      ref={rootRef}
      className={rootClass}
      style={rootStyle}
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
      <div
        className="rich-text-editor__resize-handle"
        aria-hidden="true"
        onPointerDown={handleResizePointerDown}
      />
    </div>
  )
}
