/**
 * 1사1교 강사 배정 보드 데이터 — mock 없음 (API only)
 */

import { fetchInstructorAssignmentsRemote } from '@/features/program/general/api/instructor-assignments-api-client'
import { fetchInstructorApplicationsRemote } from '@/features/program/general/api/applications-api-client'
import { fetchAdminProgramSchedulesRemote } from '@/features/program/general/api/program-schedules-api-client'
import { shouldUseCompanySchoolApplicationsRemoteApi } from '@/features/program/1c-1s/api/capabilities'
import { shouldUseCompanySchoolProgramProgressRemoteApi } from '@/features/program/1c-1s/api/capabilities'
import {
  buildOccupiedLectureDatesByInstructorKeys,
  buildScheduleLectureDateById,
  extractLectureDateKey,
} from '@/features/program/1c-1s/lib/one-school-per-day-conflict'
import type { InstructorApplicationListItemResponse } from '@/shared/api/generated/dashboard/schemas/instructorApplicationListItemResponse'
import type { InstructorAssignmentListItemResponse } from '@/shared/api/generated/dashboard/schemas/instructorAssignmentListItemResponse'
import type { ProgramScheduleResponse } from '@/shared/api/generated/dashboard/schemas/programScheduleResponse'

export type CompanySchoolAssignmentBoardData = {
  assignments: InstructorAssignmentListItemResponse[]
  approvedInstructorApplications: InstructorApplicationListItemResponse[]
  schedules: ProgramScheduleResponse[]
  occupiedLectureDatesByInstructorId: Map<string, Set<string>>
  scheduleLabelById: Map<string, { date?: string; time?: string; session?: string }>
  instructorNameByMemberId: Map<string, string>
}

function assertAssignmentRemoteReady(): void {
  if (
    shouldUseCompanySchoolProgramProgressRemoteApi() ||
    shouldUseCompanySchoolApplicationsRemoteApi()
  ) {
    return
  }
  throw new Error(
    '1사1교 강사 배정 API가 활성화되지 않았습니다. programs·applications·programProgress 모듈과 VITE_COMPANY_SCHOOL_PROGRAMS_REMOTE_ENABLED=true, API 로그인을 확인해 주세요. mock 폴백은 없습니다.'
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

export async function fetchCompanySchoolAssignmentBoard(
  programId: string
): Promise<CompanySchoolAssignmentBoardData> {
  assertAssignmentRemoteReady()

  const [assignmentsPage, instructorAppsPage, schedules] = await Promise.all([
    fetchInstructorAssignmentsRemote({ programId, page: 0, size: 200 }),
    fetchInstructorApplicationsRemote(programId, { page: 0, size: 100 }),
    fetchAdminProgramSchedulesRemote(programId),
  ])

  const assignments = assignmentsPage.items ?? []
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
  const occupiedLectureDatesByInstructorId = buildOccupiedLectureDatesByInstructorKeys(
    assignments,
    scheduleDateById
  )

  const instructorNameByMemberId = new Map<string, string>()
  for (const app of approvedInstructorApplications) {
    if (app.instructorMemberId == null) continue
    instructorNameByMemberId.set(
      String(app.instructorMemberId),
      app.instructorName?.trim() || '이름 없음'
    )
  }

  return {
    assignments,
    approvedInstructorApplications,
    schedules,
    occupiedLectureDatesByInstructorId,
    scheduleLabelById: buildScheduleLabelById(schedules),
    instructorNameByMemberId,
  }
}

/** @deprecated use fetchCompanySchoolAssignmentBoard */
export async function fetchCompanySchoolOccupiedLectureDates(
  programId: string
): Promise<Map<string, Set<string>>> {
  const board = await fetchCompanySchoolAssignmentBoard(programId)
  return board.occupiedLectureDatesByInstructorId
}

/** hope 날짜(YYYY-MM-DD)에 매칭되는 program schedule id */
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
