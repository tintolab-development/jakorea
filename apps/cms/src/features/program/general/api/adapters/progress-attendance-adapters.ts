import dayjs from 'dayjs'
import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import type { DashboardProgramScheduleResponse } from '@/shared/api/generated/dashboard/schemas/dashboardProgramScheduleResponse'
import type { AttendanceItemResponse } from '@/shared/api/generated/dashboard/schemas/attendanceItemResponse'
import type { AttendanceItemRequest } from '@/shared/api/generated/dashboard/schemas/attendanceItemRequest'
import type { ParticipantListItemResponse } from '@/shared/api/generated/dashboard/schemas/participantListItemResponse'
import {
  formatArrivalTimeForDisplay,
  toIsoLocalTime,
} from '@/shared/lib/attendance-arrival-time'
import type {
  ParticipatingIndividualProgressAttendanceParticipantRow,
  ParticipatingIndividualProgressAttendanceSessionGroup,
  ParticipatingIndividualProgressAttendanceStatus,
} from '@/features/program/general/lib/participating-individual-progress-attendance-types'
import {
  isScheduleAttendanceOpenForDisplay,
  mapDashboardScheduleDeliveryToEducationProgress,
} from '@/features/program/general/lib/dashboard-schedule-delivery-status'
import { resolveStoredAffiliation } from '@/features/program/general/lib/affiliation-organization'
import {
  formatIndividualProgressAttendanceAffiliationGradeLabel,
  formatIndividualProgressAttendanceGenderBirthLabel,
} from '@/features/program/general/lib/participating-individual-progress-attendance-display'
import { mapApiGenderToStudentGenderKey } from '@/features/program/general/api/adapters/student-roster-adapters'
import { STUDENT_GENDER_LABELS } from '@/features/program/general/model/school-detail-types'
import { toDisplayGender } from '@/features/user/api/map-member-gender-birth'

const UI_TO_API_STATUS: Record<ParticipatingIndividualProgressAttendanceStatus, string> = {
  present: 'PRESENT',
  late: 'LATE',
  absent: 'ABSENT',
  excused_absence: 'EXCUSED',
}

const SCHEDULE_PROGRESS_STATUSES = new Set([
  'COMPLETED',
  'SCHEDULED',
  'UNSCHEDULED',
  'PENDING',
  'NOT_STARTED',
  'IN_PROGRESS',
  'ONGOING',
  'DONE',
  'FINISHED',
])

/** @deprecated 이름 호환 — `mapDashboardScheduleDeliveryToEducationProgress` 사용 */
export const mapDashboardScheduleStatusToEducationProgress =
  mapDashboardScheduleDeliveryToEducationProgress

/** 출석 API status → UI. 일정 진행값·빈 값은 출석 미기록(null). */
export function mapApiAttendanceStatusToUi(
  status: string | null | undefined
): ParticipatingIndividualProgressAttendanceStatus | null {
  if (status == null) return null
  const normalized = (status ?? '').trim().toUpperCase()
  if (!normalized || SCHEDULE_PROGRESS_STATUSES.has(normalized)) return null
  if (normalized === 'LATE') return 'late'
  if (normalized === 'ABSENT') return 'absent'
  if (
    normalized === 'EXCUSED' ||
    normalized === 'EXCUSED_ABSENCE' ||
    normalized === 'REASON_ABSENT'
  ) {
    return 'excused_absence'
  }
  if (
    normalized === 'PRESENT' ||
    normalized === 'ATTEND' ||
    normalized === 'ATTENDED'
  ) {
    return 'present'
  }
  const lower = (status ?? '').trim().toLowerCase()
  if (lower === 'late') return 'late'
  if (lower === 'absent') return 'absent'
  if (lower === 'excused_absence' || lower === 'excused') return 'excused_absence'
  if (lower === 'present' || lower === 'attend' || lower === 'attended') return 'present'
  return null
}

export function mapUiAttendanceStatusToApi(
  status: ParticipatingIndividualProgressAttendanceStatus
): string {
  return UI_TO_API_STATUS[status]
}

function formatDateLabel(value: string | null | undefined, pattern: string): string {
  if (!value?.trim()) return ''
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed.format(pattern) : value.trim()
}

function mapGenderLabel(gender?: string | null): string {
  const key = mapApiGenderToStudentGenderKey(gender)
  if (key) return STUDENT_GENDER_LABELS[key]
  return toDisplayGender(gender)
}

function mapBirthLabel(birthDate?: string | null): string {
  return formatDateLabel(birthDate, 'YYYY.MM.DD') || '-'
}

function formatScheduleHeader(schedule: DashboardProgramScheduleResponse, index: number): {
  round: number
  filterValue: string
  filterLabel: string
  headerTitle: string
  headerScheduleSummary: string
  headerPeriodRangeLabel: string
  headerPrefix: string
} {
  const round = schedule.sessionNo ?? index + 1
  const start = schedule.startAt ? dayjs(schedule.startAt) : null
  const end = schedule.endAt ? dayjs(schedule.endAt) : null
  const isAllDay =
    start?.isValid() === true &&
    end?.isValid() === true &&
    start.format('HH:mm') === '00:00' &&
    end.format('HH:mm') === '00:00'
  const dateLabel =
    start?.isValid() === true
      ? formatCmsScheduleDisplayLabel(
          isAllDay || end?.isValid() !== true
            ? start.format('YYYY-MM-DD')
            : end.isSame(start, 'day')
              ? `${start.format('YYYY-MM-DD HH:mm')} ~ ${end.format('HH:mm')}`
              : `${start.format('YYYY-MM-DD HH:mm')} ~ ${end.format('YYYY-MM-DD HH:mm')}`
        )
      : (schedule.scheduleName ?? `${round}회차`)
  const periodLabel =
    start?.isValid() === true
      ? formatCmsScheduleDisplayLabel(
          end?.isValid() === true && !start.isSame(end, 'day')
            ? `${start.format('YYYY-MM-DD')} ~ ${end.format('YYYY-MM-DD')}`
            : start.format('YYYY-MM-DD')
        )
      : dateLabel
  const filterValue = String(schedule.scheduleId ?? round)
  const filterLabel = `${round}회차 · ${dateLabel}`
  return {
    round,
    filterValue,
    filterLabel,
    headerTitle: `${round}회차 출석`,
    headerScheduleSummary: filterLabel,
    headerPeriodRangeLabel: periodLabel,
    headerPrefix: `${round}회차`,
  }
}

