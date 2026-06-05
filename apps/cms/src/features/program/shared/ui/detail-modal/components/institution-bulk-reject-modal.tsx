import {
  PermissionModal,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'
import './instructor-bulk-approve-modal.css'

export type InstitutionBulkRejectModalProps = {
  open: boolean
  selectionCount: number
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  zIndex?: number
}

export function InstitutionBulkRejectModal({
  open,
  selectionCount,
  onCancel,
  onConfirm,
  zIndex,
}: InstitutionBulkRejectModalProps) {
  return (
    <PermissionModal
      open={open}
      variant="reject"
      className="institution-bulk-reject-modal"
      title="기관 일괄 반려 안내"
      message={`선택한 **${selectionCount}개**의 모든 기관의 프로그램 참여를 일괄 반려하시겠습니까?\n반려 시 입력하신 반려 사유가 각 담당 교사에게 개별로 전달되며, 알림이 발송됩니다.`}
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
