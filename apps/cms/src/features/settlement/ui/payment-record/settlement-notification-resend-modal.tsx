import {
  buildSettlementNotificationResendMessage,
  type SettlementNotificationResendKind,
} from '@/features/settlement/lib/settlement-notification-resend'
import {
  PermissionModal,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'
import '@/features/program/shared/ui/detail-modal/components/instructor-bulk-approve-modal.css'
import './settlement-notification-resend-modal.css'

export type SettlementNotificationResendModalProps = {
  open: boolean
  kind: SettlementNotificationResendKind
  hasStoredRejectionReason?: boolean
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  confirmLoading?: boolean
  zIndex?: number
}

export function SettlementNotificationResendModal({
  open,
  kind,
  hasStoredRejectionReason,
  onCancel,
  onConfirm,
  confirmLoading,
  zIndex,
}: SettlementNotificationResendModalProps) {
  const requireReason = kind === 'rejected' && !hasStoredRejectionReason

  return (
    <PermissionModal
      open={open}
      variant={requireReason ? 'reject' : 'approve'}
      className="applicant-notification-resend-modal settlement-notification-resend-modal"
      title="알림 재발송 안내"
      message={buildSettlementNotificationResendMessage(kind)}
      confirmLabel="재발송"
      confirmVariant="primary"
      confirmLoading={confirmLoading}
      requireReason={requireReason}
      reasonLabel="반려 사유"
      reasonPlaceholder="반려 사유를 입력해 주세요."
      reasonRequiredMessage="반려 사유를 입력해 주세요."
      notifyTimingOptions="two"
      onCancel={onCancel}
      onConfirm={onConfirm}
      zIndex={zIndex}
    />
  )
}
