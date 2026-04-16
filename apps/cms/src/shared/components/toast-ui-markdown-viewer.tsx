import { useEffect, useRef } from 'react'
import Viewer from '@toast-ui/editor/dist/toastui-editor-viewer'
import '@toast-ui/editor/dist/toastui-editor-viewer.css'
import './toast-ui-markdown-viewer.css'

export type ToastUiMarkdownViewerProps = {
  /** Markdown 본문 (Toast UI Viewer) */
  markdown: string
  className?: string
}

/**
 * Toast UI Editor 읽기 전용 뷰어 — 본문 미리보기·상세 본문 등에 사용
 */
export function ToastUiMarkdownViewer({ markdown, className }: ToastUiMarkdownViewerProps) {
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = hostRef.current
    if (!el) return

    const instance = new Viewer({
      el,
      initialValue: markdown,
      usageStatistics: false,
    })

    return () => {
      instance.destroy()
    }
  }, [markdown])

  return (
    <div className={`toast-ui-markdown-viewer${className ? ` ${className}` : ''}`}>
      <div ref={hostRef} className="toast-ui-markdown-viewer__host" />
    </div>
  )
}
