/**
 * 기관 신청 희망일정 — Admin requested-schedules → 목록/상세 sessions
 * (1사1교·Gemini 교시 행 + 일반 기관 날짜 지정형 시각 행)
 */

import dayjs from 'dayjs'
import { formatDateDot } from '@/shared/utils/date'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import type { RequestedScheduleResponse } from '@/shared/api/generated/dashboard/schemas/requestedScheduleResponse'
import type { RequestedScheduleWithResolved } from '@/features/program/general/api/instructor-assignment-types'
import { parseEducationScheduleLineToRange } from '@/features/template/lib/format-education-schedule-line'

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const

function formatRequestedDate(raw?: string): { date: string; dayOfWeek: string } {
  if (!raw?.trim()) return { date: '', dayOfWeek: '' }
  const d = dayjs(raw)
  if (!d.isValid()) return { date: raw.trim(), dayOfWeek: '' }
  return {
    date: formatDateDot(d),
    dayOfWeek: DAY_LABELS[d.day()] ?? '',
  }
}

function hasResolvedScheduleField(
  schedule: RequestedScheduleWithResolved
): boolean {
  return Object.prototype.hasOwnProperty.call(schedule, 'resolvedScheduleId')
}

function toClockLabel(raw?: string | null): string | null {
  const match = raw?.trim().match(/^(\d{1,2}):(\d{2})/)
  return match ? `${match[1]!.padStart(2, '0')}:${match[2]}` : null
}

/**
 * 일반 기관 날짜 지정형 행 — `startPeriod == null`, 시각은 `sessionTimes[0]`(종일이면 `[]`).
 * 1사1교·Gemini 행은 항상 `startPeriod`가 있어 이 분기를 타지 않는다.
 */
function isClockTimeRequestedSchedule(
  schedule: Pick<RequestedScheduleResponse, 'startPeriod'>
): boolean {
  return schedule.startPeriod == null
}

function hasClockSessionTimes(
  schedule: Pick<RequestedScheduleResponse, 'sessionTimes'>
): boolean {
  const first = schedule.sessionTimes?.[0]
  return Boolean(toClockLabel(first?.startTime) && toClockLabel(first?.endTime))
}

function hasParsableScheduleLabel(
  schedule: Pick<RequestedScheduleResponse, 'label'>
): boolean {
  const label = schedule.label?.trim()
  if (!label) return false
  return parseEducationScheduleLineToRange(label) != null
}

/** 행 단위 — 시각·label 지정형 vs 교시(1사1교) 분기 */
function shouldMapRequestedScheduleAsClockTime(
  schedule: RequestedScheduleResponse | RequestedScheduleWithResolved
): boolean {
  if (isClockTimeRequestedSchedule(schedule)) return true
  if (hasClockSessionTimes(schedule)) return true
  if (hasParsableScheduleLabel(schedule)) return true
  return false
}

type RequestedScheduleRow = RequestedScheduleWithResolved &
  Pick<RequestedScheduleResponse, 'label' | 'periodStartDate' | 'periodEndDate'>

function mapClockTimeRequestedScheduleToSession(
  schedule: RequestedScheduleRow,
  order: number
): ParticipatingSchoolSession {
  const periodLabel = schedule.label?.trim()
  const { date, dayOfWeek } = formatRequestedDate(schedule.requestedDate)
  const firstTime = schedule.sessionTimes?.[0]
  const start = toClockLabel(firstTime?.startTime)
  const end = toClockLabel(firstTime?.endTime)
  const timeRange =
    start && end ? `${start} ~ ${end}` : start ?? (periodLabel ? '' : '종일')
  const scheduleUnresolved =
    hasResolvedScheduleField(schedule) && schedule.resolvedScheduleId == null
  return {
    round: order,
    date: periodLabel || date,
    dayOfWeek,
    duration: '1차시',
    format: schedule.combinedClassYn ? '합반' : '단독',
    classNum: '1차시',
    timeRange,
    status: 'pending' as const,
    requestedScheduleId: schedule.id ?? undefined,
    resolvedScheduleId: hasResolvedScheduleField(schedule)
      ? (schedule.resolvedScheduleId ?? null)
      : undefined,
    scheduleUnresolved: scheduleUnresolved || undefined,
    ...(periodLabel ? { scheduleLabel: periodLabel } : {}),
  }
}

/**
 * 1사1교·Gemini: preferenceOrder 1|2 → ParticipatingSchoolSession (교시=startPeriod, 차시수=sessionCount)
 * 일반 기관 날짜 지정형: 공통정보 줄 전체(개수 제한 없음), 시각 표기
 */
export function mapRequestedSchedulesToSessions(
  schedules: RequestedScheduleResponse[] | RequestedScheduleWithResolved[] | undefined | null
): ParticipatingSchoolSession[] | undefined {
  if (!schedules?.length) return undefined

  const sorted = [...schedules].sort(
    (a, b) => (a.preferenceOrder ?? 99) - (b.preferenceOrder ?? 99)
  )

  const clockTimeRows = sorted.filter(shouldMapRequestedScheduleAsClockTime)
  const periodRows = sorted.filter(row => !shouldMapRequestedScheduleAsClockTime(row))

  const clockSessions = clockTimeRows.map((raw, index) =>
    mapClockTimeRequestedScheduleToSession(
      raw as RequestedScheduleRow,
      raw.preferenceOrder ?? index + 1
    )
  )

  const periodSessions = periodRows.slice(0, 2).map((raw, index) => {
    const schedule = raw as RequestedScheduleWithResolved
    const order = schedule.preferenceOrder ?? index + 1
    const startPeriod = schedule.startPeriod ?? 1
    const sessionCount = Math.min(2, Math.max(1, schedule.sessionCount ?? 1))
    const endPeriod = startPeriod + sessionCount - 1
    const { date, dayOfWeek } = formatRequestedDate(schedule.requestedDate)
    const classNum = `${startPeriod}교시`
    const timeRange =
      sessionCount > 1 ? `${startPeriod}교시 ~ ${endPeriod}교시` : `${startPeriod}교시`
    const scheduleUnresolved =
      hasResolvedScheduleField(schedule) && schedule.resolvedScheduleId == null

    return {
      round: order,
      date,
      dayOfWeek,
      duration: `${sessionCount}차시`,
      format: schedule.combinedClassYn ? '합반' : '단독',
      classNum,
      timeRange,
      status: 'pending' as const,
      requestedScheduleId: schedule.id ?? undefined,
      resolvedScheduleId: hasResolvedScheduleField(schedule)
        ? (schedule.resolvedScheduleId ?? null)
        : undefined,
      scheduleUnresolved: scheduleUnresolved || undefined,
    }
  })

  return [...clockSessions, ...periodSessions].sort(
    (a, b) => (a.round ?? 99) - (b.round ?? 99)
  )
}

export function formatRequestedSchedulesPeriodLabel(
  schedules: RequestedScheduleResponse[] | RequestedScheduleWithResolved[] | undefined | null
): string | undefined {
  const sessions = mapRequestedSchedulesToSessions(schedules)
  if (!sessions?.length) return undefined
  const first = sessions[0]
  const last = sessions[sessions.length - 1]
  if (sessions.length === 1) {
    const suffix = schedules?.every(schedule => shouldMapRequestedScheduleAsClockTime(schedule))
      ? first.timeRange
      : first.classNum
    return `${first.date}(${first.dayOfWeek}) ${suffix}`
  }
  return `${first.date}(${first.dayOfWeek}) ~ ${last.date}(${last.dayOfWeek})`
}
