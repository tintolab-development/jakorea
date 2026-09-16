/**
 * 프로그램 신청 상세 — 알림 재발송 확인
 * `PermissionModal` 재사용 (즉시 / 직접 설정)
 * 개인·반려: 반려 사유 입력 노출
 */

import {
  buildApplicantNotificationResendMessage,
  shouldShowApplicantNotificationResendReason,
  type ApplicantNotificationResendApprovalStatus,
  type ApplicantNotificationResendSubjectKind,
} from '@/features/program/general/lib/applicant-notification-resend'
import {
  PermissionModal,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'
import './instructor-bulk-approve-modal.css'

export type ApplicantNotificationResendModalProps = {
  open: boolean
  subjectKind: ApplicantNotificationResendSubjectKind
  subjectName: string
  approvalStatus: ApplicantNotificationResendApprovalStatus
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  confirmLoading?: boolean
  zIndex?: number
}

export function ApplicantNotificationResendModal({
  open,
  subjectKind,
  subjectName,
  approvalStatus,
  onCancel,
  onConfirm,
  confirmLoading,
  zIndex,
}: ApplicantNotificationResendModalProps) {
  const requireReason = shouldShowApplicantNotificationResendReason(subjectKind, approvalStatus)

  return (
    <PermissionModal
      open={open}
      variant={requireReason ? 'reject' : 'approve'}
      className="applicant-notification-resend-modal"
      title="알림 재발송 안내"
      message={buildApplicantNotificationResendMessage(subjectKind, subjectName, approvalStatus)}
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
