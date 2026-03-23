/**
 * 참여 기관 캘린더 뷰 (풀페이지 모달 > 프로그램 진행 현황 > 참여 기관)
 * 좌측 캘린더 7 : 우측 추등학교 리스트 3, 기존 Calendar·ApplicantScheduleList 활용
 */

import { useState, useMemo, useRef } from 'react'
import { Calendar, Button, Tooltip } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import type {
  ParticipatingSchoolRow,
  ParticipatingSchoolSession,
} from '@/data/mock/participating-schools'
import { ApplicantScheduleList } from './detail-modal/applicant-schedule-list'
import './participating-institutions-calendar-view.css'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

/** 캘린더 네비게이터 내부 아이콘 16×16 (오른쪽 화살표) */
function CalendarNavRightIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={16} height={16} viewBox="0 0 16 16" fill="none">
      <path
        d="M5.58224 8.27543C5.45408 8.08135 5.47583 7.81739 5.64669 7.64652L9.64669 3.64652C9.84196 3.45126 10.1585 3.45126 10.3537 3.64652C10.549 3.84179 10.549 4.15829 10.3537 4.35356L6.70724 8.00004L10.3537 11.6465C10.549 11.8418 10.549 12.1583 10.3537 12.3536C10.1585 12.5488 9.84195 12.5488 9.64669 12.3536L5.64669 8.35355L5.58224 8.27543Z"
        fill="#3D3D3D"
        stroke="#3D3D3D"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** 캘린더 네비게이터 내부 아이콘 16×16 (왼쪽 화살표) */
function CalendarNavLeftIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={16}
      height={16}
      viewBox="0 0 16 16"
      fill="none"
      className="participating-institutions-calendar-nav-icon--left"
    >
      <path
        d="M5.58224 8.27543C5.45408 8.08135 5.47583 7.81739 5.64669 7.64652L9.64669 3.64652C9.84196 3.45126 10.1585 3.45126 10.3537 3.64652C10.549 3.84179 10.549 4.15829 10.3537 4.35356L6.70724 8.00004L10.3537 11.6465C10.549 11.8418 10.549 12.1583 10.3537 12.3536C10.1585 12.5488 9.84195 12.5488 9.64669 12.3536L5.64669 8.35355L5.58224 8.27543Z"
        fill="#3D3D3D"
        stroke="#3D3D3D"
        strokeWidth="0.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** session.date "2026.01.09" → Dayjs */
function parseSessionDate(dateStr: string): Dayjs {
  const normalized = dateStr.replace(/\s/g, '').replace(/\./g, '-')
  return dayjs(normalized)
}

/** 학교·날짜별 이벤트 (하루에 한 학교당 1건, 해당 날짜의 세션 목록 포함) */
interface CalendarEvent {
  id: string
  title: string
  startDate: Dayjs
  endDate: Dayjs
  originalItem: {
    row: ParticipatingSchoolRow
    sessionsOnDate: ParticipatingSchoolSession[]
    educationGrade: string
    desiredEducationPeriod: string
  }
}

/** 초등학교별 태그 배경색 (학교명 기준으로 일관 적용, tone-on-tone border) */
const SCHEDULE_COLOR_BASE: { primary: string; light: string; border: string }[] = [
  { primary: '#E8D4D4', light: '#FCF8F8', border: '#E8D4D4' },
  { primary: '#E8C4C4', light: '#FBEFEF', border: '#E8C4C4' },
  { primary: '#E8C8DC', light: '#FEEBF6', border: '#E8C8DC' },
  { primary: '#E8B0B0', light: '#FFDCDC', border: '#E8B0B0' },
  { primary: '#E8E0C8', light: '#FFFBF1', border: '#E8E0C8' },
  { primary: '#D4D8A8', light: '#F1F3E0', border: '#D4D8A8' },
  { primary: '#A8D898', light: '#DDF6D2', border: '#A8D898' },
  { primary: '#B8E0A8', light: '#ECFAE5', border: '#B8E0A8' },
  { primary: '#98D088', light: '#D8EFD3', border: '#98D088' },
  { primary: '#88D0E8', light: '#D4F6FF', border: '#88D0E8' },
  { primary: '#88B0E0', light: '#C6E7FF', border: '#88B0E0' },
  { primary: '#B8C0E8', light: '#EEF1FF', border: '#B8C0E8' },
  { primary: '#D8E0A8', light: '#F4F8D3', border: '#D8E0A8' },
  { primary: '#E8E088', light: '#FFF9BF', border: '#E8E088' },
  { primary: '#E8E898', light: '#FDFFBC', border: '#E8E898' },
]

