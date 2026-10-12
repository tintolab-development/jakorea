import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'
import {
  buildVolunteerInterview2CancelFailMessage,
  resolveVolunteerInterview2CancelFailNotifyVariant,
  type VolunteerInterview2CancelFailConfirmPayload,
  type VolunteerInterview2CancelFailNotifyVariant,
} from '@/features/program/general/lib/volunteer-interview2-cancel-fail'
import {
  PermissionModal,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'
import '@/features/program/shared/ui/detail-modal/components/instructor-bulk-approve-modal.css'
import '@/features/program/shared/ui/detail-modal/components/instructor-cancel-reject-modal.css'

const MODAL_Z_INDEX = 2500

export type { VolunteerInterview2CancelFailConfirmPayload }

export type GeneralVolunteerInterview2CancelFailModalProps = {
  open: boolean
  volunteer: GeneralVolunteerApplicantRow | null
  onCancel: () => void
  onConfirm: (payload: VolunteerInterview2CancelFailConfirmPayload) => void
  zIndex?: number
}

export function resolveVolunteerInterview2CancelFailNotifyVariantFromRow(
  volunteer: GeneralVolunteerApplicantRow | null
): VolunteerInterview2CancelFailNotifyVariant {
  if (!volunteer) return 'pendingNotification'
  return resolveVolunteerInterview2CancelFailNotifyVariant(volunteer)
}

function Interview2CancelFailPendingNotificationModal({
  open,
  volunteerName,
  onCancel,
  onConfirm,
  zIndex = MODAL_Z_INDEX,
}: {
  open: boolean
  volunteerName: string
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  zIndex?: number
}) {
  return (
    <PermissionModal
      open={open}
      variant="reject"
      className="general-volunteer-interview2-cancel-fail-modal instructor-cancel-reject-modal"
      title="면접 불합격 취소 안내"
      message={buildVolunteerInterview2CancelFailMessage(volunteerName, 'pendingNotification')}
      confirmLabel="불합격 취소"
      confirmVariant="delete"
      requireReason
      reasonLabel="취소 사유"
      reasonPlaceholder="취소 사유를 입력해 주세요"
      reasonRequiredMessage="취소 사유를 입력해 주세요."
      showNotifyTiming={false}
      onCancel={onCancel}
      onConfirm={onConfirm}
      zIndex={zIndex}
    />
  )
}

function Interview2CancelFailAlreadySentModal({
  open,
  volunteerName,
  onCancel,
  onConfirm,
  zIndex = MODAL_Z_INDEX,
}: {
  open: boolean
  volunteerName: string
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  zIndex?: number
}) {
  return (
    <PermissionModal
      open={open}
      variant="reject"
      className="general-volunteer-interview2-cancel-fail-modal instructor-cancel-reject-modal"
      title="면접 불합격 취소 안내"
      message={buildVolunteerInterview2CancelFailMessage(volunteerName, 'alreadySent')}
      confirmLabel="불합격 취소"
      confirmVariant="delete"
      requireReason
      reasonLabel="취소 사유"
      reasonPlaceholder="취소 사유를 입력해 주세요"
      reasonRequiredMessage="취소 사유를 입력해 주세요."
      notifyTimingOptions="three"
      onCancel={onCancel}
      onConfirm={onConfirm}
      zIndex={zIndex}
    />
  )
}

/** 면접 불합격 취소 — 서류 반려 취소와 동일 ContentModal/PermissionModal 공통 컴포넌트 */
export function GeneralVolunteerInterview2CancelFailModal({
  open,
  volunteer,
  onCancel,
  onConfirm,
  zIndex = MODAL_Z_INDEX,
}: GeneralVolunteerInterview2CancelFailModalProps) {
  const variant = resolveVolunteerInterview2CancelFailNotifyVariantFromRow(volunteer)
  const volunteerName = volunteer?.name ?? ''

  if (variant === 'pendingNotification') {
    return (
      <Interview2CancelFailPendingNotificationModal
        open={open}
        volunteerName={volunteerName}
        onCancel={onCancel}
        onConfirm={payload =>
          onConfirm({
            variant: 'pendingNotification',
            reason: payload.reason,
          })
        }
        zIndex={zIndex}
      />
    )
  }

  return (
    <Interview2CancelFailAlreadySentModal
      open={open}
      volunteerName={volunteerName}
      onCancel={onCancel}
      onConfirm={payload => {
        onConfirm({
          variant: 'alreadySent',
          reason: payload.reason,
          notifyTiming: payload.notifyTiming,
          manualNotifyAt: payload.manualNotifyAt,
        })
      }}
      zIndex={zIndex}
    />
  )
}
