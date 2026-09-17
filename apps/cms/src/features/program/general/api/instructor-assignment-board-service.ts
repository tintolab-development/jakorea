/**
 * 강사 배정 보드 데이터 — mock 없음 (API only)
 * 일반·1사1교 공통 fetch. 게이트 assert만 표면별로 분리.
 * 점유일 SSOT: assignment-calendar (+ list lectureDate 폴백)
 */

import dayjs from 'dayjs'
import {
  fetchInstructorAssignmentCalendarRemote,
  fetchInstructorAssignmentsRemote,
} from '@/features/program/general/api/instructor-assignments-api-client'
import { fetchInstructorApplicationsRemote } from '@/features/program/general/api/applications-api-client'
import { fetchAdminProgramSchedulesRemote } from '@/features/program/general/api/program-schedules-api-client'
import { shouldUseGeneralApplicationsRemoteApi } from '@/features/program/general/api/applications-remote-capabilities'
import { shouldUseGeneralProgramProgressRemoteApi } from '@/features/program/general/api/program-progress-remote-capabilities'
import {
  buildOccupiedLectureDatesByInstructorKeys,
  buildOccupiedLectureDatesFromCalendar,
  buildScheduleLectureDateById,
  extractLectureDateKey,
  mergeOccupiedLectureDateMaps,
} from '@/features/program/1c-1s/lib/one-school-per-day-conflict'
import type { InstructorApplicationListItemResponse } from '@/shared/api/generated/dashboard/schemas/instructorApplicationListItemResponse'
import type { InstructorAssignmentListItemEnriched } from '@/features/program/general/api/instructor-assignment-types'
import type { ProgramScheduleResponse } from '@/shared/api/generated/dashboard/schemas/programScheduleResponse'

export type InstructorAssignmentBoardData = {
  assignments: InstructorAssignmentListItemEnriched[]
  approvedInstructorApplications: InstructorApplicationListItemResponse[]
  schedules: ProgramScheduleResponse[]
  occupiedLectureDatesByInstructorId: Map<string, Set<string>>
  scheduleLabelById: Map<string, { date?: string; time?: string; session?: string }>
  instructorNameByMemberId: Map<string, string>
}

function assertGeneralAssignmentRemoteReady(): void {
  if (
    shouldUseGeneralProgramProgressRemoteApi() ||
    shouldUseGeneralApplicationsRemoteApi()
  ) {
    return
  }
  throw new Error(
    '일반 프로그램 강사 배정 API가 활성화되지 않았습니다. programs·applications·programProgress 모듈과 API 로그인을 확인해 주세요. mock 폴백은 없습니다.'
  )
}

function buildScheduleLabelById(
  schedules: ProgramScheduleResponse[]
): Map<string, { date?: string; time?: string; session?: string }> {
  const map = new Map<string, { date?: string; time?: string; session?: string }>()
  for (const schedule of schedules) {
    if (schedule.id == null) continue
    const start = schedule.startAt ?? schedule.startDate
    const dateKey = extractLectureDateKey(start)
    const time =
      schedule.startAt && schedule.endAt
        ? `${schedule.startAt.slice(11, 16)} ~ ${schedule.endAt.slice(11, 16)}`
        : undefined
    map.set(String(schedule.id), {
      date: dateKey ?? start,
      time,
      session: schedule.sessionNo != null ? `${schedule.sessionNo}차시` : schedule.scheduleName,
    })
  }
  return map
}

function enrichScheduleLabelFromAssignments(
  base: Map<string, { date?: string; time?: string; session?: string }>,
  assignments: InstructorAssignmentListItemEnriched[]
): Map<string, { date?: string; time?: string; session?: string }> {
  const map = new Map(base)
  for (const a of assignments) {
    if (a.scheduleId == null || !a.lectureDate) continue
    const id = String(a.scheduleId)
    const prev = map.get(id)
    const dateKey = extractLectureDateKey(a.lectureDate) ?? a.lectureDate
    map.set(id, {
      date: dateKey,
      time: prev?.time,
      session: prev?.session,
    })
  }
  return map
}

