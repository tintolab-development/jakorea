/**
 * 프로그램 캘린더 뷰 컴포넌트
 * 3단: 좌측(미니 캘린더 + 검색 + 유형 필터) | 중앙(메인 캘린더) | 우측(선택일 일정 리스트)
 */

import { useState, useMemo, useRef, useEffect, Fragment } from 'react'
import { Calendar, Button, Spin, Input, Checkbox, Popover } from 'antd'
import { LeftOutlined, RightOutlined, SearchOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import type { Program } from '@/types/domain'
import { ProgramMiniCalendar } from './program-mini-calendar'
import { ProgramScheduleList, getProgramDayScheduleLine } from './program-schedule-list'
import {
  SCHEDULE_COLORS,
  buildResolvedScheduleColorMapForPrograms,
} from './program-schedule-colors'
import { businessAreaOptions } from './constants/program-list-constants'
import { SegmentedTab } from '@/shared/ui'
import './program-calendar-view.css'

const businessAreaColorClasses: Record<string, string> = {
  경제금융: 'program-calendar-left__filter-item--cyan',
  기업가정신: 'program-calendar-left__filter-item--red',
  진로취업: 'program-calendar-left__filter-item--purple',
  디지털리터러시: 'program-calendar-left__filter-item--green',
}

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

interface ProgramCalendarViewProps {
  programs: Program[]
  loading?: boolean
  onProgramClick: (program: Program) => void
}

type SpanRole = 'start' | 'middle' | 'end' | 'single'

/** 해당 날짜가 프로그램 구간(교육/신청) 내에서 첫날·중간·마지막·단일인지 반환 (다일자 연결 배지용) */
function getProgramSpanRole(program: Program, date: Dayjs): SpanRole {
  const start = dayjs(program.startDate)
  const end = dayjs(program.endDate)
  const isInEducation = date.isSameOrAfter(start, 'day') && date.isSameOrBefore(end, 'day')
  let rangeStart: Dayjs
  let rangeEnd: Dayjs

  if (program.applicationStartDate && program.applicationEndDate) {
    const appStart = dayjs(program.applicationStartDate)
    const appEnd = dayjs(program.applicationEndDate)
    const isInApp = date.isSameOrAfter(appStart, 'day') && date.isSameOrBefore(appEnd, 'day')
    if (isInApp) {
      rangeStart = appStart
      rangeEnd = appEnd
    } else if (isInEducation) {
      rangeStart = start
      rangeEnd = end
    } else {
      return 'single'
    }
  } else if (isInEducation) {
    rangeStart = start
    rangeEnd = end
  } else {
    return 'single'
  }

  if (rangeStart.isSame(rangeEnd, 'day')) return 'single'
  if (date.isSame(rangeStart, 'day')) return 'start'
  if (date.isSame(rangeEnd, 'day')) return 'end'
  return 'middle'
}

function CalendarCellSchedulePreview({
  date,
  programs,
  onProgramClick,
}: {
  date: Dayjs
  programs: Program[]
  onProgramClick: (program: Program) => void
}) {
  const scheduleColorMap = buildResolvedScheduleColorMapForPrograms(programs)

  return (
    <div className="program-calendar-cell-preview">
      {programs.map(program => {
        const { statusLabel, time } = getProgramDayScheduleLine(program, date)
        const title = program.title ?? ''
        const colorPair = scheduleColorMap.get(String(program.id)) ?? SCHEDULE_COLORS[0]
        return (
          <button
            key={program.id}
            type="button"
            className="program-calendar-cell-preview__item"
            onClick={e => {
              e.preventDefault()
              e.stopPropagation()
              onProgramClick(program)
            }}
          >
            <span
              className="program-calendar-cell-preview__title"
              style={{ color: colorPair.text }}
            >
              [{title}]
            </span>
            <span className="program-calendar-cell-preview__desc">
              {statusLabel} | {time}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function ProgramCalendarView({
  programs,
  loading,
  onProgramClick,
}: ProgramCalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs().startOf('month'))
  const [calendarMode, setCalendarMode] = useState<'month' | 'week'>('month')
  const [calendarSearchKeyword, setCalendarSearchKeyword] = useState('')
  const [calendarBusinessAreaKeys, setCalendarBusinessAreaKeys] = useState<string[]>([])
  const [sidebarHeight, setSidebarHeight] = useState<number | null>(null)
  const mainCalendarRef = useRef<HTMLDivElement>(null)

  // 좌측 검색 + 사업분야 필터 적용 목록
  const filteredByCalendar = useMemo(() => {
    let list = programs
    const keyword = calendarSearchKeyword.trim().toLowerCase()
    if (keyword) {
      list = list.filter(p => (p.title ?? '').toLowerCase().includes(keyword))
    }
    if (calendarBusinessAreaKeys.length > 0) {
      list = list.filter(p => p.businessArea && calendarBusinessAreaKeys.includes(p.businessArea))
    }
    return list
  }, [programs, calendarSearchKeyword, calendarBusinessAreaKeys])

  // 메인 캘린더 높이 측정하여 우측 패널에 적용
  useEffect(() => {
    const updateHeight = () => {
      if (mainCalendarRef.current) {
        setSidebarHeight(mainCalendarRef.current.offsetHeight)
      }
    }
    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [calendarMode])

  // 일정이 있는 날짜들 (미니 캘린더용) — 필터된 목록 기준
  const programDates = useMemo(() => {
    const dates = new Set<string>()
    filteredByCalendar.forEach(program => {
      const start = dayjs(program.startDate)
      const end = dayjs(program.endDate)
      let current = start

      while (current.isSameOrBefore(end, 'day')) {
        dates.add(current.format('YYYY-MM-DD'))
        current = current.add(1, 'day')
      }

      // 신청 기간도 추가
      if (program.applicationStartDate && program.applicationEndDate) {
        const appStart = dayjs(program.applicationStartDate)
        const appEnd = dayjs(program.applicationEndDate)
        let appCurrent = appStart

        while (appCurrent.isSameOrBefore(appEnd, 'day')) {
          dates.add(appCurrent.format('YYYY-MM-DD'))
          appCurrent = appCurrent.add(1, 'day')
        }
      }
    })
    return dates
  }, [filteredByCalendar])

  // 특정 날짜의 프로그램 가져오기 (필터된 목록 기준)
  const getProgramsForDate = (date: Dayjs): Program[] => {
    return filteredByCalendar.filter(program => {
      const start = dayjs(program.startDate)
      const end = dayjs(program.endDate)
      const isInEducationPeriod =
        date.isSameOrAfter(start, 'day') && date.isSameOrBefore(end, 'day')

      let isInApplicationPeriod = false
      if (program.applicationStartDate && program.applicationEndDate) {
        const appStart = dayjs(program.applicationStartDate)
        const appEnd = dayjs(program.applicationEndDate)
        isInApplicationPeriod =
          date.isSameOrAfter(appStart, 'day') && date.isSameOrBefore(appEnd, 'day')
      }

      return isInEducationPeriod || isInApplicationPeriod
    })
  }

  const handleDateSelect = (date: Dayjs) => {
    setSelectedDate(date)
    // 선택한 날짜의 월로 이동
    if (!date.isSame(currentMonth, 'month')) {
      setCurrentMonth(date.startOf('month'))
    }
  }

  const handleMonthChange = (month: Dayjs) => {
    setCurrentMonth(month)
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

  // 주간 뷰에서 표시할 날짜들 (선택된 주의 일~토)
  const weekDates = useMemo(() => {
    const startOfWeek = currentMonth.startOf('week')
    return Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'))
  }, [currentMonth])

  const handleToday = () => {
    const today = dayjs()
    setSelectedDate(today)
    setCurrentMonth(today.startOf('month'))
  }

  // 메인 캘린더 헤더 렌더링 (스크린샷: 2026.01 형식)
  const headerRender = () => {
    const headerTitle =
      calendarMode === 'week'
        ? `${weekDates[0].format('YYYY.MM')} ${weekDates[0].format('D')} - ${weekDates[6].format('D')}`
        : currentMonth.format('YYYY.MM')

    return (
      <div className="program-calendar-header">
        <div className="program-calendar-header-left">
          <span className="program-calendar-header-title">{headerTitle}</span>
          <Button size="small" className="program-calendar-today-btn" onClick={handleToday}>
            오늘
          </Button>
          <div className="program-calendar-nav">
            <Button
              type="text"
              size="small"
              icon={<LeftOutlined />}
              className="program-calendar-nav-btn"
              onClick={handlePrev}
            />
            <Button
              type="text"
              size="small"
              icon={<RightOutlined />}
              className="program-calendar-nav-btn"
              onClick={handleNext}
            />
          </div>
        </div>
        <div className="program-calendar-header-right">
          <SegmentedTab
            size="medium"
            value={calendarMode}
            onChange={value => setCalendarMode(value as 'month' | 'week')}
            options={[
              { label: '월간', value: 'month' },
              { label: '주간', value: 'week' },
            ]}
          />
        </div>
      </div>
    )
  }

  // 메인 캘린더 셀 렌더링 (이전/다음 달 일자도 표기, other-month 스타일로 구분)
  const dateFullCellRender = (date: Dayjs) => {
    const isCurrentMonth = date.isSame(currentMonth, 'month')
    const isToday = date.isSame(dayjs(), 'day')
    const isSelected = date.isSame(selectedDate, 'day')
    const dayPrograms = getProgramsForDate(date)
    const hasPrograms = dayPrograms.length > 0
    const scheduleColorMap = buildResolvedScheduleColorMapForPrograms(dayPrograms)

    const cellEl = (
      <div
        className={`program-calendar-cell ${!isCurrentMonth ? 'program-calendar-cell--other-month' : ''} ${isSelected ? 'program-calendar-cell--selected' : ''} ${isToday ? 'program-calendar-cell--today' : ''}`}
        onClick={() => handleDateSelect(date)}
      >
        <div className="program-calendar-cell-date">{date.date()}</div>
        {hasPrograms && (
          <div className="program-calendar-cell-events">
            {dayPrograms.slice(0, 2).map(program => {
              const spanRole = getProgramSpanRole(program, date)
              const colorPair = scheduleColorMap.get(String(program.id)) ?? SCHEDULE_COLORS[0]
              return (
                <div
                  key={program.id}
                  className={`program-calendar-event program-calendar-event--span-${spanRole}`}
                  style={{ backgroundColor: colorPair.bg }}
                  onClick={e => {
                    e.stopPropagation()
                    onProgramClick(program)
                  }}
                >
                  <span className="program-calendar-event-title">{program.title}</span>
                </div>
              )
            })}
            {dayPrograms.length > 2 && (
              <div className="program-calendar-event-more">
                외 {dayPrograms.length - 2}개의 일정
              </div>
            )}
          </div>
        )}
      </div>
    )

    if (!hasPrograms) {
      return cellEl
    }

    return (
      <Popover
        arrow={false}
        overlayClassName="program-calendar-cell-preview-popover"
        trigger="hover"
        placement="bottomLeft"
        mouseEnterDelay={0.12}
        mouseLeaveDelay={0.08}
        getPopupContainer={() => document.body}
        content={
          <CalendarCellSchedulePreview
            date={date}
            programs={dayPrograms}
            onProgramClick={onProgramClick}
          />
        }
      >
        {cellEl}
      </Popover>
    )
  }

  if (loading) {
    return (
      <div className="program-calendar-view program-calendar-view--loading">
        <Spin size="large" />
      </div>
    )
  }

  // 주간 뷰 렌더링
  const renderWeekView = () => {
    const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    return (
      <div className="program-calendar-week">
        {/* 요일 헤더 */}
        <div className="program-calendar-week-header">
          {weekdayNames.map(day => (
            <div key={day} className="program-calendar-week-header-cell">
              {day}
            </div>
          ))}
        </div>
        {/* 날짜 셀들 */}
        <div className="program-calendar-week-body">
          {weekDates.map(date => {
            const isToday = date.isSame(dayjs(), 'day')
            const isSelected = date.isSame(selectedDate, 'day')
            const dayPrograms = getProgramsForDate(date)
            const hasPrograms = dayPrograms.length > 0
            const scheduleColorMap = buildResolvedScheduleColorMapForPrograms(dayPrograms)

            const weekCellEl = (
              <div
                className={`program-calendar-week-cell ${isSelected ? 'program-calendar-week-cell--selected' : ''} ${isToday ? 'program-calendar-week-cell--today' : ''}`}
                onClick={() => handleDateSelect(date)}
              >
                <div className="program-calendar-week-cell-date">{date.date()}</div>
                {hasPrograms && (
                  <div className="program-calendar-week-cell-events">
                    {dayPrograms.slice(0, 2).map(program => {
                      const spanRole = getProgramSpanRole(program, date)
                      const colorPair =
                        scheduleColorMap.get(String(program.id)) ?? SCHEDULE_COLORS[0]
                      return (
                        <div
                          key={program.id}
                          className={`program-calendar-event program-calendar-event--span-${spanRole}`}
                          style={{ backgroundColor: colorPair.bg }}
                          onClick={e => {
                            e.stopPropagation()
                            onProgramClick(program)
                          }}
                        >
                          <span className="program-calendar-event-title">{program.title}</span>
                        </div>
                      )
                    })}
                    {dayPrograms.length > 2 && (
                      <div className="program-calendar-event-more">
                        외 {dayPrograms.length - 2}개의 일정
                      </div>
                    )}
                  </div>
                )}
              </div>
            )

            if (!hasPrograms) {
              return <Fragment key={date.format('YYYY-MM-DD')}>{weekCellEl}</Fragment>
            }

            return (
              <Popover
                key={date.format('YYYY-MM-DD')}
                arrow={false}
                overlayClassName="program-calendar-cell-preview-popover"
                trigger="hover"
                placement="bottomLeft"
                mouseEnterDelay={0.12}
                mouseLeaveDelay={0.08}
                getPopupContainer={() => document.body}
                content={
                  <CalendarCellSchedulePreview
                    date={date}
                    programs={dayPrograms}
                    onProgramClick={onProgramClick}
                  />
                }
              >
                {weekCellEl}
              </Popover>
            )
          })}
        </div>
      </div>
    )
  }

  const handleBusinessAreaChange = (value: string, checked: boolean) => {
    setCalendarBusinessAreaKeys(prev =>
      checked ? [...prev, value] : prev.filter(k => k !== value)
    )
  }

  return (
    <div className="program-calendar-view">
      {/* 좌측: 미니 캘린더 + 검색 + 프로그램 유형 필터 */}
      <div className="program-calendar-left">
        <ProgramMiniCalendar
          currentMonth={currentMonth}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          onMonthChange={handleMonthChange}
          programDates={programDates}
        />
        <div className="program-calendar-left__search-widget">
          <div className="program-calendar-left__search">
            <Input
              placeholder="프로그램명을 입력하세요"
              prefix={<SearchOutlined style={{ color: 'var(--color-text-secondary)' }} />}
              value={calendarSearchKeyword}
              onChange={e => setCalendarSearchKeyword(e.target.value)}
              allowClear
            />
          </div>
          <div className="program-calendar-left__filters">
            {businessAreaOptions.map(opt => (
              <div className="program-calendar-left__filters-wrapper">
                <Checkbox
                  key={opt.value}
                  className={`program-calendar-left__filter-item ${businessAreaColorClasses[opt.value] ?? ''}`}
                  checked={calendarBusinessAreaKeys.includes(opt.value)}
                  onChange={e => handleBusinessAreaChange(opt.value, e.target.checked)}
                >
                  {opt.label}
                </Checkbox>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 중앙: 메인 캘린더 */}
      <div className="program-calendar-main" ref={mainCalendarRef}>
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
      <div
        className="program-calendar-right"
        style={sidebarHeight ? { height: sidebarHeight } : undefined}
      >
        <ProgramScheduleList
          selectedDate={selectedDate}
          programs={filteredByCalendar}
          onProgramClick={onProgramClick}
        />
      </div>
    </div>
  )
}
