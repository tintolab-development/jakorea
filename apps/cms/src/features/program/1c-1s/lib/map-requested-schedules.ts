/**
 * 1사1교 기관 신청 희망일정 — Admin requested-schedules → 목록/상세 sessions
 */

import dayjs from 'dayjs'
import type { ParticipatingSchoolSession } from '@/data/mock/participating-schools'
import type { RequestedScheduleResponse } from '@/shared/api/generated/dashboard/schemas/requestedScheduleResponse'

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const

function formatRequestedDate(raw?: string): { date: string; dayOfWeek: string } {
  if (!raw?.trim()) return { date: '', dayOfWeek: '' }
  const d = dayjs(raw)
  if (!d.isValid()) return { date: raw.trim(), dayOfWeek: '' }
  return {
    date: d.format('YYYY. MM. DD'),
    dayOfWeek: DAY_LABELS[d.day()] ?? '',
  }
}

/** preferenceOrder 1|2 → ParticipatingSchoolSession (교시=startPeriod, 차시수=sessionCount) */
export function mapRequestedSchedulesToSessions(
  schedules: RequestedScheduleResponse[] | undefined | null
): ParticipatingSchoolSession[] | undefined {
  if (!schedules?.length) return undefined

  const sorted = [...schedules].sort(
    (a, b) => (a.preferenceOrder ?? 99) - (b.preferenceOrder ?? 99)
  )

  return sorted.slice(0, 2).map((schedule, index) => {
    const order = schedule.preferenceOrder ?? index + 1
    const startPeriod = schedule.startPeriod ?? 1
    const sessionCount = Math.min(2, Math.max(1, schedule.sessionCount ?? 1))
    const endPeriod = startPeriod + sessionCount - 1
    const { date, dayOfWeek } = formatRequestedDate(schedule.requestedDate)
    const classNum = `${startPeriod}교시`
    const timeRange =
      sessionCount > 1 ? `${startPeriod}교시 ~ ${endPeriod}교시` : `${startPeriod}교시`

    return {
      round: order,
      date,
      dayOfWeek,
      duration: `${sessionCount}차시`,
      format: schedule.combinedClassYn ? '합반' : '단독',
      classNum,
      timeRange,
      status: 'pending' as const,
    }
  })
}

export function formatRequestedSchedulesPeriodLabel(
  schedules: RequestedScheduleResponse[] | undefined | null
): string | undefined {
  const sessions = mapRequestedSchedulesToSessions(schedules)
  if (!sessions?.length) return undefined
  const first = sessions[0]
  const last = sessions[sessions.length - 1]
  if (sessions.length === 1) {
    return `${first.date}(${first.dayOfWeek}) ${first.classNum}`
  }
  return `${first.date}(${first.dayOfWeek}) ~ ${last.date}(${last.dayOfWeek})`
}
