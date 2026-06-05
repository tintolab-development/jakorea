import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import {
  formatModalBoldPhrase,
  formatModalBracketedSubjectName,
} from '@/features/program/general/lib/modal-message-subject'
import './instructor-cancel-approval-complete-modal.css'

const MODAL_WIDTH = 600
export const INSTITUTION_CANCEL_APPROVAL_COMPLETE_MODAL_Z = 2550

export type InstitutionCancelApprovalCompleteModalProps = {
  open: boolean
  schoolName: string
  cancellationReason: string
  onClose: () => void
  zIndex?: number
}

export function buildInstitutionCancelApprovalCompleteDescription(
  schoolName: string,
  cancellationReason: string
): string {
  const trimmedName = schoolName.trim() || '기관'
  const trimmedReason = cancellationReason.trim() || '-'
  return `${formatModalBracketedSubjectName(trimmedName)}의 프로그램 참여 ${formatModalBoldPhrase('승인 취소')} 되었습니다.\n(사유 : ${trimmedReason})`
}

export function InstitutionCancelApprovalCompleteModal({
  open,
  schoolName,
  cancellationReason,
  onClose,
  zIndex = INSTITUTION_CANCEL_APPROVAL_COMPLETE_MODAL_Z,
}: InstitutionCancelApprovalCompleteModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="기관 승인 취소 완료"
      width={MODAL_WIDTH}
      zIndex={zIndex}
      className="institution-cancel-approval-complete-modal"
      description={buildInstitutionCancelApprovalCompleteDescription(
        schoolName,
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
