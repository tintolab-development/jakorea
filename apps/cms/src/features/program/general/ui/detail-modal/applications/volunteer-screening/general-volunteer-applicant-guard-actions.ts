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

function guardGeneralVolunteerInterview2Withdrawn(
  row: GeneralVolunteerApplicantRow,
  actionTitle: string
): boolean {
  if (row.interviewAssignmentStatus !== 'withdrawn') return true
  cmsAlertModal.show({
    title: actionTitle,
    content: '활동 포기한 봉사자는 면접 처리를 할 수 없습니다.',
  })
  return false
}

export function guardGeneralVolunteerInterview2Fail(row: GeneralVolunteerApplicantRow): boolean {
  if (!guardGeneralVolunteerInterview2Withdrawn(row, '면접 불합격 안내')) return false
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

export function guardGeneralVolunteerInterview2Pass(row: GeneralVolunteerApplicantRow): boolean {
  if (!guardGeneralVolunteerInterview2Withdrawn(row, '면접 합격 안내')) return false
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

export function guardGeneralVolunteerInterview2Evaluation(row: GeneralVolunteerApplicantRow): boolean {
  if (!guardGeneralVolunteerInterview2Withdrawn(row, '면접 평가 안내')) return false
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

export function alertGeneralVolunteerInterview2BulkPassTypeRequired(): void {
  cmsAlertModal.show({
    title: '일괄 합격 안내',
    content: '합격 유형을 선택해 주세요.',
  })
}
