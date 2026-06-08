/**
 * 참여 기관 캘린더 뷰 (풀페이지 모달 > 프로그램 진행 현황 > 참여 기관)
 * 좌측 캘린더 7 : 우측 선택일 기관 리스트 3
 */

import { useState, useMemo } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import type {
  ParticipatingSchoolRow,
  ParticipatingSchoolSession,
} from '@/data/mock/participating-schools'
import { formatInstitutionRegionForTableDisplay } from '@/shared/lib/format-institution-region-display'
import { SCHEDULE_COLORS } from '../../../../shared/ui/program-schedule-colors'
import {
  ParticipatingInstitutionsCalendarDayList,
  getPrimaryParticipatingSessionLine,
  parseParticipatingSessionTimeRange,
} from './participating-institutions-calendar-day-list'
import {
  CalendarMain,
  CalendarSplitCardLayout,
  calendarItemsForEventMode,
  type CalendarMainEventInput,
  type RenderCalendarMonthEventContent,
} from '@/shared/components/calendar'
import {
  createInitialCalendarNavigationState,
  syncViewAnchorOnDateSelect,
} from '@/shared/components/calendar/lib/calendar-navigation'
import '@/shared/components/calendar/styles/calendar.css'
import './participating-institutions-calendar-view.css'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

/** session.date "2026.01.09" → Dayjs */
function parseSessionDate(dateStr: string): Dayjs {
  const normalized = dateStr.replace(/\s/g, '').replace(/\./g, '-')
  return dayjs(normalized)
}

/** 학교·날짜별 이벤트 (하루에 한 학교당 1건, 해당 날짜의 세션 목록 포함) */
interface CalendarEvent extends CalendarMainEventInput {
  id: string
  title: string
  startDate: string
  endDate: string
  originalItem: {
    row: ParticipatingSchoolRow
    sessionsOnDate: ParticipatingSchoolSession[]
    educationGrade: string
    desiredEducationPeriod: string
  }
}

export type ParticipatingCalendarPopoverRowParts = {
  title: string
  location: string
  grade?: string
  sessionLine?: string
  /** 참여 강사 등: 2행째 보조 문구(지역 다음 구분) */
  valueLabel?: string
  /** 참여 강사 캘린더 팝오버 2행 — 강사명 */
  instructorName?: string
  /** 참여 강사 캘린더 팝오버 2행 — 강의보고서 제출 여부 */
  lectureReportSubmitted?: boolean
}

function isInstructorCalendarEventItem(
  item: CalendarEvent['originalItem']
): item is CalendarEvent['originalItem'] & { instructorName: string; lectureReportSubmitted?: boolean } {
  return typeof (item as { instructorName?: string }).instructorName === 'string'
}

function getInstructorCalendarPopoverParts(ev: CalendarEvent): ParticipatingCalendarPopoverRowParts {
  const { row, instructorName, lectureReportSubmitted } = ev.originalItem as CalendarEvent['originalItem'] & {
    instructorName: string
    lectureReportSubmitted?: boolean
  }
  return {
    title: row.schoolName?.trim() || '-',
    location: '',
    instructorName,
    lectureReportSubmitted: lectureReportSubmitted ?? false,
  }
}

function getPopoverRowParts(ev: CalendarEvent): ParticipatingCalendarPopoverRowParts {
  if (isInstructorCalendarEventItem(ev.originalItem)) {
    return getInstructorCalendarPopoverParts(ev)
  }
  const { row, sessionsOnDate, educationGrade } = ev.originalItem
  return {
    title: row.schoolName?.trim() || '-',
    location: formatInstitutionRegionForTableDisplay(row.region),
    grade: educationGrade?.trim() || row.educationGrade?.trim() || '-',
    sessionLine: getPrimaryParticipatingSessionLine(sessionsOnDate),
  }
}

function resolveEventPopoverRowParts(
  ev: CalendarEvent,
  resolvePopoverRowParts?: ParticipatingInstitutionsCalendarViewProps['resolvePopoverRowParts']
): ParticipatingCalendarPopoverRowParts {
  if (isInstructorCalendarEventItem(ev.originalItem)) {
    return getInstructorCalendarPopoverParts(ev)
  }
  if (resolvePopoverRowParts) {
    return resolvePopoverRowParts({
      schoolRow: ev.originalItem.row,
      date: dayjs(ev.startDate),
    })
  }
  return getPopoverRowParts(ev)
}

