/**
 * 공통 프로그램 메인 캘린더 (중앙 컬럼)
 * - kind `program`: 월간·주간 Popover (applicant는 Tooltip 유지)
 * - kind `applicant`: 신청자 캘린더 (기존 applicant-calendar-view 마크업·CSS 클래스)
 */

import {
  forwardRef,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react'
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
import { AppButton } from './app-button'
import './overlay-popover.css'
import './program-calendar.css'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

export type ProgramCalendarMonthHeaderVariant = 'default' | 'applicantSpaced'

export type ProgramScheduleOverlayWrapArgs = {
  view: 'month' | 'week'
  date: Dayjs
  programs: Program[]
  /** 호버 시 미리보기 내용 (기본 Popover content) */
  previewContent: ReactNode
  /** 셀 내부 트리거(날짜+이벤트 칩) */
  trigger: ReactElement
}

type ProgramCalendarSharedProps = {
  selectedDate: Dayjs
  currentMonth: Dayjs
  mode: 'month' | 'week'
  onSelectDate: (date: Dayjs) => void
  onMonthChange: (month: Dayjs) => void
  onModeChange: (mode: 'month' | 'week') => void
  className?: string
  /** 우측 월간/주간 전환 UI */
  headerModeSwitcher?: 'segmented' | 'applicantPill'
  /** 월간 헤더 제목: `applicantSpaced` → `YYYY. MM` */
  monthHeaderTitleVariant?: ProgramCalendarMonthHeaderVariant
  /** 기본: 오늘 선택 + `onMonthChange(startOf('month'))` */
  onTodayClick?: () => void
}

export type ProgramCalendarProgramProps = ProgramCalendarSharedProps & {
  kind?: 'program'
  programs: Program[]
  onProgramClick: (program: Program) => void
  /**
   * program 모드에서만 사용. 미지정 시 월간·주간 모두 Popover.
   * 전체 래퍼를 바꿀 때 `previewContent`·`trigger`를 조합해 반환.
   */
  wrapProgramScheduleOverlay?: (args: ProgramScheduleOverlayWrapArgs) => ReactNode
}

export type ProgramCalendarApplicantProps = ProgramCalendarSharedProps & {
  kind: 'applicant'
  events: Array<{
    id: string | number
    title?: string
    startDate: string
    endDate: string
    originalItem?: unknown
  }>
  selectedRowKeys?: React.Key[]
}

export type ProgramCalendarProps = ProgramCalendarProgramProps | ProgramCalendarApplicantProps

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

function getApplicantEventsForDate(
  events: ProgramCalendarApplicantProps['events'],
  date: Dayjs
): ProgramCalendarApplicantProps['events'] {
  return events.filter(event => {
    const start = dayjs(event.startDate)
    const end = dayjs(event.endDate)
    return date.isSameOrAfter(start, 'day') && date.isSameOrBefore(end, 'day')
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

/** 커서 기준 오른쪽·아래 방향(앵커 topLeft, 패널이 남동쪽으로 펼침)으로 띄우기 */
const PROGRAM_SCHEDULE_POPOVER_CURSOR_OFFSET = 10

function ProgramScheduleCellCursorPopover({
  previewContent,
  trigger,
}: {
  previewContent: ReactNode
  trigger: ReactElement
}) {
  const popRef = useRef<React.ComponentRef<typeof Popover>>(null)
  const anchorRef = useRef<HTMLSpanElement>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const alignRafRef = useRef<number | undefined>(undefined)
  const lastPointerRef = useRef({ x: 0, y: 0 })
  const [open, setOpen] = useState(false)
  const overlayAnchorClass = `program-cal-cursor-pop-${useId().replace(/:/g, '')}`

  const cancelScheduledClose = () => {
    if (closeTimerRef.current !== undefined) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = undefined
    }
  }

  const scheduleClose = () => {
    cancelScheduledClose()
    closeTimerRef.current = setTimeout(() => setOpen(false), 180)
  }

  const applyAnchorPosition = (clientX: number, clientY: number) => {
    const el = anchorRef.current
    if (!el) return
    el.style.left = `${clientX + PROGRAM_SCHEDULE_POPOVER_CURSOR_OFFSET}px`
    el.style.top = `${clientY + PROGRAM_SCHEDULE_POPOVER_CURSOR_OFFSET}px`
    popRef.current?.forceAlign()
  }

  const queueAlignFromPointer = (clientX: number, clientY: number) => {
    if (alignRafRef.current !== undefined) cancelAnimationFrame(alignRafRef.current)
    alignRafRef.current = requestAnimationFrame(() => {
      alignRafRef.current = undefined
      applyAnchorPosition(clientX, clientY)
    })
  }

  useLayoutEffect(() => {
    if (!open) return
    const { x, y } = lastPointerRef.current
    applyAnchorPosition(x, y)
  }, [open])

  useEffect(() => {
    return () => {
      cancelScheduledClose()
      if (alignRafRef.current !== undefined) cancelAnimationFrame(alignRafRef.current)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const inner = document.querySelector<HTMLElement>(
      `.${overlayAnchorClass} .ant-popover-inner`
    )
    if (!inner) return
    const onInnerEnter = () => cancelScheduledClose()
    const onInnerLeave = () => scheduleClose()
    inner.addEventListener('mouseenter', onInnerEnter)
    inner.addEventListener('mouseleave', onInnerLeave)
    return () => {
      inner.removeEventListener('mouseenter', onInnerEnter)
      inner.removeEventListener('mouseleave', onInnerLeave)
    }
  }, [open, overlayAnchorClass])

  return (
    <div
      onMouseEnter={e => {
        cancelScheduledClose()
        lastPointerRef.current = { x: e.clientX, y: e.clientY }
        applyAnchorPosition(e.clientX, e.clientY)
        setOpen(true)
      }}
      onMouseLeave={scheduleClose}
      onMouseMove={e => {
        lastPointerRef.current = { x: e.clientX, y: e.clientY }
        if (open) queueAlignFromPointer(e.clientX, e.clientY)
      }}
    >
      {trigger}
      <Popover
        ref={popRef}
        open={open}
        onOpenChange={vis => {
          if (!vis) {
            cancelScheduledClose()
            setOpen(false)
          }
        }}
        trigger={[]}
        arrow={false}
        overlayClassName={`app-popover-panel program-calendar-cell-preview-popover ${overlayAnchorClass}`}
        placement="topLeft"
        mouseEnterDelay={0}
        mouseLeaveDelay={0.08}
        getPopupContainer={() => document.body}
        content={previewContent}
      >
        <span
          ref={anchorRef}
          aria-hidden
          className="program-calendar-popover-cursor-anchor"
        />
      </Popover>
    </div>
  )
}

function defaultWrapProgramOverlay(args: ProgramScheduleOverlayWrapArgs): ReactNode {
  const { previewContent, trigger } = args
  return (
    <ProgramScheduleCellCursorPopover previewContent={previewContent} trigger={trigger} />
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
      headerModeSwitcher = 'segmented',
      monthHeaderTitleVariant = 'default',
      onTodayClick,
    } = props

    const isApplicant = props.kind === 'applicant'
    const programs = !isApplicant ? props.programs : []
    const onProgramClick = !isApplicant ? props.onProgramClick : () => {}
    const wrapProgramScheduleOverlay = !isApplicant ? props.wrapProgramScheduleOverlay : undefined

    const applicantEvents = isApplicant ? props.events : []
    const selectedRowKeys = isApplicant ? (props.selectedRowKeys ?? []) : []
    const { buildResolvedColorMap } = useApplicantCalendarColorMaps(applicantEvents)

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
        : monthHeaderTitleVariant === 'applicantSpaced'
          ? currentMonth.format('YYYY. MM')
          : currentMonth.format('YYYY.MM')

    const wrapProgramCell = (
      view: 'month' | 'week',
      date: Dayjs,
      dayPrograms: Program[],
      cellTrigger: ReactElement
    ): ReactNode => {
      const preview = (
        <CalendarCellSchedulePreview
          date={date}
          programs={dayPrograms}
          onProgramClick={onProgramClick}
        />
      )
      const args: ProgramScheduleOverlayWrapArgs = {
        view,
        date,
        programs: dayPrograms,
        previewContent: preview,
        trigger: cellTrigger,
      }
      if (wrapProgramScheduleOverlay) {
        return wrapProgramScheduleOverlay(args)
      }
      return defaultWrapProgramOverlay(args)
    }

    const dateFullCellRenderProgram = (date: Dayjs) => {
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
                  외 {dayPrograms.length - 2}개의 항목
                </div>
              )}
            </div>
          )}
        </div>
      )

      if (!hasPrograms) {
        return cellEl
      }

      const trigger = <div className="program-calendar-cell-tooltip-trigger">{cellEl}</div>
      return wrapProgramCell('month', date, dayPrograms, trigger)
    }

    const dateFullCellRenderApplicant = (date: Dayjs) => {
      const isCurrentMonth = date.isSame(currentMonth, 'month')
      const isSelected = date.isSame(selectedDate, 'day')
      const dayEvents = getApplicantEventsForDate(applicantEvents, date)
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
                const displayTitle = String(event.title ?? '').replace(/^\[.*?\]\s*/, '')
                const isEventSelected = selectedRowKeys.includes(event.id)
                const colors = resolvedColors.get(event.id) ?? SCHEDULE_COLORS[0]
                return (
                  <div
                    key={String(event.id)}
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
                  외 {dayEvents.length - 2}개의 항목
                </div>
              )}
            </div>
          )}
        </>
      )

      return (
        <div
          className={`applicant-calendar-cell ${!isCurrentMonth ? 'applicant-calendar-cell--other-month' : ''} ${isSelected ? 'applicant-calendar-cell--selected' : ''}`}
          onClick={() => onSelectDate(date)}
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

    const renderWeekViewProgram = () => {
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
              const dayPrograms = getProgramsForDate(programs, date)
              const hasPrograms = dayPrograms.length > 0
              const scheduleColorMap = buildResolvedScheduleColorMapForPrograms(dayPrograms)

              const weekCellInner = (
                <>
                  <div className="program-calendar-week-cell-date">{date.date()}</div>
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
                          외 {dayPrograms.length - 2}개의 항목
                        </div>
                      )}
                    </div>
                  )}
                </>
              )

              const cell = (
                <div
                  key={date.format('YYYY-MM-DD')}
                  className={`program-calendar-week-cell ${isSelected ? 'program-calendar-week-cell--selected' : ''}`}
                  onClick={() => onSelectDate(date)}
                >
                  {hasPrograms
                    ? wrapProgramCell(
                        'week',
                        date,
                        dayPrograms,
                        <div className="program-calendar-week-cell-tooltip-trigger">
                          {weekCellInner}
                        </div>
                      )
                    : weekCellInner}
                </div>
              )

              return cell
            })}
          </div>
        </div>
      )
    }

    const renderWeekViewApplicant = () => {
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
              const dayEvents = getApplicantEventsForDate(applicantEvents, d)
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
                        const displayTitle = String(event.title ?? '').replace(/^\[.*?\]\s*/, '')
                        const colors = resolvedWeekColors.get(event.id) ?? SCHEDULE_COLORS[0]
                        return (
                          <div
                            key={String(event.id)}
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
                          외 {dayEvents.length - 2}개의 항목
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
                  onClick={() => onSelectDate(d)}
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
                      <div className="applicant-calendar-week-cell-tooltip-trigger">
                        {weekCellBody}
                      </div>
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

    const renderHeaderRight = () => {
      if (headerModeSwitcher === 'applicantPill') {
        return (
          <div className="applicant-calendar-view-mode">
            <div
              className={`applicant-calendar-view-mode__indicator ${mode === 'week' ? 'applicant-calendar-view-mode__indicator--week' : ''}`}
              aria-hidden
            />
            <button
              type="button"
              className={`applicant-calendar-view-mode__tab ${mode === 'month' ? 'applicant-calendar-view-mode__tab--active' : ''}`}
              onClick={() => {
                onModeChange('month')
                onMonthChange(selectedDate.startOf('month'))
              }}
            >
              <span className="applicant-calendar-view-mode__tab-text">월간</span>
            </button>
            <button
              type="button"
              className={`applicant-calendar-view-mode__tab ${mode === 'week' ? 'applicant-calendar-view-mode__tab--active' : ''}`}
              onClick={() => {
                onModeChange('week')
                onMonthChange(selectedDate.startOf('week'))
              }}
            >
              <span className="applicant-calendar-view-mode__tab-text">주간</span>
            </button>
          </div>
        )
      }
      return (
        <SegmentedTab
          size="medium"
          value={mode}
          onChange={value => onModeChange(value as 'month' | 'week')}
          options={[
            { label: '월간', value: 'month' },
            { label: '주간', value: 'week' },
          ]}
        />
      )
    }

    const todayButton =
      headerModeSwitcher === 'applicantPill' ? (
        <AppButton size="small" className="applicant-calendar-today-btn" onClick={handleToday}>
          오늘
        </AppButton>
      ) : (
        <Button size="small" className="program-calendar-today-btn" onClick={handleToday}>
          오늘
        </Button>
      )

    const headerLeftClass =
      headerModeSwitcher === 'applicantPill'
        ? 'applicant-calendar-header-left'
        : 'program-calendar-header-left'
    const headerTitleClass =
      headerModeSwitcher === 'applicantPill'
        ? 'applicant-calendar-header-title'
        : 'program-calendar-header-title'
    const navBtnClass =
      headerModeSwitcher === 'applicantPill'
        ? 'applicant-calendar-nav-btn'
        : 'program-calendar-nav-btn'
    const navWrapClass =
      headerModeSwitcher === 'applicantPill' ? 'applicant-calendar-nav' : 'program-calendar-nav'

    return (
      <div ref={ref} className={['program-calendar-main', className].filter(Boolean).join(' ')}>
        <div
          className={
            headerModeSwitcher === 'applicantPill'
              ? 'applicant-calendar-header'
              : 'program-calendar-header'
          }
        >
          <div className={headerLeftClass}>
            <span className={headerTitleClass}>{headerTitle}</span>
            {todayButton}
            <div className={navWrapClass}>
              <Button
                type="text"
                size="small"
                icon={<LeftOutlined />}
                className={navBtnClass}
                onClick={handlePrev}
              />
              <Button
                type="text"
                size="small"
                icon={<RightOutlined />}
                className={navBtnClass}
                onClick={handleNext}
              />
            </div>
          </div>
          <div
            className={
              headerModeSwitcher === 'applicantPill'
                ? 'applicant-calendar-header-right'
                : 'program-calendar-header-right'
            }
          >
            {renderHeaderRight()}
          </div>
        </div>
        {mode === 'week' ? (
          isApplicant ? (
            renderWeekViewApplicant()
          ) : (
            renderWeekViewProgram()
          )
        ) : (
          <Calendar
            value={currentMonth}
            fullCellRender={isApplicant ? dateFullCellRenderApplicant : dateFullCellRenderProgram}
            headerRender={() => null}
          />
        )}
      </div>
    )
  }
)

ProgramCalendar.displayName = 'ProgramCalendar'
