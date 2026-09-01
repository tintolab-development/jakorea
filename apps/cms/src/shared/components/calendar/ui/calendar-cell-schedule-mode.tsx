import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import type { Program } from '@/types/domain'
import { SCHEDULE_COLORS } from '@/features/program/shared/ui/program-schedule-colors'
import {
  calendarItemForScheduleSource,
  getItemsForDate,
  resolveItemColor,
  uniqueScheduleSourcesForDay,
} from '../lib/calendar-helpers'
import { CalendarItemList, withOverlay } from './calendar-cell-commons'
import type { CalendarCellProps } from './calendar-cell-types'

type SpanRole = 'start' | 'middle' | 'end' | 'single'

function getScheduleSpanRole(entity: Program, date: Dayjs): SpanRole {
  const start = dayjs(entity.startDate)
  const end = dayjs(entity.endDate)
  const isInEducation = date.isSameOrAfter(start, 'day') && date.isSameOrBefore(end, 'day')
  let rangeStart: Dayjs
  let rangeEnd: Dayjs

  if (entity.applicationStartDate && entity.applicationEndDate) {
    const appStart = dayjs(entity.applicationStartDate)
    const appEnd = dayjs(entity.applicationEndDate)
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

export function CalendarCellScheduleMode(props: CalendarCellProps) {
  const {
    date,
    items,
    selectedDate,
    currentMonth,
    mode,
    selectedKeys,
    colorMap,
    onSelectDate,
    overlayEnabled,
    overlayContent,
    tooltipOverlayClassName,
  } = props

  const overlayProps = { tooltipOverlayClassName }

  const dayScheduleSources = uniqueScheduleSourcesForDay(getItemsForDate(items, date))
  const hasScheduleItems = dayScheduleSources.length > 0

  if (mode === 'month') {
    const isCurrentMonth = date.isSame(currentMonth, 'month')
    const isSelected = date.isSame(selectedDate, 'day')
    const isToday = date.isSame(dayjs(), 'day')

    const cellClass = [
      'calendar-cell',
      !isCurrentMonth ? 'calendar-cell--other-month' : '',
      isSelected ? 'calendar-cell--selected' : '',
      isToday ? 'calendar-cell--today' : '',
    ]
      .filter(Boolean)
      .join(' ')

    const cellBody = (
      <div className={cellClass} onClick={() => onSelectDate(date)}>
        <div className="calendar-cell-date">{date.date()}</div>
        {hasScheduleItems && (
          <div className="calendar-cell-events">
            {dayScheduleSources.slice(0, 2).map(entity => {
              const spanRole = getScheduleSpanRole(entity, date)
              const colorPair = resolveItemColor(
                calendarItemForScheduleSource(entity),
                colorMap,
                SCHEDULE_COLORS[0]
              )
              return (
                <div
                  key={entity.id}
                  className={`calendar-event calendar-event--span-${spanRole}`}
                  style={{ backgroundColor: colorPair.bg, border: `1px solid ${colorPair.border}` }}
                >
                  <span className="calendar-event-title">{entity.title}</span>
                </div>
              )
            })}
            {dayScheduleSources.length > 2 && (
              <div className="calendar-event-more">외 {dayScheduleSources.length - 2}개의 항목</div>
            )}
          </div>
        )}
      </div>
    )

    return withOverlay(
      hasScheduleItems ? <div className="calendar-cell-tooltip-trigger">{cellBody}</div> : cellBody,
      overlayEnabled,
      overlayContent,
      overlayProps
    )
  }

  const isSelected = date.isSame(selectedDate, 'day')

  const weekCellInner = (
    <>
      <div
        className={`calendar-week-cell-date ${isSelected ? 'calendar-week-cell-date--selected' : ''}`}
      >
        {date.date()}
      </div>
      {hasScheduleItems && (
        <div className="calendar-week-cell-events">
          <CalendarItemList
            items={dayScheduleSources.map(calendarItemForScheduleSource)}
            selectedKeys={selectedKeys}
            colorMap={colorMap}
            limit={2}
          />
        </div>
      )}
    </>
  )

  return (
    <div
      className={`calendar-week-cell ${isSelected ? 'calendar-week-cell--selected' : ''}`}
      onClick={() => onSelectDate(date)}
    >
      {withOverlay(
        hasScheduleItems ? (
          <div className="calendar-week-cell-tooltip-trigger">{weekCellInner}</div>
        ) : (
          weekCellInner
        ),
        overlayEnabled,
        overlayContent,
        overlayProps
      )}
    </div>
  )
}