function buildEventsFromSchools(schools: ParticipatingSchoolRow[]): CalendarEvent[] {
  const byDateAndSchool = new Map<
    string,
    { row: ParticipatingSchoolRow; sessions: ParticipatingSchoolSession[] }
  >()
  for (const row of schools) {
    const sessions = row.sessions ?? []
    for (const session of sessions) {
      const d = parseSessionDate(session.date)
      const key = `${d.format('YYYY-MM-DD')}_${row.id}`
      const existing = byDateAndSchool.get(key)
      if (existing) {
        existing.sessions.push(session)
      } else {
        byDateAndSchool.set(key, { row, sessions: [session] })
      }
    }
  }
  const events: CalendarEvent[] = []
  byDateAndSchool.forEach(({ row, sessions }) => {
    const d = parseSessionDate(sessions[0].date)
    const first = sessions[0]
    const timeRangeDisplay = first.timeRange.replace(/\s*~\s*/, ' ~ ')
    const periodLabel = first.classNum.endsWith('교시') ? first.classNum : `${first.classNum}교시`
    const periodStr = `${periodLabel} (${timeRangeDisplay})`
    events.push({
      id: row.id,
      title: row.schoolName,
      startDate: d,
      endDate: d,
      originalItem: {
        row,
        sessionsOnDate: sessions,
        educationGrade: row.educationGrade,
        desiredEducationPeriod: periodStr,
      },
    })
  })
  return events
}

export interface ParticipatingInstitutionsCalendarViewProps {
  schools: ParticipatingSchoolRow[]
  selectedRowKeys: React.Key[]
  onSelectionChange: (keys: React.Key[]) => void
  onSchoolClick: (row: ParticipatingSchoolRow) => void
  /** 우측 카드 영역을 대체할 컨텐츠. 없으면 ApplicantScheduleList 사용 */
  rightContent?: React.ReactNode
  /** 날짜 셀 클릭 시 호출 (참여 강사 캘린더에서 우측 강사 목록 필터용) */
  onDateSelect?: (date: Dayjs) => void
}

