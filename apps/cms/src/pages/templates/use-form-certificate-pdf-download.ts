import { useCallback, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { generatePdfBlobFromHtmlElement } from '@/shared/utils/certificate-pdf-generator'
import { downloadBlob } from '@/shared/utils/file-download'
import { isIssuedCertificateSerial } from '@/features/program/shared/lib/certificate-serial'
import { waitForCertificatePreviewCaptureReady } from './wait-for-certificate-preview-capture-ready'

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

  const downloadPdf = useCallback(
    async (
      issuedSerialNumber?: string,
      beforeSave?: (fileName: string) => Promise<void>
    ) => {
      if (isGeneratingRef.current) {
        throw new Error('PDF를 생성하는 중입니다. 잠시 후 다시 시도해 주세요.')
      }
      const el = exportRootRef.current
      if (!el) {
        throw new Error('PDF 다운로드에 실패했습니다. 잠시 후 다시 시도해 주세요.')
      }
      isGeneratingRef.current = true
      setIsDownloading(true)
      try {
        await waitForCertificatePreviewCaptureReady(el)
        const issued =
          issuedSerialNumber && isIssuedCertificateSerial(issuedSerialNumber)
            ? issuedSerialNumber
            : undefined
        const blob = await generatePdfBlobFromHtmlElement(el, {
          ...(issued ? { issuedSerialNumber: issued } : {}),
        })
        const fileName = buildFilename()
        if (beforeSave) await beforeSave(fileName)
        await downloadBlob(blob, fileName, { skipAccessLog: Boolean(beforeSave) })
      } finally {
        isGeneratingRef.current = false
        setIsDownloading(false)
      }
    },
    [exportRootRef, buildFilename]
  )

  return { downloadPdf, isDownloading }
}
