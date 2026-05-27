import { formatAttendanceDateLabel } from '../attendance/attendance-display'
import {
  UJAT_ASSIGNMENT_SUBMISSION_STATUS_LABEL,
  type UjatAssignmentReportState,
  type UjatAssignmentReportStatus,
  type UjatAssignmentSubmissionStatusKey,
  type UjatAssignmentVolunteerRow,
} from './types'

export { formatAttendanceDateLabel as formatAssignmentDateLabel }

export function isAssignmentReportSubmitted(status: UjatAssignmentReportStatus): boolean {
  return status === 'submitted' || status === 'revised' || status === 'deadline_missed'
}

export function resolveAssignmentSubmissionStatus(
  row: Pick<UjatAssignmentVolunteerRow, 'plan' | 'log'>
): UjatAssignmentSubmissionStatusKey {
  const { plan, log } = row
  const planNot = plan.status === 'not_submitted'
  const logNot = log.status === 'not_submitted'

  if (planNot && logNot) return 'not_submitted'
  if (planNot) return 'plan_not_submitted'
  if (logNot) return 'log_not_submitted'

  const planLate = plan.status === 'deadline_missed'
  const logLate = log.status === 'deadline_missed'

  if (planLate && logLate) return 'deadline_missed'
  if (planLate) return 'plan_deadline_missed'
  if (logLate) return 'log_deadline_missed'

  return 'completed'
}

export function assignmentSubmissionStatusLabel(
  key: UjatAssignmentSubmissionStatusKey
): string {
  return UJAT_ASSIGNMENT_SUBMISSION_STATUS_LABEL[key]
}

export type UjatAssignmentSubmissionStatusTone =
  | 'completed'
  | 'not_submitted'
  | 'deadline_missed'

export const UJAT_ASSIGNMENT_SUBMISSION_STATUS_COLOR: Record<
  UjatAssignmentSubmissionStatusTone,
  string
> = {
  completed: 'var(--main-BK, #3D3D3D)',
  not_submitted: '#C32F4A',
  deadline_missed: 'var(--color-green, #1E8C29)',
} as const

export const UJAT_ASSIGNMENT_SUBMISSION_STATUS_CLASSNAME: Record<
  UjatAssignmentSubmissionStatusTone,
  string
> = {
  completed: 'ujat-education-progress-assignments__status--completed',
  not_submitted: 'ujat-education-progress-assignments__status--not-submitted',
  deadline_missed: 'ujat-education-progress-assignments__status--deadline-missed',
} as const

export function assignmentSubmissionStatusTone(
  key: UjatAssignmentSubmissionStatusKey
): UjatAssignmentSubmissionStatusTone {
  if (
    key === 'plan_not_submitted' ||
    key === 'log_not_submitted' ||
    key === 'not_submitted'
  ) {
    return 'not_submitted'
  }
  if (
    key === 'plan_deadline_missed' ||
    key === 'log_deadline_missed' ||
    key === 'deadline_missed'
  ) {
    return 'deadline_missed'
  }
  return 'completed'
}

export function assignmentSubmissionStatusClassName(
  key: UjatAssignmentSubmissionStatusKey
): string {
  return UJAT_ASSIGNMENT_SUBMISSION_STATUS_CLASSNAME[assignmentSubmissionStatusTone(key)]
}

export function assignmentSubmissionStatusColor(
  key: UjatAssignmentSubmissionStatusKey
): string {
  return UJAT_ASSIGNMENT_SUBMISSION_STATUS_COLOR[assignmentSubmissionStatusTone(key)]
}

function remarkForReport(
  reportLabel: string,
  report: UjatAssignmentReportState
): string | null {
  if (report.status === 'deadline_missed' && report.submittedDateLabel) {
    return `${reportLabel} 기한 미준수 (${report.submittedDateLabel})`
  }
  if (report.status === 'revised' && report.submittedDateLabel) {
    return `${reportLabel} 수정 제출 (${report.submittedDateLabel})`
  }
  return null
}

export function formatAssignmentRemarks(
  row: Pick<UjatAssignmentVolunteerRow, 'plan' | 'log'>
): string {
  const lines = [
    remarkForReport('교육 계획서', row.plan),
    remarkForReport('교육일지', row.log),
  ].filter((line): line is string => line != null)

  return lines.length > 0 ? lines.join('\n') : '-'
}

export function isAssignmentPlanViewEnabled(plan: UjatAssignmentReportState): boolean {
  return plan.status !== 'not_submitted'
}

export function isAssignmentLogViewEnabled(log: UjatAssignmentReportState): boolean {
  return log.status !== 'not_submitted'
}

export function filterVisibleAssignmentVolunteers(
  volunteers: UjatAssignmentVolunteerRow[]
): UjatAssignmentVolunteerRow[] {
  return volunteers.filter(v => !v.isDropout || v.plan !== undefined)
}

export function cloneAssignmentVolunteerRows(
  rows: UjatAssignmentVolunteerRow[]
): UjatAssignmentVolunteerRow[] {
  return rows.map(row => ({
    ...row,
    plan: { ...row.plan },
    log: { ...row.log },
  }))
}

export function cloneAssignmentSessionVolunteers(
  sessions: { volunteers: UjatAssignmentVolunteerRow[] }[]
): UjatAssignmentVolunteerRow[] {
  return sessions.flatMap(s => cloneAssignmentVolunteerRows(s.volunteers))
}
