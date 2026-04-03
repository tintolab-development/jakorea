/**
 * 공통 프로그램 메인 캘린더 (중앙 컬럼)
 * - 마크업·클래스는 `program-calendar-*` 단일 체계
 * - `scheduleOverlay`로 Popover(프로그램 일정) vs Tooltip(신청자 일정)만 분기
 */

import { forwardRef, Fragment, useMemo, type ReactElement, type ReactNode } from 'react'
import { Calendar, Button, Popover, Tooltip } from 'antd'
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
import {
  ApplicantCalendarEventPopoverContent,
  useApplicantCalendarColorMaps,
} from '@/features/program/ui/detail-modal/applicants/applicant-calendar-schedule-helpers'
import { SegmentedTab } from './segmented-tab'
import './overlay-popover.css'
import './program-calendar.css'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

export type ProgramCalendarEventItem = {
  id: string | number
  title?: string
  startDate: string
  endDate: string
  originalItem?: unknown
}

type ProgramCalendarSharedProps = {
  selectedDate: Dayjs
  currentMonth: Dayjs
  mode: 'month' | 'week'
  onSelectDate: (date: Dayjs) => void
  onMonthChange: (month: Dayjs) => void
  onModeChange: (mode: 'month' | 'week') => void
  className?: string
  /** 기본: 오늘 선택 + `onMonthChange(startOf('month'))` */
  onTodayClick?: () => void
  /**
   * 일정 호버 오버레이. 미지정 시 `programs` → popover, `events` → tooltip
   */
  scheduleOverlay?: 'popover' | 'tooltip'
  /** Tooltip일 때 `program-calendar-tooltip-overlay`에 추가하는 클래스 */
  tooltipOverlayClassName?: string
}

export type ProgramCalendarProgramProps = ProgramCalendarSharedProps & {
  programs: Program[]
  onProgramClick: (program: Program) => void
  events?: undefined
  selectedRowKeys?: undefined
}

export type ProgramCalendarEventsProps = ProgramCalendarSharedProps & {
  events: ProgramCalendarEventItem[]
  selectedRowKeys?: React.Key[]
  renderEventsTooltipContent?: (args: {
    events: ProgramCalendarEventItem[]
    colorMap: ReturnType<ReturnType<typeof useApplicantCalendarColorMaps>['buildResolvedColorMap']>
  }) => ReactNode
  programs?: undefined
  onProgramClick?: undefined
}

export type ProgramCalendarProps = ProgramCalendarProgramProps | ProgramCalendarEventsProps

