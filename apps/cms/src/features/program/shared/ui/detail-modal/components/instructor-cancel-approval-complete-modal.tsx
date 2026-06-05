/**
 * 일반 프로그램 — 강사 승인 취소 완료 (600×222)
 */

import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { formatModalBoldPhrase, formatModalBracketedSubjectName } from '@/features/program/general/lib/modal-message-subject'
import './instructor-cancel-approval-complete-modal.css'

const MODAL_WIDTH = 600
export const INSTRUCTOR_CANCEL_APPROVAL_COMPLETE_MODAL_Z = 2550

export type InstructorCancelApprovalCompleteModalProps = {
  open: boolean
  instructorName: string
  cancellationReason: string
  onClose: () => void
  zIndex?: number
}

export function buildInstructorCancelApprovalCompleteDescription(
  instructorName: string,
  cancellationReason: string
): string {
  const trimmedName = instructorName.trim() || '강사'
  const trimmedReason = cancellationReason.trim() || '-'
  return `${formatModalBracketedSubjectName(trimmedName)} 강사님의 프로그램 참여 ${formatModalBoldPhrase('승인 취소')} 되었습니다.\n(사유 : ${trimmedReason})`
}

export function InstructorCancelApprovalCompleteModal({
  open,
  instructorName,
  cancellationReason,
  onClose,
  zIndex = INSTRUCTOR_CANCEL_APPROVAL_COMPLETE_MODAL_Z,
}: InstructorCancelApprovalCompleteModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="강사 승인 취소 완료"
      width={MODAL_WIDTH}
      zIndex={zIndex}
      className="instructor-cancel-approval-complete-modal"
      description={buildInstructorCancelApprovalCompleteDescription(
        instructorName,
        cancellationReason
      )}
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
