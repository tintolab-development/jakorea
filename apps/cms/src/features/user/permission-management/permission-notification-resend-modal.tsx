/**
 * 강사·관리자 권한 신청 상세 — 알림 재발송 확인
 * `PermissionModal` 재사용 (즉시 / 직접 설정)
 */

import {
  buildPermissionNotificationResendMessage,
  type PermissionNotificationResendApprovalStatus,
  type PermissionNotificationResendRole,
} from '@/features/user/permission-management/lib/permission-notification-resend'
import {
  PermissionModal,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'

export type PermissionNotificationResendModalProps = {
  open: boolean
  permissionRole: PermissionNotificationResendRole
  userDisplayName: string
  approvalStatus: PermissionNotificationResendApprovalStatus
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  zIndex?: number
}

export function PermissionNotificationResendModal({
  open,
  permissionRole,
  userDisplayName,
  approvalStatus,
  onCancel,
  onConfirm,
  zIndex,
}: PermissionNotificationResendModalProps) {
  return (
    <PermissionModal
      open={open}
      variant="approve"
      title="알림 재발송 안내"
      message={buildPermissionNotificationResendMessage(
        permissionRole,
        userDisplayName,
        approvalStatus
      )}
      confirmLabel="재발송"
      notifyTimingOptions="two"
      onCancel={onCancel}
      onConfirm={onConfirm}
      zIndex={zIndex}
    />
  )
}
