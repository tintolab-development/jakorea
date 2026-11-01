import { PermissionModal, type PermissionModalPayload } from '@/shared/components/permission-modal'
import type { NotifyTimingCapability } from '@/shared/lib/notify-timing-capability'
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
  notifyTimingCapability?: NotifyTimingCapability
  notifyTimingOptions?: 'two' | 'three'
  confirmLoading?: boolean
  reasonPlaceholder?: string
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
  notifyTimingCapability,
  notifyTimingOptions,
  confirmLoading,
  reasonPlaceholder = '반려 사유를 입력해 주세요',
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
      /** 시안: 활성 시 teal primary · 사유 미입력 시 disabled(회색 solid) */
      confirmVariant="primary"
      requireReason
      reasonLabel="반려 사유"
      reasonPlaceholder={reasonPlaceholder}
      reasonRequiredMessage="반려 사유를 입력해 주세요."
      confirmLoading={confirmLoading}
      onCancel={onCancel}
      onConfirm={onConfirm}
      zIndex={zIndex}
      notifyTimingCapability={notifyTimingCapability}
      notifyTimingOptions={notifyTimingOptions}
    />
  )
}
