import { useState, useRef, useMemo, useCallback, useEffect } from 'react'
import { Calendar, Button, Spin, Tooltip } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import { ApplicantScheduleList } from './applicant-schedule-list'
import {
  SCHEDULE_COLORS,
  type ScheduleColorPair,
} from '../../program-schedule-colors'
import './applicant-calendar-view.css'
import { AppButton, AppMultiSelect, APP_MULTI_SELECT_TAG_COLORS } from '@/shared/ui'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

function getEntityKey(event: any): string {
  const item = event?.originalItem
  if (item?.schoolName) return item.schoolName
  if (item?.instructorName) return item.instructorName
  return event?.title?.replace(/^\[.*?\]\s*/, '') ?? ''
}

/** 기관: 학교명 | 지역(첫 토큰) | 신청 n명 · 강사: 성명 | 신청학교 등 | 신청 1명 */
function getPopoverRowParts(item: any): { title: string; location: string; countLabel: string } | null {
  if (!item) return null
  const summary = item.calendarInstitutionSummary as
    | { applicantCount: number; regionDisplay: string }
    | undefined
  if (summary && typeof item.schoolName === 'string') {
    return {
      title: item.schoolName,
      location: summary.regionDisplay || '-',
      countLabel: `신청 : ${summary.applicantCount}명`,
    }
  }
  if (typeof item.schoolName === 'string' && 'region' in item && item.region != null) {
    const regionStr = String(item.region).trim()
    const location = regionStr.split(/\s+/)[0] ?? regionStr
    const n = typeof item.studentCount === 'number' ? item.studentCount : 0
    return {
      title: item.schoolName,
      location: location || '-',
      countLabel: `신청 : ${n}명`,
    }
  }
  if (typeof item.instructorName === 'string') {
    const location =
      typeof item.schoolName === 'string' && item.schoolName
        ? item.schoolName
        : typeof item.address === 'string'
          ? item.address.split(/\s+/).slice(0, 2).join(' ') || '-'
          : '-'
    return {
      title: item.instructorName,
      location,
      countLabel: '신청 : 1명',
    }
  }
  return null
}

function ApplicantCalendarEventPopoverContent({
  events,
  colorMap,
}: {
  events: any[]
  colorMap: Map<string | number, ScheduleColorPair>
}) {
  return (
    <div className="applicant-calendar-popover">
      {events.map(ev => {
        const colors = colorMap.get(ev.id) ?? SCHEDULE_COLORS[0]
        const parts = getPopoverRowParts(ev.originalItem)
        const fallbackTitle = String(ev.title ?? '').replace(/^\[.*?\]\s*/, '')
        if (!parts) {
          return (
            <div key={ev.id} className="applicant-calendar-popover__row">
              <span className="applicant-calendar-popover__title" style={{ color: colors.text }}>
                {fallbackTitle || '-'}
              </span>
            </div>
          )
        }
        return (
          <div key={ev.id} className="applicant-calendar-popover__row">
            <span className="applicant-calendar-popover__title" style={{ color: colors.text }}>
              {parts.title}
            </span>
            <span className="applicant-calendar-popover__sep" aria-hidden>
              |
            </span>
            <span className="applicant-calendar-popover__text">{parts.location}</span>
            <span className="applicant-calendar-popover__sep" aria-hidden>
              |
            </span>
            <span className="applicant-calendar-popover__text">{parts.countLabel}</span>
          </div>
        )
      })}
    </div>
  )
}

interface ApplicantCalendarViewProps {
  events: any[]
  loading?: boolean
  selectedRowKeys: React.Key[]
  onSelectionChange: (keys: React.Key[]) => void
  onItemClick: (item: any) => void
}

