import {
  isMultiDayAllDayPeriodWindowForSurvey,
  readProgramScheduleCanonicalFields,
} from '@/features/program/shared/lib/program-schedule-canonical'

const PERIOD_WINDOW_MS = 24 * 60 * 60 * 1000

function parseScheduleInstant(value: unknown): number | null {
  if (typeof value !== 'string' || !value.trim()) return null
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : null
}

function hasPhysicalScheduleId(schedule: object): boolean {
  const raw = schedule as { scheduleId?: unknown; id?: unknown }
  const id = raw.scheduleId ?? raw.id
  return typeof id === 'number' && Number.isFinite(id) && id > 0
}

/**
 * 일반 프로그램 진행 현황 출석·과제 회차 테이블 대상.
 * 커리큘럼/운영 기간 창(다일 all-day, sessionNo=1이어도)은 수업 일정이 아니다.
 * 응답에 allDay가 없어도 startAt~endAt이 24시간을 넘으면 기간 창으로 본다.
 */
export function isGeneralProgressEducationSessionSchedule(schedule: unknown): boolean {
  if (schedule == null || typeof schedule !== 'object') return false
  if (!hasPhysicalScheduleId(schedule)) return false
  if (isMultiDayAllDayPeriodWindowForSurvey(schedule)) return false

  const raw = schedule as { startAt?: unknown; endAt?: unknown }
  const start = parseScheduleInstant(raw.startAt)
  const end = parseScheduleInstant(raw.endAt)
  if (start != null && end != null && end - start > PERIOD_WINDOW_MS) {
    return false
  }

  const { scheduleRole } = readProgramScheduleCanonicalFields(schedule)
  if (scheduleRole == null) return true
  const role = String(scheduleRole).trim().toUpperCase()
  if (role === 'PRE_EDUCATION' || role === 'CLOSING') return false
  return role === 'EDUCATION' || role === 'SESSION'
}
