import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import '@/features/program/shared/ui/detail-modal/components/instructor-bulk-reject-complete-modal.css'

const MODAL_WIDTH = 600
export const GENERAL_VOLUNTEER_DOCUMENT_BULK_REJECT_COMPLETE_MODAL_Z = 2550

export type GeneralVolunteerDocumentBulkRejectCompleteModalProps = {
  open: boolean
  selectionCount: number
  onClose: () => void
  zIndex?: number
}

export function buildGeneralVolunteerDocumentBulkRejectCompleteDescription(
  selectionCount: number
): string {
  return `선택한 **${selectionCount}명**의 모든 봉사자의 1차 서류 합격이 일괄 반려 되었습니다.`
}

export function GeneralVolunteerDocumentBulkRejectCompleteModal({
  open,
  selectionCount,
  onClose,
  zIndex = GENERAL_VOLUNTEER_DOCUMENT_BULK_REJECT_COMPLETE_MODAL_Z,
}: GeneralVolunteerDocumentBulkRejectCompleteModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="봉사자 일괄 반려 완료"
      width={MODAL_WIDTH}
      zIndex={zIndex}
      className="general-volunteer-document-bulk-reject-complete-modal"
      description={buildGeneralVolunteerDocumentBulkRejectCompleteDescription(selectionCount)}
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
