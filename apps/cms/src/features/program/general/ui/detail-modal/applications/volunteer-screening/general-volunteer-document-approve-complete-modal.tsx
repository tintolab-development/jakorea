import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import '@/features/program/shared/ui/detail-modal/components/instructor-approval-complete-modal.css'

const MODAL_WIDTH = 600
export const GENERAL_VOLUNTEER_DOCUMENT_APPROVE_COMPLETE_MODAL_Z = 2550

export type GeneralVolunteerDocumentApproveCompleteModalProps = {
  open: boolean
  volunteerName: string
  onClose: () => void
  zIndex?: number
}

export function buildGeneralVolunteerDocumentApproveCompleteDescription(
  volunteerName: string
): string {
  const trimmedName = volunteerName.trim() || '봉사자'
  return `[${trimmedName}] 봉사자의 1차 서류 합격이 승인 되었습니다.`
}

export function GeneralVolunteerDocumentApproveCompleteModal({
  open,
  volunteerName,
  onClose,
  zIndex = GENERAL_VOLUNTEER_DOCUMENT_APPROVE_COMPLETE_MODAL_Z,
}: GeneralVolunteerDocumentApproveCompleteModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="봉사자 1차 승인 완료"
      width={MODAL_WIDTH}
      zIndex={zIndex}
      className="general-volunteer-document-approve-complete-modal"
      description={buildGeneralVolunteerDocumentApproveCompleteDescription(volunteerName)}
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
