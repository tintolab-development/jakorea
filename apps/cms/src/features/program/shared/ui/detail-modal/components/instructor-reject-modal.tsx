/**
 * 일반 프로그램 — 강사 개별 참여 반려 확인
 * `PermissionModal` + 반려 사유 + 알림 발송 재사용
 */

import {
  PermissionModal,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'
import './instructor-bulk-approve-modal.css'

export type InstructorRejectModalProps = {
  open: boolean
  instructorName: string
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  zIndex?: number
}

export function buildInstructorRejectMessage(instructorName: string): string {
  const trimmedName = instructorName.trim() || '강사'
  return `[${trimmedName}] 강사님의 프로그램 참여를 반려하시겠습니까?\n반려 시 입력하신 반려 사유가 강사님에게 전달되며, 알림이 발송됩니다.`
}

export function InstructorRejectModal({
  open,
  instructorName,
  onCancel,
  onConfirm,
  zIndex,
}: InstructorRejectModalProps) {
  return (
    <PermissionModal
      open={open}
      variant="reject"
      className="instructor-reject-modal"
      title="강사 반려 안내"
      message={buildInstructorRejectMessage(instructorName)}
      confirmLabel="반려"
      confirmVariant="delete"
      requireReason
      reasonLabel="반려 사유"
      reasonPlaceholder="반려 사유를 입력해 주세요."
      reasonRequiredMessage="반려 사유를 입력해 주세요."
      onCancel={onCancel}
      onConfirm={onConfirm}
      zIndex={zIndex}
    />
  )
}
