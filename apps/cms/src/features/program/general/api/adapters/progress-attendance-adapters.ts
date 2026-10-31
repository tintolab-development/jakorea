import dayjs from 'dayjs'
import type { DashboardProgramScheduleResponse } from '@/shared/api/generated/dashboard/schemas/dashboardProgramScheduleResponse'
import type { Program } from '@/types/domain'
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
import { isGeneralProgressAttendanceSessionSchedule } from '@/features/program/general/lib/general-progress-education-session-schedule'
import { shouldHideGiveUpParticipantFromSchedule } from '@/features/program/general/lib/general-progress-give-up-visibility'
import { buildGeneralProgressSessionTableHeader } from '@/features/program/general/lib/general-progress-session-table-header'
import { resolveSchoolDetailAttendanceSessionLeadLabel } from '@/features/program/general/lib/school-detail-attendance-display'
import {
  isGeneralScheduleSingleDateProgram,
  resolveGeneralScheduleSingleDateDetailName,
} from '@/features/program/general/lib/general-progress-date-schedule-lead'
import {
  isProgramSchedulePreEducation,
  readProgramScheduleCanonicalFields,
} from '@/features/program/shared/lib/program-schedule-canonical'
import { PRE_EDUCATION_DISPLAY_LABEL } from '@/features/program/general/lib/schedule-detail-form'

/** GET AttendanceItemResponse.checkInSource. UI 배지로는 쓰지 않는다. */
export type AttendanceCheckInSource = 'ADMIN' | 'MEMBER_SELF' | 'SYSTEM' | null

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

function formatScheduleHeader(
  schedule: DashboardProgramScheduleResponse,
  index: number,
  program?: Program | null
): {
  round: number
  filterValue: string
  filterLabel: string
  headerTitle: string
  headerDateLabel: string
  headerScheduleSummary: string
  headerPeriodRangeLabel: string
  headerPrefix: string
} {
  const round = schedule.sessionNo ?? index + 1
  // 사전교육 행은 sessionNo=null — 회차 번호로 공통 정보를 찾지 않고 「일시 ㅣ 사전교육」으로 표시한다.
  const preEducation = isProgramSchedulePreEducation(schedule)
  const scheduleDirect = preEducation || isGeneralScheduleSingleDateProgram(program)
  const leadLabel = preEducation
    ? PRE_EDUCATION_DISPLAY_LABEL
    : program && scheduleDirect
      ? resolveGeneralScheduleSingleDateDetailName(program, schedule)
      : program
        ? resolveSchoolDetailAttendanceSessionLeadLabel(program, round)
        : `${round}회차`
  const built = buildGeneralProgressSessionTableHeader({
    round,
    leadLabel,
    scheduleName: preEducation ? null : schedule.scheduleName,
    startAt: schedule.startAt,
    endAt: schedule.endAt,
    allDay: schedule.allDay,
    program,
    scheduleDirect,
  })
  return {
    round,
    filterValue: String(schedule.scheduleId ?? round),
    filterLabel: built.filterLabel,
    headerTitle: built.headerTitle,
    headerDateLabel: built.dateLabel,
    headerScheduleSummary: built.headerScheduleSummary,
    headerPeriodRangeLabel: built.headerPeriodRangeLabel,
    headerPrefix: built.headerPrefix,
  }
}

type ProgressAttendanceParticipantInput = Pick<
  ParticipantListItemResponse,
  'participantId' | 'memberName' | 'participantType'
> &
  Partial<ParticipantListItemResponse>

function scheduleIdMatches(
  value: number | null | undefined,
  scheduleId: string
): boolean {
  return value != null && String(value) === scheduleId
}

/** 해당 일정 테이블 행: 배정(sessions) 또는 그 일정 출결 기록이 있는 참여자만. */
function participantBelongsToSchedule(
  participant: ProgressAttendanceParticipantInput,
  scheduleId: string,
  hasAttendanceOnSchedule: boolean
): boolean {
  if (hasAttendanceOnSchedule) return true
  return (participant.sessions ?? []).some(
    session =>
      scheduleIdMatches(session.scheduleId, scheduleId) ||
      scheduleIdMatches(session.resolvedScheduleId, scheduleId)
  )
}

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
  program?: Program | null
}): ParticipatingIndividualProgressAttendanceSessionGroup[] {
  const individuals = params.participants.filter(p => {
    const type = (p.participantType ?? '').toUpperCase()
    return type === 'INDIVIDUAL' || type === 'STUDENT' || type === 'PARTICIPANT' || type === ''
  })
  const roster = individuals.length > 0 ? individuals : params.participants

  // sessionNo 없는 본교육 행의 회차 폴백은 사전교육 행을 세지 않는다(서버 순서 유지).
  let mainEducationIndex = 0
  return params.schedules
    .filter(isGeneralProgressAttendanceSessionSchedule)
    .map(schedule => {
      const index = isProgramSchedulePreEducation(schedule)
        ? mainEducationIndex
        : mainEducationIndex++
      const scheduleId = String(schedule.scheduleId)
      const attendances = params.attendancesByScheduleId[scheduleId] ?? []
      const byParticipant = new Map(
        attendances
          .filter(a => a.participantId != null)
          .map(a => [String(a.participantId), a] as const)
      )
      const header = formatScheduleHeader(schedule, index, params.program)
      const attendanceRecordingOpen = isScheduleAttendanceOpenForDisplay(schedule)
      const canonical = readProgramScheduleCanonicalFields(schedule)
      return {
        id: scheduleId,
        ...header,
        scheduleRole: canonical.scheduleRole ?? null,
        educationSlotKey: canonical.educationSlotKey ?? null,
        scheduleEducationProgress: mapDashboardScheduleDeliveryToEducationProgress(
          schedule.scheduleStatus
        ),
        attendanceRecordingOpen,
        participants: roster
          .filter(p =>
            participantBelongsToSchedule(
              p,
              scheduleId,
              byParticipant.has(String(p.participantId))
            )
          )
          .filter(
            p =>
              !shouldHideGiveUpParticipantFromSchedule({
                giveUpAt: p.giveUpAt,
                participantStatus: p.participantStatus,
                scheduleStartAt: schedule.startAt,
              })
          )
          .map(p =>
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
