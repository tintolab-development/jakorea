/**
 * 참여 기관 상세 > 출석 관리
 * — student-roster × schedule attendances 조회 / bulk-upsert 저장
 */

import type { AttendanceItemResponse } from '@/shared/api/generated/dashboard/schemas/attendanceItemResponse'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import type { Program } from '@/types/domain'
import type {
  SchoolDetailAttendanceSessionGroup,
  SchoolDetailAttendanceStudentRow,
  SchoolDetailStudentRow,
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

export function mapApiStatusToSchoolSessionAttendance(
  status?: string | null
): SchoolSessionAttendanceStatusKey {
  const normalized = (status ?? '').trim().toUpperCase()
  if (normalized === 'LATE') return 'late'
  if (
    normalized === 'ABSENT' ||
    normalized === 'EXCUSED' ||
    normalized === 'EXCUSED_ABSENCE' ||
    normalized === 'REASON_ABSENT'
  ) {
    return 'absent'
  }
  if (normalized === 'PRESENT' || normalized === 'ATTEND' || normalized === 'ATTENDED') {
    return 'present'
  }
  return 'present'
}

export function mapSchoolSessionAttendanceToApi(
  status: SchoolSessionAttendanceStatusKey
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

function resolveSessionGroupId(
  schoolId: string,
  session: ParticipatingSchoolSession
): string {
  if (
    typeof session.resolvedScheduleId === 'number' &&
    Number.isFinite(session.resolvedScheduleId) &&
    session.resolvedScheduleId > 0
  ) {
    return String(session.resolvedScheduleId)
  }
  return `${schoolId}-round-${session.round}`
}

function mapRosterStudentToAttendanceRow(
  student: SchoolDetailStudentRow,
  index: number,
  total: number,
  attendance: AttendanceItemResponse | undefined
): SchoolDetailAttendanceStudentRow {
  return {
    id: student.id,
    no: total - index,
    name: student.name,
    gender: student.gender,
    birthDate: student.birthDate,
    gradeClass: student.gradeClass,
    contact: student.contact,
    email: student.email,
    participantId: student.participantId ?? null,
    status: attendance
      ? mapApiStatusToSchoolSessionAttendance(attendance.status)
      : 'present',
  }
}

export function buildSchoolDetailAttendanceSessionGroups(input: {
  schoolId: string
  program: Program
  sessions: ParticipatingSchoolSession[]
  rosterStudents: SchoolDetailStudentRow[]
  attendancesByScheduleId: Record<string, AttendanceItemResponse[]>
  /**
   * true면 출결 기록이 없는 회차도 노출 (sessions가 기관 실제 진행 일정 SSOT일 때 — 교육받은 교사).
   * 기본은 출결 응답이 있는 회차만.
   */
  includeSessionsWithoutAttendance?: boolean
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

  return sessions.filter(session => {
    const scheduleId = session.resolvedScheduleId
    const hasScheduleId =
      typeof scheduleId === 'number' && Number.isFinite(scheduleId) && scheduleId > 0
    if (input.includeSessionsWithoutAttendance) return hasScheduleId
    const attendances = hasScheduleId ? attendancesByScheduleId[String(scheduleId)] : undefined
    return Array.isArray(attendances) && attendances.length > 0
  }).map(session => {
    const id = resolveSessionGroupId(schoolId, session)
    const scheduleId =
      typeof session.resolvedScheduleId === 'number' &&
      Number.isFinite(session.resolvedScheduleId) &&
      session.resolvedScheduleId > 0
        ? session.resolvedScheduleId
        : null
    const attendances = scheduleId != null ? attendancesByScheduleId[String(scheduleId)] ?? [] : []
    const byParticipant = new Map(
      attendances
        .filter(item => item.participantId != null)
        .map(item => [Number(item.participantId), item] as const)
    )
    const sessionLeadLabel = resolveSchoolDetailAttendanceSessionLeadLabel(
      program,
      session.round
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
          visibleStudents.length,
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
    const id = resolveSessionGroupId(input.schoolId, session)
    const sessionLeadLabel = resolveSchoolDetailAttendanceSessionLeadLabel(
      input.program,
      session.round
    )
    return {
      label: buildAttendanceSessionFilterLabel(session, sessionLeadLabel),
      value: id,
    }
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
        .map(session => session.resolvedScheduleId)
        .filter(
          (id): id is number =>
            typeof id === 'number' && Number.isFinite(id) && id > 0
        )
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

/** 회차 학생 출결 bulk-upsert (participantId 있는 행만) */
export async function saveSchoolDetailAttendanceSessionRemote(input: {
  programId: string
  scheduleId: number
  /** 지정 시 서버가 participantId가 이 기관 신청 소속인지 검증 */
  organizationApplicationId?: string | number | null
  students: SchoolDetailAttendanceStudentRow[]
}): Promise<void> {
  const attendances = input.students
    .map(student => {
      const participantId =
        student.participantId != null && Number.isFinite(Number(student.participantId))
          ? Number(student.participantId)
          : null
      if (participantId == null) return null
      return {
        participantId,
        status: mapSchoolSessionAttendanceToApi(student.status),
      }
    })
    .filter((item): item is { participantId: number; status: string } => item != null)

  if (attendances.length === 0) {
    throw new Error('저장할 출결 대상(participantId)이 없습니다.')
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
