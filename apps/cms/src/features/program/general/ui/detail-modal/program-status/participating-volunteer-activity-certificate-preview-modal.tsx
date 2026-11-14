/**
 * 참여 봉사자 — 활동확인서(활동인증서) 발급 미리보기
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ModalCloseIcon } from '@/shared/ui/icons'
import {
  ACTIVITY_CERTIFICATE_DOCUMENT_TITLE,
  buildActivityCertificateFileName,
  buildActivityCertificateInitialStringValuesForVolunteer,
} from '@/features/program/general/lib/build-activity-certificate-issuance-preview'
import {
  CERTIFICATE_PARTICIPANT_INFO_OVERRIDE_KEYS,
  VOLUNTEER_ACTIVITY_CERTIFICATE_TEMPLATE_CODE,
} from '@/features/template/lib/certificate-form-settings'
import { useCertificateTemplateModalState } from '@/features/template/hooks/use-certificate-template-modal-state'
import { downloadIssuedCertificatePdf } from '@/features/program/shared/lib/apply-allocated-serial-for-pdf-capture'
import { getCertificateSerialAllocateErrorMessage } from '@/features/program/shared/api/certificate-serial-api'
import { unmaskVolunteerForCertificateIssue } from '@/features/program/shared/lib/unmask-for-certificate-issue'
import { getGeneralProgramApiErrorMessage } from '@/features/program/general/api/get-general-program-api-error'
import type { ParticipatingVolunteerDetailRow } from '@/features/program/general/lib/participating-volunteer-detail'
import { certificateIssueReasonCodeFromLabel } from '@/features/program/shared/lib/certificate-serial'
import { useActivityCertificatePeriodHours } from '@/features/program/general/hooks/use-activity-certificate-period-hours'
import {
  ACTIVITY_CERTIFICATE_BLOCKED_TITLE,
  activityCertificateBlockMessageFromError,
} from '@/features/program/general/lib/activity-certificate-issue-block'
import { CERTIFICATE_ELIGIBILITY_TYPE_VOLUNTEER_ACTIVITY } from '@/features/program/general/lib/activity-certificate-period-hours'
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
import { ButtonDownloadIcon } from '@/shared/ui/icons/ButtonIcons'
import '@/features/template/ui/template-management/template-fullpage-modal.css'
import '@/pages/templates/form-certificate-preview.css'
import './activity-certificate-issuance-preview-modal.css'

export interface ParticipatingVolunteerActivityCertificatePreviewModalProps {
  open: boolean
  onClose: () => void
  volunteer: ParticipatingVolunteerDetailRow
  program?: Program | null
  /** 발급 사유 모달에서 고른 사유 라벨 — 참여자 정보 「발급목적」 줄·발급 사유 코드 */
  issuanceReasonLabel?: string
}

