import {
  PermissionModal,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'
import './instructor-bulk-approve-modal.css'

export type InstitutionApproveModalProps = {
  open: boolean
  schoolName: string
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  zIndex?: number
}

export function buildInstitutionApproveMessage(schoolName: string): string {
  const trimmedName = schoolName.trim() || '기관'
  return `[${trimmedName}]의 프로그램 참여를 승인하시겠습니까?\n승인 시 담당 교사에게 승인 알림이 발송됩니다.`
}

export function InstitutionApproveModal({
  open,
  schoolName,
  onCancel,
  onConfirm,
  zIndex,
}: InstitutionApproveModalProps) {
  return (
    <PermissionModal
      open={open}
      variant="approve"
      className="institution-approve-modal"
      title="기관 승인 안내"
      message={buildInstitutionApproveMessage(schoolName)}
      confirmLabel="승인"
      onCancel={onCancel}
      onConfirm={onConfirm}
      zIndex={zIndex}
    />
  )
}
