import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import '@/features/program/shared/ui/detail-modal/components/instructor-reject-complete-modal.css'

const MODAL_WIDTH = 600
export const GENERAL_VOLUNTEER_DOCUMENT_REJECT_COMPLETE_MODAL_Z = 2550

export type GeneralVolunteerDocumentRejectCompleteModalProps = {
  open: boolean
  volunteerName: string
  rejectionReason: string
  onClose: () => void
  zIndex?: number
}

export function buildGeneralVolunteerDocumentRejectCompleteDescription(
  volunteerName: string,
  rejectionReason: string
): string {
  const trimmedName = volunteerName.trim() || '봉사자'
  const trimmedReason = rejectionReason.trim() || '-'
  return `[${trimmedName}] 봉사자의 1차 서류 합격이 반려 되었습니다.\n(사유 : ${trimmedReason})`
}

export function GeneralVolunteerDocumentRejectCompleteModal({
  open,
  volunteerName,
  rejectionReason,
  onClose,
  zIndex = GENERAL_VOLUNTEER_DOCUMENT_REJECT_COMPLETE_MODAL_Z,
}: GeneralVolunteerDocumentRejectCompleteModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="봉사자 1차 반려 완료"
      width={MODAL_WIDTH}
      zIndex={zIndex}
      className="general-volunteer-document-reject-complete-modal"
      description={buildGeneralVolunteerDocumentRejectCompleteDescription(
        volunteerName,
        rejectionReason
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
