import type { UjatInstitutionApplicationRegionKey } from '../../application-institution/list/regions'
import type { EducationProgressHalfKey } from '../tabs'

export type UjatAssignmentReportStatus =
  | 'submitted'
  | 'not_submitted'
  | 'deadline_missed'
  | 'revised'

export type UjatAssignmentReportState = {
  status: UjatAssignmentReportStatus
  submittedDateLabel?: string
  /** 피드백 전달 후 봉사자가 아직 수정 제출하지 않은 상태의 피드백 작성일 */
  feedbackDeliveredDateLabel?: string
}

export type UjatAssignmentSubmissionStatusKey =
  | 'completed'
  | 'plan_not_submitted'
  | 'log_not_submitted'
  | 'not_submitted'
  | 'plan_deadline_missed'
  | 'log_deadline_missed'
  | 'deadline_missed'

export const UJAT_ASSIGNMENT_SUBMISSION_STATUS_LABEL: Record<
  UjatAssignmentSubmissionStatusKey,
  string
> = {
  completed: '제출 완료',
  plan_not_submitted: '교육계획서 미제출',
  log_not_submitted: '교육일지 미제출',
  not_submitted: '미제출',
  plan_deadline_missed: '교육계획서 기한 미준수',
  log_deadline_missed: '교육일지 기한 미준수',
  deadline_missed: '기한 미준수',
} as const

export const UJAT_ASSIGNMENT_SUBMISSION_STATUS_ORDER: readonly UjatAssignmentSubmissionStatusKey[] =
  [
    'completed',
    'plan_not_submitted',
    'log_not_submitted',
    'not_submitted',
    'plan_deadline_missed',
    'log_deadline_missed',
    'deadline_missed',
  ] as const

export type UjatAssignmentVolunteerRow = {
  id: string
  name: string
  institutionName: string
  assignedClass: string
  plan: UjatAssignmentReportState
  log: UjatAssignmentReportState
  isDropout: boolean
  /** 활동 포기자라도 해당 교육일에 진행 이력이 있으면 노출 */
  hasProgressHistory?: boolean
}

export type UjatAssignmentSessionGroup = {
  id: string
  regionKey: UjatInstitutionApplicationRegionKey
  half: EducationProgressHalfKey
  isoDate: string
  dateLabel: string
  planSubmissionPeriodLabel: string
  logSubmissionPeriodLabel: string
  volunteers: UjatAssignmentVolunteerRow[]
}

export const UJAT_ASSIGNMENT_FILTER_ALL = ''

export type UjatAssignmentFilters = {
  educationDate: string
  volunteerName: string
  institutionName: string
  submissionStatus: string
}

export const EMPTY_UJAT_ASSIGNMENT_FILTERS: UjatAssignmentFilters = {
  educationDate: UJAT_ASSIGNMENT_FILTER_ALL,
  volunteerName: '',
  institutionName: UJAT_ASSIGNMENT_FILTER_ALL,
  submissionStatus: UJAT_ASSIGNMENT_FILTER_ALL,
}