type ProgressAttendanceParticipantInput = Pick<
  ParticipantListItemResponse,
  'participantId' | 'memberName' | 'participantType'
> &
  Partial<ParticipantListItemResponse>

function mapParticipantRow(
  participant: ProgressAttendanceParticipantInput,
  attendance: AttendanceItemResponse | undefined,
  schedule: Pick<DashboardProgramScheduleResponse, 'scheduleStatus' | 'startAt'>
): ParticipatingIndividualProgressAttendanceParticipantRow {
  const participantId = String(participant.participantId ?? '')
  const status = mapApiAttendanceStatusToUi(attendance?.status)
  const attendanceRecorded =
    status != null && isScheduleAttendanceOpenForDisplay(schedule)
  const lateTime =
    status === 'late' ? formatArrivalTimeForDisplay(attendance?.arrivalTime) : undefined
  const affiliationResolved = resolveStoredAffiliation({
    affiliationOrganizationId: participant.organizationId,
    affiliationDisplayName: participant.organizationName,
  })
  const affiliation = affiliationResolved.affiliation?.trim() || '-'
  const educationGrade = participant.grade?.trim() || '-'
  const contact = participant.contact?.trim() || participant.phone?.trim() || undefined
  const email = participant.email?.trim() || undefined
  return {
    id: `att-${participantId}`,
    participantId,
    name: participant.memberName?.trim() || `참여자 ${participantId}`,
    genderBirthLabel: formatIndividualProgressAttendanceGenderBirthLabel(
      mapGenderLabel(participant.gender),
      mapBirthLabel(participant.birthDate)
    ),
    affiliationGradeLabel: formatIndividualProgressAttendanceAffiliationGradeLabel(
      affiliation,
      educationGrade
    ),
    affiliation,
    educationGrade,
    contact,
    email,
    attendanceRecorded,
    ...(attendanceRecorded ? { attendanceStatus: status } : {}),
    lateTime,
    remark: attendance?.absenceReason ?? undefined,
  }
}

export function buildProgressAttendanceSessionsFromRemote(params: {
  schedules: DashboardProgramScheduleResponse[]
  participants: ProgressAttendanceParticipantInput[]
  attendancesByScheduleId: Record<string, AttendanceItemResponse[]>
}): ParticipatingIndividualProgressAttendanceSessionGroup[] {
  const individuals = params.participants.filter(p => {
    const type = (p.participantType ?? '').toUpperCase()
    return type === 'INDIVIDUAL' || type === 'STUDENT' || type === 'PARTICIPANT' || type === ''
  })
  const roster = individuals.length > 0 ? individuals : params.participants

  return params.schedules
    .filter(s => {
      if (s.scheduleId == null) return false
      const attendances = params.attendancesByScheduleId[String(s.scheduleId)]
      return Array.isArray(attendances) && attendances.length > 0
    })
    .map((schedule, index) => {
      const scheduleId = String(schedule.scheduleId)
      const attendances = params.attendancesByScheduleId[scheduleId] ?? []
      const byParticipant = new Map(
        attendances
          .filter(a => a.participantId != null)
          .map(a => [String(a.participantId), a] as const)
      )
      const header = formatScheduleHeader(schedule, index)
      const attendanceRecordingOpen = isScheduleAttendanceOpenForDisplay(schedule)
      return {
        id: scheduleId,
        ...header,
        scheduleEducationProgress: mapDashboardScheduleDeliveryToEducationProgress(
          schedule.scheduleStatus
        ),
        attendanceRecordingOpen,
        participants: roster.map(p =>
          mapParticipantRow(p, byParticipant.get(String(p.participantId)), schedule)
        ),
      }
    })
}

export type AttendanceItemWriteRequest = AttendanceItemRequest & {
  /** 결석·사유 정정 증빙. 없거나 빈 배열이면 이번 정정에 증빙 없음 */
  fileObjectIds?: number[]
}

export function buildAttendanceItemRequest(params: {
  participantId: string
  attendanceStatus: ParticipatingIndividualProgressAttendanceStatus
  lateTime?: string
  remark?: string
  fileObjectIds?: number[]
}): AttendanceItemWriteRequest {
  const participantIdNum = Number(params.participantId)
  const status = mapUiAttendanceStatusToApi(params.attendanceStatus)
  return {
    participantId: Number.isFinite(participantIdNum) ? participantIdNum : undefined,
    status,
    absenceReason: params.remark,
    arrivalTime: toIsoLocalTime(params.lateTime) ?? undefined,
    ...(params.fileObjectIds !== undefined ? { fileObjectIds: params.fileObjectIds } : {}),
  }
}
