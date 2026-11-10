/**
 * 강사 배정 보드 데이터 — mock 없음 (API only)
 * 일반·1사1교 공통 fetch. 게이트 assert만 표면별로 분리.
 * 점유일 SSOT: assignment-calendar (+ list lectureDate 폴백)
 */

import dayjs from 'dayjs'
import {
  formatEducationRoundSessionLabel,
  toDisplayEducationScheduleName,
} from '@/shared/lib/education-schedule-name'
import { formatOrganizationScheduleRangeLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import {
  fetchInstructorAssignmentCalendarRemote,
  fetchInstructorAssignmentsRemote,
} from '@/features/program/general/api/instructor-assignments-api-client'
import { fetchInstructorApplicationsRemote } from '@/features/program/general/api/applications-api-client'
import { mapApiApplicationStatusToApprovalStatus } from '@/features/program/general/api/adapters/general-applications-adapters'
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
import { fetchAllApiPages } from '@/shared/lib/fetch-all-api-pages'

export type InstructorAssignmentBoardData = {
  assignments: InstructorAssignmentListItemEnriched[]
  approvedInstructorApplications: InstructorApplicationListItemResponse[]
  /**
   * 승인 전(대기) 강사 신청 — 일반 기관형 참여 기관 상세 배정 대기 목록의 「승인 및 배정」용.
   * 반려·취소 상태는 포함하지 않는다. 1사1교 화면은 읽지 않는다.
   */
  pendingInstructorApplications?: InstructorApplicationListItemResponse[]
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

function splitRangeDateAndTime(range: string): { date?: string; time?: string } {
  const match = range.match(/^(\d{4}\.\d{2}\.\d{2}\([^)]+\))\s+(.+)$/u)
  if (match?.[1] && match[2] && /\d{1,2}:\d{2}/.test(match[2])) {
    return { date: match[1], time: match[2] }
  }
  if (range.trim()) return { date: range.trim() }
  return {}
}

function buildScheduleLabelById(
  schedules: ProgramScheduleResponse[]
): Map<string, { date?: string; time?: string; session?: string }> {
  const map = new Map<string, { date?: string; time?: string; session?: string }>()
  for (const schedule of schedules) {
    if (schedule.id == null) continue
    const start = schedule.startAt ?? schedule.startDate
    const end = schedule.endAt ?? schedule.endDate
    const range = formatOrganizationScheduleRangeLabel(start, end)
    const split = splitRangeDateAndTime(range)
    const dateKey = extractLectureDateKey(start)
    map.set(String(schedule.id), {
      date: split.date || dateKey || start,
      time: split.time,
      session:
        formatEducationRoundSessionLabel({ roundNumber: schedule.sessionNo }) ||
        toDisplayEducationScheduleName(schedule.scheduleName),
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
      date: prev?.date ?? dateKey,
      time: prev?.time,
      session: prev?.session,
    })
  }
  return map
}

async function fetchAllInstructorAssignments(
  programId: string
): Promise<InstructorAssignmentListItemEnriched[]> {
  return fetchAllApiPages((page, size) =>
    fetchInstructorAssignmentsRemote({ programId, page, size })
  )
}

async function fetchAllInstructorApplications(
  programId: string
): Promise<InstructorApplicationListItemResponse[]> {
  return fetchAllApiPages((page, size) =>
    fetchInstructorApplicationsRemote(programId, { page, size })
  )
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
  const [assignments, instructorApplications, schedules, calendarOccupied] = await Promise.all([
    fetchAllInstructorAssignments(programId),
    fetchAllInstructorApplications(programId),
    fetchAdminProgramSchedulesRemote(programId),
    fetchCalendarSafe(programId),
  ])

  const approvedInstructorApplications = instructorApplications.filter(app => {
    const status = (app.applicationStatus ?? '').toUpperCase()
    return ['APPROVED', 'WAITING_ASSIGNMENT', 'ASSIGNED'].includes(status)
  })

  const pendingInstructorApplications = instructorApplications.filter(
    app => mapApiApplicationStatusToApprovalStatus(app.applicationStatus) === 'pending'
  )

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
    pendingInstructorApplications,
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

/**
 * @deprecated 날짜-only 첫 매치 제거. {@link resolveInstructorAssignmentScheduleId} 사용.
 */
export function findScheduleIdForLectureDate(
  _schedules: ProgramScheduleResponse[],
  _hopeDateOrLine: string | null | undefined
): number | null {
  return null
}
