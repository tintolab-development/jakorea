import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import {
  formatModalBoldPhrase,
  formatModalBracketedSubjectName,
} from '@/features/program/general/lib/modal-message-subject'
import './instructor-cancel-reject-modal.css'

const MODAL_WIDTH = 600
export const INSTITUTION_CANCEL_REJECT_COMPLETE_MODAL_Z = 2550

export type InstitutionCancelRejectCompleteModalProps = {
  open: boolean
  schoolName: string
  onClose: () => void
  zIndex?: number
}

export function buildInstitutionCancelRejectCompleteDescription(schoolName: string): string {
  const trimmedName = schoolName.trim() || '기관'
  return `${formatModalBracketedSubjectName(trimmedName)}의 프로그램 참여 ${formatModalBoldPhrase('반려 취소')} 되었습니다.\n해당 기관은 신청 목록 또는 상세에서 ${formatModalBoldPhrase('승인 및 반려')}가 가능합니다.`
}

export function InstitutionCancelRejectCompleteModal({
  open,
  schoolName,
  onClose,
  zIndex = INSTITUTION_CANCEL_REJECT_COMPLETE_MODAL_Z,
}: InstitutionCancelRejectCompleteModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="기관 반려 취소 완료"
      width={MODAL_WIDTH}
      zIndex={zIndex}
      className="institution-cancel-reject-complete-modal"
      description={buildInstitutionCancelRejectCompleteDescription(schoolName)}
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
