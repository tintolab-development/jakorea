import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import './instructor-bulk-reject-complete-modal.css'

const MODAL_WIDTH = 600
export const INSTITUTION_BULK_REJECT_COMPLETE_MODAL_Z = 2550

export type InstitutionBulkRejectCompleteModalProps = {
  open: boolean
  selectionCount: number
  onClose: () => void
  zIndex?: number
}

export function buildInstitutionBulkRejectCompleteDescription(selectionCount: number): string {
  return `선택한 **${selectionCount}개**의 모든 기관의 프로그램 참여가 일괄 반려 되었습니다.`
}

export function InstitutionBulkRejectCompleteModal({
  open,
  selectionCount,
  onClose,
  zIndex = INSTITUTION_BULK_REJECT_COMPLETE_MODAL_Z,
}: InstitutionBulkRejectCompleteModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="기관 일괄 반려 완료"
      width={MODAL_WIDTH}
      zIndex={zIndex}
      className="institution-bulk-reject-complete-modal"
      description={buildInstitutionBulkRejectCompleteDescription(selectionCount)}
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
