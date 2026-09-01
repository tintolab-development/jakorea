import {
  PermissionModal,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'
import './instructor-bulk-approve-modal.css'

export type InstitutionRejectModalProps = {
  open: boolean
  schoolName: string
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  zIndex?: number
}

export function buildInstitutionRejectMessage(schoolName: string): string {
  const trimmedName = schoolName.trim() || '기관'
  return `[${trimmedName}]의 프로그램 참여를 반려하시겠습니까?\n반려 시 입력하신 반려 사유가 담당 교사에게 전달되며, 알림이 발송됩니다.`
}

export function InstitutionRejectModal({
  open,
  schoolName,
  onCancel,
  onConfirm,
  zIndex,
}: InstitutionRejectModalProps) {
  return (
    <PermissionModal
      open={open}
      variant="reject"
      className="institution-reject-modal"
      title="기관 반려 안내"
      message={buildInstitutionRejectMessage(schoolName)}
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
