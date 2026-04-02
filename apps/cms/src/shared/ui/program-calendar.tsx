/**
 * 공통 프로그램 메인 캘린더 (중앙 컬럼)
 * 월간 Ant Design Calendar · 주간 그리드 · 셀 Popover
 */

import { forwardRef, useMemo, Fragment } from 'react'
import { Calendar, Button, Popover } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import type { Program } from '@/types/domain'
import { getProgramDayScheduleLine } from '@/entities/program/lib/program-day-schedule-line'
import {
  SCHEDULE_COLORS,
  buildResolvedScheduleColorMapForPrograms,
} from '@/features/program/ui/program-schedule-colors'
import { SegmentedTab } from './segmented-tab'
import './program-calendar.css'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

export interface ProgramCalendarProps {
  programs: Program[]
  selectedDate: Dayjs
  currentMonth: Dayjs
  mode: 'month' | 'week'
  onSelectDate: (date: Dayjs) => void
  onMonthChange: (month: Dayjs) => void
  onModeChange: (mode: 'month' | 'week') => void
  onProgramClick: (program: Program) => void
  className?: string
}

type SpanRole = 'start' | 'middle' | 'end' | 'single'

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

function getProgramsForDate(programs: Program[], date: Dayjs): Program[] {
  return programs.filter(program => {
    const start = dayjs(program.startDate)
    const end = dayjs(program.endDate)
    const isInEducationPeriod = date.isSameOrAfter(start, 'day') && date.isSameOrBefore(end, 'day')

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
            onClick={() => onProgramClick(program)}
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

export const ProgramCalendar = forwardRef<HTMLDivElement, ProgramCalendarProps>(
  function ProgramCalendarInner(
    {
      programs,
      selectedDate,
      currentMonth,
      mode,
      onSelectDate,
      onMonthChange,
      onModeChange,
      onProgramClick,
      className,
    },
    ref
  ) {
    const weekDates = useMemo(() => {
      const startOfWeek = currentMonth.startOf('week')
      return Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'))
    }, [currentMonth])

    const handleToday = () => {
      const today = dayjs()
      onSelectDate(today)
      onMonthChange(today.startOf('month'))
    }

    const handlePrev = () => {
      if (mode === 'week') {
        onMonthChange(currentMonth.subtract(1, 'week'))
      } else {
        onMonthChange(currentMonth.subtract(1, 'month'))
      }
    }

    const handleNext = () => {
      if (mode === 'week') {
        onMonthChange(currentMonth.add(1, 'week'))
      } else {
        onMonthChange(currentMonth.add(1, 'month'))
      }
    }

    const headerTitle =
      mode === 'week'
        ? `${weekDates[0].format('YYYY.MM')} ${weekDates[0].format('D')} - ${weekDates[6].format('D')}`
        : currentMonth.format('YYYY.MM')

    const dateFullCellRender = (date: Dayjs) => {
      const isCurrentMonth = date.isSame(currentMonth, 'month')
      const isToday = date.isSame(dayjs(), 'day')
      const isSelected = date.isSame(selectedDate, 'day')
      const dayPrograms = getProgramsForDate(programs, date)
      const hasPrograms = dayPrograms.length > 0
      const scheduleColorMap = buildResolvedScheduleColorMapForPrograms(dayPrograms)

      const cellEl = (
        <div
          className={`program-calendar-cell ${!isCurrentMonth ? 'program-calendar-cell--other-month' : ''} ${isSelected ? 'program-calendar-cell--selected' : ''} ${isToday ? 'program-calendar-cell--today' : ''}`}
          onClick={() => onSelectDate(date)}
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

    const renderWeekView = () => {
      const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

      return (
        <div className="program-calendar-week">
          <div className="program-calendar-week-header">
            {weekdayNames.map(day => (
              <div key={day} className="program-calendar-week-header-cell">
                {day}
              </div>
            ))}
          </div>
          <div className="program-calendar-week-body">
            {weekDates.map(date => {
              const isToday = date.isSame(dayjs(), 'day')
              const isSelected = date.isSame(selectedDate, 'day')
              const dayPrograms = getProgramsForDate(programs, date)
              const hasPrograms = dayPrograms.length > 0
              const scheduleColorMap = buildResolvedScheduleColorMapForPrograms(dayPrograms)

              const weekCellEl = (
                <div
                  className={`program-calendar-week-cell ${isSelected ? 'program-calendar-week-cell--selected' : ''} ${isToday ? 'program-calendar-week-cell--today' : ''}`}
                  onClick={() => onSelectDate(date)}
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

    return (
      <div ref={ref} className={['program-calendar-main', className].filter(Boolean).join(' ')}>
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
              value={mode}
              onChange={value => onModeChange(value as 'month' | 'week')}
              options={[
                { label: '월간', value: 'month' },
                { label: '주간', value: 'week' },
              ]}
            />
          </div>
        </div>
        {mode === 'week' ? (
          renderWeekView()
        ) : (
          <Calendar
            value={currentMonth}
            fullCellRender={dateFullCellRender}
            headerRender={() => null}
          />
        )}
      </div>
    )
  }
)

ProgramCalendar.displayName = 'ProgramCalendar'
