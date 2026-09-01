/**
 * 일반 프로그램 — 강사 개별 반려 완료 안내 (600×222)
 */

import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import './instructor-reject-complete-modal.css'

const MODAL_WIDTH = 600
/** 반려 확인(`PermissionModal` z≈2500) 위에 표시 */
export const INSTRUCTOR_REJECT_COMPLETE_MODAL_Z = 2550

export type InstructorRejectCompleteModalProps = {
  open: boolean
  instructorName: string
  rejectionReason: string
  onClose: () => void
  zIndex?: number
}

export function buildInstructorRejectCompleteDescription(
  instructorName: string,
  rejectionReason: string
): string {
  const trimmedName = instructorName.trim() || '강사'
  const trimmedReason = rejectionReason.trim() || '-'
  return `[${trimmedName}] 강사님의 프로그램 참여가 반려 되었습니다.\n(사유 : ${trimmedReason})`
}

export function InstructorRejectCompleteModal({
  open,
  instructorName,
  rejectionReason,
  onClose,
  zIndex = INSTRUCTOR_REJECT_COMPLETE_MODAL_Z,
}: InstructorRejectCompleteModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="강사 반려 완료"
      width={MODAL_WIDTH}
      zIndex={zIndex}
      className="instructor-reject-complete-modal"
      description={buildInstructorRejectCompleteDescription(instructorName, rejectionReason)}
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
