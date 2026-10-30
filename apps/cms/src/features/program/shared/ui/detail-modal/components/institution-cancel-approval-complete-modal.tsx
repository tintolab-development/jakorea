import { AlertModal } from '@/shared/ui/alert-modal'
import { MESSAGES } from '@/shared/constants/messages'

export const INSTITUTION_CANCEL_APPROVAL_COMPLETE_MODAL_Z = 2550

export type InstitutionCancelApprovalCompleteModalProps = {
  open: boolean
  schoolName: string
  cancellationReason: string
  notificationResult: 'not-created' | 'created' | 'unknown'
  onClose: () => void
  zIndex?: number
}

/** Figma 「Popup / Text / w600 / 공통 완료」 — 취소 완료 / 취소되었습니다. */
export function buildInstitutionCancelApprovalCompleteDescription(
  _schoolName: string,
  _cancellationReason: string,
  _notificationResult: InstitutionCancelApprovalCompleteModalProps['notificationResult']
): string {
  return MESSAGES.success.cancelled
}

export function InstitutionCancelApprovalCompleteModal({
  open,
  schoolName,
  cancellationReason,
  notificationResult,
  onClose,
  zIndex = INSTITUTION_CANCEL_APPROVAL_COMPLETE_MODAL_Z,
}: InstitutionCancelApprovalCompleteModalProps) {
  return (
    <AlertModal
      open={open}
      onClose={onClose}
      title="취소 완료"
      content={buildInstitutionCancelApprovalCompleteDescription(
        schoolName,
        cancellationReason,
        notificationResult
      )}
      zIndex={zIndex}
    />
  )
}
