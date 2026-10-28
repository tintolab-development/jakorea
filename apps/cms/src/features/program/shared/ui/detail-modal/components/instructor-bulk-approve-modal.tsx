/**
 * 일반 프로그램(기관) — 강사 신청 목록 선택 승인 확인 모달
 * `PermissionModal` + 알림 발송(즉시 / 발표일 / 직접 설정) 재사용
 */

import { PermissionModal, type PermissionModalPayload } from '@/shared/components/permission-modal'
import { NOTIFY_TIMING_CAPABILITY } from '@/shared/lib/notify-timing-capability'
import './instructor-bulk-approve-modal.css'

export type InstructorBulkApproveModalProps = {
  open: boolean
  /** 일괄 시 대표(첫) 강사명 — `[이름] 님 외 N명` */
  subjectName: string
  /** 선택한 강사 수 */
  selectionCount: number
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  zIndex?: number
}

export function buildInstructorBulkApproveCopy({
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

function InstructorBulkApproveInfoCallout() {
  return (
    <p className="instructor-bulk-approve-modal__callout-text">
      일괄 승인 시 선택된 모든 강사의{' '}
      <span className="instructor-bulk-approve-modal__callout-em">
        강사비는 프로그램 기준으로 자동 책정
      </span>
      되며,
      <br />
      <span className="instructor-bulk-approve-modal__callout-em">
        기관 배정은 승인 후 강사 상세에서 개별 설정이 필요
      </span>
      합니다.
    </p>
  )
}

export function InstructorBulkApproveModal({
  open,
  subjectName,
  selectionCount,
  onCancel,
  onConfirm,
  zIndex,
}: InstructorBulkApproveModalProps) {
  const copy = buildInstructorBulkApproveCopy({ subjectName, selectionCount })
  return (
    <PermissionModal
      open={open}
      variant="approve"
      className="instructor-bulk-approve-modal"
      title={copy.title}
      message={copy.message}
      infoCallout={<InstructorBulkApproveInfoCallout />}
      confirmLabel="승인"
      onCancel={onCancel}
      onConfirm={onConfirm}
      zIndex={zIndex}
      notifyTimingCapability={NOTIFY_TIMING_CAPABILITY.timedBulk}
    />
  )
}
