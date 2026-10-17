import { extractLectureDateKey } from '@/features/program/1c-1s/lib/one-school-per-day-conflict'
import {
  filterProgramSchedulesForNewEducationAssignment,
  isProgramScheduleCandidateForNewEducationAssignment,
} from '@/features/program/shared/lib/program-schedule-canonical'
import type { AdminProgramScheduleResponse } from '@/features/program/shared/api/admin-program-schedule-response'
import type { ProgramScheduleResponse } from '@/shared/api/generated/dashboard/schemas/programScheduleResponse'

export type InstructorAssignmentScheduleResolveInput = {
  schedules: ReadonlyArray<AdminProgramScheduleResponse | ProgramScheduleResponse>
  resolvedScheduleId?: number | null
  hopeDateOrLine?: string | null
  /** ISO-8601 — preferred/session에서 알 수 있을 때 */
  preferredStartAt?: string | null
  preferredEndAt?: string | null
  /** UI 표시용 `9:30 ~ 11:30` 등 */
  timeRangeLabel?: string | null
}

function parseIsoMs(value: string | null | undefined): number | null {
  if (typeof value !== 'string' || !value.trim()) return null
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value.trim())) return null
  const parsed = Date.parse(value.trim())
  return Number.isFinite(parsed) ? parsed : null
}

function scheduleStartEndMs(schedule: AdminProgramScheduleResponse | ProgramScheduleResponse): {
  startMs: number | null
  endMs: number | null
} {
  const startMs = parseIsoMs(schedule.startAt ?? schedule.startDate ?? null)
  const endMs = parseIsoMs(schedule.endAt ?? schedule.endDate ?? null)
  return { startMs, endMs }
}

function isAllDaySchedule(
  schedule: AdminProgramScheduleResponse | ProgramScheduleResponse
): boolean {
  if (schedule.allDay === true) return true
  const { startMs, endMs } = scheduleStartEndMs(schedule)
  if (startMs == null || endMs == null) return false
  return endMs - startMs >= 23 * 60 * 60 * 1000
}

function findScheduleById(
  schedules: ReadonlyArray<AdminProgramScheduleResponse | ProgramScheduleResponse>,
  scheduleId: number
): AdminProgramScheduleResponse | ProgramScheduleResponse | undefined {
  return schedules.find(
    s => s.id != null && Number.isFinite(s.id) && Math.trunc(s.id) === Math.trunc(scheduleId)
  )
}

function timeRangesMatch(
  expectedStartMs: number,
  expectedEndMs: number,
  schedule: AdminProgramScheduleResponse | ProgramScheduleResponse
): boolean {
  const { startMs, endMs } = scheduleStartEndMs(schedule)
  if (startMs == null || endMs == null) return false
  return startMs === expectedStartMs && endMs === expectedEndMs
}

function parseTimeRangeLabel(
  dateKey: string,
  timeRangeLabel: string
): { startMs: number; endMs: number } | null {
  const match = timeRangeLabel.match(
    /(\d{1,2}):(\d{2})\s*[~\-–]\s*(\d{1,2}):(\d{2})/
  )
  if (!match) return null
  const [, sh, sm, eh, em] = match
  const start = new Date(`${dateKey}T${sh.padStart(2, '0')}:${sm}:00`)
  const end = new Date(`${dateKey}T${eh.padStart(2, '0')}:${em}:00`)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null
  if (end.getTime() <= start.getTime()) return null
  return { startMs: start.getTime(), endMs: end.getTime() }
}

function schedulesMatchingExactTime(
  schedules: ReadonlyArray<AdminProgramScheduleResponse | ProgramScheduleResponse>,
  startMs: number,
  endMs: number
): Array<AdminProgramScheduleResponse | ProgramScheduleResponse> {
  const assignable = filterProgramSchedulesForNewEducationAssignment(schedules)
  return assignable.filter(s => timeRangesMatch(startMs, endMs, s))
}

/**
 * 강사 배정용 program_schedule.id.
 * 날짜만 맞는 첫 일정·sessionNo 최소 등 임의 fallback은 사용하지 않는다.
 */
export function resolveInstructorAssignmentScheduleId(
  input: InstructorAssignmentScheduleResolveInput
): number | null {
  const schedules = input.schedules ?? []
  const resolvedId =
    typeof input.resolvedScheduleId === 'number' &&
    Number.isFinite(input.resolvedScheduleId) &&
    input.resolvedScheduleId > 0
      ? Math.trunc(input.resolvedScheduleId)
      : null

  const expectedStartMs = parseIsoMs(input.preferredStartAt)
  const expectedEndMs = parseIsoMs(input.preferredEndAt)
  const hasExplicitRange = expectedStartMs != null && expectedEndMs != null && expectedEndMs > expectedStartMs

  const dateKey = extractLectureDateKey(input.hopeDateOrLine)
  const fromLabel =
    !hasExplicitRange && dateKey && input.timeRangeLabel?.trim()
      ? parseTimeRangeLabel(dateKey, input.timeRangeLabel)
      : null
  const rangeStartMs = hasExplicitRange ? expectedStartMs! : fromLabel?.startMs ?? null
  const rangeEndMs = hasExplicitRange ? expectedEndMs! : fromLabel?.endMs ?? null
  const hasResolvableRange = rangeStartMs != null && rangeEndMs != null && rangeEndMs > rangeStartMs

  if (resolvedId != null) {
    const schedule = findScheduleById(schedules, resolvedId)
    if (schedule == null) return null
    if (!isProgramScheduleCandidateForNewEducationAssignment(schedule)) return null
    if (hasResolvableRange) {
      return timeRangesMatch(rangeStartMs!, rangeEndMs!, schedule) ? resolvedId : null
    }
    if (isAllDaySchedule(schedule) && hasResolvableRange === false && dateKey != null) {
      const sameDateTimed = schedules.filter(s => {
        const key = extractLectureDateKey(s.startAt ?? s.startDate)
        return key === dateKey && !isAllDaySchedule(s)
      })
      if (sameDateTimed.length > 0) return null
    }
    return resolvedId
  }

  if (!hasResolvableRange) return null

  const matches = schedulesMatchingExactTime(schedules, rangeStartMs!, rangeEndMs!)
  const withId = matches.filter(s => s.id != null && s.id > 0)
  if (withId.length !== 1) return null
  return Math.trunc(withId[0]!.id!)
}