export function ParticipatingVolunteerActivityCertificatePreviewModal({
  open,
  onClose,
  volunteer,
  program,
  issuanceReasonLabel,
}: ParticipatingVolunteerActivityCertificatePreviewModalProps) {
  const { showAlert } = useCmsAlert()
  const pdfExportCanvasRef = useRef<HTMLDivElement>(null)
  const [isAllocatingSerial, setIsAllocatingSerial] = useState(false)
  const [pdfSerialNumber, setPdfSerialNumber] = useState<string | undefined>()
  // 서버 발급일 — PDF 본문 발급일(state)과 파일명 날짜(ref, 캡처 직후 읽음)에 같은 값을 쓴다.
  const [pdfIssueDate, setPdfIssueDate] = useState<Date | undefined>()
  const pdfIssueDateRef = useRef<Date | null>(null)
  const applyIssuedAt = useCallback((issuedAt: Date) => {
    pdfIssueDateRef.current = issuedAt
    setPdfIssueDate(issuedAt)
  }, [])
  const [unmaskedVolunteer, setUnmaskedVolunteer] = useState(volunteer)
  const [isUnmasking, setIsUnmasking] = useState(false)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setUnmaskedVolunteer(volunteer)
    setIsUnmasking(true)
    void unmaskVolunteerForCertificateIssue(volunteer, program?.id)
      .then(next => {
        if (!cancelled) setUnmaskedVolunteer(next)
      })
      .catch(error => {
        if (cancelled) return
        showAlert({
          title: '열람 실패',
          content: getGeneralProgramApiErrorMessage(error, '개인정보 원문 조회에 실패했습니다.'),
        })
        onClose()
      })
      .finally(() => {
        if (!cancelled) setIsUnmasking(false)
      })
    return () => {
      cancelled = true
    }
  }, [
    onClose,
    open,
    program?.id,
    showAlert,
    volunteer,
    volunteer.id,
    volunteer.memberId,
    volunteer.volunteerApplicationId,
  ])

  const periodHours = useActivityCertificatePeriodHours({
    open,
    participantId: volunteer.id,
    certificateType: CERTIFICATE_ELIGIBILITY_TYPE_VOLUNTEER_ACTIVITY,
  })

  const runtimeStringValues = useMemo(
    () =>
      buildActivityCertificateInitialStringValuesForVolunteer(unmaskedVolunteer.volunteerName, {
        birthDate: unmaskedVolunteer.birthDate,
        affiliation: unmaskedVolunteer.affiliation,
        program,
        issuanceReasonLabel,
        participationPeriod: periodHours.participationPeriod,
      }),
    [
      issuanceReasonLabel,
      periodHours.participationPeriod,
      program,
      unmaskedVolunteer.affiliation,
      unmaskedVolunteer.birthDate,
      unmaskedVolunteer.volunteerName,
    ]
  )

  const issueReasonCode = useMemo(
    () => certificateIssueReasonCodeFromLabel(issuanceReasonLabel),
    [issuanceReasonLabel]
  )

  const modalState = useCertificateTemplateModalState({
    open,
    templateCode: VOLUNTEER_ACTIVITY_CERTIFICATE_TEMPLATE_CODE,
    fallbackTitleName: ACTIVITY_CERTIFICATE_DOCUMENT_TITLE,
    runtimeStringValues,
    runtimeStringOverrideKeys: CERTIFICATE_PARTICIPANT_INFO_OVERRIDE_KEYS,
  })
  const { interactive: certificateInteractiveProps, pdfExport: certificatePdfExportProps } =
    useFormCertificatePreviewProps(modalState, pdfIssueDate, pdfSerialNumber)

  const fileName = useMemo(
    () => buildActivityCertificateFileName(unmaskedVolunteer.volunteerName),
    [unmaskedVolunteer.volunteerName]
  )

  const buildPdfFilename = useCallback(
    () =>
      `${buildActivityCertificateFileName(unmaskedVolunteer.volunteerName, pdfIssueDateRef.current)}.pdf`,
    [unmaskedVolunteer.volunteerName]
  )

  const { downloadPdf, isDownloading: isPdfDownloading } = useFormCertificatePdfDownload({
    exportRootRef: pdfExportCanvasRef,
    buildFilename: buildPdfFilename,
  })

  const handleClose = useCallback(() => {
    onClose()
  }, [onClose])

  const handleDownloadPdf = useCallback(async () => {
    if (isAllocatingSerial || isPdfDownloading || isUnmasking) return
    setIsAllocatingSerial(true)
    try {
      await downloadIssuedCertificatePdf({
        subject: {
          programId: program?.id,
          subjectId: unmaskedVolunteer.id,
          certificateType: VOLUNTEER_ACTIVITY_CERTIFICATE_TEMPLATE_CODE,
          // 발급 사유 모달에서 고른 사유 — 문서 「발급목적」과 같은 값을 코드로 issueReason에 전송
          issueReason: issueReasonCode,
        },
        applySerial: setPdfSerialNumber,
        applyIssuedAt,
        exportRoot: pdfExportCanvasRef.current,
        getExportRoot: () => pdfExportCanvasRef.current,
        downloadPdf,
      })
    } catch (error) {
      const blockMessage = activityCertificateBlockMessageFromError(error)
      showAlert(
        blockMessage
          ? { title: ACTIVITY_CERTIFICATE_BLOCKED_TITLE, content: blockMessage }
          : { title: '안내', content: getCertificateSerialAllocateErrorMessage(error) }
      )
    } finally {
      setIsAllocatingSerial(false)
    }
  }, [
    applyIssuedAt,
    downloadPdf,
    isAllocatingSerial,
    isPdfDownloading,
    isUnmasking,
    issueReasonCode,
    program?.id,
    showAlert,
    unmaskedVolunteer.id,
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
        icon={<ButtonDownloadIcon />}
        disabled={isPdfDownloading || isAllocatingSerial || isUnmasking}
        onClick={() => void handleDownloadPdf()} >
        파일 다운로드
      </CmsButton>
    </div>
  )

  return (
    <>
      <FormCertificatePdfExportOverlay
        visible={isPdfDownloading || isAllocatingSerial || isUnmasking}
      />
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
              <ModalCloseIcon tone="white" />
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
