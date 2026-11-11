/**
 * 참여 기관 상세 > 출석 관리
 * — student-roster × 기관 배정 일정 × schedule attendances 조회 / bulk-upsert 저장
 */

import type { AttendanceItemResponse } from '@/shared/api/generated/dashboard/schemas/attendanceItemResponse'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import type { Program } from '@/types/domain'
import type {
  SchoolDetailAttendanceSessionGroup,
  SchoolDetailAttendanceStudentRow,
  SchoolDetailStudentRow,
  SchoolSessionAttendanceEditableStatusKey,
  SchoolSessionAttendanceStatusKey,
} from '@/features/program/general/model/school-detail-types'
import {
  buildAttendanceSessionFilterLabel,
  buildAttendanceSessionHeaderParts,
  resolveSchoolDetailAttendanceSessionLeadLabel,
} from '@/features/program/general/lib/school-detail-attendance-display'
import { mapStudentRosterResponseToRows } from '@/features/program/general/api/adapters/student-roster-adapters'
import { fetchOrganizationStudentRosterRemote } from '@/features/program/general/api/student-roster-api-client'
import { fetchAllProgramProgressParticipants } from '@/features/program/general/api/admin-program-progress-service'
import {
  bulkUpsertProgramAttendancesRemote,
  fetchAttendancesByScheduleIdsRemote,
} from '@/features/program/general/api/program-progress-api-client'
import { shouldHideGiveUpParticipantFromSchedule } from '@/features/program/general/lib/general-progress-give-up-visibility'
import { isScheduleAttendanceOpenForDisplay } from '@/features/program/general/lib/dashboard-schedule-delivery-status'

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

export function isSchoolSessionAttendanceEditableStatus(
  status: SchoolSessionAttendanceStatusKey
): status is SchoolSessionAttendanceEditableStatusKey {
  return status === 'present' || status === 'absent' || status === 'late'
}

export function mapApiStatusToSchoolSessionAttendance(
  status?: string | null
): SchoolSessionAttendanceStatusKey {
  if (status == null) return 'unrecorded'
  const normalized = status.trim().toUpperCase()
  if (!normalized || SCHEDULE_PROGRESS_STATUSES.has(normalized)) return 'unrecorded'
  if (normalized === 'LATE') return 'late'
  if (normalized === 'ABSENT') return 'absent'
  if (
    normalized === 'EXCUSED' ||
    normalized === 'EXCUSED_ABSENCE' ||
    normalized === 'REASON_ABSENT'
  ) {
    return 'excused'
  }
  if (normalized === 'PRESENT' || normalized === 'ATTEND' || normalized === 'ATTENDED') {
    return 'present'
  }
  return 'unrecorded'
}

export function mapSchoolSessionAttendanceToApi(
  status: SchoolSessionAttendanceEditableStatusKey
): string {
  if (status === 'late') return 'LATE'
  if (status === 'absent') return 'ABSENT'
  return 'PRESENT'
}

