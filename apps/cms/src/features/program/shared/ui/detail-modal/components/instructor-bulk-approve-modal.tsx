/**
 * 일반 프로그램(기관) — 강사 신청 목록 선택 승인 확인 모달
 * `PermissionModal` + 알림 발송(즉시 / 발표일 / 직접 설정) 재사용
 */

import { PermissionModal, type PermissionModalPayload } from '@/shared/components/permission-modal'
import './instructor-bulk-approve-modal.css'

export type InstructorBulkApproveModalProps = {
  open: boolean
  /** 선택한 강사 수 */
  selectionCount: number
  onCancel: () => void
  onConfirm: (payload: PermissionModalPayload) => void
  zIndex?: number
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
  selectionCount,
  onCancel,
  onConfirm,
  zIndex,
}: InstructorBulkApproveModalProps) {
  return (
    <PermissionModal
      open={open}
      variant="approve"
      className="instructor-bulk-approve-modal"
      title="강사 일괄 승인 안내"
      message={`선택한 **${selectionCount}명**의 모든 강사의 프로그램 참여를 일괄 승인하시겠습니까?\n승인 시 각 강사에게 개별로 승인 알림이 발송됩니다.`}
      infoCallout={<InstructorBulkApproveInfoCallout />}
      confirmLabel="승인"
      onCancel={onCancel}
      onConfirm={onConfirm}
      zIndex={zIndex}
    />
  )
}
