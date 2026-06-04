/**
 * 참여 기관 캘린더 우측 — 선택일 기관 목록 (학교명 + 지역 | 학년 | 회차·시간)
 */

import { Empty } from 'antd'
import type {
  ParticipatingSchoolRow,
  ParticipatingSchoolSession,
} from '@/data/mock/participating-schools'
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

export function formatParticipatingSessionLine(session: ParticipatingSchoolSession): string {
  const timeRangeDisplay = session.timeRange.replace(/\s*~\s*/, ' ~ ')
  const periodLabel = session.classNum.endsWith('교시') ? session.classNum : `${session.classNum}교시`
  return `${periodLabel} (${timeRangeDisplay})`
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
}: {
  events: ParticipatingInstitutionsCalendarDayListEvent[]
  getColorForEvent: (event: ParticipatingInstitutionsCalendarDayListEvent) => ScheduleColorPair
  onSchoolClick: (row: ParticipatingSchoolRow) => void
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
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="해당 날짜에 일정이 없습니다" />
      ) : (
        sortedEvents.map(ev => {
          const { row, sessionsOnDate, educationGrade } = ev.originalItem
          const color = getColorForEvent(ev)
          const region = row.region?.trim() || '-'
          const grade = educationGrade?.trim() || row.educationGrade?.trim() || '-'
          const sessionLine = getPrimaryParticipatingSessionLine(sessionsOnDate)

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
