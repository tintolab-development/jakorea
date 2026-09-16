import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
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
  approveGeneralIndividualApplication,
  rejectGeneralIndividualApplication,
  submitGeneralIndividualDocumentResult,
} from '@/features/program/general/api/admin-applications-service'
import { shouldUseGeneralApplicationsRemoteApi } from '@/features/program/general/api/applications-remote-capabilities'
import { generalApplicationsQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { shouldPreferGeneralApplicationListMock } from '@/features/program/general/lib/prefer-general-application-list-mock'
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
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'

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
  const queryClient = useQueryClient()
  const { showAlert } = useCmsAlert()
  const useRemote =
    !shouldPreferGeneralApplicationListMock(program) && shouldUseGeneralApplicationsRemoteApi()

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

  const invalidateIndividualApplications = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: generalApplicationsQueryKeys.individualScope(program.id),
    })
  }, [program.id, queryClient])

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
  const [decisionBusy, setDecisionBusy] = useState(false)

  const cancelRejectParticipant = useMemo(() => {
    if (!cancelRejectTarget || !applicant) return null
    return applicant
  }, [applicant, cancelRejectTarget])

  const handleOpenNotificationResend = useCallback(() => {
    if (!applicant) return
    if (applicant.approvalStatus !== 'approved' && applicant.approvalStatus !== 'rejected') return
    setNotificationResendOpen(true)
  }, [applicant])

  const notifyDecisionFailure = useCallback(
    (error: unknown) => {
      console.debug('participant detail decision remote failed', error)
      void showAlert({
        title: '처리 실패',
        content: '참여자 신청 상태 변경 중 오류가 발생했습니다. 다시 시도해 주세요.',
      })
    },
    [showAlert]
  )

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
        onCancel={() => {
          if (decisionBusy) return
          setApproveTarget(null)
        }}
        onConfirm={payload => {
          if (!approveTarget || decisionBusy) return
          const notifyOptions = {
            notifyTiming: payload.notifyTiming,
            manualNotifyAt: payload.manualNotifyAt,
          }
          const run = async () => {
            if (useRemote) {
              setDecisionBusy(true)
              try {
                if (screeningStage === 'doc1') {
                  await submitGeneralIndividualDocumentResult(applicant.id, { result: 'PASS' })
                } else {
                  await approveGeneralIndividualApplication(applicant.id)
                }
                await invalidateIndividualApplications()
              } catch (error) {
                notifyDecisionFailure(error)
                return
              } finally {
                setDecisionBusy(false)
              }
            } else {
              updateGeneralIndividualApplicantApprovalStatus(applicant.id, 'approved', notifyOptions)
            }
            const patched =
              screeningStage === 'doc1'
                ? {
                    ...applicant,
                    documentScreeningStatus: 'pass' as const,
                    approvalNotifyTiming: notifyOptions.notifyTiming,
                  }
                : patchGeneralIndividualApplicantForApprovalStatus(
                    applicant,
                    'approved',
                    notifyOptions
                  )
            syncApplicant(patched)
            setApproveTarget(null)
            setApproveComplete({ participantName: approveTarget.name })
          }
          void run()
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
        onCancel={() => {
          if (decisionBusy) return
          setRejectTarget(null)
        }}
        onConfirm={payload => {
          if (!rejectTarget || decisionBusy) return
          const notifyOptions = {
            notifyTiming: payload.notifyTiming,
            manualNotifyAt: payload.manualNotifyAt,
            rejectionReason: payload.reason,
          }
          const run = async () => {
            if (useRemote) {
              setDecisionBusy(true)
              try {
                if (screeningStage === 'doc1') {
                  await submitGeneralIndividualDocumentResult(applicant.id, {
                    result: 'FAIL',
                    reason: payload.reason.trim() || '반려',
                  })
                } else {
                  await rejectGeneralIndividualApplication(applicant.id, {
                    reason: payload.reason.trim() || '반려',
                  })
                }
                await invalidateIndividualApplications()
              } catch (error) {
                notifyDecisionFailure(error)
                return
              } finally {
                setDecisionBusy(false)
              }
            } else {
              updateGeneralIndividualApplicantApprovalStatus(applicant.id, 'rejected', notifyOptions)
            }
            const patched =
              screeningStage === 'doc1'
                ? {
                    ...applicant,
                    documentScreeningStatus: 'fail' as const,
                    participationRejectionReason: payload.reason,
                    rejectionNotifyTiming: notifyOptions.notifyTiming,
                  }
                : patchGeneralIndividualApplicantForApprovalStatus(
                    applicant,
                    'rejected',
                    notifyOptions
                  )
            syncApplicant(patched)
            setRejectTarget(null)
            setRejectComplete({
              participantName: rejectTarget.name,
              rejectionReason: payload.reason,
            })
          }
          void run()
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
