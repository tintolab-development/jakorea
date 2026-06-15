import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import {
  FormCertificatePreview,
  FORM_CERTIFICATE_PREVIEW_PDF_EXPORT_ROOT_CLASS,
} from '@/pages/templates/form-certificate-preview'
import { useFormCertificatePdfDownload } from '@/pages/templates/use-form-certificate-pdf-download'
import { useFormCertificatePreviewProps } from '@/pages/templates/use-form-certificate-preview-props'
import { useFormTemplateCertificateModalState } from '@/pages/templates/use-form-template-certificate-modal-state'
import {
  buildStudentCertificateFileName,
  buildStudentCertificateInitialStringValues,
  type StudentCertificateDownloadContext,
} from '@/features/program/general/lib/build-student-certificate-issuance'
import '@/pages/templates/form-certificate-preview.css'

export interface StudentCertificatePdfExportHostProps {
  context: StudentCertificateDownloadContext
  onComplete: (success: boolean) => void
}

export function StudentCertificatePdfExportHost({
  context,
  onComplete,
}: StudentCertificatePdfExportHostProps) {
  const pdfExportCanvasRef = useRef<HTMLDivElement>(null)
  const completedRef = useRef(false)
  const [captureMounted, setCaptureMounted] = useState(false)

  const initialStringValues = useMemo(
    () => buildStudentCertificateInitialStringValues(context),
    [context]
  )
  const modalState = useFormTemplateCertificateModalState(true, initialStringValues)
  const { pdfExport: certificatePdfExportProps } = useFormCertificatePreviewProps(modalState)

  const buildPdfFilename = useCallback(
    () => `${buildStudentCertificateFileName(context)}.pdf`,
    [context]
  )

  const { downloadPdf } = useFormCertificatePdfDownload({
    exportRootRef: pdfExportCanvasRef,
    buildFilename: buildPdfFilename,
  })

  useLayoutEffect(() => {
    setCaptureMounted(true)
    return () => setCaptureMounted(false)
  }, [context.student.id, context.certificateKind, context.issuanceReasonLabel])

  useEffect(() => {
    completedRef.current = false
  }, [context.student.id, context.certificateKind, context.issuanceReasonLabel])

  useEffect(() => {
    if (!captureMounted || completedRef.current) return

    completedRef.current = true
    let cancelled = false

    void (async () => {
      try {
        if (pdfExportCanvasRef.current == null) {
          if (!cancelled) onComplete(false)
          return
        }
        await downloadPdf()
        if (!cancelled) onComplete(true)
      } catch {
        if (!cancelled) onComplete(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [captureMounted, context.certificateKind, context.student.id, downloadPdf, onComplete])

  return (
    <div className={FORM_CERTIFICATE_PREVIEW_PDF_EXPORT_ROOT_CLASS} aria-hidden="true">
      <FormCertificatePreview {...certificatePdfExportProps} canvasRef={pdfExportCanvasRef} />
    </div>
  )
}
