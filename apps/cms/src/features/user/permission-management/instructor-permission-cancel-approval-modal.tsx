import { PermissionModal, type PermissionModalPayload } from '@/shared/components/permission-modal'
import type { InstructorApprovalCancelModalCase } from '@/features/user/api/lib/approval-notification-case'
import type { InstructorPermissionApproveNotifyTiming } from '@/features/user/permission-management/instructor-permission-approve-modal'
import { toInstructorRoleReviewScheduledAt } from '@/features/user/permission-management/lib/instructor-role-review-notify'
import {
  INSTRUCTOR_PERMISSION_CANCEL_APPROVAL_REASON_PLACEHOLDER,
  INSTRUCTOR_PERMISSION_CANCEL_APPROVAL_TITLE,
  buildInstructorPermissionCancelApprovalMessage,
} from '@/features/user/permission-management/lib/instructor-permission-cancel-approval-copy'

export interface InstructorPermissionCancelApprovalPayload {
  cancellationReason: string
  notifyTiming: InstructorPermissionApproveNotifyTiming
  scheduledAt?: string
}

type InstructorPermissionCancelApprovalModalProps = {
  open: boolean
  onCancel: () => void
  onConfirm: (payload: InstructorPermissionCancelApprovalPayload) => void
  userDisplayName: string
  modalCase: InstructorApprovalCancelModalCase
  zIndex?: number
  confirmLoading?: boolean
}

export function InstructorPermissionCancelApprovalModal({
  open,
  onCancel,
  onConfirm,
  userDisplayName,
  modalCase,
  zIndex,
  confirmLoading = false,
}: InstructorPermissionCancelApprovalModalProps) {
  const handleConfirm = (payload: PermissionModalPayload) => {
    const notifyTiming: InstructorPermissionApproveNotifyTiming =
      payload.notifyTiming === 'on_announcement' ? 'immediate' : payload.notifyTiming
    onConfirm({
      cancellationReason: payload.reason,
      notifyTiming,
      scheduledAt: toInstructorRoleReviewScheduledAt(notifyTiming, payload.manualNotifyAt),
    })
  }

  return (
    <PermissionModal
      open={open}
      onCancel={onCancel}
      onConfirm={handleConfirm}
      variant="reject"
      title={INSTRUCTOR_PERMISSION_CANCEL_APPROVAL_TITLE}
      zIndex={zIndex}
      width={600}
      notifyTimingOptions="two"
      reasonLabel="취소 사유"
      reasonPlaceholder={INSTRUCTOR_PERMISSION_CANCEL_APPROVAL_REASON_PLACEHOLDER}
      reasonMaxLength={1000}
      confirmLabel="승인 취소"
      confirmVariant="delete"
      confirmLoading={confirmLoading}
      message={buildInstructorPermissionCancelApprovalMessage(modalCase, userDisplayName)}
    />
  )
}
