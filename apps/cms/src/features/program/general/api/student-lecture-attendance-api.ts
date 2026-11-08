/**
 * 참여 기관 학생 명단 > 강의 출석 내역
 * — program schedules + schedule attendances 로 조회/정정
 */

import type { AttendanceItemResponse } from '@/shared/api/generated/dashboard/schemas/attendanceItemResponse'
import type { DashboardProgramScheduleResponse } from '@/shared/api/generated/dashboard/schemas/dashboardProgramScheduleResponse'
import type { ProgramScheduleResponse } from '@/shared/api/generated/dashboard/schemas/programScheduleResponse'
import type {
  LectureAttendanceDetail,
  LectureAttendanceSession,
  LectureAttendanceStatusKey,
} from '@/features/program/general/model/school-detail-types'
import { countLectureAttendanceHeldAndAttended } from '@/features/program/general/lib/lecture-attendance-count'
import { isScheduleAttendanceOpenForDisplay } from '@/features/program/general/lib/dashboard-schedule-delivery-status'
import { isGeneralProgressAttendanceSessionSchedule } from '@/features/program/general/lib/general-progress-education-session-schedule'
import { isProgramSchedulePreEducation } from '@/features/program/shared/lib/program-schedule-canonical'
import { PRE_EDUCATION_LECTURE_ROUND_NUMBER } from '@/features/program/general/lib/lecture-attendance-session-identity'
import { mapOrganizationScheduleAssignmentSlotsToAssignedSessions } from '@/features/program/general/lib/organization-education-schedule-sources'
import { fetchOrganizationScheduleAssignmentsRemote } from '@/features/program/general/api/organization-schedule-assignments-api-client'
import {
  bulkUpsertProgramAttendancesRemote,
  fetchAttendancesByScheduleIdsRemote,
  fetchProgramSchedulesViaDashboardRemote,
} from '@/features/program/general/api/program-progress-api-client'

function mapApiStatusToLecture(status?: string | null): LectureAttendanceStatusKey {
  const normalized = (status ?? '').trim().toUpperCase()
  if (normalized === 'LATE') return 'late'
  if (normalized === 'ABSENT') return 'absent'
  if (normalized === 'EXCUSED' || normalized === 'EXCUSED_ABSENCE') return 'excused'
  if (
    normalized === 'PRESENT' ||
    normalized === 'ATTEND' ||
    normalized === 'ATTENDED'
  ) {
    return 'attended'
  }
  if (normalized === 'NOT_HELD') return 'not_held'
  return 'not_held'
}

function mapLectureStatusToApi(
  status: LectureAttendanceStatusKey
): string | null {
  if (status === 'attended') return 'PRESENT'
  if (status === 'late') return 'LATE'
  if (status === 'absent') return 'ABSENT'
  if (status === 'excused') return 'EXCUSED'
  return null
}

type LectureRoundRow = {
  scheduleId: number
  roundNumber: number
  schedule?: DashboardProgramScheduleResponse
  preEducation?: boolean
}

function dashboardScheduleById(
  schedules: readonly DashboardProgramScheduleResponse[]
): Map<number, DashboardProgramScheduleResponse> {
  const byId = new Map<number, DashboardProgramScheduleResponse>()
  for (const schedule of schedules) {
    const id = schedule.scheduleId
    if (id == null || !Number.isFinite(id) || id <= 0) continue
    byId.set(Math.trunc(id), schedule)
  }
  return byId
}

function toProgramSchedule(schedule: DashboardProgramScheduleResponse): ProgramScheduleResponse | null {
  const id = schedule.scheduleId
  if (id == null || !Number.isFinite(id) || id <= 0) return null
  return {
    id: Math.trunc(id),
    sessionNo: schedule.sessionNo,
    scheduleName: schedule.scheduleName,
    startAt: schedule.startAt,
    endAt: schedule.endAt,
    allDay: schedule.allDay,
    scheduleStatus: schedule.scheduleStatus,
  }
}

/** 기관 배정이 없을 때 프로그램 교육 회차. 운영 기간 창은 회차가 아니다. */
function educationSessionRoundRows(
  schedules: readonly DashboardProgramScheduleResponse[]
): LectureRoundRow[] {
  // 사전교육(sessionNo=null)은 회차 0 — 본교육 회차 폴백 번호를 밀지 않고, 정렬 시 앞에 온다.
  let mainEducationIndex = 0
  return schedules
    .filter(isGeneralProgressAttendanceSessionSchedule)
    .flatMap(schedule => {
      const preEducation = isProgramSchedulePreEducation(schedule)
      const index = preEducation ? mainEducationIndex : mainEducationIndex++
      const scheduleId = schedule.scheduleId
      if (scheduleId == null || !Number.isFinite(scheduleId) || scheduleId <= 0) return []
      return [
        {
          schedule,
          scheduleId: Math.trunc(scheduleId),
          roundNumber: preEducation
            ? PRE_EDUCATION_LECTURE_ROUND_NUMBER
            : (schedule.sessionNo ?? index + 1),
          ...(preEducation ? { preEducation: true } : {}),
        },
      ]
    })
    .sort((a, b) => a.roundNumber - b.roundNumber)
}

