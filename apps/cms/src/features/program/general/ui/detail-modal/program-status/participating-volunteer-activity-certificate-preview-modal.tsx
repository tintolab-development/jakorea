/**
 * 참여 봉사자 — 활동확인서(활동인증서) 발급 미리보기
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CloseOutlined, DownloadOutlined } from '@ant-design/icons'
import {
  ACTIVITY_CERTIFICATE_DOCUMENT_TITLE,
  buildActivityCertificateFileName,
  buildActivityCertificateInitialStringValuesForVolunteer,
} from '@/features/program/general/lib/build-activity-certificate-issuance-preview'
import { VOLUNTEER_ACTIVITY_CERTIFICATE_TEMPLATE_CODE } from '@/features/template/lib/certificate-form-settings'
import { useCertificateTemplateModalState } from '@/features/template/hooks/use-certificate-template-modal-state'
import { applyAllocatedSerialForPdfCapture } from '@/features/program/shared/lib/apply-allocated-serial-for-pdf-capture'
import { getCertificateSerialAllocateErrorMessage } from '@/features/program/shared/api/certificate-serial-api'
import type { ParticipatingVolunteerDetailRow } from '@/features/program/general/lib/participating-volunteer-detail'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import type { Program } from '@/types/domain'
import {
  FormCertificatePreview,
  FORM_CERTIFICATE_PREVIEW_PDF_EXPORT_ROOT_CLASS,
} from '@/pages/templates/form-certificate-preview'
import { FormCertificatePdfExportOverlay } from '@/pages/templates/form-certificate-pdf-export-overlay'
import { useFormCertificatePdfDownload } from '@/pages/templates/use-form-certificate-pdf-download'
import { useFormCertificatePreviewProps } from '@/pages/templates/use-form-certificate-preview-props'
import '@/features/template/ui/template-management/template-fullpage-modal.css'
import '@/pages/templates/form-certificate-preview.css'
import './activity-certificate-issuance-preview-modal.css'

export interface ParticipatingVolunteerActivityCertificatePreviewModalProps {
  open: boolean
  onClose: () => void
  volunteer: ParticipatingVolunteerDetailRow
  program?: Program | null
}

export function ParticipatingVolunteerActivityCertificatePreviewModal({
  open,
  onClose,
  volunteer,
  program,
}: ParticipatingVolunteerActivityCertificatePreviewModalProps) {
  const { showAlert } = useCmsAlert()
  const pdfExportCanvasRef = useRef<HTMLDivElement>(null)
  const [pdfSerialNumber, setPdfSerialNumber] = useState<string | undefined>()
  const [isAllocatingSerial, setIsAllocatingSerial] = useState(false)

  const runtimeStringValues = useMemo(
    () =>
      buildActivityCertificateInitialStringValuesForVolunteer(volunteer.volunteerName, {
        birthDate: volunteer.birthDate,
        institutionName: volunteer.assignedInstitutionNames[0],
        program,
      }),
    [program, volunteer.assignedInstitutionNames, volunteer.birthDate, volunteer.volunteerName]
  )

  const modalState = useCertificateTemplateModalState({
    open,
    templateCode: VOLUNTEER_ACTIVITY_CERTIFICATE_TEMPLATE_CODE,
    fallbackTitleName: ACTIVITY_CERTIFICATE_DOCUMENT_TITLE,
    runtimeStringValues,
    runtimeStringOverrideKeys: ['participantInfo'],
  })
  const { interactive: certificateInteractiveProps, pdfExport: certificatePdfExportProps } =
    useFormCertificatePreviewProps(modalState, undefined, pdfSerialNumber)

  const fileName = useMemo(
    () => buildActivityCertificateFileName(volunteer.volunteerName),
    [volunteer.volunteerName]
  )

  const buildPdfFilename = useCallback(() => `${fileName}.pdf`, [fileName])

  const { downloadPdf, isDownloading: isPdfDownloading } = useFormCertificatePdfDownload({
    exportRootRef: pdfExportCanvasRef,
    buildFilename: buildPdfFilename,
  })

  useEffect(() => {
    if (!open) setPdfSerialNumber(undefined)
  }, [open])

  const handleClose = useCallback(() => {
    setPdfSerialNumber(undefined)
    onClose()
  }, [onClose])

  const handleDownloadPdf = useCallback(async () => {
    if (isAllocatingSerial || isPdfDownloading) return
    setIsAllocatingSerial(true)
    try {
      await applyAllocatedSerialForPdfCapture({
        subject: {
          programId: program?.id,
          subjectId: volunteer.id,
          certificateType: VOLUNTEER_ACTIVITY_CERTIFICATE_TEMPLATE_CODE,
        },
        applySerial: setPdfSerialNumber,
        exportRoot: pdfExportCanvasRef.current,
      })
      await downloadPdf()
    } catch (error) {
      showAlert({
        title: '안내',
        content: getCertificateSerialAllocateErrorMessage(error),
      })
    } finally {
      setIsAllocatingSerial(false)
    }
  }, [
    downloadPdf,
    isAllocatingSerial,
    isPdfDownloading,
    program?.id,
    showAlert,
    volunteer.id,
  ])

  if (!open) return null

  const actionButtons = (
    <div className="full-page-modal__actions activity-cert-issuance-preview-modal__actions">
      <CmsButton variant="secondary" size="medium" onClick={handleClose}>
        닫기
      </CmsButton>
      <CmsButton
        variant="primary"
        size="medium"
        width={140}
        icon={<DownloadOutlined />}
        disabled={isPdfDownloading || isAllocatingSerial}
        onClick={() => void handleDownloadPdf()}
      >
        파일 다운로드
      </CmsButton>
    </div>
  )

  return (
    <>
      <FormCertificatePdfExportOverlay visible={isPdfDownloading || isAllocatingSerial} />
      <TealHeaderModal
        open={open}
        onCancel={handleClose}
        title=""
        size="full"
        hideHeader
        className="full-page-modal activity-cert-issuance-preview-modal"
        zIndex={1400}
      >
        <div className="full-page-modal__layout">
          <header className="full-page-modal__topbar">
            <div className="full-page-modal__title activity-cert-issuance-preview-modal__title-wrap">
              <span className="full-page-modal__title-text activity-cert-issuance-preview-modal__file-name">
                {fileName}
              </span>
              <span className="activity-cert-issuance-preview-modal__badge">미리보기</span>
            </div>
            <button
              type="button"
              className="full-page-modal__close"
              onClick={handleClose}
              aria-label="닫기"
            >
              <CloseOutlined />
            </button>
          </header>

          <div className="full-page-modal__body">
            <div className="full-page-modal__body-header">
              <p className="full-page-modal__description activity-cert-issuance-preview-modal__description">
                {ACTIVITY_CERTIFICATE_DOCUMENT_TITLE} 미리보기 화면입니다.
              </p>
              {actionButtons}
            </div>

            <div className="activity-cert-issuance-preview-modal__workspace">
              <div className="activity-cert-issuance-preview-modal__page">
                <div className="activity-cert-issuance-preview-modal__scale-inner">
                  <FormCertificatePreview {...certificateInteractiveProps} />
                </div>
              </div>
            </div>
            <div className="full-page-modal__body-bottom" aria-hidden="true" />
          </div>
        </div>
      </TealHeaderModal>

      {open ? (
        <div className={FORM_CERTIFICATE_PREVIEW_PDF_EXPORT_ROOT_CLASS} aria-hidden="true">
          <div className="activity-cert-issuance-preview-modal__pdf-host">
            <FormCertificatePreview {...certificatePdfExportProps} canvasRef={pdfExportCanvasRef} />
          </div>
        </div>
      ) : null}
    </>
  )
}
