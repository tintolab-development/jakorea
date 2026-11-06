import {
  isGeneralInterviewTotalScoreUnevaluated,
  resolveGeneralEffectiveSecondInterviewStatus,
} from '@/features/program/general/lib/general-volunteer-interview2-display'
import type { GeneralVolunteerApplicantRow } from '@/features/program/general/model/volunteer-applicant'
import { INTERVIEW_RESULT_NOT_ENDED_ALERT } from '@/features/program/shared/lib/interview-not-ended'
import {
  canReassignVolunteerInterviewAssignment,
  VOLUNTEER_INTERVIEW_REASSIGN_BLOCKED_ALERT,
} from '@/features/program/shared/lib/volunteer-interview-reassign'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'

export { INTERVIEW_RESULT_NOT_ENDED_ALERT }

const INTERVIEW_EVALUATION_REQUIRED_ALERT = {
  title: '면접 평가 진행 안내',
  content: '면접 평가 진행 후 합격 혹은 불합격 처리가 가능합니다.',
  confirmLabel: '닫기',
} as const

function guardGeneralVolunteerInterview2Evaluated(row: GeneralVolunteerApplicantRow): boolean {
  if (!isGeneralInterviewTotalScoreUnevaluated(row)) return true
  cmsAlertModal.show({ ...INTERVIEW_EVALUATION_REQUIRED_ALERT })
  return false
}

/** 배정 면접 종료 전(면접 진행 대기) — 합격·불합격·평가 모두 차단 */
function guardGeneralVolunteerInterview2NotEnded(row: GeneralVolunteerApplicantRow): boolean {
  if (resolveGeneralEffectiveSecondInterviewStatus(row) !== 'waiting') return true
  cmsAlertModal.show({ ...INTERVIEW_RESULT_NOT_ENDED_ALERT })
  return false
}

export function guardGeneralVolunteerWithdrawActivity(row: GeneralVolunteerApplicantRow): boolean {
  if (row.interviewAssignmentStatus !== 'withdrawn') return true
  cmsAlertModal.show({
    title: '활동 포기 안내',
    content: '이미 활동 포기 처리된 봉사자입니다.',
  })
  return false
}

const VOLUNTEER_ASSIGNMENT_BLOCKED_APPLICATION_STATUSES = new Set([
  'APPROVAL_CANCELLED',
  'REJECTED',
  'AUTO_REJECTED',
  'INTERVIEW_FAILED',
  'GIVE_UP',
  'CANCELLED',
  'COMPLETED',
])

export function isVolunteerAssignmentBlockedApplicationStatus(
  status: string | null | undefined,
): boolean {
  return VOLUNTEER_ASSIGNMENT_BLOCKED_APPLICATION_STATUSES.has(status?.trim().toUpperCase() ?? '')
}

export function guardGeneralVolunteerAssignInterview(row: GeneralVolunteerApplicantRow): boolean {
  if (isVolunteerAssignmentBlockedApplicationStatus(row.applicationStatus)) {
    cmsAlertModal.show({
      title: '면접일 배정 안내',
      content: '현재 신청 상태에서는 승인·반려·취소 처리를 수행할 수 없습니다.',
    })
    return false
  }
  if (row.interviewAssignmentStatus === 'not_required') {
    cmsAlertModal.show({
      title: '면접일 배정 안내',
      content: '면접이 필요하지 않은 신청입니다. 면접일을 배정할 수 없습니다.',
    })
    return false
  }
  if (row.interviewAssignmentStatus === 'withdrawn') {
    cmsAlertModal.show({
      title: '면접일 배정 안내',
      content: '활동 포기한 봉사자에게는 면접일을 배정할 수 없습니다.',
    })
    return false
  }
  if (
    row.interviewAssignmentStatus === 'assigned' &&
    !canReassignVolunteerInterviewAssignment(row)
  ) {
    cmsAlertModal.show({ ...VOLUNTEER_INTERVIEW_REASSIGN_BLOCKED_ALERT })
    return false
  }
  return true
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
  if (!guardGeneralVolunteerInterview2NotEnded(row)) return false
  return guardGeneralVolunteerInterview2Evaluated(row)
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
  if (!guardGeneralVolunteerInterview2NotEnded(row)) return false
  return guardGeneralVolunteerInterview2Evaluated(row)
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
  return guardGeneralVolunteerInterview2NotEnded(row)
}