function sessionScheduleStartAt(session: ParticipatingSchoolSession): string | null {
  if (session.startAt?.trim()) return session.startAt.trim()
  const date = session.date.trim().replace(/\./g, '-')
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T12:00:00+09:00` : null
}

function resolvePositiveScheduleId(session: ParticipatingSchoolSession): number | null {
  if (
    typeof session.resolvedScheduleId === 'number' &&
    Number.isFinite(session.resolvedScheduleId) &&
    session.resolvedScheduleId > 0
  ) {
    return session.resolvedScheduleId
  }
  return null
}

function resolveSessionGroupDisplayId(
  schoolId: string,
  session: ParticipatingSchoolSession
): string {
  const scheduleId = resolvePositiveScheduleId(session)
  if (scheduleId != null) return String(scheduleId)
  return `unresolved:${schoolId}:round-${session.round}`
}

function mapRosterStudentToAttendanceRow(
  student: SchoolDetailStudentRow,
  index: number,
  attendance: AttendanceItemResponse | undefined
): SchoolDetailAttendanceStudentRow {
  const recordedApiStatus = attendance?.status?.trim() ? attendance.status.trim() : null
  const status = mapApiStatusToSchoolSessionAttendance(attendance?.status)
  return {
    id: student.id,
    no: index + 1,
    name: student.name,
    gender: student.gender,
    genderMask: student.genderMask,
    birthDate: student.birthDate,
    gradeClass: student.gradeClass,
    contact: student.contact,
    email: student.email,
    participantId: student.participantId ?? null,
    status,
    recordedApiStatus,
    attendanceRecorded: status !== 'unrecorded',
  }
}

export function buildSchoolDetailAttendanceSessionGroups(input: {
  schoolId: string
  program: Program
  sessions: ParticipatingSchoolSession[]
  rosterStudents: SchoolDetailStudentRow[]
  attendancesByScheduleId: Record<string, AttendanceItemResponse[]>
  giveUpParticipants?: Array<{
    participantId?: number
    giveUpAt?: string | null
    participantStatus?: string | null
  }> | null
}): SchoolDetailAttendanceSessionGroup[] {
  const { schoolId, program, sessions, rosterStudents, attendancesByScheduleId } = input
  const giveUpById = new Map(
    (input.giveUpParticipants ?? [])
      .filter(item => item.participantId != null)
      .map(item => [Number(item.participantId), item] as const)
  )

  return sessions.map(session => {
    const scheduleId = resolvePositiveScheduleId(session)
    const id = resolveSessionGroupDisplayId(schoolId, session)
    const attendances = scheduleId != null ? attendancesByScheduleId[String(scheduleId)] ?? [] : []
    const byParticipant = new Map(
      attendances
        .filter(item => item.participantId != null)
        .map(item => [Number(item.participantId), item] as const)
    )
    const sessionLeadLabel = resolveSchoolDetailAttendanceSessionLeadLabel(
      program,
      session.round,
      session
    )
    const header = buildAttendanceSessionHeaderParts(session, sessionLeadLabel, program)
    const scheduleStartAt = sessionScheduleStartAt(session)
    const visibleStudents = rosterStudents.filter(student => {
      const participantId =
        student.participantId != null && Number.isFinite(Number(student.participantId))
          ? Number(student.participantId)
          : null
      if (participantId == null) return true
      const lookup = giveUpById.get(participantId)
      if (lookup == null) return true
      return !shouldHideGiveUpParticipantFromSchedule({
        giveUpAt: lookup.giveUpAt,
        participantStatus: lookup.participantStatus,
        scheduleStartAt,
      })
    })
    return {
      id,
      round: session.round,
      filterValue: id,
      scheduleId,
      scheduleIdUnresolved: scheduleId == null,
      attendanceRecordingOpen: isScheduleAttendanceOpenForDisplay({
        scheduleStatus: session.deliveryScheduleStatus,
        startAt: session.startAt ?? scheduleStartAt,
      }),
      sessionLeadLabel: header.sessionLeadLabel,
      headerTitle: header.title,
      headerScheduleSummary: header.scheduleSummary,
      headerPeriodRangeLabel: header.periodRangeLabel,
      headerPrefix: header.headerPrefix,
      students: visibleStudents.map((student, index) => {
        const participantId =
          student.participantId != null && Number.isFinite(Number(student.participantId))
            ? Number(student.participantId)
            : null
        return mapRosterStudentToAttendanceRow(
          student,
          index,
          participantId != null ? byParticipant.get(participantId) : undefined
        )
      }),
    }
  })
}

export function buildSchoolDetailAttendanceEducationScheduleOptions(input: {
  schoolId: string
  program: Program
  sessions: ParticipatingSchoolSession[]
}): Array<{ label: string; value: string }> {
  return input.sessions.map(session => {
    const id = resolveSessionGroupDisplayId(input.schoolId, session)
    const sessionLeadLabel = resolveSchoolDetailAttendanceSessionLeadLabel(
      input.program,
      session.round,
      session
    )
    return {
      label: buildAttendanceSessionFilterLabel(session, sessionLeadLabel),
      value: id,
    }
  })
}

export function collectChangedSchoolDetailAttendances(
  workingRows: SchoolDetailAttendanceStudentRow[],
  baselineRows: SchoolDetailAttendanceStudentRow[]
): SchoolDetailAttendanceStudentRow[] {
  const baselineById = new Map(baselineRows.map(row => [row.id, row]))
  return workingRows.filter(row => {
    if (!isSchoolSessionAttendanceEditableStatus(row.status)) return false
    const participantId =
      row.participantId != null && Number.isFinite(Number(row.participantId))
        ? Number(row.participantId)
        : null
    if (participantId == null || participantId <= 0) return false
    const baseline = baselineById.get(row.id)
    if (baseline == null) return true
    if (!baseline.attendanceRecorded) return true
    return baseline.status !== row.status
  })
}

export async function fetchSchoolDetailAttendanceBundle(input: {
  programId: string
  organizationApplicationId: string
  sessions: ParticipatingSchoolSession[]
}): Promise<{
  rosterStudents: SchoolDetailStudentRow[]
  attendancesByScheduleId: Record<string, AttendanceItemResponse[]>
  giveUpParticipants: Awaited<ReturnType<typeof fetchAllProgramProgressParticipants>>
}> {
  const scheduleIds = [
    ...new Set(
      input.sessions
        .map(session => resolvePositiveScheduleId(session))
        .filter((id): id is number => id != null)
    ),
  ]
  const [rosterResponse, attendancesByScheduleId, giveUpParticipants] = await Promise.all([
    fetchOrganizationStudentRosterRemote(input.organizationApplicationId),
    fetchAttendancesByScheduleIdsRemote(input.programId, scheduleIds, {
      organizationApplicationId: input.organizationApplicationId,
    }),
    fetchAllProgramProgressParticipants(input.programId),
  ])

  return {
    rosterStudents: mapStudentRosterResponseToRows(rosterResponse),
    attendancesByScheduleId,
    giveUpParticipants,
  }
}

/** 회차 학생 출결 bulk-upsert — 호출부가 넘긴 변경 행만 전송 */
export async function saveSchoolDetailAttendanceSessionRemote(input: {
  programId: string
  scheduleId: number
  /** 지정 시 서버가 participantId가 이 기관 신청 소속인지 검증 */
  organizationApplicationId?: string | number | null
  students: SchoolDetailAttendanceStudentRow[]
}): Promise<void> {
  const attendances = input.students
    .map(student => {
      if (!isSchoolSessionAttendanceEditableStatus(student.status)) return null
      const participantId =
        student.participantId != null && Number.isFinite(Number(student.participantId))
          ? Number(student.participantId)
          : null
      if (participantId == null || participantId <= 0) return null
      return {
        participantId,
        status: mapSchoolSessionAttendanceToApi(student.status),
      }
    })
    .filter((item): item is { participantId: number; status: string } => item != null)

  if (attendances.length === 0) {
    throw new Error('저장할 출결 변경이 없습니다.')
  }

  const organizationApplicationId = Number(input.organizationApplicationId)
  await bulkUpsertProgramAttendancesRemote(input.programId, {
    scheduleId: input.scheduleId,
    ...(Number.isSafeInteger(organizationApplicationId) && organizationApplicationId > 0
      ? { organizationApplicationId }
      : {}),
    attendances,
  })
}
