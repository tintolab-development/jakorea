import { useCallback, useRef, useState } from 'react'
import { EditorContent } from '@tiptap/react'
import { isRichTextEditorReady } from '../core/editor-ready'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import {
  RICH_TEXT_EDITOR_DEFAULT_MIN_HEIGHT_PX,
  type RichTextEditorProps,
} from './types'

function toCssLength(value: string | number): string {
  return typeof value === 'number' ? `${value}px` : value
}

function resolveMinResizeHeight(minHeight: string | number | undefined): number {
  if (typeof minHeight === 'number' && Number.isFinite(minHeight)) return minHeight
  if (typeof minHeight === 'string') {
    const parsed = Number.parseFloat(minHeight)
    if (Number.isFinite(parsed)) return parsed
  }
  return RICH_TEXT_EDITOR_DEFAULT_MIN_HEIGHT_PX
}

/**
 * Headless 에디터 셸 — Pro Simple Editor / UI Components 미사용.
 * 툴바는 `toolbar` 슬롯으로 앱별 주입 (Ant Design, PF 등).
 */
export function RichTextEditor({
  editor,
  className,
  minHeight = RICH_TEXT_EDITOR_DEFAULT_MIN_HEIGHT_PX,
  height,
  toolbar,
  'aria-label': ariaLabel = '본문 편집',
}: RichTextEditorProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [userHeight, setUserHeight] = useState<number | null>(null)
  const rootClass = ['rich-text-editor', className].filter(Boolean).join(' ')
  const minResizeHeight = resolveMinResizeHeight(minHeight)
  const rootStyle: CSSProperties = {
    minHeight: toCssLength(minHeight),
    ...(userHeight != null
      ? ({
          height: userHeight,
          ['--rt-user-height' as string]: `${userHeight}px`,
        } as CSSProperties)
      : height != null
        ? { height: toCssLength(height) }
        : null),
  }

  const handleResizePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault()
      event.stopPropagation()

      const root = rootRef.current
      if (root == null) return

      const startY = event.clientY
      const startHeight = root.getBoundingClientRect().height
      const pointerId = event.pointerId
      event.currentTarget.setPointerCapture(pointerId)

      const applyHeight = (nextHeight: number) => {
        setUserHeight(nextHeight)
        root.style.setProperty('height', `${nextHeight}px`, 'important')
        root.style.setProperty('--rt-user-height', `${nextHeight}px`)
        root.dataset.resized = 'true'
      }

      const handlePointerMove = (moveEvent: PointerEvent) => {
        const nextHeight = Math.max(minResizeHeight, startHeight + moveEvent.clientY - startY)
        applyHeight(nextHeight)
      }

      const handlePointerUp = () => {
        document.removeEventListener('pointermove', handlePointerMove)
        document.removeEventListener('pointerup', handlePointerUp)
        document.removeEventListener('pointercancel', handlePointerUp)
      }

      document.addEventListener('pointermove', handlePointerMove)
      document.addEventListener('pointerup', handlePointerUp)
      document.addEventListener('pointercancel', handlePointerUp)
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
        data-resized={userHeight != null ? 'true' : undefined}
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
      data-resized={userHeight != null ? 'true' : undefined}
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
        role="separator"
        aria-orientation="horizontal"
        aria-label="에디터 높이 조절"
        onPointerDown={handleResizePointerDown}
      />
    </div>
  )
}
