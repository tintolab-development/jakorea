import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'
import {
  buildVolunteerInterview2CancelPassMessage,
  resolveVolunteerInterview2CancelPassNotifyVariant,
  resolveVolunteerInterview2CancelPassReasonLabel,
  resolveVolunteerInterview2CancelPassButtonLabel,
  type VolunteerInterview2CancelPassNotifyVariant,
} from '@/features/program/general/lib/volunteer-interview2-cancel-pass'
import {
  PermissionModal,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'
import '@/features/program/shared/ui/detail-modal/components/instructor-bulk-approve-modal.css'

export type GeneralVolunteerInterview2CancelPassModalProps = {
  open: boolean
  volunteer: GeneralVolunteerApplicantRow | null
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  zIndex?: number
}

export function resolveVolunteerInterview2CancelPassNotifyVariantFromRow(
  volunteer: GeneralVolunteerApplicantRow | null
): VolunteerInterview2CancelPassNotifyVariant {
  if (!volunteer) return 'pendingNotification'
  return resolveVolunteerInterview2CancelPassNotifyVariant(volunteer)
}

/** 면접 합격 취소 — 서류 승인 취소와 동일 PermissionModal 공통 컴포넌트 */
export function GeneralVolunteerInterview2CancelPassModal({
  open,
  volunteer,
  onCancel,
  onConfirm,
  zIndex,
}: GeneralVolunteerInterview2CancelPassModalProps) {
  const variant = resolveVolunteerInterview2CancelPassNotifyVariantFromRow(volunteer)
  const volunteerName = volunteer?.name ?? ''

  return (
    <PermissionModal
      open={open}
      variant="reject"
      className="general-volunteer-interview2-cancel-pass-modal"
      title="면접 합격 취소 안내"
      message={buildVolunteerInterview2CancelPassMessage(volunteerName, variant)}
      confirmLabel={resolveVolunteerInterview2CancelPassButtonLabel(
        volunteer?.secondInterviewScreeningStatus
      )}
      confirmVariant="delete"
      requireReason
      reasonLabel={resolveVolunteerInterview2CancelPassReasonLabel(variant)}
      reasonPlaceholder="취소 사유를 입력해 주세요"
      reasonRequiredMessage="취소 사유를 입력해 주세요."
      notifyTimingOptions="three"
      onCancel={onCancel}
      onConfirm={onConfirm}
      zIndex={zIndex}
    />
  )
}
