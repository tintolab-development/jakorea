/**
 * 일반 프로그램 — 강사 반려 취소 완료 (600×222)
 */

import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { formatModalBoldPhrase, formatModalBracketedSubjectName } from '@/features/program/general/lib/modal-message-subject'
import './instructor-cancel-reject-modal.css'

const MODAL_WIDTH = 600
export const INSTRUCTOR_CANCEL_REJECT_COMPLETE_MODAL_Z = 2550

export type InstructorCancelRejectCompleteModalProps = {
  open: boolean
  instructorName: string
  onClose: () => void
  zIndex?: number
}

export function buildInstructorCancelRejectCompleteDescription(
  instructorName: string
): string {
  const trimmedName = instructorName.trim() || '강사'
  return `${formatModalBracketedSubjectName(trimmedName)} 강사님의 프로그램 참여 ${formatModalBoldPhrase('반려 취소')} 되었습니다.\n해당 강사님은 신청 목록 또는 상세에서 ${formatModalBoldPhrase('승인 및 반려')}가 가능합니다.`
}

export function InstructorCancelRejectCompleteModal({
  open,
  instructorName,
  onClose,
  zIndex = INSTRUCTOR_CANCEL_REJECT_COMPLETE_MODAL_Z,
}: InstructorCancelRejectCompleteModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="강사 반려 취소 완료"
      width={MODAL_WIDTH}
      zIndex={zIndex}
      className="instructor-cancel-reject-complete-modal"
      description={buildInstructorCancelRejectCompleteDescription(instructorName)}
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
