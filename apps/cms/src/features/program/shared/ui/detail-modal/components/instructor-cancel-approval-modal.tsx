/**
 * 일반 프로그램 — 강사 승인 취소 확인
 * `PermissionModal` 재사용 (승인 알림 발송 여부에 따라 문구·알림 옵션 분기)
 */

import {
  buildInstructorCancelApprovalMessage,
  resolveInstructorCancelApprovalNotifyVariant,
  resolveInstructorCancelApprovalReasonLabel,
  type InstructorCancelApprovalNotifyVariant,
} from '@/features/program/general/lib/instructor-cancel-approval'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import {
  PermissionModal,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'
import './instructor-bulk-approve-modal.css'

export type InstructorCancelApprovalModalProps = {
  open: boolean
  instructor: ApplicantInstructorRow | null
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  zIndex?: number
}

export function resolveInstructorCancelApprovalNotifyVariantFromRow(
  instructor: ApplicantInstructorRow | null
): InstructorCancelApprovalNotifyVariant {
  if (!instructor) return 'alreadySent'
  return resolveInstructorCancelApprovalNotifyVariant(instructor)
}

export function InstructorCancelApprovalModal({
  open,
  instructor,
  onCancel,
  onConfirm,
  zIndex,
}: InstructorCancelApprovalModalProps) {
  const variant = resolveInstructorCancelApprovalNotifyVariantFromRow(instructor)
  const instructorName = instructor?.instructorName ?? ''

  return (
    <PermissionModal
      open={open}
      variant="reject"
      className="instructor-cancel-approval-modal"
      title="강사 승인 취소 안내"
      message={buildInstructorCancelApprovalMessage(instructorName, variant)}
      confirmLabel="승인 취소"
      confirmVariant="delete"
      requireReason
      reasonLabel={resolveInstructorCancelApprovalReasonLabel(variant)}
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
