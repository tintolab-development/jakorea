import { useState } from 'react'
import { PermissionModal, type PermissionModalPayload } from '@/shared/components/permission-modal'
import type { InstructorPermissionRevokeNotifyTiming } from '@/features/user/detail/lib/use-user-detail-controller'
import { toInstructorRoleReviewScheduledAt } from '@/features/user/permission-management/lib/instructor-role-review-notify'
import {
  INSTRUCTOR_PERMISSION_REVOKE_CONFIRM_LABEL,
  INSTRUCTOR_PERMISSION_REVOKE_REASON_LABEL,
  INSTRUCTOR_PERMISSION_REVOKE_REASON_PLACEHOLDER,
  INSTRUCTOR_PERMISSION_REVOKE_TITLE,
  buildInstructorPermissionRevokeMessage,
} from '@/features/user/detail/lib/instructor-permission-revoke-copy'

export interface InstructorPermissionRevokeModalProps {
  open: boolean
  instructorName: string
  onCancel: () => void
  onConfirm: (payload: {
    reason: string
    notifyTiming: InstructorPermissionRevokeNotifyTiming
    scheduledAt?: string
  }) => void | Promise<void>
}

export function InstructorPermissionRevokeModal({
  open,
  instructorName,
  onCancel,
  onConfirm,
}: InstructorPermissionRevokeModalProps) {
  const [confirmLoading, setConfirmLoading] = useState(false)

  const handleConfirm = async (payload: PermissionModalPayload) => {
    const notifyTiming: InstructorPermissionRevokeNotifyTiming =
      payload.notifyTiming === 'on_announcement' ? 'immediate' : payload.notifyTiming
    setConfirmLoading(true)
    try {
      await onConfirm({
        reason: payload.reason,
        notifyTiming,
        scheduledAt: toInstructorRoleReviewScheduledAt(notifyTiming, payload.manualNotifyAt),
      })
    } finally {
      setConfirmLoading(false)
    }
  }

  return (
    <PermissionModal
      open={open}
      onCancel={confirmLoading ? () => undefined : onCancel}
      onConfirm={payload => {
        void handleConfirm(payload)
      }}
      variant="reject"
      title={INSTRUCTOR_PERMISSION_REVOKE_TITLE}
      width={600}
      notifyTimingOptions="two"
      reasonLabel={INSTRUCTOR_PERMISSION_REVOKE_REASON_LABEL}
      reasonPlaceholder={INSTRUCTOR_PERMISSION_REVOKE_REASON_PLACEHOLDER}
      confirmLabel={INSTRUCTOR_PERMISSION_REVOKE_CONFIRM_LABEL}
      confirmVariant="delete"
      confirmLoading={confirmLoading}
      message={buildInstructorPermissionRevokeMessage(instructorName)}
    />
  )
}
