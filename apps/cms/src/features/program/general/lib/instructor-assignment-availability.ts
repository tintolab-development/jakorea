import type {
  InstructorAssignmentAvailabilityItem,
  InstructorAssignmentAvailabilityReason,
  InstructorAssignmentAvailabilityResponse,
  InstructorAssignmentAvailabilityStatus,
} from '@/features/program/general/api/instructor-assignment-types'
import type {
  InstructorWaitingSchoolRow,
} from '@/features/program/general/lib/instructor-institution-assignment'
import type { ParticipatingIndividualInstructorWaitingScheduleRow } from '@/features/program/general/lib/participating-individual-instructor-assignment-types'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import type {
  ParticipatingSchoolRow,
  ParticipatingSchoolSession,
} from '@/features/program/general/model/participating-schools'
import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import { buildParticipatingSchoolSessionLines } from '@/features/program/general/lib/participating-school-session-display'
import { getParticipatingSchoolAssignmentSessions } from '@/features/program/general/lib/participating-school-assignment-sessions'

export const INSTRUCTOR_ASSIGNMENT_AVAILABILITY_STATUSES = [
  'AVAILABLE',
  'UNAVAILABLE',
  'ASSIGNED',
  'ASSIGNMENT_CANCELLED',
] as const satisfies readonly InstructorAssignmentAvailabilityStatus[]

export const INSTRUCTOR_ASSIGNMENT_AVAILABILITY_REASONS = [
  'CAPACITY_FULL',
  'TIME_CONFLICT_OTHER_PROGRAM',
  'TIME_CONFLICT_OTHER_ORGANIZATION',
  'SAME_ORGANIZATION_OTHER_SCHEDULE_ASSIGNED',
] as const satisfies readonly InstructorAssignmentAvailabilityReason[]

export const INSTRUCTOR_ASSIGNMENT_UNAVAILABLE_REASON_LABELS: Record<
  InstructorAssignmentAvailabilityReason,
  string
> = {
  CAPACITY_FULL: '배정 불가(정원)',
  TIME_CONFLICT_OTHER_PROGRAM: '배정 불가(다른 프로그램 시간 겹침)',
  TIME_CONFLICT_OTHER_ORGANIZATION: '배정 불가(다른 기관 시간 겹침)',
  SAME_ORGANIZATION_OTHER_SCHEDULE_ASSIGNED: '배정 불가(같은 기관 다른 일정 배정)',
}

export const INSTRUCTOR_ASSIGNMENT_WRITE_CONFLICT_MESSAGES: Record<string, string> = {
  INSTRUCTOR_ASSIGNMENT_CAPACITY_FULL: '최대 배정 가능 강사 수를 초과하여 배정할 수 없습니다.',
  INSTRUCTOR_ASSIGNMENT_TIME_CONFLICT_OTHER_PROGRAM: '같은 시간에 다른 프로그램에 배정된 강사입니다.',
  INSTRUCTOR_ASSIGNMENT_TIME_CONFLICT_OTHER_ORGANIZATION:
    '같은 시간에 다른 기관에 배정된 강사입니다.',
  INSTRUCTOR_ASSIGNMENT_SAME_ORGANIZATION_OTHER_SCHEDULE:
    '같은 기관의 다른 일정에 이미 배정된 강사입니다.',
  INSTRUCTOR_REPRESENTATIVE_ASSIGNMENT_SCOPE_NOT_FOUND:
    '대표 강사로 지정할 기관 배정 정보를 찾을 수 없습니다.',
  GENERAL_INSTRUCTOR_ASSIGNMENT_REQUIRES_RECRUITMENT:
    '강사 모집이 없는 일반 기관 프로그램에는 강사를 배정할 수 없습니다.',
}

export function normalizeAvailabilityItems(
  payload: InstructorAssignmentAvailabilityResponse | null | undefined
): InstructorAssignmentAvailabilityItem[] {
  return Array.isArray(payload?.items) ? payload.items : []
}

export function formatAvailabilityAssignedCountLabel(
  assignedInstructorCount: number | null,
  maxAssignableInstructors: number | null
): string {
  if (assignedInstructorCount == null) return '-'
  if (maxAssignableInstructors == null) return `${assignedInstructorCount}명`
  return `${assignedInstructorCount}/${maxAssignableInstructors}명`
}

export function mapAvailabilityStatusToWaiting(input: {
  status: InstructorAssignmentAvailabilityStatus
  reasons: InstructorAssignmentAvailabilityReason[]
}): {
  assignmentStatus: 'waiting' | 'unavailable' | 'assignment_cancelled'
  assignmentStatusLabel: string
} | null {
  if (input.status === 'ASSIGNED') return null
  if (input.status === 'AVAILABLE') {
    return { assignmentStatus: 'waiting', assignmentStatusLabel: '배정 대기' }
  }
  if (input.status === 'ASSIGNMENT_CANCELLED') {
    return { assignmentStatus: 'assignment_cancelled', assignmentStatusLabel: '배정 취소' }
  }
  const reason = input.reasons[0]
  return {
    assignmentStatus: 'unavailable',
    assignmentStatusLabel:
      reason != null ? INSTRUCTOR_ASSIGNMENT_UNAVAILABLE_REASON_LABELS[reason] : '배정 불가',
  }
}

