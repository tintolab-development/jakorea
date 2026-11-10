/**
 * 일반 프로그램 — 강사 승인 취소 확인
 * `PermissionModal` 재사용 (승인 알림 발송 여부에 따라 문구·알림 옵션 분기)
 */

import {
  buildInstructorCancelApprovalMessage,
  resolveInstructorCancelApprovalNotifyVariant,
  resolveInstructorCancelApprovalReasonLabel,
  type InstructorApplicationCopyVariant,
  type InstructorCancelApprovalNotifyVariant,
} from '@/features/program/general/lib/instructor-cancel-approval'
import type { NotifyTimingCapability } from '@/shared/lib/notify-timing-capability'
import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
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
  /**
   * 기본 `default`: 기존 본문 + 「취소 귀책」 필수.
   * `general-organization`: 시안 08-1·08-2 본문, 귀책 미노출(API 선택값 — 생략 시 서버 ADMIN).
   */
  copyVariant?: InstructorApplicationCopyVariant
  notifyTimingCapability?: NotifyTimingCapability
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
  copyVariant = 'default',
  notifyTimingCapability,
}: InstructorCancelApprovalModalProps) {
  const variant = resolveInstructorCancelApprovalNotifyVariantFromRow(instructor)
  const instructorName = instructor?.instructorName ?? ''

  return (
    <PermissionModal
      open={open}
      variant="reject"
      className="instructor-cancel-approval-modal"
      title="프로그램 승인 취소 안내"
      message={buildInstructorCancelApprovalMessage(instructorName, variant, copyVariant)}
      confirmLabel="승인 취소"
      confirmVariant="delete"
      requireReason
      reasonLabel={resolveInstructorCancelApprovalReasonLabel(variant)}
      reasonPlaceholder="취소 사유를 입력해 주세요"
      reasonRequiredMessage="취소 사유를 입력해 주세요."
      faultPartyRequired={copyVariant !== 'general-organization'}
      notifyTimingCapability={notifyTimingCapability}
      onCancel={onCancel}
      onConfirm={onConfirm}
      zIndex={zIndex}
    />
  )
}
