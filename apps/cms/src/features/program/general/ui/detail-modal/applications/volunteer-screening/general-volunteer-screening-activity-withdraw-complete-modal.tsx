import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { buildGeneralVolunteerScreeningActivityWithdrawCompleteDescription } from '@/features/program/general/lib/general-volunteer-activity-withdraw'
import '@/features/program/shared/ui/detail-modal/components/instructor-approval-complete-modal.css'

const MODAL_WIDTH = 600
export const GENERAL_VOLUNTEER_SCREENING_ACTIVITY_WITHDRAW_COMPLETE_MODAL_Z = 2550

export type GeneralVolunteerScreeningActivityWithdrawCompleteModalProps = {
  open: boolean
  volunteerName: string
  onClose: () => void
  zIndex?: number
}

export function GeneralVolunteerScreeningActivityWithdrawCompleteModal({
  open,
  volunteerName,
  onClose,
  zIndex = GENERAL_VOLUNTEER_SCREENING_ACTIVITY_WITHDRAW_COMPLETE_MODAL_Z,
}: GeneralVolunteerScreeningActivityWithdrawCompleteModalProps) {
  return (
    <ContentModal
      open={open}
      onCancel={onClose}
      title="활동 포기 완료"
      width={MODAL_WIDTH}
      zIndex={zIndex}
      className="general-volunteer-interview2-pass-complete-modal"
      description={buildGeneralVolunteerScreeningActivityWithdrawCompleteDescription(volunteerName)}
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
