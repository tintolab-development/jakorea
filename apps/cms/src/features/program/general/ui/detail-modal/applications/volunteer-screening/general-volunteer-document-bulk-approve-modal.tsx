import { PermissionModal, type PermissionModalPayload } from '@/shared/components/permission-modal'
import '@/features/program/shared/ui/detail-modal/components/instructor-bulk-approve-modal.css'

export type GeneralVolunteerDocumentBulkApproveModalProps = {
  open: boolean
  selectionCount: number
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  zIndex?: number
}

export function buildGeneralVolunteerDocumentBulkApproveMessage(selectionCount: number): string {
  return `선택한 **${selectionCount}명**의 모든 봉사자의 1차 서류 합격을 일괄 승인하시겠습니까?\n승인 시 각 봉사자에게 개별로 합격 알림이 발송됩니다.`
}

export function GeneralVolunteerDocumentBulkApproveModal({
  open,
  selectionCount,
  onCancel,
  onConfirm,
  zIndex,
}: GeneralVolunteerDocumentBulkApproveModalProps) {
  return (
    <PermissionModal
      open={open}
      variant="approve"
      className="general-volunteer-document-bulk-approve-modal"
      title="봉사자 일괄 승인 안내"
      message={buildGeneralVolunteerDocumentBulkApproveMessage(selectionCount)}
      confirmLabel="승인"
      onCancel={onCancel}
      onConfirm={onConfirm}
      zIndex={zIndex}
    />
  )
}
