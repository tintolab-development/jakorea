/**
 * 일반 프로그램(기관) — 강사 신청 목록 일괄 승인 완료 안내 (600×198)
 * `ContentModal` description + 확인 버튼 (권한 승인 완료 모달과 동일 패턴)
 */

import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import './instructor-bulk-approve-complete-modal.css'

const MODAL_WIDTH = 600
/** 일괄 승인 확인(`PermissionModal` z≈2500) 위에 표시 */
export const INSTRUCTOR_BULK_APPROVE_COMPLETE_MODAL_Z = 2550

export type InstructorBulkApproveCompleteModalProps = {
  open: boolean
  selectionCount: number
  onClose: () => void
  zIndex?: number
}

export function buildInstructorBulkApproveCompleteDescription(selectionCount: number): string {
  return `선택한 **${selectionCount}명**의 모든 강사의 프로그램 참여가 일괄 승인 되었습니다.`
}

export function InstructorBulkApproveCompleteModal({
  open,
  selectionCount,
  onClose,
  zIndex = INSTRUCTOR_BULK_APPROVE_COMPLETE_MODAL_Z,
}: InstructorBulkApproveCompleteModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="강사 일괄 승인 완료"
      width={MODAL_WIDTH}
      zIndex={zIndex}
      className="instructor-bulk-approve-complete-modal"
      description={buildInstructorBulkApproveCompleteDescription(selectionCount)}
      footer={
        <CmsButton variant="secondary" size="medium" type="button" onClick={onClose}>
          확인
        </CmsButton>
      }
    >
      {null}
    </ContentModal>
  )
}
