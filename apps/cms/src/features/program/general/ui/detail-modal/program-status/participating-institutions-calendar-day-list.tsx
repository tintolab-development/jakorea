/**
 * 참여 기관 캘린더 우측 — 선택일 기관 목록 (학교명 + 지역 | 학년 | 회차·시간)
 */

import { EmptyState } from '@/shared/ui'
import type {
  ParticipatingSchoolRow,
  ParticipatingSchoolSession,
} from '@/data/mock/participating-schools'
import { formatInstitutionRegionForCalendarListDisplay } from '@/shared/lib/format-institution-region-display'
import type { ScheduleColorPair } from '@/features/program/shared/ui/program-schedule-colors'

export type ParticipatingInstitutionsCalendarDayListEvent = {
  id: string
  originalItem: {
    row: ParticipatingSchoolRow
    sessionsOnDate: ParticipatingSchoolSession[]
    educationGrade: string
  }
}

/** mock `timeRange` (예: `9:20~10:10`, `09:20 ~ 11:20`) → 주간 격자 HH:mm */
export function parseParticipatingSessionTimeRange(
  timeRange: string
): { startTime: string; endTime: string } | null {
  const compact = timeRange.replace(/\s/g, '')
  const match = /^(\d{1,2}):(\d{2})[~\-–—]+(\d{1,2}):(\d{2})$/.exec(compact)
  if (!match) return null
  const toHhmm = (hour: string, minute: string) =>
    `${String(Number.parseInt(hour, 10)).padStart(2, '0')}:${minute}`
  return {
    startTime: toHhmm(match[1], match[2]),
    endTime: toHhmm(match[3], match[4]),
  }
}

function resolveParticipatingSessionPeriodLabel(session: ParticipatingSchoolSession): string {
  const classNum = session.classNum?.trim()
  if (classNum) {
    if (classNum.endsWith('교시') || classNum.endsWith('차시')) return classNum
    return `${classNum}교시`
  }
  return `${session.round}차시`
}

export function formatParticipatingSessionLine(session: ParticipatingSchoolSession): string {
  const timeRangeDisplay = session.timeRange.replace(/\s*~\s*/, ' ~ ')
  return `${resolveParticipatingSessionPeriodLabel(session)} (${timeRangeDisplay})`
}

function timeToMinutes(value: string): number | null {
  const [hourRaw, minuteRaw = '00'] = value.split(':')
  const hour = Number.parseInt(hourRaw, 10)
  const minute = Number.parseInt(minuteRaw, 10)
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null
  return hour * 60 + minute
}

function minutesToTime(totalMinutes: number): string {
  const hour = Math.floor(totalMinutes / 60)
  const minute = totalMinutes % 60
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function formatParticipatingSessionsPeriodForCalendarDisplay(
  sessions: ParticipatingSchoolSession[]
): string {
  const availableSessions = sessions.filter(session => session.status !== 'not_planned')
  if (availableSessions.length === 0) return '-'

  const sorted = [...availableSessions].sort((a, b) => a.round - b.round)
  const ranges = sorted
    .map(session => parseParticipatingSessionTimeRange(session.timeRange))
    .filter((range): range is NonNullable<typeof range> => range != null)
    .map(range => ({
      start: timeToMinutes(range.startTime),
      end: timeToMinutes(range.endTime),
    }))
    .filter(
      (range): range is { start: number; end: number } => range.start != null && range.end != null
    )

  const first = sorted[0]!
  const sessionCount =
    sorted.length === 1 && first.round > 0 ? first.round : Math.max(sorted.length, 1)

  if (ranges.length === 0) return `${sessionCount}차시`

  const start = Math.min(...ranges.map(range => range.start))
  const end = Math.max(...ranges.map(range => range.end))
  return `${sessionCount}차시 (${minutesToTime(start)} ~ ${minutesToTime(end)})`
}

/** 캘린더 우측 목록 2행 — 교시·차시 + 시간만 (학년 제외) */
export function formatParticipatingSessionPeriodForCalendarDisplay(
  session: ParticipatingSchoolSession
): string {
  return formatParticipatingSessionLine(session)
}

export function getPrimaryParticipatingSessionLine(sessions: ParticipatingSchoolSession[]): string {
  if (sessions.length === 0) return '-'
  const sorted = [...sessions].sort((a, b) => a.round - b.round)
  return formatParticipatingSessionLine(sorted[0]!)
}

export function ParticipatingInstitutionsCalendarDayList({
  events,
  getColorForEvent,
  onSchoolClick,
  usePreferredScheduleFormat = false,
}: {
  events: ParticipatingInstitutionsCalendarDayListEvent[]
  getColorForEvent: (event: ParticipatingInstitutionsCalendarDayListEvent) => ScheduleColorPair
  onSchoolClick: (row: ParticipatingSchoolRow) => void
  usePreferredScheduleFormat?: boolean
}) {
  const sortedEvents = [...events].sort((a, b) =>
    (a.originalItem.row.schoolName || '').localeCompare(b.originalItem.row.schoolName || '', 'ko')
  )

  return (
    <div
      className={
        sortedEvents.length === 0
          ? 'calendar-list participating-institutions-calendar-day-list calendar-list--empty'
          : 'calendar-list participating-institutions-calendar-day-list'
      }
    >
      {sortedEvents.length === 0 ? (
        <EmptyState description="해당 날짜에 일정이 없습니다" />
      ) : (
        sortedEvents.map(ev => {
          const { row, sessionsOnDate, educationGrade } = ev.originalItem
          const color = getColorForEvent(ev)
          const region = formatInstitutionRegionForCalendarListDisplay(row.region)
          const grade = educationGrade?.trim() || row.educationGrade?.trim() || '-'
          const sessionLine = usePreferredScheduleFormat
            ? formatParticipatingSessionsPeriodForCalendarDisplay(sessionsOnDate)
            : getPrimaryParticipatingSessionLine(sessionsOnDate)

          return (
            <div
              key={`${ev.id}-${ev.originalItem.row.id}`}
              role="button"
              tabIndex={0}
              className="calendar-list-item participating-institutions-calendar-day-list__item"
              data-has-color="true"
              style={{
                backgroundColor: color.bg,
                border: `1px solid ${color.border}`,
              }}
              onClick={() => onSchoolClick(row)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSchoolClick(row)
                }
              }}
            >
              <div className="participating-institutions-calendar-day-list__title">
                {row.schoolName?.trim() || '-'}
              </div>
              <div className="participating-institutions-calendar-day-list__meta">
                <span className="participating-institutions-calendar-day-list__meta-part">
                  {region}
                </span>
                <span className="participating-institutions-calendar-day-list__meta-sep" aria-hidden />
                <span className="participating-institutions-calendar-day-list__meta-part">
                  {grade}
                </span>
                <span className="participating-institutions-calendar-day-list__meta-sep" aria-hidden />
                <span className="participating-institutions-calendar-day-list__meta-part participating-institutions-calendar-day-list__meta-part--session">
                  {sessionLine}
                </span>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}