function ParticipatingCalendarEventPopoverContent({
  events,
  titleColorMap,
  resolvePopoverRowParts,
}: {
  events: CalendarEvent[]
  titleColorMap?: Map<string, string>
  resolvePopoverRowParts?: (ev: CalendarEvent) => ParticipatingCalendarPopoverRowParts
}) {
  return (
    <div className="participating-institutions-calendar-popover">
      {events.map(ev => {
        const parts = resolvePopoverRowParts ? resolvePopoverRowParts(ev) : getPopoverRowParts(ev)
        const titleColor = titleColorMap?.get(String(ev.id))
        const instructorName = parts.instructorName?.trim()
        const isInstructorPopover = Boolean(instructorName)
        const hasGradeSession =
          parts.grade != null &&
          parts.grade !== '' &&
          parts.sessionLine != null &&
          parts.sessionLine !== ''
        return (
          <div key={ev.id} className="participating-institutions-calendar-popover__entry">
            <div
              className="participating-institutions-calendar-popover__title"
              style={titleColor ? { color: titleColor } : undefined}
            >
              {parts.title}
            </div>
            {isInstructorPopover ? (
              <div className="participating-institutions-calendar-popover__meta participating-institutions-calendar-popover__meta--instructor">
                <span className="participating-institutions-calendar-popover__meta-part">
                  {instructorName}
                </span>
                <span className="participating-institutions-calendar-popover__meta-sep" aria-hidden />
                <span className="participating-institutions-calendar-popover__meta-part participating-institutions-calendar-popover__meta-part--report">
                  강의보고서 : {parts.lectureReportSubmitted ? '제출' : '미제출'}
                </span>
              </div>
            ) : (
            <div className="participating-institutions-calendar-popover__meta">
              <span className="participating-institutions-calendar-popover__meta-part">
                {parts.location}
              </span>
              {hasGradeSession ? (
                <>
                  <span className="participating-institutions-calendar-popover__meta-sep" aria-hidden />
                  <span className="participating-institutions-calendar-popover__meta-part">
                    {parts.grade}
                  </span>
                  <span className="participating-institutions-calendar-popover__meta-sep" aria-hidden />
                  <span className="participating-institutions-calendar-popover__meta-part participating-institutions-calendar-popover__meta-part--session">
                    {parts.sessionLine}
                  </span>
                </>
              ) : parts.valueLabel ? (
                <>
                  <span className="participating-institutions-calendar-popover__meta-sep" aria-hidden />
                  <span className="participating-institutions-calendar-popover__meta-part">
                    {parts.valueLabel}
                  </span>
                </>
              ) : null}
            </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function buildEventsFromSchools(schools: ParticipatingSchoolRow[]): CalendarEvent[] {
  const events: CalendarEvent[] = []
  for (const row of schools) {
    for (const session of row.sessions ?? []) {
      const d = parseSessionDate(session.date)
      const times = parseParticipatingSessionTimeRange(session.timeRange)
      const timeRangeDisplay = session.timeRange.replace(/\s*~\s*/g, ' ~ ')
      const periodLabel = session.classNum.endsWith('교시')
        ? session.classNum
        : `${session.classNum}교시`
      const periodStr = `${periodLabel} (${timeRangeDisplay})`
      const dateKey = d.format('YYYY-MM-DD')
      events.push({
        id: `${row.id}_${dateKey}_r${session.round}`,
        title: row.schoolName?.trim() || '-',
        startDate: dateKey,
        endDate: dateKey,
        startTime: times?.startTime,
        endTime: times?.endTime,
        originalItem: {
          row,
          sessionsOnDate: [session],
          educationGrade: row.educationGrade,
          desiredEducationPeriod: periodStr,
        },
      })
    }
  }
  return events
}

export interface ParticipatingInstitutionsCalendarViewProps {
  schools: ParticipatingSchoolRow[]
  selectedRowKeys: React.Key[]
  onSelectionChange: (keys: React.Key[]) => void
  onSchoolClick: (row: ParticipatingSchoolRow) => void
  /** 우측 카드 영역을 대체할 컨텐츠. 없으면 선택일 기관 리스트 */
  rightContent?: React.ReactNode
  /** 날짜 셀 클릭 시 호출 (참여 강사 캘린더에서 우측 강사 목록 필터용) */
  onDateSelect?: (date: Dayjs) => void
  /** 월간/주간 — onCalendarGranularityChange와 함께 전달 시 쿼리스트링 등과 동기화 */
  calendarGranularity?: 'month' | 'week'
  onCalendarGranularityChange?: (mode: 'month' | 'week') => void
  /** 셀 hover 팝오버 한 줄 내용 커스터마이징 (탭별 대표 정보 유지) */
  resolvePopoverRowParts?: (args: {
    schoolRow: ParticipatingSchoolRow
    date: Dayjs
  }) => ParticipatingCalendarPopoverRowParts
  /** 제공 시 schools 기반 이벤트 대신 사용 (참여 강사 캘린더) */
  customEvents?: CalendarEvent[]
  /** 월간 셀 strip 내부 커스텀 렌더 (참여 강사: 학교명 | 강사명) */
  renderMonthEventContent?: RenderCalendarMonthEventContent
}

export function ParticipatingInstitutionsCalendarView({
  schools,
  selectedRowKeys,
  onSelectionChange: _onSelectionChange,
  onSchoolClick,
  rightContent,
  onDateSelect,
  calendarGranularity: calendarGranularityProp,
  onCalendarGranularityChange,
  resolvePopoverRowParts,
  customEvents,
  renderMonthEventContent,
}: ParticipatingInstitutionsCalendarViewProps) {
  const [fallbackCalendarMode, setFallbackCalendarMode] = useState<'month' | 'week'>('month')
  const calendarControlled =
    calendarGranularityProp !== undefined && onCalendarGranularityChange !== undefined
  const calendarMode = calendarControlled ? calendarGranularityProp : fallbackCalendarMode
  const setCalendarMode = (mode: 'month' | 'week') => {
    if (calendarControlled) onCalendarGranularityChange(mode)
    else setFallbackCalendarMode(mode)
  }
  const [selectedDate, setSelectedDate] = useState<Dayjs>(() => dayjs())
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(() =>
    createInitialCalendarNavigationState(calendarGranularityProp ?? 'month').viewAnchor
  )
  const baseEvents = useMemo(
    () => customEvents ?? buildEventsFromSchools(schools),
    [customEvents, schools]
  )
  const events = useMemo(
    () =>
      baseEvents.map(ev => {
        if (!resolvePopoverRowParts) return ev
        const parts = resolvePopoverRowParts({
          schoolRow: ev.originalItem.row,
          date: dayjs(ev.startDate),
        })
        return { ...ev, title: parts.title?.trim() || '-' }
      }),
    [baseEvents, resolvePopoverRowParts]
  )

  /** 초등학교별 색상 인덱스 (학교명 알파벳순으로 0~N 배정) */
  const entityToColorIndex = useMemo(() => {
    const keys = new Set(schools.map(s => s.schoolName))
    const sorted = Array.from(keys).sort()
    const map = new Map<string, number>()
    sorted.forEach((k, i) => map.set(k, i % SCHEDULE_COLORS.length))
    return map
  }, [schools])

  const getColorForEvent = (event: CalendarEvent) => {
    const idx = entityToColorIndex.get(event.originalItem.row.schoolName) ?? 0
    return SCHEDULE_COLORS[idx % SCHEDULE_COLORS.length]
  }

  const eventsForSelectedDate = useMemo(
    () =>
      events.filter(
        ev =>
          selectedDate.isSameOrAfter(dayjs(ev.startDate), 'day') &&
          selectedDate.isSameOrBefore(dayjs(ev.endDate), 'day')
      ),
    [events, selectedDate]
  )

  const handleDateSelect = (date: Dayjs) => {
    setSelectedDate(date)
    onDateSelect?.(date)
    setCurrentMonth(prev => syncViewAnchorOnDateSelect(calendarMode, date, prev))
  }

  return (
    <div className="participating-institutions-calendar-view participating-institutions-calendar-view--page-scroll">
      <CalendarSplitCardLayout
      left={
        <CalendarMain
          className="calendar-split-card-main"
          events={events}
          selectedRowKeys={selectedRowKeys}
          selectedDate={selectedDate}
          currentMonth={currentMonth}
          mode={calendarMode}
          onSelectDate={handleDateSelect}
          onMonthChange={setCurrentMonth}
          onModeChange={setCalendarMode}
          eventsTooltipScope="full-day"
          eventsTooltipTrigger="cell"
          formatEventsOverflowText={n => `외 ${n}개의 항목`}
          tooltipOverlayClassName="participating-institutions-calendar-tooltip-overlay"
          renderMonthEventContent={renderMonthEventContent}
          previewTooltipContent={({ events: dayItems, colorMap }) => {
            const dayEvents = calendarItemsForEventMode(dayItems).map(
              item => item.original as CalendarEvent
            )
            return (
              <ParticipatingCalendarEventPopoverContent
                events={dayEvents}
                titleColorMap={new Map(
                  dayEvents.map(ev => [
                    String(ev.id),
                    colorMap.get(ev.id)?.text ?? getColorForEvent(ev).text,
                  ])
                )}
                resolvePopoverRowParts={event =>
                  resolveEventPopoverRowParts(event, resolvePopoverRowParts)
                }
              />
            )
          }}
        />
      }
      right={
        rightContent !== undefined ? (
          rightContent
        ) : (
          <ParticipatingInstitutionsCalendarDayList
            events={eventsForSelectedDate}
            getColorForEvent={e => getColorForEvent(e as CalendarEvent)}
            onSchoolClick={onSchoolClick}
          />
        )
      }
      />
    </div>
  )
}
