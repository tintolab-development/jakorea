import type { GeneralInterviewAssignConfirmPayload } from './general-volunteer-interview-assign-modal'
import { UjatVolunteerInterviewAssignCompleteModal } from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/ujat-volunteer-interview-assign-complete-modal'

export type GeneralVolunteerInterviewAssignCompleteModalProps = {
  open: boolean
  applicantName: string
  mode: 'assign' | 'reassign'
  payload: GeneralInterviewAssignConfirmPayload
  onClose: () => void
}

/** UJAT 면접일 배정·재배정 완료 모달 UI 재사용 */
export function GeneralVolunteerInterviewAssignCompleteModal({
  open,
  applicantName,
  mode,
  payload,
  onClose,
}: GeneralVolunteerInterviewAssignCompleteModalProps) {
  return (
    <UjatVolunteerInterviewAssignCompleteModal
      open={open}
      applicantName={applicantName}
      mode={mode}
      payload={payload}
      onClose={onClose}
    />
  )
}
