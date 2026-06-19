import type { UjatVolunteerApplicantRow } from '@/data/mock/ujat-volunteer-applicants-mock'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'

export function guardUjatVolunteerWithdrawActivity(row: UjatVolunteerApplicantRow): boolean {
  if (row.interviewAssignmentStatus !== 'withdrawn') return true
  cmsAlertModal.show({
    title: '활동 포기 안내',
    content: '이미 활동 포기 처리된 봉사자입니다.',
  })
  return false
}

export function guardUjatVolunteerAssignInterview(row: UjatVolunteerApplicantRow): boolean {
  if (row.interviewAssignmentStatus !== 'withdrawn') return true
  cmsAlertModal.show({
    title: '면접일 배정 안내',
    content: '활동 포기한 봉사자에게는 면접일을 배정할 수 없습니다.',
  })
  return false
}

function guardUjatVolunteerInterview2Withdrawn(row: UjatVolunteerApplicantRow, actionTitle: string): boolean {
  if (row.interviewAssignmentStatus !== 'withdrawn') return true
  cmsAlertModal.show({
    title: actionTitle,
    content: '활동 포기한 봉사자는 면접 처리를 할 수 없습니다.',
  })
  return false
}

export function guardUjatVolunteerInterview2Fail(row: UjatVolunteerApplicantRow): boolean {
  if (!guardUjatVolunteerInterview2Withdrawn(row, '면접 불합격 안내')) return false
  if (row.secondInterviewScreeningStatus === 'fail') {
    cmsAlertModal.show({
      title: '면접 불합격 안내',
      content: '이미 면접 불합격 처리된 봉사자입니다.',
    })
    return false
  }
  if (row.secondInterviewScreeningStatus === 'pass') {
    cmsAlertModal.show({
      title: '면접 불합격 안내',
      content: '이미 면접 합격 처리된 봉사자입니다.',
    })
    return false
  }
  return true
}

export function guardUjatVolunteerInterview2Pass(row: UjatVolunteerApplicantRow): boolean {
  if (!guardUjatVolunteerInterview2Withdrawn(row, '면접 합격 안내')) return false
  if (row.secondInterviewScreeningStatus === 'pass') {
    cmsAlertModal.show({
      title: '면접 합격 안내',
      content: '이미 면접 합격 처리된 봉사자입니다.',
    })
    return false
  }
  if (row.secondInterviewScreeningStatus === 'fail') {
    cmsAlertModal.show({
      title: '면접 합격 안내',
      content: '이미 면접 불합격 처리된 봉사자입니다.',
    })
    return false
  }
  return true
}

export function guardUjatVolunteerInterview2Evaluation(row: UjatVolunteerApplicantRow): boolean {
  if (!guardUjatVolunteerInterview2Withdrawn(row, '면접 평가 안내')) return false
  if (row.secondInterviewScreeningStatus === 'pass') {
    cmsAlertModal.show({
      title: '면접 평가 안내',
      content: '이미 면접 합격 처리된 봉사자입니다.',
    })
    return false
  }
  if (row.secondInterviewScreeningStatus === 'fail') {
    cmsAlertModal.show({
      title: '면접 평가 안내',
      content: '이미 면접 불합격 처리된 봉사자입니다.',
    })
    return false
  }
  return true
}

export function alertUjatVolunteerInterviewAssignSlotRequired(): void {
  cmsAlertModal.show({
    title: '면접일 배정 안내',
    content: '면접 일정을 선택해 주세요.',
  })
}

export function alertUjatVolunteerInterview2BulkPassTypeRequired(): void {
  cmsAlertModal.show({
    title: '일괄 합격 안내',
    content: '합격 유형을 선택해 주세요.',
  })
}
