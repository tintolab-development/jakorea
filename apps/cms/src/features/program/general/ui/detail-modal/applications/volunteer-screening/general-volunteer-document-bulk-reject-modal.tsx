import {
  PermissionModal,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'
import '@/features/program/shared/ui/detail-modal/components/instructor-bulk-approve-modal.css'

export type GeneralVolunteerDocumentBulkRejectModalProps = {
  open: boolean
  selectionCount: number
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  zIndex?: number
}

export function buildGeneralVolunteerDocumentBulkRejectMessage(selectionCount: number): string {
  return `선택한 **${selectionCount}명**의 모든 봉사자의 1차 서류 합격을 일괄 반려하시겠습니까?\n반려 시 입력하신 반려 사유가 각 봉사자에게 개별로 전달되며, 알림이 발송됩니다.`
}

export function GeneralVolunteerDocumentBulkRejectModal({
  open,
  selectionCount,
  onCancel,
  onConfirm,
  zIndex,
}: GeneralVolunteerDocumentBulkRejectModalProps) {
  return (
    <PermissionModal
      open={open}
      variant="reject"
      className="general-volunteer-document-bulk-reject-modal instructor-bulk-reject-modal"
      title="봉사자 일괄 반려 안내"
      message={buildGeneralVolunteerDocumentBulkRejectMessage(selectionCount)}
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
