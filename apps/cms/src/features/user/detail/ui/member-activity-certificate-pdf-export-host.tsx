import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useCertificateTemplateModalState } from '@/features/template/hooks/use-certificate-template-modal-state'
import {
  CERTIFICATE_PARTICIPANT_INFO_OVERRIDE_KEYS,
  INSTRUCTOR_ACTIVITY_CERTIFICATE_TEMPLATE_CODE,
  VOLUNTEER_ACTIVITY_CERTIFICATE_TEMPLATE_CODE,
} from '@/features/template/lib/certificate-form-settings'
import { DEFAULT_TEMPLATE_CUSTOM_FIELD_STRING_VALUES } from '@/features/template/ui/template-management/template-custom-fields-form'
import { ACTIVITY_CERTIFICATE_BODY_CONTENT } from '@/features/template/lib/certificate-body-content'
import { downloadIssuedCertificatePdf } from '@/features/program/shared/lib/apply-allocated-serial-for-pdf-capture'
import { getCertificateSerialAllocateErrorMessage } from '@/features/program/shared/api/certificate-serial-api'
import { certificateIssueReasonCodeFromLabel } from '@/features/program/shared/lib/certificate-serial'
import {
  ACTIVITY_CERTIFICATE_DOCUMENT_TITLE,
  buildActivityCertificateFileName,
  buildActivityCertificateParticipantInfoLines,
} from '@/features/program/general/lib/build-activity-certificate-issuance-preview'
import {
  CERTIFICATE_ELIGIBILITY_TYPE_INSTRUCTOR_ACTIVITY,
  type ActivityCertificateEligibilityType,
} from '@/features/program/general/lib/activity-certificate-period-hours'
import {
  ACTIVITY_CERTIFICATE_BLOCKED_TITLE,
  activityCertificateBlockMessageFromError,
} from '@/features/program/general/lib/activity-certificate-issue-block'
import {
  FormCertificatePreview,
  FORM_CERTIFICATE_PREVIEW_PDF_EXPORT_ROOT_CLASS,
} from '@/pages/templates/form-certificate-preview'
import { FormCertificatePdfExportOverlay } from '@/pages/templates/form-certificate-pdf-export-overlay'
import { useFormCertificatePdfDownload } from '@/pages/templates/use-form-certificate-pdf-download'
import { useFormCertificatePreviewProps } from '@/pages/templates/use-form-certificate-preview-props'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import '@/pages/templates/form-certificate-preview.css'
import '@/features/program/general/ui/detail-modal/program-status/activity-certificate-issuance-preview-modal.css'

/** 회원 상세 강의·봉사 이력 — 1건 활동인증서 PDF 발급 대상 */
export type MemberActivityCertificatePdfContext = {
  certificateType: ActivityCertificateEligibilityType
  participantId: number
  programId?: string | number | null
  programName: string
  name: string
  birthDate?: string | null
  affiliation?: string | null
  /** 서버 eligibility로 계산한 「활동기간」 표시 문구 */
  participationPeriod?: string | null
  issuanceReasonLabel: string
}

export interface MemberActivityCertificatePdfExportHostProps {
  context: MemberActivityCertificatePdfContext
  onComplete: (success: boolean) => void
}

/**
 * 프로그램 상세 활동인증서 미리보기(강사·봉사자)와 같은 양식·같은 PDF 캡처 경로로
 * 화면에 띄우지 않고 바로 PDF를 내려받는다(고유번호 발급 → PDF 생성 → 다운로드 이력 → 저장).
 */