function formatAvailabilityScheduleLine(
  item: InstructorAssignmentAvailabilityItem,
  scheduleLabelById: Map<string, { date?: string; time?: string; session?: string }>
): string {
  const label = scheduleLabelById.get(String(item.scheduleId))
  const fromBoard = [label?.date, label?.time, label?.session].filter(Boolean)
  if (fromBoard.length > 0) return fromBoard.join(' | ')
  const start = item.startAt?.trim() ? formatCmsScheduleDisplayLabel(item.startAt) : ''
  const end = item.endAt?.trim() ? formatCmsScheduleDisplayLabel(item.endAt) : ''
  if (start && end && start !== end) return `${start} ~ ${end}`
  return start || '-'
}

function sessionsForSchedule(
  school: ParticipatingSchoolRow | undefined,
  scheduleId: number
): ParticipatingSchoolSession[] {
  if (!school) return []
  return getParticipatingSchoolAssignmentSessions(school).filter(
    session => session.resolvedScheduleId === scheduleId
  )
}

export function buildWaitingSchoolRowsFromAvailability(input: {
  items: InstructorAssignmentAvailabilityItem[]
  instructor: ParticipatingInstructorRow
  schoolRows: ParticipatingSchoolRow[]
  scheduleLabelById: Map<string, { date?: string; time?: string; session?: string }>
  instructorMemberId: string
}): InstructorWaitingSchoolRow[] {
  const rows: InstructorWaitingSchoolRow[] = []
  let no = 0
  for (const item of input.items) {
    const mapped = mapAvailabilityStatusToWaiting({
      status: item.status,
      reasons: Array.isArray(item.reasons) ? item.reasons : [],
    })
    if (!mapped) continue
    no += 1
    const orgAppId =
      item.organizationApplicationId != null ? String(item.organizationApplicationId) : ''
    const school = orgAppId
      ? input.schoolRows.find(row => row.organizationApplicationId === orgAppId)
      : undefined
    const sessions = sessionsForSchedule(school, item.scheduleId)
    const scheduleLines =
      sessions.length > 0
        ? buildParticipatingSchoolSessionLines(sessions)
        : [formatAvailabilityScheduleLine(item, input.scheduleLabelById)]
    rows.push({
      id: orgAppId
        ? `${school?.id ?? orgAppId}__schedule-${item.scheduleId}`
        : `schedule-${item.scheduleId}`,
      no,
      schoolId: school?.id ?? (orgAppId || String(item.scheduleId)),
      scheduleKey: `schedule-${item.scheduleId}`,
      sessions,
      schoolName: school?.schoolName ?? '-',
      desiredGrade: school?.educationGrade ?? '-',
      region: school?.region ?? '-',
      distanceFromHome: '-',
      educationScheduleLines: scheduleLines,
      assignmentStatus: mapped.assignmentStatus,
      assignmentStatusLabel: mapped.assignmentStatusLabel,
      assignedInstructorCountLabel: formatAvailabilityAssignedCountLabel(
        item.assignedInstructorCount,
        item.maxAssignableInstructors
      ),
      organizationApplicationId: orgAppId || undefined,
      instructorApplicationId: input.instructor.instructorApplicationId,
      instructorMemberId: input.instructorMemberId,
      resolvedScheduleId: item.scheduleId,
    })
  }
  return rows
}

export function buildWaitingScheduleRowsFromAvailability(input: {
  items: InstructorAssignmentAvailabilityItem[]
  instructor: ParticipatingInstructorRow
  scheduleLabelById: Map<string, { date?: string; time?: string; session?: string }>
  lectureLocationByScheduleId?: Map<string, string>
  instructorMemberId: string
}): ParticipatingIndividualInstructorWaitingScheduleRow[] {
  const rows: ParticipatingIndividualInstructorWaitingScheduleRow[] = []
  let no = 0
  for (const item of input.items) {
    const mapped = mapAvailabilityStatusToWaiting({
      status: item.status,
      reasons: Array.isArray(item.reasons) ? item.reasons : [],
    })
    if (!mapped) continue
    no += 1
    const scheduleKey = String(item.scheduleId)
    rows.push({
      id: `schedule-${scheduleKey}`,
      no,
      slotKey: scheduleKey,
      schoolId: scheduleKey,
      lectureLocation:
        input.lectureLocationByScheduleId?.get(scheduleKey)?.trim() || '-',
      distanceFromHome: '-',
      scheduleLabel: formatAvailabilityScheduleLine(item, input.scheduleLabelById),
      assignmentStatus: mapped.assignmentStatus,
      assignmentStatusLabel: mapped.assignmentStatusLabel,
      assignedInstructorCountLabel: formatAvailabilityAssignedCountLabel(
        item.assignedInstructorCount,
        item.maxAssignableInstructors
      ),
      instructorApplicationId: input.instructor.instructorApplicationId,
      instructorMemberId: input.instructorMemberId,
      resolvedScheduleId: item.scheduleId,
    })
  }
  return rows
}

export function waitingAssignmentStatusLabel<T extends string>(
  status: T,
  fallbackLabels: Record<T, string>,
  assignmentStatusLabel?: string
): string {
  return assignmentStatusLabel?.trim() || fallbackLabels[status]
}