async function fetchCalendarSafe(
  programId: string
): Promise<ReturnType<typeof buildOccupiedLectureDatesFromCalendar>> {
  const from = dayjs().subtract(6, 'month').format('YYYY-MM-DD')
  const to = dayjs().add(12, 'month').format('YYYY-MM-DD')
  try {
    const res = await fetchInstructorAssignmentCalendarRemote(programId, { from, to })
    return buildOccupiedLectureDatesFromCalendar(res.items)
  } catch {
    // calendar 미배포/404 시 list+schedules 폴백
    return new Map()
  }
}

/** assert 없는 공통 fetch — 1사1교·일반 래퍼에서 게이트 후 호출 */
export async function fetchInstructorAssignmentBoardData(
  programId: string
): Promise<InstructorAssignmentBoardData> {
  const [assignmentsPage, instructorAppsPage, schedules, calendarOccupied] = await Promise.all([
    fetchInstructorAssignmentsRemote({ programId, page: 0, size: 200 }),
    fetchInstructorApplicationsRemote(programId, { page: 0, size: 100 }),
    fetchAdminProgramSchedulesRemote(programId),
    fetchCalendarSafe(programId),
  ])

  const assignments = (assignmentsPage.items ?? []) as InstructorAssignmentListItemEnriched[]
  const approvedInstructorApplications = (instructorAppsPage.items ?? []).filter(app => {
    const status = (app.applicationStatus ?? '').toUpperCase()
    return ['APPROVED', 'WAITING_ASSIGNMENT', 'ASSIGNED'].includes(status)
  })

  const scheduleDateById = buildScheduleLectureDateById(
    schedules.map(s => ({
      scheduleId: s.id,
      startAt: s.startAt ?? s.startDate,
    }))
  )
  const listOccupied = buildOccupiedLectureDatesByInstructorKeys(assignments, scheduleDateById)
  const occupiedLectureDatesByInstructorId = mergeOccupiedLectureDateMaps(
    calendarOccupied,
    listOccupied
  )

  const instructorNameByMemberId = new Map<string, string>()
  for (const a of assignments) {
    if (a.instructorMemberId == null || !a.instructorName?.trim()) continue
    instructorNameByMemberId.set(String(a.instructorMemberId), a.instructorName.trim())
  }
  for (const app of approvedInstructorApplications) {
    if (app.instructorMemberId == null) continue
    const key = String(app.instructorMemberId)
    if (!instructorNameByMemberId.has(key)) {
      instructorNameByMemberId.set(key, app.instructorName?.trim() || '이름 없음')
    }
  }

  return {
    assignments,
    approvedInstructorApplications,
    schedules,
    occupiedLectureDatesByInstructorId,
    scheduleLabelById: enrichScheduleLabelFromAssignments(
      buildScheduleLabelById(schedules),
      assignments
    ),
    instructorNameByMemberId,
  }
}

/** 일반 프로그램 강사 배정 보드 */
export async function fetchGeneralInstructorAssignmentBoard(
  programId: string
): Promise<InstructorAssignmentBoardData> {
  assertGeneralAssignmentRemoteReady()
  return fetchInstructorAssignmentBoardData(programId)
}

/** hope 날짜(YYYY-MM-DD)에 매칭되는 program schedule id — 레거시 폴백 */
export function findScheduleIdForLectureDate(
  schedules: ProgramScheduleResponse[],
  hopeDateOrLine: string | null | undefined
): number | null {
  const hopeKey = extractLectureDateKey(hopeDateOrLine)
  if (!hopeKey) return null
  for (const schedule of schedules) {
    const key = extractLectureDateKey(schedule.startAt ?? schedule.startDate)
    if (key === hopeKey && schedule.id != null) return schedule.id
  }
  return null
}