function isEventsProps(p: ProgramCalendarProps): p is ProgramCalendarEventsProps {
  return 'events' in p && Array.isArray(p.events)
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

function getEventsForDate(
  events: ProgramCalendarEventItem[],
  date: Dayjs
): ProgramCalendarEventItem[] {
  return events.filter(event => {
    const start = dayjs(event.startDate)
    const end = dayjs(event.endDate)
    return date.isSameOrAfter(start, 'day') && date.isSameOrBefore(end, 'day')
  })
}

function CalendarCellSchedulePreview({ date, programs }: { date: Dayjs; programs: Program[] }) {
  const scheduleColorMap = buildResolvedScheduleColorMapForPrograms(programs)

  return (
    <div className="program-calendar-cell-preview">
      {programs.map(program => {
        const { statusLabel, time } = getProgramDayScheduleLine(program, date)
        const title = program.title ?? ''
        const colorPair = scheduleColorMap.get(String(program.id)) ?? SCHEDULE_COLORS[0]
        return (
          <button key={program.id} type="button" className="program-calendar-cell-preview__item">
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

function wrapScheduleOverlay(
  scheduleOverlay: 'popover' | 'tooltip',
  tooltipOverlayClassName: string | undefined,
  previewContent: ReactNode,
  trigger: ReactElement
): ReactNode {
  if (scheduleOverlay === 'popover') {
    return (
      <Popover
        arrow={false}
        overlayClassName="app-popover-panel program-calendar-cell-preview-popover"
        trigger="hover"
        placement="bottomLeft"
        mouseEnterDelay={0.12}
        mouseLeaveDelay={0.08}
        getPopupContainer={() => document.body}
        content={previewContent}
      >
        {trigger}
      </Popover>
    )
  }
  const overlayClass = ['program-calendar-tooltip-overlay', tooltipOverlayClassName]
    .filter(Boolean)
    .join(' ')
  return (
    <Tooltip
      arrow={false}
      overlayClassName={overlayClass}
      title={previewContent}
      placement="bottomLeft"
      mouseEnterDelay={0.15}
      destroyTooltipOnHide
    >
      {trigger}
    </Tooltip>
  )
}

export const ProgramCalendar = forwardRef<HTMLDivElement, ProgramCalendarProps>(
  function ProgramCalendarInner(props, ref) {
    const {
      selectedDate,
      currentMonth,
      mode,
      onSelectDate,
      onMonthChange,
      onModeChange,
      className,
      onTodayClick,
      scheduleOverlay: scheduleOverlayProp,
      tooltipOverlayClassName,
    } = props

    const isEvents = isEventsProps(props)
    const programs = isEvents ? [] : props.programs
    const events = isEvents ? props.events : []
    const selectedRowKeys = isEvents ? (props.selectedRowKeys ?? []) : []
    const renderEventsTooltipContent = isEvents ? props.renderEventsTooltipContent : undefined

    const scheduleOverlay: 'popover' | 'tooltip' =
      scheduleOverlayProp ?? (isEvents ? 'tooltip' : 'popover')

    const { buildResolvedColorMap } = useApplicantCalendarColorMaps(events)

    const weekDates = useMemo(() => {
      const startOfWeek = currentMonth.startOf('week')
      return Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'))
    }, [currentMonth])

    const handleToday = () => {
      if (onTodayClick) {
        onTodayClick()
        return
      }
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
        ? `${weekDates[0].format('MM.DD')} ~ ${weekDates[6].format('MM.DD')}`
        : currentMonth.format('YYYY.MM')

    const buildProgramPreview = (date: Dayjs, dayPrograms: Program[]) => (
      <CalendarCellSchedulePreview date={date} programs={dayPrograms} />
    )

    const buildEventsPreview = (
      dayEvents: ProgramCalendarEventItem[],
      colorMap: ReturnType<typeof buildResolvedColorMap>
    ) =>
      renderEventsTooltipContent ? (
        renderEventsTooltipContent({ events: dayEvents, colorMap })
      ) : (
        <ApplicantCalendarEventPopoverContent events={dayEvents} colorMap={colorMap} />
      )

    const dateFullCellRender = (date: Dayjs) => {
      const isCurrentMonth = date.isSame(currentMonth, 'month')
      const isSelected = date.isSame(selectedDate, 'day')

      const cellClass = [
        'program-calendar-cell',
        !isCurrentMonth ? 'program-calendar-cell--other-month' : '',
        isSelected ? 'program-calendar-cell--selected' : '',
      ]
        .filter(Boolean)
        .join(' ')

      if (isEvents) {
        const dayEvents = getEventsForDate(events, date)
        const hasItems = dayEvents.length > 0
        const resolvedColors = buildResolvedColorMap(dayEvents)

        const cellBody = (
          <div className={cellClass} onClick={() => onSelectDate(date)}>
            <div className="program-calendar-cell-date">{date.date()}</div>
            {hasItems && (
              <div className="program-calendar-cell-events">
                {dayEvents.slice(0, 2).map(event => {
                  const displayTitle = String(event.title ?? '').replace(/^\[.*?\]\s*/, '')
                  const isEventSelected = selectedRowKeys.includes(event.id)
                  const colors = resolvedColors.get(event.id) ?? SCHEDULE_COLORS[0]
                  const previewOne = buildEventsPreview([event], resolvedColors)
                  return (
                    <Fragment key={String(event.id)}>
                      {wrapScheduleOverlay(
                        scheduleOverlay,
                        tooltipOverlayClassName,
                        previewOne,
                        <div className="program-calendar-event-tooltip-trigger">
                          <div
                            className={`program-calendar-event ${isEventSelected ? 'program-calendar-event--selected' : ''}`}
                            style={{
                              backgroundColor: colors.bg,
                            }}
                            onClick={e => e.stopPropagation()}
                          >
                            <span className="program-calendar-event-title">{displayTitle}</span>
                          </div>
                        </div>
                      )}
                    </Fragment>
                  )
                })}
                {dayEvents.length > 2 && (
                  <Fragment key="more">
                    {wrapScheduleOverlay(
                      scheduleOverlay,
                      tooltipOverlayClassName,
                      buildEventsPreview(dayEvents.slice(2), resolvedColors),
                      <div className="program-calendar-event-tooltip-trigger program-calendar-event-more">
                        외 {dayEvents.length - 2}개의 일정
                      </div>
                    )}
                  </Fragment>
                )}
              </div>
            )}
          </div>
        )

        return cellBody
      }

      const dayPrograms = getProgramsForDate(programs, date)
      const hasPrograms = dayPrograms.length > 0
      const scheduleColorMap = buildResolvedScheduleColorMapForPrograms(dayPrograms)
      const preview = buildProgramPreview(date, dayPrograms)

      const cellBody = (
        <div className={cellClass} onClick={() => onSelectDate(date)}>
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

      if (!hasPrograms) return cellBody
      const trigger = <div className="program-calendar-cell-tooltip-trigger">{cellBody}</div>
      return wrapScheduleOverlay(scheduleOverlay, tooltipOverlayClassName, preview, trigger)
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
              const isSelected = date.isSame(selectedDate, 'day')

              if (isEvents) {
                const dayEvents = getEventsForDate(events, date)
                const hasItems = dayEvents.length > 0
                const resolvedWeekColors = buildResolvedColorMap(dayEvents)

                const weekCellInner = (
                  <>
                    <div
                      className={`program-calendar-week-cell-date ${isSelected ? 'program-calendar-week-cell-date--selected' : ''}`}
                    >
                      {date.date()}
                    </div>
                    {hasItems && (
                      <div className="program-calendar-week-cell-events">
                        {dayEvents.slice(0, 2).map(event => {
                          const displayTitle = String(event.title ?? '').replace(/^\[.*?\]\s*/, '')
                          const isEventSelected = selectedRowKeys.includes(event.id)
                          const colors = resolvedWeekColors.get(event.id) ?? SCHEDULE_COLORS[0]
                          const previewOne = buildEventsPreview([event], resolvedWeekColors)
                          return (
                            <Fragment key={String(event.id)}>
                              {wrapScheduleOverlay(
                                scheduleOverlay,
                                tooltipOverlayClassName,
                                previewOne,
                                <div className="program-calendar-event-tooltip-trigger">
                                  <div
                                    className={`program-calendar-event ${isEventSelected ? 'program-calendar-event--selected' : ''}`}
                                    style={{
                                      backgroundColor: colors.bg,
                                      border: isEventSelected ? 'none' : `1px solid ${colors.border}`,
                                    }}
                                    onClick={e => e.stopPropagation()}
                                  >
                                    <span className="program-calendar-event-title">{displayTitle}</span>
                                  </div>
                                </div>
                              )}
                            </Fragment>
                          )
                        })}
                        {dayEvents.length > 2 && (
                          <Fragment key="more">
                            {wrapScheduleOverlay(
                              scheduleOverlay,
                              tooltipOverlayClassName,
                              buildEventsPreview(dayEvents.slice(2), resolvedWeekColors),
                              <div className="program-calendar-event-tooltip-trigger program-calendar-event-more">
                                외 {dayEvents.length - 2}개의 일정
                              </div>
                            )}
                          </Fragment>
                        )}
                      </div>
                    )}
                  </>
                )

                return (
                  <div
                    key={date.format('YYYY-MM-DD')}
                    className={`program-calendar-week-cell ${isSelected ? 'program-calendar-week-cell--selected' : ''}`}
                    onClick={() => onSelectDate(date)}
                  >
                    {weekCellInner}
                  </div>
                )
              }

              const dayPrograms = getProgramsForDate(programs, date)
              const hasPrograms = dayPrograms.length > 0
              const scheduleColorMap = buildResolvedScheduleColorMapForPrograms(dayPrograms)
              const preview = buildProgramPreview(date, dayPrograms)

              const weekCellInner = (
                <>
                  <div
                    className={`program-calendar-week-cell-date ${isSelected ? 'program-calendar-week-cell-date--selected' : ''}`}
                  >
                    {date.date()}
                  </div>
                  {hasPrograms && (
                    <div className="program-calendar-week-cell-events">
                      {dayPrograms.slice(0, 2).map(program => {
                        const colorPair =
                          scheduleColorMap.get(String(program.id)) ?? SCHEDULE_COLORS[0]
                        return (
                          <div
                            key={program.id}
                            className="program-calendar-event"
                            style={{
                              backgroundColor: colorPair.bg,
                            }}
                            onClick={e => e.stopPropagation()}
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
                </>
              )

              return (
                <div
                  key={date.format('YYYY-MM-DD')}
                  className={`program-calendar-week-cell ${isSelected ? 'program-calendar-week-cell--selected' : ''}`}
                  onClick={() => onSelectDate(date)}
                >
                  {hasPrograms
                    ? wrapScheduleOverlay(
                        scheduleOverlay,
                        tooltipOverlayClassName,
                        preview,
                        <div className="program-calendar-week-cell-tooltip-trigger">
                          {weekCellInner}
                        </div>
                      )
                    : weekCellInner}
                </div>
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
