/**
 * 일반 프로그램 — 강사 승인 취소 완료 (Figma 「Popup / Text / w600 / 공통 완료」)
 */

import { AlertModal } from '@/shared/ui/alert-modal'
import { MESSAGES } from '@/shared/constants/messages'

export const INSTRUCTOR_CANCEL_APPROVAL_COMPLETE_MODAL_Z = 2550

export type InstructorCancelApprovalCompleteModalProps = {
  open: boolean
  instructorName: string
  cancellationReason: string
  onClose: () => void
  zIndex?: number
}

export function buildInstructorCancelApprovalCompleteDescription(
  _instructorName: string,
  _cancellationReason: string
): string {
  return MESSAGES.success.cancelled
}

export function InstructorCancelApprovalCompleteModal({
  open,
  instructorName,
  cancellationReason,
  onClose,
  zIndex = INSTRUCTOR_CANCEL_APPROVAL_COMPLETE_MODAL_Z,
}: InstructorCancelApprovalCompleteModalProps) {
  return (
    <AlertModal
      open={open}
      onClose={onClose}
      title="취소 완료"
      content={buildInstructorCancelApprovalCompleteDescription(instructorName, cancellationReason)}
      zIndex={zIndex}
    />
  )
}
