import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import '@/features/program/shared/ui/detail-modal/components/instructor-bulk-approve-complete-modal.css'

const MODAL_WIDTH = 600
export const GENERAL_VOLUNTEER_DOCUMENT_BULK_APPROVE_COMPLETE_MODAL_Z = 2550

export type GeneralVolunteerDocumentBulkApproveCompleteModalProps = {
  open: boolean
  selectionCount: number
  onClose: () => void
  zIndex?: number
}

export function buildGeneralVolunteerDocumentBulkApproveCompleteDescription(
  selectionCount: number
): string {
  return `선택한 **${selectionCount}명**의 모든 봉사자의 1차 서류 합격이 일괄 승인 되었습니다.`
}

export function GeneralVolunteerDocumentBulkApproveCompleteModal({
  open,
  selectionCount,
  onClose,
  zIndex = GENERAL_VOLUNTEER_DOCUMENT_BULK_APPROVE_COMPLETE_MODAL_Z,
}: GeneralVolunteerDocumentBulkApproveCompleteModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="봉사자 일괄 승인 완료"
      width={MODAL_WIDTH}
      zIndex={zIndex}
      className="general-volunteer-document-bulk-approve-complete-modal"
      description={buildGeneralVolunteerDocumentBulkApproveCompleteDescription(selectionCount)}
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
