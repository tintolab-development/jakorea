/**
 * 프로그램 신청 상세 — 알림 재발송 확인
 * `PermissionModal` 재사용 (즉시 / 직접 설정)
 */

import {
  buildApplicantNotificationResendMessage,
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
  zIndex?: number
}

export function ApplicantNotificationResendModal({
  open,
  subjectKind,
  subjectName,
  approvalStatus,
  onCancel,
  onConfirm,
  zIndex,
}: ApplicantNotificationResendModalProps) {
  return (
    <PermissionModal
      open={open}
      variant="approve"
      className="applicant-notification-resend-modal"
      title="알림 재발송 안내"
      message={buildApplicantNotificationResendMessage(subjectKind, subjectName, approvalStatus)}
      confirmLabel="재발송"
      notifyTimingOptions="two"
      onCancel={onCancel}
      onConfirm={onConfirm}
      zIndex={zIndex}
    />
  )
}
