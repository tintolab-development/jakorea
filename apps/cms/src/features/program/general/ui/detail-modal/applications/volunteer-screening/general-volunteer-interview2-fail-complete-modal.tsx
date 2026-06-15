import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import '@/features/program/shared/ui/detail-modal/components/instructor-reject-complete-modal.css'

const MODAL_WIDTH = 600
export const GENERAL_VOLUNTEER_INTERVIEW2_FAIL_COMPLETE_MODAL_Z = 2550

export type GeneralVolunteerInterview2FailCompleteModalProps = {
  open: boolean
  volunteerName: string
  failReason: string
  onClose: () => void
  zIndex?: number
}

export function buildGeneralVolunteerInterview2FailCompleteDescription(
  volunteerName: string,
  failReason: string
): string {
  const trimmedName = volunteerName.trim() || '봉사자'
  const trimmedReason = failReason.trim() || '-'
  return `[${trimmedName}] 봉사자의 면접 심사가 불합격 처리되었습니다.\n(사유 : ${trimmedReason})`
}

export function GeneralVolunteerInterview2FailCompleteModal({
  open,
  volunteerName,
  failReason,
  onClose,
  zIndex = GENERAL_VOLUNTEER_INTERVIEW2_FAIL_COMPLETE_MODAL_Z,
}: GeneralVolunteerInterview2FailCompleteModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="봉사자 면접 불합격 완료"
      width={MODAL_WIDTH}
      zIndex={zIndex}
      className="general-volunteer-interview2-fail-complete-modal"
      description={buildGeneralVolunteerInterview2FailCompleteDescription(
        volunteerName,
        failReason
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
