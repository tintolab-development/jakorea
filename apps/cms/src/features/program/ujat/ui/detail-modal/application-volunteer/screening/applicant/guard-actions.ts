import type { UjatVolunteerApplicantRow } from '@/features/program/ujat/model/ujat-volunteer-applicant'
import {
  isUjatInterviewTotalScoreUnevaluated,
  resolveUjatEffectiveSecondInterviewStatus,
} from '@/features/program/ujat/ui/detail-modal/application-volunteer/screening/interview2/display'
import { INTERVIEW_RESULT_NOT_ENDED_ALERT } from '@/features/program/shared/lib/interview-not-ended'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'

export { INTERVIEW_RESULT_NOT_ENDED_ALERT }

const INTERVIEW_EVALUATION_REQUIRED_ALERT = {
  title: '면접 평가 진행 안내',
  content: '면접 평가 진행 후 합격 혹은 불합격 처리가 가능합니다.',
  confirmLabel: '닫기',
} as const

function guardUjatVolunteerInterview2Evaluated(row: UjatVolunteerApplicantRow): boolean {
  if (!isUjatInterviewTotalScoreUnevaluated(row)) return true
  cmsAlertModal.show({ ...INTERVIEW_EVALUATION_REQUIRED_ALERT })
  return false
}

/** 배정 면접 종료 전(면접 진행 대기) — 합격·불합격·평가 모두 차단 */
function guardUjatVolunteerInterview2NotEnded(row: UjatVolunteerApplicantRow): boolean {
  if (resolveUjatEffectiveSecondInterviewStatus(row) !== 'waiting') return true
  cmsAlertModal.show({ ...INTERVIEW_RESULT_NOT_ENDED_ALERT })
  return false
}

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
  if (!guardUjatVolunteerInterview2NotEnded(row)) return false
  return guardUjatVolunteerInterview2Evaluated(row)
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
  if (!guardUjatVolunteerInterview2NotEnded(row)) return false
  return guardUjatVolunteerInterview2Evaluated(row)
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
  return guardUjatVolunteerInterview2NotEnded(row)
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
