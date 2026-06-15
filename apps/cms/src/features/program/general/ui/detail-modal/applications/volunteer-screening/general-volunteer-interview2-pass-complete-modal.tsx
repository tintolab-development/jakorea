import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import '@/features/program/shared/ui/detail-modal/components/instructor-approval-complete-modal.css'

const MODAL_WIDTH = 600
export const GENERAL_VOLUNTEER_INTERVIEW2_PASS_COMPLETE_MODAL_Z = 2550

export type GeneralVolunteerInterview2PassCompleteModalProps = {
  open: boolean
  volunteerName: string
  onClose: () => void
  zIndex?: number
}

export function buildGeneralVolunteerInterview2PassCompleteDescription(
  volunteerName: string
): string {
  const trimmedName = volunteerName.trim() || '봉사자'
  return `[${trimmedName}] 봉사자의 면접 심사가 합격 처리되었습니다.`
}

export function GeneralVolunteerInterview2PassCompleteModal({
  open,
  volunteerName,
  onClose,
  zIndex = GENERAL_VOLUNTEER_INTERVIEW2_PASS_COMPLETE_MODAL_Z,
}: GeneralVolunteerInterview2PassCompleteModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="봉사자 면접 합격 완료"
      width={MODAL_WIDTH}
      zIndex={zIndex}
      className="general-volunteer-interview2-pass-complete-modal"
      description={buildGeneralVolunteerInterview2PassCompleteDescription(volunteerName)}
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