export function ApplicantCalendarView({
  events,
  loading,
  selectedRowKeys,
  onSelectionChange,
  onItemClick,
}: ApplicantCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs().startOf('month'))
  const [calendarMode, setCalendarMode] = useState<'month' | 'week'>('month')
  const [selectedSchools, setSelectedSchools] = useState<string[]>([])
  const mainCalendarRef = useRef<HTMLDivElement>(null)

  const weekDates = useMemo(() => {
    const startOfWeek = currentMonth.startOf('week')
    return Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'))
  }, [currentMonth])

  const colorPalette = SCHEDULE_COLORS
  // 학교/강사별 색상 매핑 (순차 할당)
  const entityToColorIndex = useMemo(() => {
    const keys = new Set<string>()
    events.forEach(ev => {
      const k = getEntityKey(ev)
      if (k) keys.add(k)
    })
    const sorted = Array.from(keys).sort()
    const map = new Map<string, number>()
    sorted.forEach((k, i) => map.set(k, i % colorPalette.length))
    return map
  }, [events, colorPalette])

  /** 인접한 서로 다른 엔티티 간 동일 색상 방지. 이미 사용된 색은 최대한 재사용하지 않고 미사용 색 우선 배정 */
  const buildResolvedColorMap = useCallback(
    (eventList: any[]) => {
      const map = new Map<string, ScheduleColorPair>()
      const usedIndices = new Set<number>()
      let prevIdx = -1
      let prevKey = ''

      eventList.forEach(ev => {
        const key = getEntityKey(ev)
        let idx = entityToColorIndex.get(key) ?? 0

        // 서로 다른 엔티티가 인접한데 같은 색이면 → 미사용 색 우선, 없으면 다음 색
        if (prevIdx >= 0 && idx === prevIdx && key !== prevKey) {
          let altIdx = -1
          for (let i = 0; i < colorPalette.length; i++) {
            if (!usedIndices.has(i) && i !== prevIdx) {
              altIdx = i
              break
            }
          }
          if (altIdx >= 0) {
            idx = altIdx
          } else {
            idx = (prevIdx + 1) % colorPalette.length
          }
        }

        usedIndices.add(idx)
        prevIdx = idx
        prevKey = key
        map.set(ev.id, colorPalette[idx])
      })
      return map
    },
    [entityToColorIndex, colorPalette]
  )

  // 특정 날짜의 이벤트 가져오기
  const getEventsForDate = (date: Dayjs): any[] => {
    return events.filter(event => {
      const start = dayjs(event.startDate)
      const end = dayjs(event.endDate)
      return date.isSameOrAfter(start, 'day') && date.isSameOrBefore(end, 'day')
    })
  }

  const dayEvents = useMemo(() => getEventsForDate(selectedDate), [events, selectedDate])
  const schoolFilterOptions = useMemo(() => {
    const uniqueSchools = Array.from(
      new Set(
        dayEvents
          .map(ev => String(ev?.originalItem?.schoolName ?? '').trim())
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b, 'ko'))
    return uniqueSchools.map((school, i) => ({
      value: school,
      label: school,
      tagColor: APP_MULTI_SELECT_TAG_COLORS[i % APP_MULTI_SELECT_TAG_COLORS.length],
    }))
  }, [dayEvents])
  useEffect(() => {
    setSelectedSchools(prev => prev.filter(v => schoolFilterOptions.some(opt => opt.value === v)))
  }, [schoolFilterOptions])
  const filteredDayEvents = useMemo(() => {
    if (selectedSchools.length === 0) return dayEvents
    const selectedSet = new Set(selectedSchools)
    return dayEvents.filter(ev => {
      const schoolName = String(ev?.originalItem?.schoolName ?? '').trim()
      return schoolName !== '' && selectedSet.has(schoolName)
    })
  }, [dayEvents, selectedSchools])
  const scheduleListColorMap = useMemo(
    () => buildResolvedColorMap(filteredDayEvents),
    [filteredDayEvents, buildResolvedColorMap]
  )
  const getColorForScheduleList = useCallback(
    (event: any) => scheduleListColorMap.get(event.id) ?? colorPalette[0],
    [scheduleListColorMap, colorPalette]
  )

  const handleDateSelect = (date: Dayjs) => {
    setSelectedDate(date)
    if (calendarMode === 'week') {
      if (!date.isSame(currentMonth, 'week')) {
        setCurrentMonth(date.startOf('week'))
      }
    } else if (!date.isSame(currentMonth, 'month')) {
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

  // 메인 캘린더 헤더 렌더링
  const headerRender = () => {
    const headerTitle =
      calendarMode === 'week'
        ? `${weekDates[0].format('YYYY.MM')} ${weekDates[0].format('D')} - ${weekDates[6].format('D')}`
        : currentMonth.format('YYYY. MM')

    return (
      <div className="applicant-calendar-header">
        <div className="applicant-calendar-header-left">
          <span className="applicant-calendar-header-title">{headerTitle}</span>
          <AppButton size="small" className="applicant-calendar-today-btn" onClick={handleToday}>
            오늘
          </AppButton>
          <div className="applicant-calendar-nav">
            <Button
              type="text"
              size="small"
              icon={<LeftOutlined />}
              className="applicant-calendar-nav-btn"
              onClick={handlePrev}
            />
            <Button
              type="text"
              size="small"
              icon={<RightOutlined />}
              className="applicant-calendar-nav-btn"
              onClick={handleNext}
            />
          </div>
        </div>
        <div className="applicant-calendar-header-right">
          <div className="applicant-calendar-view-mode">
            <div
              className={`applicant-calendar-view-mode__indicator ${calendarMode === 'week' ? 'applicant-calendar-view-mode__indicator--week' : ''}`}
              aria-hidden
            />
            <button
              type="button"
              className={`applicant-calendar-view-mode__tab ${calendarMode === 'month' ? 'applicant-calendar-view-mode__tab--active' : ''}`}
              onClick={() => {
                setCalendarMode('month')
                setCurrentMonth(selectedDate.startOf('month'))
              }}
            >
              <span className="applicant-calendar-view-mode__tab-text">월간</span>
            </button>
            <button
              type="button"
              className={`applicant-calendar-view-mode__tab ${calendarMode === 'week' ? 'applicant-calendar-view-mode__tab--active' : ''}`}
              onClick={() => {
                setCalendarMode('week')
                setCurrentMonth(selectedDate.startOf('week'))
              }}
            >
              <span className="applicant-calendar-view-mode__tab-text">주간</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  // 메인 캘린더 셀 렌더링
  const dateFullCellRender = (date: Dayjs) => {
    const isCurrentMonth = date.isSame(currentMonth, 'month')
    const isSelected = date.isSame(selectedDate, 'day')
    const dayEvents = getEventsForDate(date)
    const hasEvents = dayEvents.length > 0
    const resolvedColors = buildResolvedColorMap(dayEvents)

    const cellBody = (
      <>
        <div className="applicant-calendar-cell-date">
          <span className={isSelected ? 'applicant-calendar-cell-date-selected' : ''}>
            {date.date()}
          </span>
        </div>
        {hasEvents && (
          <div className="applicant-calendar-cell-events">
            {dayEvents.slice(0, 2).map(event => {
              const displayTitle = event.title.replace(/^\[.*?\]\s*/, '')
              const isEventSelected = selectedRowKeys.includes(event.id)
              const colors = resolvedColors.get(event.id) ?? SCHEDULE_COLORS[0]
              return (
                <div
                  key={event.id}
                  className={`applicant-calendar-event ${isEventSelected ? 'applicant-calendar-event--selected' : ''}`}
                  style={{
                    backgroundColor: colors.bg,
                    border: isEventSelected ? 'none' : `1px solid ${colors.border}`,
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <span className="applicant-calendar-event-title">{displayTitle}</span>
                </div>
              )
            })}
            {dayEvents.length > 2 && (
              <div className="applicant-calendar-event-more">
                외 {dayEvents.length - 2}개의 일정
              </div>
            )}
          </div>
        )}
      </>
    )

    return (
      <div
        className={`applicant-calendar-cell ${!isCurrentMonth ? 'applicant-calendar-cell--other-month' : ''} ${isSelected ? 'applicant-calendar-cell--selected' : ''}`}
        onClick={() => handleDateSelect(date)}
      >
        {hasEvents ? (
          <Tooltip
            arrow={false}
            overlayClassName="applicant-calendar-tooltip-overlay"
            title={
              <ApplicantCalendarEventPopoverContent
                events={dayEvents}
                colorMap={resolvedColors}
              />
            }
            placement="bottomLeft"
            mouseEnterDelay={0.15}
            destroyTooltipOnHide
          >
            <div className="applicant-calendar-cell-tooltip-trigger">{cellBody}</div>
          </Tooltip>
        ) : (
          cellBody
        )}
      </div>
    )
  }

  // 주간 뷰 렌더링
  const renderWeekView = () => {
    const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    return (
      <div className="applicant-calendar-week">
        <div className="applicant-calendar-week-header">
          {weekdayNames.map(day => (
            <div key={day} className="applicant-calendar-week-header-cell">
              {day}
            </div>
          ))}
        </div>
        <div className="applicant-calendar-week-body">
          {weekDates.map(d => {
            const isSelected = d.isSame(selectedDate, 'day')
            const dayEvents = getEventsForDate(d)
            const hasEvents = dayEvents.length > 0
            const resolvedWeekColors = buildResolvedColorMap(dayEvents)
            const weekCellBody = (
              <>
                <div
                  className={`applicant-calendar-week-cell-date ${isSelected ? 'applicant-calendar-week-cell-date--selected' : ''}`}
                >
                  {d.date()}
                </div>
                {hasEvents && (
                  <div className="applicant-calendar-week-cell-events">
                    {dayEvents.slice(0, 2).map(event => {
                      const displayTitle = event.title.replace(/^\[.*?\]\s*/, '')
                      const colors = resolvedWeekColors.get(event.id) ?? SCHEDULE_COLORS[0]
                      return (
                        <div
                          key={event.id}
                          className="applicant-calendar-event"
                          style={{
                            backgroundColor: colors.bg,
                            border: `1px solid ${colors.border}`,
                          }}
                          onClick={e => e.stopPropagation()}
                        >
                          <span className="applicant-calendar-event-title">{displayTitle}</span>
                        </div>
                      )
                    })}
                    {dayEvents.length > 2 && (
                      <div className="applicant-calendar-event-more">
                        외 {dayEvents.length - 2}개의 일정
                      </div>
                    )}
                  </div>
                )}
              </>
            )

            return (
              <div
                key={d.format('YYYY-MM-DD')}
                className={`applicant-calendar-week-cell ${isSelected ? 'applicant-calendar-week-cell--selected' : ''}`}
                onClick={() => handleDateSelect(d)}
              >
                {hasEvents ? (
                  <Tooltip
                    arrow={false}
                    overlayClassName="applicant-calendar-tooltip-overlay"
                    title={
                      <ApplicantCalendarEventPopoverContent
                        events={dayEvents}
                        colorMap={resolvedWeekColors}
                      />
                    }
                    placement="bottomLeft"
                    mouseEnterDelay={0.15}
                    destroyTooltipOnHide
                  >
                    <div className="applicant-calendar-week-cell-tooltip-trigger">{weekCellBody}</div>
                  </Tooltip>
                ) : (
                  weekCellBody
                )}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="applicant-calendar-view applicant-calendar-view--loading">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="applicant-calendar-layout">
      {/* 좌측: 메인 캘린더 */}
      <div className="applicant-calendar-main" ref={mainCalendarRef}>
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

      {/* 우측: 선택일 일정 리스트 */}
      <div className="applicant-calendar-right">
        <div className="applicant-calendar-right__school-filter">
          <AppMultiSelect
            value={selectedSchools}
            onChange={setSelectedSchools}
            options={schoolFilterOptions}
            placeholder="기관 선택"
          />
        </div>
        <ApplicantScheduleList
          selectedDate={selectedDate}
          events={filteredDayEvents}
          selectedRowKeys={selectedRowKeys}
          onSelectionChange={onSelectionChange}
          onEventClick={onItemClick}
          getColorForEvent={getColorForScheduleList}
        />
      </div>
    </div>
  )
}
