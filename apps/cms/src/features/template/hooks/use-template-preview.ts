import { useEffect, useRef } from 'react'
import Viewer from '@toast-ui/editor/dist/toastui-editor-viewer'
import type { EmailTemplate, SmsTemplate } from '@/types/template'

export function useTemplatePreview<T extends EmailTemplate | SmsTemplate>(
  previewOpen: boolean,
  previewTarget: T | null,
  getPreviewContent: (template: T) => string
) {
  const viewerHostRef = useRef<HTMLDivElement | null>(null)
  const viewerRef = useRef<Viewer | null>(null)

  const destroyViewer = () => {
    if (viewerRef.current) {
      viewerRef.current.destroy()
      viewerRef.current = null
    }
  }

  useEffect(() => {
    if (!previewOpen || !previewTarget) {
      destroyViewer()
      return
    }
    if (!viewerHostRef.current) return

    destroyViewer()

    const content = getPreviewContent(previewTarget)
    const instance = new Viewer({
      el: viewerHostRef.current,
      initialValue: content,
      usageStatistics: false,
    })
    viewerRef.current = instance
  }, [previewOpen, previewTarget, getPreviewContent])

  return {
    viewerHostRef,
  }
}
