import {
  PermissionModal,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'
import '@/features/program/shared/ui/detail-modal/components/instructor-bulk-approve-modal.css'

export type GeneralVolunteerInterview2BulkFailModalProps = {
  open: boolean
  selectionCount: number
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  zIndex?: number
}

export function buildGeneralVolunteerInterview2BulkFailMessage(selectionCount: number): string {
  return `선택한 **${selectionCount}명**의 모든 봉사자의 면접 심사를 일괄 불합격 처리하시겠습니까?\n불합격 시 입력하신 불합격 사유가 각 봉사자에게 개별로 전달되며, 알림이 발송됩니다.`
}

export function GeneralVolunteerInterview2BulkFailModal({
  open,
  selectionCount,
  onCancel,
  onConfirm,
  zIndex,
}: GeneralVolunteerInterview2BulkFailModalProps) {
  return (
    <PermissionModal
      open={open}
      variant="reject"
      className="general-volunteer-interview2-bulk-fail-modal instructor-bulk-reject-modal"
      title="봉사자 일괄 불합격 안내"
      message={buildGeneralVolunteerInterview2BulkFailMessage(selectionCount)}
      confirmLabel="불합격"
      confirmVariant="delete"
      requireReason
      reasonLabel="불합격 사유"
      reasonPlaceholder="불합격 사유를 입력해 주세요."
      reasonRequiredMessage="불합격 사유를 입력해 주세요."
      onCancel={onCancel}
      onConfirm={onConfirm}
      zIndex={zIndex}
    />
  )
}