export function MemberActivityCertificatePdfExportHost({
  context,
  onComplete,
}: MemberActivityCertificatePdfExportHostProps) {
  const { showAlert } = useCmsAlert()
  const pdfExportCanvasRef = useRef<HTMLDivElement>(null)
  const completedRef = useRef(false)
  const [captureMounted, setCaptureMounted] = useState(false)
  const [pdfSerialNumber, setPdfSerialNumber] = useState<string | undefined>()
  // 서버 발급일 — PDF 본문 발급일(state)과 파일명 날짜(ref, 캡처 직후 읽음)에 같은 값을 쓴다.
  const [pdfIssueDate, setPdfIssueDate] = useState<Date | undefined>()
  const pdfIssueDateRef = useRef<Date | null>(null)
  const applyIssuedAt = useCallback((issuedAt: Date) => {
    pdfIssueDateRef.current = issuedAt
    setPdfIssueDate(issuedAt)
  }, [])

  const templateCode =
    context.certificateType === CERTIFICATE_ELIGIBILITY_TYPE_INSTRUCTOR_ACTIVITY
      ? INSTRUCTOR_ACTIVITY_CERTIFICATE_TEMPLATE_CODE
      : VOLUNTEER_ACTIVITY_CERTIFICATE_TEMPLATE_CODE

  const runtimeStringValues = useMemo(
    () => ({
      ...DEFAULT_TEMPLATE_CUSTOM_FIELD_STRING_VALUES,
      titleName: ACTIVITY_CERTIFICATE_DOCUMENT_TITLE,
      bodyContent: ACTIVITY_CERTIFICATE_BODY_CONTENT,
      participantInfo: buildActivityCertificateParticipantInfoLines({
        name: context.name,
        birthDate: context.birthDate,
        affiliation: context.affiliation,
        programName: context.programName,
        participationPeriod: context.participationPeriod,
        issuanceReasonLabel: context.issuanceReasonLabel,
      }),
    }),
    [context]
  )

  const modalState = useCertificateTemplateModalState({
    open: true,
    templateCode,
    fallbackTitleName: ACTIVITY_CERTIFICATE_DOCUMENT_TITLE,
    runtimeStringValues,
    runtimeStringOverrideKeys: CERTIFICATE_PARTICIPANT_INFO_OVERRIDE_KEYS,
  })
  const { pdfExport: certificatePdfExportProps } = useFormCertificatePreviewProps(
    modalState,
    pdfIssueDate,
    pdfSerialNumber
  )

  const buildPdfFilename = useCallback(
    () => `${buildActivityCertificateFileName(context.name, pdfIssueDateRef.current)}.pdf`,
    [context.name]
  )

  const { downloadPdf } = useFormCertificatePdfDownload({
    exportRootRef: pdfExportCanvasRef,
    buildFilename: buildPdfFilename,
  })

  // 발급 1건마다 새로 마운트된다(부모가 context가 있을 때만 렌더) — 캡처 대상이 그려진 뒤 시작한다.
  useLayoutEffect(() => {
    setCaptureMounted(true)
    return () => setCaptureMounted(false)
  }, [])

  const templateSettingsLoaded = modalState.isTemplateSettingsLoaded

  useEffect(() => {
    // 템플릿 설정(제목·로고·참여자 줄 배치)을 받은 뒤에만 캡처한다. 먼저 찍으면 기본 양식으로 나오고
    // 고유번호·다운로드 이력만 남는다.
    if (!captureMounted || !templateSettingsLoaded || completedRef.current) return

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
            subjectId: context.participantId,
            certificateType: templateCode,
            issueReason: certificateIssueReasonCodeFromLabel(context.issuanceReasonLabel),
          },
          applySerial: setPdfSerialNumber,
          applyIssuedAt,
          exportRoot: pdfExportCanvasRef.current,
          getExportRoot: () => pdfExportCanvasRef.current,
          downloadPdf,
        })
        if (!cancelled) onComplete(true)
      } catch (error) {
        if (cancelled) return
        const blockMessage = activityCertificateBlockMessageFromError(error)
        showAlert(
          blockMessage
            ? { title: ACTIVITY_CERTIFICATE_BLOCKED_TITLE, content: blockMessage }
            : { title: '안내', content: getCertificateSerialAllocateErrorMessage(error) }
        )
        onComplete(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    applyIssuedAt,
    captureMounted,
    context.issuanceReasonLabel,
    context.participantId,
    context.programId,
    downloadPdf,
    onComplete,
    showAlert,
    templateCode,
    templateSettingsLoaded,
  ])

  return (
    <>
      <FormCertificatePdfExportOverlay visible />
      <div className={FORM_CERTIFICATE_PREVIEW_PDF_EXPORT_ROOT_CLASS} aria-hidden="true">
        <div className="activity-cert-issuance-preview-modal__pdf-host">
          <FormCertificatePreview {...certificatePdfExportProps} canvasRef={pdfExportCanvasRef} />
        </div>
      </div>
    </>
  )
}
