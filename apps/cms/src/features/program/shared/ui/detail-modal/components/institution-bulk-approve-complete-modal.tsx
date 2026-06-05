import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import './instructor-bulk-approve-complete-modal.css'

const MODAL_WIDTH = 600
export const INSTITUTION_BULK_APPROVE_COMPLETE_MODAL_Z = 2550

export type InstitutionBulkApproveCompleteModalProps = {
  open: boolean
  selectionCount: number
  onClose: () => void
  zIndex?: number
}

export function buildInstitutionBulkApproveCompleteDescription(selectionCount: number): string {
  return `선택한 **${selectionCount}개**의 모든 기관의 프로그램 참여가 일괄 승인 되었습니다.`
}

export function InstitutionBulkApproveCompleteModal({
  open,
  selectionCount,
  onClose,
  zIndex = INSTITUTION_BULK_APPROVE_COMPLETE_MODAL_Z,
}: InstitutionBulkApproveCompleteModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="기관 일괄 승인 완료"
      width={MODAL_WIDTH}
      zIndex={zIndex}
      className="institution-bulk-approve-complete-modal"
      description={buildInstitutionBulkApproveCompleteDescription(selectionCount)}
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
