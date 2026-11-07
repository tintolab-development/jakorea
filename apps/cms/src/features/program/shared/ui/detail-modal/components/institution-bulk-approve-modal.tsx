import {
  PermissionModal,
  type PermissionModalPayload,
} from '@/shared/components/permission-modal'
import { NOTIFY_TIMING_CAPABILITY } from '@/shared/lib/notify-timing-capability'
import './instructor-bulk-approve-modal.css'

export type InstitutionBulkApproveModalProps = {
  open: boolean
  /** 일괄 시 대표(첫) 기관명 — `[이름] 외 N개` */
  subjectName: string
  selectionCount: number
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  zIndex?: number
}

export function buildInstitutionApplicationBulkApproveCopy({
  subjectName,
  selectionCount,
}: {
  subjectName: string
  selectionCount: number
}): { title: string; message: string } {
  const name = subjectName.trim() || '기관'
  const rest = Math.max(0, selectionCount - 1)
  return {
    title: '프로그램 신청 일괄 승인 안내',
    message: `**[${name}] 외 ${rest}개**의 프로그램 신청을 승인하시겠습니까?\n승인 시 담당 교사에게 승인 알림이 발송됩니다.`,
  }
}

export function InstitutionBulkApproveModal({
  open,
  subjectName,
  selectionCount,
  onCancel,
  onConfirm,
  zIndex,
}: InstitutionBulkApproveModalProps) {
  const copy = buildInstitutionApplicationBulkApproveCopy({ subjectName, selectionCount })
  return (
    <PermissionModal
      open={open}
      variant="approve"
      className="institution-bulk-approve-modal"
      title={copy.title}
      message={copy.message}
      confirmLabel="승인"
      onCancel={onCancel}
      onConfirm={onConfirm}
      zIndex={zIndex}
      notifyTimingCapability={NOTIFY_TIMING_CAPABILITY.timedBulk}
      notifyTimingOptions="two"
    />
  )
}
