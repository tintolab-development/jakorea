import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import './instructor-reject-complete-modal.css'

const MODAL_WIDTH = 600
export const INSTITUTION_REJECT_COMPLETE_MODAL_Z = 2550

export type InstitutionRejectCompleteModalProps = {
  open: boolean
  schoolName: string
  rejectionReason: string
  onClose: () => void
  zIndex?: number
}

export function buildInstitutionRejectCompleteDescription(
  schoolName: string,
  rejectionReason: string
): string {
  const trimmedName = schoolName.trim() || '기관'
  const trimmedReason = rejectionReason.trim() || '-'
  return `[${trimmedName}]의 프로그램 참여가 반려 되었습니다.\n(사유 : ${trimmedReason})`
}

export function InstitutionRejectCompleteModal({
  open,
  schoolName,
  rejectionReason,
  onClose,
  zIndex = INSTITUTION_REJECT_COMPLETE_MODAL_Z,
}: InstitutionRejectCompleteModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="기관 반려 완료"
      width={MODAL_WIDTH}
      zIndex={zIndex}
      className="institution-reject-complete-modal"
      description={buildInstitutionRejectCompleteDescription(schoolName, rejectionReason)}
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
