import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useCertificateTemplateModalState } from '@/features/template/hooks/use-certificate-template-modal-state'
import { downloadIssuedCertificatePdf } from '@/features/program/shared/lib/apply-allocated-serial-for-pdf-capture'
import { getCertificateSerialAllocateErrorMessage } from '@/features/program/shared/api/certificate-serial-api'
import {
  FormCertificatePreview,
  FORM_CERTIFICATE_PREVIEW_PDF_EXPORT_ROOT_CLASS,
} from '@/pages/templates/form-certificate-preview'
import { useFormCertificatePdfDownload } from '@/pages/templates/use-form-certificate-pdf-download'
import { useFormCertificatePreviewProps } from '@/pages/templates/use-form-certificate-preview-props'
import {
  buildStudentCertificateFileName,
  buildStudentCertificateInitialStringValues,
  type StudentCertificateDownloadContext,
} from '@/features/program/general/lib/build-student-certificate-issuance'
import {
  resolveStudentCertificateTemplateKey,
  resolveStudentCertificateTemplateName,
} from '@/features/program/general/lib/student-certificate-template'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import '@/pages/templates/form-certificate-preview.css'

export interface StudentCertificatePdfExportHostProps {
  context: StudentCertificateDownloadContext
  onComplete: (success: boolean) => void
}

export function StudentCertificatePdfExportHost({
  context,
  onComplete,
}: StudentCertificatePdfExportHostProps) {
  const { showAlert } = useCmsAlert()
  const pdfExportCanvasRef = useRef<HTMLDivElement>(null)
  const completedRef = useRef(false)
  const [captureMounted, setCaptureMounted] = useState(false)
  const [pdfSerialNumber, setPdfSerialNumber] = useState<string | undefined>()

  const runtimeStringValues = useMemo(
    () => buildStudentCertificateInitialStringValues(context),
    [context]
  )
  const modalState = useCertificateTemplateModalState({
    open: true,
    templateCode: resolveStudentCertificateTemplateKey(context.certificateKind),
    fallbackTitleName: resolveStudentCertificateTemplateName(context.certificateKind),
    runtimeStringValues,
    runtimeStringOverrideKeys: ['participantInfo'],
  })
  const certificateType = resolveStudentCertificateTemplateKey(context.certificateKind)
  const { pdfExport: certificatePdfExportProps } = useFormCertificatePreviewProps(
    modalState,
    undefined,
    pdfSerialNumber
  )

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
    setPdfSerialNumber(undefined)
  }, [context.student.id, context.certificateKind, context.issuanceReasonLabel])

  useEffect(() => {
    if (!captureMounted || completedRef.current) return

    completedRef.current = true
    let cancelled = false

    void (async () => {
      try {
        if (pdfExportCanvasRef.current == null) {
          if (!cancelled) {
            showAlert({
              title: '안내',
              content: 'PDF 다운로드에 실패했습니다. 잠시 후 다시 시도해 주세요.',
            })
            onComplete(false)
          }
          return
        }
        await downloadIssuedCertificatePdf({
          subject: {
            programId: context.programId,
            subjectId: context.student.id,
            certificateType,
          },
          applySerial: setPdfSerialNumber,
          exportRoot: pdfExportCanvasRef.current,
          getExportRoot: () => pdfExportCanvasRef.current,
          downloadPdf,
        })
        if (cancelled) return
        if (!cancelled) onComplete(true)
      } catch (error) {
        if (!cancelled) {
          showAlert({
            title: '안내',
            content: getCertificateSerialAllocateErrorMessage(error),
          })
          onComplete(false)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    captureMounted,
    certificateType,
    context.certificateKind,
    context.programId,
    context.student.id,
    downloadPdf,
    onComplete,
    showAlert,
  ])

  return (
    <div className={FORM_CERTIFICATE_PREVIEW_PDF_EXPORT_ROOT_CLASS} aria-hidden="true">
      <FormCertificatePreview {...certificatePdfExportProps} canvasRef={pdfExportCanvasRef} />
    </div>
  )
}
