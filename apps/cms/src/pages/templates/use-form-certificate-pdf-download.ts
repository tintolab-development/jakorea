import { useCallback, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { message } from 'antd'
import { generatePdfBlobFromHtmlElement } from '@/shared/utils/certificate-pdf-generator'
import { downloadBlob } from '@/shared/utils/file-download'

export interface UseFormCertificatePdfDownloadOptions {
  /** html2canvas 대상 — 흰색 캔버스 노드만 넘기면 회색 바깥 래퍼는 PDF에 포함되지 않음 */
  exportRootRef: RefObject<HTMLElement | null>
  buildFilename: () => string
}

/**
 * 수료증 캡처 DOM(`exportRootRef`)을 PDF로 저장합니다.
 */
export function useFormCertificatePdfDownload({
  exportRootRef,
  buildFilename,
}: UseFormCertificatePdfDownloadOptions) {
  const [isDownloading, setIsDownloading] = useState(false)
  /** 상태 갱신 전에도 연속 클릭을 막기 위한 동기 가드 */
  const isGeneratingRef = useRef(false)

  const downloadPdf = useCallback(async () => {
    if (isGeneratingRef.current) {
      return
    }
    const el = exportRootRef.current
    if (!el) {
      message.error('PDF를 생성할 수 없습니다.')
      return
    }
    isGeneratingRef.current = true
    setIsDownloading(true)
    try {
      await new Promise<void>(resolve => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      })
      const blob = await generatePdfBlobFromHtmlElement(el)
      downloadBlob(blob, buildFilename())
      message.success('PDF를 저장했습니다.')
    } catch {
      message.error('PDF 생성에 실패했습니다.')
    } finally {
      isGeneratingRef.current = false
      setIsDownloading(false)
    }
  }, [exportRootRef, buildFilename])

  return { downloadPdf, isDownloading }
}
