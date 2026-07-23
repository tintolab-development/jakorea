import dayjs from 'dayjs'
import type { DashboardProgramScheduleResponse } from '@/shared/api/generated/dashboard/schemas/dashboardProgramScheduleResponse'
import type { AttendanceItemResponse } from '@/shared/api/generated/dashboard/schemas/attendanceItemResponse'
import type { AttendanceItemRequest } from '@/shared/api/generated/dashboard/schemas/attendanceItemRequest'
import type { ParticipantListItemResponse } from '@/shared/api/generated/dashboard/schemas/participantListItemResponse'
import type {
  ParticipatingIndividualProgressAttendanceParticipantRow,
  ParticipatingIndividualProgressAttendanceSessionGroup,
  ParticipatingIndividualProgressAttendanceStatus,
} from '@/features/program/general/lib/participating-individual-progress-attendance-types'

const UI_TO_API_STATUS: Record<ParticipatingIndividualProgressAttendanceStatus, string> = {
  present: 'PRESENT',
  late: 'LATE',
  absent: 'ABSENT',
  excused_absence: 'EXCUSED',
}

export function mapApiAttendanceStatusToUi(
  status: string | undefined
): ParticipatingIndividualProgressAttendanceStatus {
  const normalized = (status ?? '').trim().toUpperCase()
  if (normalized === 'LATE') return 'late'
  if (normalized === 'ABSENT') return 'absent'
  if (normalized === 'EXCUSED' || normalized === 'EXCUSED_ABSENCE' || normalized === 'REASON_ABSENT') {
    return 'excused_absence'
  }
  if (normalized === 'PRESENT' || normalized === 'ATTEND') return 'present'
  const lower = (status ?? '').trim().toLowerCase()
  if (lower === 'late') return 'late'
  if (lower === 'absent') return 'absent'
  if (lower === 'excused_absence' || lower === 'excused') return 'excused_absence'
  return 'present'
}

export function mapUiAttendanceStatusToApi(
  status: ParticipatingIndividualProgressAttendanceStatus
): string {
  return UI_TO_API_STATUS[status]
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
  const dateLabel =
    start?.isValid() === true ? start.format('YYYY.MM.DD') : (schedule.scheduleName ?? `${round}회차`)
  const timeLabel =
    start?.isValid() === true && end?.isValid() === true
      ? `${start.format('HH:mm')}~${end.format('HH:mm')}`
      : ''
  const filterValue = String(schedule.scheduleId ?? round)
  const filterLabel = `${round}회차 · ${dateLabel}${timeLabel ? ` ${timeLabel}` : ''}`
  return {
    round,
    filterValue,
    filterLabel,
    headerTitle: `${round}회차 출석`,
    headerScheduleSummary: filterLabel,
    headerPeriodRangeLabel: dateLabel,
    headerPrefix: `${round}회차`,
  }
}

function mapParticipantRow(
  participant: ParticipantListItemResponse,
  attendance: AttendanceItemResponse | undefined
): ParticipatingIndividualProgressAttendanceParticipantRow {
  const participantId = String(participant.participantId ?? '')
  const status = mapApiAttendanceStatusToUi(attendance?.status)
  const arrival = attendance?.arrivalTime
  const lateTime =
    status === 'late' && arrival
      ? dayjs(arrival).isValid()
        ? dayjs(arrival).format('H:mm')
        : arrival
      : undefined
  return {
    id: `att-${participantId}`,
    participantId,
    name: participant.memberName?.trim() || `참여자 ${participantId}`,
    genderBirthLabel: '-',
    affiliationGradeLabel: '-',
    affiliation: '-',
    educationGrade: '-',
    attendanceStatus: status,
    lateTime,
    remark: attendance?.absenceReason,
  }
}

export function buildProgressAttendanceSessionsFromRemote(params: {
  schedules: DashboardProgramScheduleResponse[]
  participants: ParticipantListItemResponse[]
  attendancesByScheduleId: Record<string, AttendanceItemResponse[]>
}): ParticipatingIndividualProgressAttendanceSessionGroup[] {
  const individuals = params.participants.filter(p => {
    const type = (p.participantType ?? '').toUpperCase()
    return type === 'INDIVIDUAL' || type === 'STUDENT' || type === 'PARTICIPANT' || type === ''
  })
  const roster = individuals.length > 0 ? individuals : params.participants

  return params.schedules
    .filter(s => s.scheduleId != null)
    .map((schedule, index) => {
      const scheduleId = String(schedule.scheduleId)
      const attendances = params.attendancesByScheduleId[scheduleId] ?? []
      const byParticipant = new Map(
        attendances
          .filter(a => a.participantId != null)
          .map(a => [String(a.participantId), a] as const)
      )
      const header = formatScheduleHeader(schedule, index)
      return {
        id: scheduleId,
        ...header,
        participants: roster.map(p => mapParticipantRow(p, byParticipant.get(String(p.participantId)))),
      }
    })
}

export function buildAttendanceItemRequest(params: {
  participantId: string
  attendanceStatus: ParticipatingIndividualProgressAttendanceStatus
  lateTime?: string
  remark?: string
}): AttendanceItemRequest {
  const participantIdNum = Number(params.participantId)
  return {
    participantId: Number.isFinite(participantIdNum) ? participantIdNum : undefined,
    status: mapUiAttendanceStatusToApi(params.attendanceStatus),
    absenceReason: params.remark,
    arrivalTime: params.lateTime || undefined,
  }
}
