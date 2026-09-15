import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Program } from '@/types/domain'
import {
  getGeneralIndividualApplicationsForProgram,
  patchGeneralIndividualApplicantForApprovalStatus,
  patchGeneralIndividualApplicantForNotificationResend,
  updateGeneralIndividualApplicantApprovalStatus,
  updateGeneralIndividualApplicantCancelRejection,
  updateGeneralIndividualApplicantNotificationResend,
  type GeneralIndividualApplicantRow,
} from '@/data/mock/general-individual-applications-mock'
import {
  patchParticipantForCancelRejection,
  toParticipantCancelRejectionNotifyOptions,
  type ParticipantCancelRejectionConfirmPayload,
} from '@/features/program/general/lib/participant-cancel-rejection'
import {
  resolveApplicantNotificationResendSentAt,
  toApplicantNotificationResendNotifyOptions,
} from '@/features/program/general/lib/applicant-notification-resend'
import type { IndividualApplicantScreeningStage } from '@/features/program/general/lib/individual-application-visibility'
import {
  screeningDoc1DetailTitle,
  screeningDocPassedDetailTitle,
  screeningInterview2DetailTitle,
} from '@/features/program/general/lib/screening-subject-kind'
import {
  ParticipantApproveModal,
  ParticipantApprovalCompleteModal,
  ParticipantRejectModal,
  ParticipantRejectCompleteModal,
  ParticipantCancelRejectModal,
  ParticipantCancelRejectCompleteModal,
} from '@/features/program/shared/ui/detail-modal/components/participant-application-flow-modals'
import { ApplicantNotificationResendModal } from '@/features/program/shared/ui/detail-modal/components/applicant-notification-resend-modal'
import {
  ApplicantsDetailContents,
} from '@/features/program/shared/ui/program-detail/applicant-list/applicants-detail-contents'
import type { ApplicantDetailMeta } from '@/features/program/shared/ui/program-detail/applicant-list/use-applicants-detail'

function resolveParticipantScreeningDetailTitle(
  screeningStage: IndividualApplicantScreeningStage,
  name: string
): string {
  if (screeningStage === 'doc1') return screeningDoc1DetailTitle('participant', name)
  if (screeningStage === 'doc_passed') return screeningDocPassedDetailTitle('participant', name)
  if (screeningStage === 'interview2') return screeningInterview2DetailTitle('participant', name)
  return `참여자 신청 상세 (${name})`
}

export interface GeneralParticipantApplicantDetailViewProps {
  program: Program
  applicantId: string
  screeningStage: IndividualApplicantScreeningStage
  /** 목록 행(원격 API 등). 없으면 mock SSOT에서 id로 조회 */
  applicant?: GeneralIndividualApplicantRow | null
  onRegisterApplicantCloseHandler?: (fn: (() => boolean) | null) => void
  onApplicantDetailMetaChange?: (meta: ApplicantDetailMeta) => void
  onApplicantUpdated?: (row: GeneralIndividualApplicantRow) => void
}

