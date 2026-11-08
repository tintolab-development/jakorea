import type { PreferredEducationSchedule } from '@/features/program/general/api/individual-application-screening-api-types'
import { normalizePreferredEducationScheduleEntry } from '@/features/program/general/lib/organization-application-preferred-education-schedules'
import type { RequestedScheduleResponse } from '@/shared/api/generated/dashboard/schemas/requestedScheduleResponse'

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function readIsoDate(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? ''
  return ISO_DATE.test(trimmed) ? trimmed : null
}

function normalizeClock(value: string | null | undefined): string | null {
  const match = value?.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/)
  if (!match) return null
  return `${match[1]!.padStart(2, '0')}:${match[2]}:${match[3] ?? '00'}`
}

/** Java `Instant.toString()`과 같은 UTC 표기(밀리초 0이면 생략) */
function toInstantString(date: Date): string | null {
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString().replace('.000Z', 'Z')
}

function seoulInstant(isoDate: string, clock = '00:00:00'): string | null {
  return toInstantString(new Date(`${isoDate}T${clock}+09:00`))
}

function addDays(isoDate: string, days: number): string {
  const base = new Date(`${isoDate}T00:00:00Z`)
  base.setUTCDate(base.getUTCDate() + days)
  return base.toISOString().slice(0, 10)
}

/**
 * BE `OrganizationApplicationPreferredEducationSchedulesMergeSupport.fromRequestedSchedule`과 같은 규칙으로
 * requested-schedules 한 행을 organization-applications `preferredEducationSchedules[]` 항목으로 바꾼다.
 * 기관 신청 목록을 다시 순회하지 않고 participants `requestedSchedules[]`만으로 같은 희망 일정을 만든다.
 */
export function requestedScheduleToPreferredEducationSchedule(
  row: RequestedScheduleResponse | null | undefined
): PreferredEducationSchedule | null {
  if (row == null) return null
  const label = row.label?.trim() || null
  const requestedDate = readIsoDate(row.requestedDate)
  const periodStartDate = readIsoDate(row.periodStartDate)
  const periodEndDate = readIsoDate(row.periodEndDate)
  const scheduleIds = (row.resolvedScheduleIds ?? []).filter(
    id => typeof id === 'number' && Number.isInteger(id) && id > 0
  )
  const scheduleId = scheduleIds[0] ?? null

  let startAt: string | null = null
  let endAt: string | null = null
  let educationDate: string | null = null
  if (!(label && requestedDate == null)) {
    const times = row.sessionTimes ?? []
    if (times.length > 0) {
      const startClock = normalizeClock(times[0]?.startTime)
      const endClock = normalizeClock(times[times.length - 1]?.endTime)
      if (requestedDate && startClock) startAt = seoulInstant(requestedDate, startClock)
      if (requestedDate && endClock) endAt = seoulInstant(requestedDate, endClock)
    } else if (periodStartDate) {
      startAt = seoulInstant(periodStartDate)
      if (periodEndDate) endAt = seoulInstant(addDays(periodEndDate, 1))
    } else if (requestedDate) {
      startAt = seoulInstant(requestedDate)
      endAt = seoulInstant(addDays(requestedDate, 1))
    }
    educationDate = requestedDate ?? periodStartDate
  }

  return normalizePreferredEducationScheduleEntry({
    scheduleId,
    round: row.preferenceOrder ?? null,
    startAt,
    endAt,
    label,
    unresolvedReason: scheduleId == null ? 'NO_PROGRAM_DEFINED_SCHEDULE_MATCH' : null,
    scheduleIds,
    educationDate,
  })
}

export function requestedSchedulesToPreferredEducationSchedules(
  rows: readonly RequestedScheduleResponse[] | null | undefined
): PreferredEducationSchedule[] {
  return (rows ?? [])
    .map(requestedScheduleToPreferredEducationSchedule)
    .filter((entry): entry is PreferredEducationSchedule => entry != null)
}