export function ParticipatingInstitutionsCalendarView({
  schools,
  selectedRowKeys,
  onSelectionChange,
  onSchoolClick,
  rightContent,
  onDateSelect,
}: ParticipatingInstitutionsCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs().startOf('month'))
  const [calendarMode, setCalendarMode] = useState<'month' | 'week'>('month')
  const mainCalendarRef = useRef<HTMLDivElement>(null)

  const events = useMemo(() => buildEventsFromSchools(schools), [schools])

  /** 초등학교별 색상 인덱스 (학교명 알파벳순으로 0~N 배정) */
  const entityToColorIndex = useMemo(() => {
    const keys = new Set(schools.map(s => s.schoolName))
    const sorted = Array.from(keys).sort()
    const map = new Map<string, number>()
    sorted.forEach((k, i) => map.set(k, i % SCHEDULE_COLOR_BASE.length))
    return map
  }, [schools])

  const getColorForEvent = (event: CalendarEvent) => {
    const idx = entityToColorIndex.get(event.title) ?? 0
    return SCHEDULE_COLOR_BASE[idx]
  }

  const getEventsForDate = (date: Dayjs): CalendarEvent[] => {
    return events.filter(
      ev => date.isSameOrAfter(ev.startDate, 'day') && date.isSameOrBefore(ev.endDate, 'day')
    )
  }

  const handleDateSelect = (date: Dayjs) => {
    setSelectedDate(date)
    onDateSelect?.(date)
    if (!date.isSame(currentMonth, 'month')) {
      setCurrentMonth(date.startOf('month'))
    }
  }

  const handlePrev = () => {
    if (calendarMode === 'week') {
      setCurrentMonth(prev => prev.subtract(1, 'week'))
    } else {
      setCurrentMonth(prev => prev.subtract(1, 'month'))
    }
  }

  const handleNext = () => {
    if (calendarMode === 'week') {
      setCurrentMonth(prev => prev.add(1, 'week'))
    } else {
      setCurrentMonth(prev => prev.add(1, 'month'))
    }
  }

  const handleToday = () => {
    const today = dayjs()
    setSelectedDate(today)
    setCurrentMonth(today.startOf('month'))
  }

  const weekDates = useMemo(() => {
    const startOfWeek = currentMonth.startOf('week')
    return Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'))
  }, [currentMonth])

  const headerRender = () => {
    const headerTitle =
      calendarMode === 'week'
        ? `${weekDates[0].format('YYYY.MM')} ${weekDates[0].format('D')} - ${weekDates[6].format('D')}`
        : currentMonth.format('YYYY. MM')

    return (
      <div className="participating-institutions-calendar-header">
        <div className="participating-institutions-calendar-header-left">
          <span className="participating-institutions-calendar-header-title">{headerTitle}</span>
          <Button
            size="small"
            className="participating-institutions-calendar-today-btn"
            onClick={handleToday}
          >
            오늘
          </Button>
          <div className="participating-institutions-calendar-nav">
            <Button
              type="text"
              size="small"
              icon={<CalendarNavRightIcon />}
              className="participating-institutions-calendar-nav-btn"
              onClick={handlePrev}
            />
            <Button
              type="text"
              size="small"
              icon={<CalendarNavLeftIcon />}
              className="participating-institutions-calendar-nav-btn"
              onClick={handleNext}
            />
          </div>
        </div>
        <div className="participating-institutions-calendar-header-right">
          <div className="participating-institutions-calendar-view-mode">
            <div
              className={`participating-institutions-calendar-view-mode__indicator ${calendarMode === 'week' ? 'participating-institutions-calendar-view-mode__indicator--week' : ''}`}
              aria-hidden
            />
            <button
              type="button"
              className={`participating-institutions-calendar-view-mode__tab ${calendarMode === 'month' ? 'participating-institutions-calendar-view-mode__tab--active' : ''}`}
              onClick={() => setCalendarMode('month')}
            >
              <span className="participating-institutions-calendar-view-mode__tab-text">월간</span>
            </button>
            <button
              type="button"
              className={`participating-institutions-calendar-view-mode__tab ${calendarMode === 'week' ? 'participating-institutions-calendar-view-mode__tab--active' : ''}`}
              onClick={() => setCalendarMode('week')}
            >
              <span className="participating-institutions-calendar-view-mode__tab-text">주간</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  const dateFullCellRender = (date: Dayjs) => {
    const isCurrentMonth = date.isSame(currentMonth, 'month')
    const isToday = date.isSame(dayjs(), 'day')
    const isSelected = date.isSame(selectedDate, 'day')
    const dayEvents = getEventsForDate(date)
    const hasEvents = dayEvents.length > 0

    return (
      <div
        className={`participating-institutions-calendar-cell ${!isCurrentMonth ? 'participating-institutions-calendar-cell--other-month' : ''} ${isSelected ? 'participating-institutions-calendar-cell--selected' : ''} ${isToday ? 'participating-institutions-calendar-cell--today' : ''}`}
        onClick={() => handleDateSelect(date)}
      >
        <div className="participating-institutions-calendar-cell-date">
          <span className={isToday ? 'participating-institutions-calendar-cell-date-today' : ''}>
            {date.date()}
          </span>
        </div>
        {hasEvents && (
          <div className="participating-institutions-calendar-cell-events">
            {dayEvents.slice(0, 2).map(ev => {
              const displayTitle = `${ev.originalItem.row.schoolName} | ${ev.originalItem.row.region}`
              const isEventSelected = selectedRowKeys.includes(ev.id)
              const colorIdx = entityToColorIndex.get(ev.title) ?? 0
              return (
                <Tooltip
                  key={ev.id}
                  title={
                    <pre className="participating-institutions-calendar-event-tooltip">
                      {getEventPreviewContent(ev)}
                    </pre>
                  }
                  placement="topLeft"
                  mouseEnterDelay={0.2}
                >
                  <div
                    className={`participating-institutions-calendar-event ${isEventSelected ? 'participating-institutions-calendar-event--selected' : ''}`}
                    data-color-index={colorIdx}
                    onClick={e => e.stopPropagation()}
                  >
                    <span className="participating-institutions-calendar-event-title">
                      {displayTitle}
                    </span>
                  </div>
                </Tooltip>
              )
            })}
            {dayEvents.length > 2 && (
              <Tooltip
                title={
                  <pre className="participating-institutions-calendar-event-tooltip">
                    {dayEvents
                      .slice(2)
                      .map(ev => getEventPreviewContent(ev))
                      .join('\n\n')}
                  </pre>
                }
                placement="topLeft"
                mouseEnterDelay={0.2}
              >
                <div className="participating-institutions-calendar-event-more">
                  외 {dayEvents.length - 2}개의 일정
                </div>
              </Tooltip>
            )}
          </div>
        )}
      </div>
    )
  }

  /** 태그 호버 시 미리보기용 텍스트 (학교명, 지역, 해당일 세션 요약) */
  function getEventPreviewContent(ev: CalendarEvent): string {
    const { row, sessionsOnDate, educationGrade } = ev.originalItem
    const lines = [`${row.schoolName} | ${row.region}`]
    if (sessionsOnDate.length > 0) {
      const sessionLines = sessionsOnDate.map(
        s => `${s.classNum} (${s.timeRange.replace(/~/g, ' ~ ')}) | ${educationGrade}`
      )
      lines.push(...sessionLines)
    }
    return lines.join('\n')
  }

  const renderWeekView = () => {
    const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return (
      <div className="participating-institutions-calendar-week">
        <div className="participating-institutions-calendar-week-header">
          {weekdayNames.map(day => (
            <div key={day} className="participating-institutions-calendar-week-header-cell">
              {day}
            </div>
          ))}
        </div>
        <div className="participating-institutions-calendar-week-body">
          {weekDates.map(d => {
            const isToday = d.isSame(dayjs(), 'day')
            const isSelected = d.isSame(selectedDate, 'day')
            const dayEvents = getEventsForDate(d)
            const hasEvents = dayEvents.length > 0
            return (
              <div
                key={d.format('YYYY-MM-DD')}
                className={`participating-institutions-calendar-week-cell ${isSelected ? 'participating-institutions-calendar-week-cell--selected' : ''} ${isToday ? 'participating-institutions-calendar-week-cell--today' : ''}`}
                onClick={() => handleDateSelect(d)}
              >
                <div className="participating-institutions-calendar-week-cell-date">{d.date()}</div>
                {hasEvents && (
                  <div className="participating-institutions-calendar-week-cell-events">
                    {dayEvents.slice(0, 2).map(ev => {
                      const displayTitle = `${ev.originalItem.row.schoolName} | ${ev.originalItem.row.region}`
                      const colorIdx = entityToColorIndex.get(ev.title) ?? 0
                      return (
                        <Tooltip
                          key={ev.id}
                          title={
                            <pre className="participating-institutions-calendar-event-tooltip">
                              {getEventPreviewContent(ev)}
                            </pre>
                          }
                          placement="topLeft"
                          mouseEnterDelay={0.2}
                        >
                          <div
                            className="participating-institutions-calendar-event"
                            data-color-index={colorIdx}
                            onClick={e => e.stopPropagation()}
                          >
                            <span className="participating-institutions-calendar-event-title">
                              {displayTitle}
                            </span>
                          </div>
                        </Tooltip>
                      )
                    })}
                    {dayEvents.length > 2 && (
                      <Tooltip
                        title={
                          <pre className="participating-institutions-calendar-event-tooltip">
                            {dayEvents
                              .slice(2)
                              .map(ev => getEventPreviewContent(ev))
                              .join('\n\n')}
                          </pre>
                        }
                        placement="topLeft"
                        mouseEnterDelay={0.2}
                      >
                        <div className="participating-institutions-calendar-event-more">
                          외 {dayEvents.length - 2}개의 일정
                        </div>
                      </Tooltip>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const eventsForSelectedDate = getEventsForDate(selectedDate)
  const eventListForList = eventsForSelectedDate.map(ev => ({
    ...ev,
    originalItem: {
      ...ev.originalItem,
      educationGrade: ev.originalItem.educationGrade,
      desiredEducationPeriod: ev.originalItem.desiredEducationPeriod,
    },
  }))

  return (
    <div className="participating-institutions-calendar-layout">
      <div
        className="participating-institutions-calendar-card participating-institutions-calendar-card--left"
        ref={mainCalendarRef}
      >
        {headerRender()}
        {calendarMode === 'week' ? (
          renderWeekView()
        ) : (
          <Calendar
            value={currentMonth}
            fullCellRender={dateFullCellRender}
            headerRender={() => null}
          />
        )}
      </div>
      <div className="participating-institutions-calendar-card participating-institutions-calendar-card--right">
        {rightContent !== undefined ? (
          rightContent
        ) : (
          <ApplicantScheduleList
            selectedDate={selectedDate}
            events={eventListForList}
            selectedRowKeys={selectedRowKeys}
            onSelectionChange={onSelectionChange}
            onEventClick={item => item?.row && onSchoolClick(item.row)}
            getColorForEvent={e => getColorForEvent(e as CalendarEvent)}
          />
        )}
      </div>
    </div>
  )
}