export function GeneralParticipantApplicantDetailView({
  program,
  applicantId,
  screeningStage,
  applicant: applicantProp = null,
  onRegisterApplicantCloseHandler: _onRegisterApplicantCloseHandler,
  onApplicantDetailMetaChange,
  onApplicantUpdated,
}: GeneralParticipantApplicantDetailViewProps) {
  const resolveFromMock = useCallback((): GeneralIndividualApplicantRow | null => {
    return (
      getGeneralIndividualApplicationsForProgram(program.id).find(row => row.id === applicantId) ??
      null
    )
  }, [applicantId, program.id])

  const [applicant, setApplicant] = useState<GeneralIndividualApplicantRow | null>(
    () => applicantProp ?? resolveFromMock()
  )

  useEffect(() => {
    if (applicantProp) {
      setApplicant(applicantProp)
      return
    }
    const next = resolveFromMock()
    setApplicant(prev => (prev?.id === next?.id ? prev : next))
  }, [applicantProp, resolveFromMock])

  const onApplicantDetailMetaChangeRef = useRef(onApplicantDetailMetaChange)
  onApplicantDetailMetaChangeRef.current = onApplicantDetailMetaChange

  useEffect(() => {
    const notify = onApplicantDetailMetaChangeRef.current
    if (!notify) return
    if (!applicant) {
      notify(null)
      return
    }
    notify({
      title: resolveParticipantScreeningDetailTitle(screeningStage, applicant.applicantName),
      breadcrumbLabel: applicant.applicantName,
      kind: 'individual',
    })
    return () => {
      onApplicantDetailMetaChangeRef.current?.(null)
    }
  }, [applicant, screeningStage])

  const syncApplicant = useCallback(
    (row: GeneralIndividualApplicantRow) => {
      setApplicant(row)
      onApplicantUpdated?.(row)
    },
    [onApplicantUpdated]
  )

  const [approveTarget, setApproveTarget] = useState<{ id: string; name: string } | null>(null)
  const [approveComplete, setApproveComplete] = useState<{ participantName: string } | null>(null)
  const [rejectTarget, setRejectTarget] = useState<{ id: string; name: string } | null>(null)
  const [rejectComplete, setRejectComplete] = useState<{
    participantName: string
    rejectionReason: string
  } | null>(null)
  const [cancelRejectTarget, setCancelRejectTarget] = useState<{ id: string; name: string } | null>(
    null
  )
  const [cancelRejectComplete, setCancelRejectComplete] = useState<{
    participantName: string
  } | null>(null)
  const [notificationResendOpen, setNotificationResendOpen] = useState(false)

  const cancelRejectParticipant = useMemo(() => {
    if (!cancelRejectTarget || !applicant) return null
    return applicant
  }, [applicant, cancelRejectTarget])

  const handleOpenNotificationResend = useCallback(() => {
    if (!applicant) return
    if (applicant.approvalStatus !== 'approved' && applicant.approvalStatus !== 'rejected') return
    setNotificationResendOpen(true)
  }, [applicant])

  if (!applicant) return null

  return (
    <>
      <ApplicantsDetailContents
        type="individual-applications"
        detailVariant="general"
        data={applicant}
        program={program}
        individualScreeningStage={screeningStage}
        onBack={() => {}}
        onApprove={id => {
          setApproveTarget({ id, name: applicant.applicantName })
        }}
        onReject={id => {
          setRejectTarget({ id, name: applicant.applicantName })
        }}
        onCancelReject={id => {
          setCancelRejectTarget({ id, name: applicant.applicantName })
        }}
        onResendNotification={handleOpenNotificationResend}
        onIndividualDetailSaved={syncApplicant}
      />
      <ApplicantNotificationResendModal
        open={notificationResendOpen}
        subjectKind="individual"
        subjectName={applicant.applicantName}
        approvalStatus={
          applicant.approvalStatus === 'rejected' ? 'rejected' : 'approved'
        }
        onCancel={() => setNotificationResendOpen(false)}
        onConfirm={payload => {
          const notifyOptions = toApplicantNotificationResendNotifyOptions(payload)
          const sentAt = resolveApplicantNotificationResendSentAt(notifyOptions)
          const patched = patchGeneralIndividualApplicantForNotificationResend(
            applicant,
            sentAt,
            { rejectionReason: notifyOptions.rejectionReason }
          )
          updateGeneralIndividualApplicantNotificationResend(applicant.id, sentAt, {
            rejectionReason: notifyOptions.rejectionReason,
          })
          syncApplicant(patched)
          setNotificationResendOpen(false)
        }}
      />
      <ParticipantApproveModal
        open={approveTarget != null}
        participantName={approveTarget?.name ?? ''}
        onCancel={() => setApproveTarget(null)}
        onConfirm={payload => {
          if (!approveTarget) return
          const notifyOptions = {
            notifyTiming: payload.notifyTiming,
            manualNotifyAt: payload.manualNotifyAt,
          }
          const patched = patchGeneralIndividualApplicantForApprovalStatus(
            applicant,
            'approved',
            notifyOptions
          )
          updateGeneralIndividualApplicantApprovalStatus(applicant.id, 'approved', notifyOptions)
          syncApplicant(patched)
          setApproveTarget(null)
          setApproveComplete({ participantName: approveTarget.name })
        }}
      />
      <ParticipantApprovalCompleteModal
        open={approveComplete != null}
        participantName={approveComplete?.participantName ?? ''}
        onClose={() => setApproveComplete(null)}
      />
      <ParticipantRejectModal
        open={rejectTarget != null}
        participantName={rejectTarget?.name ?? ''}
        onCancel={() => setRejectTarget(null)}
        onConfirm={payload => {
          if (!rejectTarget) return
          const notifyOptions = {
            notifyTiming: payload.notifyTiming,
            manualNotifyAt: payload.manualNotifyAt,
            rejectionReason: payload.reason,
          }
          const patched = patchGeneralIndividualApplicantForApprovalStatus(
            applicant,
            'rejected',
            notifyOptions
          )
          updateGeneralIndividualApplicantApprovalStatus(applicant.id, 'rejected', notifyOptions)
          syncApplicant(patched)
          setRejectTarget(null)
          setRejectComplete({
            participantName: rejectTarget.name,
            rejectionReason: payload.reason,
          })
        }}
      />
      <ParticipantRejectCompleteModal
        open={rejectComplete != null}
        participantName={rejectComplete?.participantName ?? ''}
        rejectionReason={rejectComplete?.rejectionReason ?? ''}
        onClose={() => setRejectComplete(null)}
      />
      <ParticipantCancelRejectModal
        open={cancelRejectTarget != null}
        participant={cancelRejectParticipant}
        onCancel={() => setCancelRejectTarget(null)}
        onConfirm={(payload: ParticipantCancelRejectionConfirmPayload) => {
          if (!cancelRejectTarget) return
          const notifyOptions =
            payload.variant === 'alreadySent'
              ? toParticipantCancelRejectionNotifyOptions(payload)
              : undefined
          const patched = patchParticipantForCancelRejection(applicant, notifyOptions)
          updateGeneralIndividualApplicantCancelRejection(applicant.id, notifyOptions)
          syncApplicant(patched)
          setCancelRejectTarget(null)
          setCancelRejectComplete({ participantName: cancelRejectTarget.name })
        }}
      />
      <ParticipantCancelRejectCompleteModal
        open={cancelRejectComplete != null}
        participantName={cancelRejectComplete?.participantName ?? ''}
        onClose={() => setCancelRejectComplete(null)}
      />
    </>
  )
}
