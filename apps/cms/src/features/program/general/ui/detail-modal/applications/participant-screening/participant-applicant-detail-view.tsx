import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Program } from '@/types/domain'
import {
  getGeneralIndividualApplicationsForProgram,
  patchGeneralIndividualApplicantForApprovalStatus,
  updateGeneralIndividualApplicantApprovalStatus,
  updateGeneralIndividualApplicantCancelRejection,
  type GeneralIndividualApplicantRow,
} from '@/data/mock/general-individual-applications-mock'
import {
  patchParticipantForCancelRejection,
  toParticipantCancelRejectionNotifyOptions,
  type ParticipantCancelRejectionConfirmPayload,
} from '@/features/program/general/lib/participant-cancel-rejection'
import type { IndividualApplicantScreeningStage } from '@/features/program/general/lib/individual-application-visibility'
import {
  ParticipantApproveModal,
  ParticipantApprovalCompleteModal,
  ParticipantRejectModal,
  ParticipantRejectCompleteModal,
  ParticipantCancelRejectModal,
  ParticipantCancelRejectCompleteModal,
} from '@/features/program/shared/ui/detail-modal/components/participant-application-flow-modals'
import {
  ApplicantsDetailContents,
} from '@/features/program/shared/ui/program-detail/applicant-list/applicants-detail-contents'
import type { ApplicantDetailMeta } from '@/features/program/shared/ui/program-detail/applicant-list/use-applicants-detail'

export interface GeneralParticipantApplicantDetailViewProps {
  program: Program
  applicantId: string
  screeningStage: IndividualApplicantScreeningStage
  onRegisterApplicantCloseHandler?: (fn: (() => boolean) | null) => void
  onApplicantDetailMetaChange?: (meta: ApplicantDetailMeta) => void
  onApplicantUpdated?: (row: GeneralIndividualApplicantRow) => void
}

export function GeneralParticipantApplicantDetailView({
  program,
  applicantId,
  screeningStage,
  onRegisterApplicantCloseHandler: _onRegisterApplicantCloseHandler,
  onApplicantDetailMetaChange: _onApplicantDetailMetaChange,
  onApplicantUpdated,
}: GeneralParticipantApplicantDetailViewProps) {
  const [applicant, setApplicant] = useState<GeneralIndividualApplicantRow | null>(() =>
    getGeneralIndividualApplicationsForProgram(program.id).find(row => row.id === applicantId) ?? null
  )

  useEffect(() => {
    const next =
      getGeneralIndividualApplicationsForProgram(program.id).find(row => row.id === applicantId) ??
      null
    setApplicant(prev => (prev?.id === next?.id ? prev : next))
  }, [applicantId, program.id])

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

  const cancelRejectParticipant = useMemo(() => {
    if (!cancelRejectTarget || !applicant) return null
    return applicant
  }, [applicant, cancelRejectTarget])

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
        onIndividualDetailSaved={syncApplicant}
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
