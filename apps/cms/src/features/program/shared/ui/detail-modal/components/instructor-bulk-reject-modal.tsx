/**
 * 일반 프로그램(기관) — 강사 신청 목록 선택 반려 확인 모달
 * `PermissionModal` + 반려 사유 + 알림 발송(즉시 / 발표일 / 직접 설정) 재사용
 */

import {
  PermissionModal,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'
import './instructor-bulk-approve-modal.css'

export type InstructorBulkRejectModalProps = {
  open: boolean
  /** 선택한 강사 수 */
  selectionCount: number
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  zIndex?: number
}

export function InstructorBulkRejectModal({
  open,
  selectionCount,
  onCancel,
  onConfirm,
  zIndex,
}: InstructorBulkRejectModalProps) {
  return (
    <PermissionModal
      open={open}
      variant="reject"
      className="instructor-bulk-reject-modal"
      title="강사 일괄 반려 안내"
      message={`선택한 **${selectionCount}명**의 모든 강사의 프로그램 참여를 일괄 반려하시겠습니까?\n반려 시 입력하신 반려 사유가 각 강사에게 개별로 전달되며, 알림이 발송됩니다.`}
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
