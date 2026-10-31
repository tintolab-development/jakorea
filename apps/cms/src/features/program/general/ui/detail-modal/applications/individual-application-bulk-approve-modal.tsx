/**
 * 일반 개인 프로그램 — 일정형 복수회차 참여자 일괄 승인 (일정 선택 UI 없음)
 */

import { PermissionModal, type PermissionModalPayload } from '@/shared/components/permission-modal'
import { NOTIFY_TIMING_CAPABILITY } from '@/shared/lib/notify-timing-capability'
import '@/features/program/shared/ui/detail-modal/components/instructor-bulk-approve-modal.css'

export type IndividualApplicationBulkApproveModalProps = {
  open: boolean
  subjectName: string
  selectionCount: number
  confirmLoading?: boolean
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  zIndex?: number
}

export function buildIndividualApplicationBulkApproveCopy({
  subjectName,
  selectionCount,
}: {
  subjectName: string
  selectionCount: number
}): { title: string; message: string } {
  const name = subjectName.trim() || '회원'
  const rest = Math.max(0, selectionCount - 1)
  return {
    title: '프로그램 신청 일괄 승인 안내',
    message: `**[${name}] 님 외 ${rest}명**의 프로그램 신청을 승인하시겠습니까?\n승인 시 회원에게 승인 알림이 발송됩니다.`,
  }
}

export function IndividualApplicationBulkApproveModal({
  open,
  subjectName,
  selectionCount,
  confirmLoading = false,
  onCancel,
  onConfirm,
  zIndex,
}: IndividualApplicationBulkApproveModalProps) {
  const copy = buildIndividualApplicationBulkApproveCopy({ subjectName, selectionCount })
  return (
    <PermissionModal
      open={open}
      variant="approve"
      className="instructor-bulk-approve-modal"
      title={copy.title}
      message={copy.message}
      confirmLabel="승인"
      confirmLoading={confirmLoading}
      onCancel={onCancel}
      onConfirm={onConfirm}
      zIndex={zIndex}
      notifyTimingCapability={NOTIFY_TIMING_CAPABILITY.timedBulk}
    />
  )
}
