import type { GeneralVolunteerApplicantRow } from '@/data/mock/general-volunteer-applicants-mock'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'

export function guardGeneralVolunteerWithdrawActivity(row: GeneralVolunteerApplicantRow): boolean {
  if (row.interviewAssignmentStatus !== 'withdrawn') return true
  cmsAlertModal.show({
    title: '활동 포기 안내',
    content: '이미 활동 포기 처리된 봉사자입니다.',
  })
  return false
}

export function guardGeneralVolunteerAssignInterview(row: GeneralVolunteerApplicantRow): boolean {
  if (row.interviewAssignmentStatus !== 'withdrawn') return true
  cmsAlertModal.show({
    title: '면접일 배정 안내',
    content: '활동 포기한 봉사자에게는 면접일을 배정할 수 없습니다.',
  })
  return false
}
