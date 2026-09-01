import {
  PermissionModal,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'
import './instructor-bulk-approve-modal.css'

export type InstitutionBulkApproveModalProps = {
  open: boolean
  selectionCount: number
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  zIndex?: number
}

export function InstitutionBulkApproveModal({
  open,
  selectionCount,
  onCancel,
  onConfirm,
  zIndex,
}: InstitutionBulkApproveModalProps) {
  return (
    <PermissionModal
      open={open}
      variant="approve"
      className="institution-bulk-approve-modal"
      title="기관 일괄 승인 안내"
      message={`선택한 **${selectionCount}개**의 모든 기관의 프로그램 참여를 일괄 승인하시겠습니까?\n승인 시 각 담당 교사에게 개별로 승인 알림이 발송됩니다.`}
      confirmLabel="승인"
      onCancel={onCancel}
      onConfirm={onConfirm}
      zIndex={zIndex}
    />
  )
}