function assignedRoundRows(
  schedules: readonly DashboardProgramScheduleResponse[],
  slots: Awaited<ReturnType<typeof fetchOrganizationScheduleAssignmentsRemote>>,
  scope: { programId: string; organizationApplicationId: string }
): LectureRoundRow[] {
  const scheduleById = dashboardScheduleById(schedules)
  const programSchedules = schedules.flatMap(schedule => {
    const mapped = toProgramSchedule(schedule)
    return mapped ? [mapped] : []
  })
  const assigned = mapOrganizationScheduleAssignmentSlotsToAssignedSessions(
    slots,
    programSchedules,
    scope
  )
  const seen = new Set<number>()
  const rows: LectureRoundRow[] = []
  for (const session of assigned) {
    const scheduleId = session.resolvedScheduleId
    if (scheduleId == null || seen.has(scheduleId)) continue
    seen.add(scheduleId)
    const schedule = scheduleById.get(scheduleId)
    const preEducation = schedule != null && isProgramSchedulePreEducation(schedule)
    rows.push({
      scheduleId,
      roundNumber: preEducation ? PRE_EDUCATION_LECTURE_ROUND_NUMBER : session.round,
      schedule,
      ...(preEducation ? { preEducation: true } : {}),
    })
  }
  return rows
}

function isLectureRecordingOpen(schedule?: DashboardProgramScheduleResponse): boolean {
  if (!schedule || !isScheduleAttendanceOpenForDisplay(schedule)) return false
  if (schedule.startAt?.trim()) return true
  const status = (schedule.scheduleStatus ?? '').trim().toUpperCase()
  return (
    status === 'IN_PROGRESS' ||
    status === 'ONGOING' ||
    status === 'COMPLETED' ||
    status === 'DONE' ||
    status === 'FINISHED'
  )
}

function toLectureSession(
  row: LectureRoundRow,
  items: readonly AttendanceItemResponse[] | undefined,
  participantId: number
): LectureAttendanceSession {
  const mine = items?.find(item => Number(item.participantId) === participantId)
  return {
    roundNumber: row.roundNumber,
    scheduleId: row.scheduleId,
    status: mine ? mapApiStatusToLecture(mine.status) : 'not_held',
    ...(isLectureRecordingOpen(row.schedule) ? { recordingOpen: true } : {}),
    ...(row.preEducation ? { preEducation: true } : {}),
  }
}

export async function fetchStudentLectureAttendanceByParticipantRemote(input: {
  programId: string
  participantId: number
  studentName: string
  organizationApplicationId?: string | null
}): Promise<LectureAttendanceDetail> {
  const organizationApplicationId = input.organizationApplicationId?.trim() ?? ''
  const schedules = await fetchProgramSchedulesViaDashboardRemote(input.programId)
  const assignedSlots = organizationApplicationId
    ? await fetchOrganizationScheduleAssignmentsRemote(input.programId, organizationApplicationId)
    : null
  const assignedRows =
    assignedSlots == null
      ? []
      : assignedRoundRows(schedules, assignedSlots, {
          programId: input.programId,
          organizationApplicationId,
        })
  // 기관 신청이 있으면 분모는 active OSA 배정 일정만(사전교육 포함). 미배정 프로그램 일정으로 폴백하지 않는다.
  const roundRows = organizationApplicationId
    ? assignedRows
    : educationSessionRoundRows(schedules)

  if (roundRows.length === 0) {
    return {
      studentName: input.studentName,
      attendanceRatePercent: 0,
      sessions: [],
    }
  }

  const attendancesByScheduleId = await fetchAttendancesByScheduleIdsRemote(
    input.programId,
    roundRows.map(row => row.scheduleId),
    organizationApplicationId ? { organizationApplicationId } : {}
  )

  const sessions: LectureAttendanceSession[] = roundRows.map(row =>
    toLectureSession(
      row,
      attendancesByScheduleId[String(row.scheduleId)],
      input.participantId
    )
  )

  const { attended, held } = countLectureAttendanceHeldAndAttended(sessions)
  return {
    studentName: input.studentName,
    attendanceRatePercent: held > 0 ? Math.round((attended / held) * 100) : 0,
    sessions,
  }
}

/** 회차별 scheduleId 기준 bulk-upsert (강의 미진행은 전송 생략) */
export async function saveStudentLectureAttendanceByParticipantRemote(input: {
  programId: string
  participantId: number
  sessions: LectureAttendanceSession[]
}): Promise<void> {
  const editable = input.sessions.filter(
    session => session.scheduleId != null && mapLectureStatusToApi(session.status) != null
  )

  await Promise.all(
    editable.map(async session => {
      const status = mapLectureStatusToApi(session.status)
      if (status == null || session.scheduleId == null) return
      await bulkUpsertProgramAttendancesRemote(input.programId, {
        scheduleId: session.scheduleId,
        attendances: [
          {
            participantId: input.participantId,
            status,
          },
        ],
      })
    })
  )
}
