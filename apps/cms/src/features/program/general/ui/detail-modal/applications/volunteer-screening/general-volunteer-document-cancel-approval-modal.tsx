import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import {
  buildVolunteerDocumentCancelApprovalMessage,
  resolveVolunteerDocumentCancelApprovalNotifyVariant,
  resolveVolunteerDocumentCancelApprovalReasonLabel,
  type VolunteerDocumentCancelApprovalNotifyVariant,
} from '@/features/program/general/lib/volunteer-document-cancel-approval'
import {
  PermissionModal,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'
import '@/features/program/shared/ui/detail-modal/components/instructor-bulk-approve-modal.css'

export type GeneralVolunteerDocumentCancelApprovalModalProps = {
  open: boolean
  volunteer: GeneralVolunteerApplicantRow | null
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  zIndex?: number
}

export function resolveVolunteerDocumentCancelApprovalNotifyVariantFromRow(
  volunteer: GeneralVolunteerApplicantRow | null
): VolunteerDocumentCancelApprovalNotifyVariant {
  if (!volunteer) return 'pendingNotification'
  return resolveVolunteerDocumentCancelApprovalNotifyVariant(volunteer)
}

export function GeneralVolunteerDocumentCancelApprovalModal({
  open,
  volunteer,
  onCancel,
  onConfirm,
  zIndex,
}: GeneralVolunteerDocumentCancelApprovalModalProps) {
  const variant = resolveVolunteerDocumentCancelApprovalNotifyVariantFromRow(volunteer)
  const volunteerName = volunteer?.name ?? ''

  return (
    <PermissionModal
      open={open}
      variant="reject"
      className="general-volunteer-document-cancel-approval-modal"
      title="봉사자 1차 승인 취소 안내"
      message={buildVolunteerDocumentCancelApprovalMessage(volunteerName, variant)}
      confirmLabel="승인 취소"
      confirmVariant="delete"
      requireReason
      reasonLabel={resolveVolunteerDocumentCancelApprovalReasonLabel(variant)}
      reasonPlaceholder="취소 사유를 입력해 주세요."
      reasonRequiredMessage="취소 사유를 입력해 주세요."
      notifyTimingOptions={variant === 'alreadySent' ? 'two' : 'three'}
      notifyBeforeReason
      onCancel={onCancel}
      onConfirm={onConfirm}
      zIndex={zIndex}
    />
  )
}
