import {
  PermissionModal,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'
import {
  buildProgramApplicationRejectCopy,
  type ProgramApplicationRejectAudience,
  type ProgramApplicationRejectVariant,
} from '@/features/program/shared/lib/program-application-reject-copy'
import './instructor-bulk-approve-modal.css'

export type ProgramApplicationRejectModalProps = {
  open: boolean
  audience: ProgramApplicationRejectAudience
  variant: ProgramApplicationRejectVariant
  subjectName: string
  selectionCount?: number
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  zIndex?: number
}

export function ProgramApplicationRejectModal({
  open,
  audience,
  variant,
  subjectName,
  selectionCount,
  onCancel,
  onConfirm,
  zIndex,
}: ProgramApplicationRejectModalProps) {
  const copy = buildProgramApplicationRejectCopy({
    audience,
    variant,
    subjectName,
    selectionCount,
  })

  return (
    <PermissionModal
      open={open}
      variant="reject"
      className="program-application-reject-modal"
      title={copy.title}
      message={copy.message}
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
