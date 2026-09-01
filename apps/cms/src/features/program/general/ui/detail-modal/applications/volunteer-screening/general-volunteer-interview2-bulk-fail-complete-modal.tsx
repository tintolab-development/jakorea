import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import '@/features/program/shared/ui/detail-modal/components/instructor-bulk-reject-complete-modal.css'

const MODAL_WIDTH = 600
export const GENERAL_VOLUNTEER_INTERVIEW2_BULK_FAIL_COMPLETE_MODAL_Z = 2550

export type GeneralVolunteerInterview2BulkFailCompleteModalProps = {
  open: boolean
  selectionCount: number
  onClose: () => void
  zIndex?: number
}

export function buildGeneralVolunteerInterview2BulkFailCompleteDescription(
  selectionCount: number
): string {
  return `선택한 **${selectionCount}명**의 모든 봉사자의 면접 심사가 일괄 불합격 처리되었습니다.`
}

export function GeneralVolunteerInterview2BulkFailCompleteModal({
  open,
  selectionCount,
  onClose,
  zIndex = GENERAL_VOLUNTEER_INTERVIEW2_BULK_FAIL_COMPLETE_MODAL_Z,
}: GeneralVolunteerInterview2BulkFailCompleteModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="봉사자 일괄 불합격 완료"
      width={MODAL_WIDTH}
      zIndex={zIndex}
      className="general-volunteer-interview2-bulk-fail-complete-modal"
      description={buildGeneralVolunteerInterview2BulkFailCompleteDescription(selectionCount)}
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
