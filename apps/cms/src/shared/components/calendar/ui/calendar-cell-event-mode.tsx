import dayjs from 'dayjs'
import { SCHEDULE_COLORS } from '@/features/program/shared/ui/program-schedule-colors'
import { calendarItemsForEventMode, getItemsForDate, resolveItemColor } from '../lib/calendar-helpers'
import type { CalendarMonthCellRow } from '../model/calendar-month-cell-row'
import { defaultCalendarMonthEventTitle } from './calendar-month-event-title'
import { CalendarPreviewTooltip } from './preview-tooltip/calendar-preview-tooltip'
import type { CalendarCellEventModeProps } from './calendar-cell-types'

function defaultBuildMonthCellRows(
  dayEvents: ReturnType<typeof calendarItemsForEventMode>
): CalendarMonthCellRow[] {
  return dayEvents.map(event => ({
    id: event.id,
    sourceEvent: event,
  }))
}

function defaultRenderMonthEventContent({
  row,
  colors,
}: {
  row: CalendarMonthCellRow
  colors: { text: string }
}) {
  return defaultCalendarMonthEventTitle(String(row.sourceEvent.title ?? ''), colors.text)
}

function renderMonthEventStrips(
  dayEvents: ReturnType<typeof calendarItemsForEventMode>,
  config: CalendarCellEventModeProps['eventsConfig'],
  selectedKeys: CalendarCellEventModeProps['selectedKeys'],
  colorMap: CalendarCellEventModeProps['colorMap']
) {
  const buildRows = config.buildMonthCellRows ?? defaultBuildMonthCellRows
  const renderContent = config.renderMonthEventContent ?? defaultRenderMonthEventContent
  const rows = buildRows(dayEvents)

  return (
    <>
      {rows.slice(0, 2).map(row => {
        const isEventSelected = selectedKeys.includes(row.sourceEvent.id)
        const colors =
          config.resolveEventColors?.(row.sourceEvent) ??
          resolveItemColor(row.sourceEvent, colorMap, SCHEDULE_COLORS[0])
        return (
          <div key={String(row.id)}>
            <div
              className={`calendar-event ${isEventSelected ? 'calendar-event--selected' : ''}`}
              style={{
                backgroundColor: colors.bg,
                border: isEventSelected ? 'none' : `1px solid ${colors.border}`,
              }}
              onClick={e => e.stopPropagation()}
            >
              {renderContent({
                row,
                dayEvents,
                colors,
                isSelected: isEventSelected,
              })}
            </div>
          </div>
        )
      })}
      {rows.length > 2 && (
        <div className="calendar-event-more">
          {config.formatEventsOverflowText?.(rows.length - 2) ??
            `외 ${rows.length - 2}개의 항목`}
        </div>
      )}
    </>
  )
}

export function CalendarCellEventMode(props: CalendarCellEventModeProps) {
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
    eventsConfig: config,
  } = props

  const dayEvents = calendarItemsForEventMode(getItemsForDate(items, date))
  const hasItems = dayEvents.length > 0

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

    if (!hasItems) {
      return (
        <div className={cellClass} onClick={() => onSelectDate(date)}>
          <div className="calendar-cell-date">{date.date()}</div>
        </div>
      )
    }

    const eventStrips = renderMonthEventStrips(dayEvents, config, selectedKeys, colorMap)

    if (config.eventsTooltipTrigger === 'cell') {
      const cellInner = (
        <div className={cellClass} onClick={() => onSelectDate(date)}>
          <div className="calendar-cell-date">{date.date()}</div>
          <div className="calendar-cell-events">{eventStrips}</div>
        </div>
      )

      return (
        <CalendarPreviewTooltip
          enabled={overlayEnabled && overlayContent != null}
          content={overlayContent}
          tooltipOverlayClassName={tooltipOverlayClassName}
        >
          <div className="calendar-cell-tooltip-trigger calendar-cell-tooltip-trigger--full-cell">
            {cellInner}
          </div>
        </CalendarPreviewTooltip>
      )
    }

    return (
      <CalendarPreviewTooltip
        enabled={overlayEnabled && overlayContent != null}
        content={overlayContent}
        tooltipOverlayClassName={tooltipOverlayClassName}
      >
        <div className={cellClass} onClick={() => onSelectDate(date)}>
          <div className="calendar-cell-date">{date.date()}</div>
          <div className="calendar-cell-events">{eventStrips}</div>
        </div>
      </CalendarPreviewTooltip>
    )
  }

  const isSelected = date.isSame(selectedDate, 'day')

  if (!hasItems) {
    return (
      <div
        className={`calendar-week-cell ${isSelected ? 'calendar-week-cell--selected' : ''}`}
        onClick={() => onSelectDate(date)}
      >
        <div
          className={`calendar-week-cell-date ${isSelected ? 'calendar-week-cell-date--selected' : ''}`}
        >
          {date.date()}
        </div>
      </div>
    )
  }

  if (config.eventsTooltipTrigger === 'cell') {
    const weekCellInnerPlain = (
      <>
        <div
          className={`calendar-week-cell-date ${isSelected ? 'calendar-week-cell-date--selected' : ''}`}
        >
          {date.date()}
        </div>
        <div className="calendar-week-cell-events">
          {dayEvents.slice(0, 2).map(event => {
            const displayTitle = String(event.title ?? '').replace(/^\[.*?\]\s*/, '')
            const isEventSelected = selectedKeys.includes(event.id)
            const colors =
              config.resolveEventColors?.(event) ??
              resolveItemColor(event, colorMap, SCHEDULE_COLORS[0])
            return (
              <div key={String(event.id)}>
                <div
                  className={`calendar-event ${isEventSelected ? 'calendar-event--selected' : ''}`}
                  style={{
                    backgroundColor: colors.bg,
                    border: isEventSelected ? 'none' : `1px solid ${colors.border}`,
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <span className="calendar-event-title" style={{ color: colors.text }}>
                    {displayTitle}
                  </span>
                </div>
              </div>
            )
          })}
          {dayEvents.length > 2 && (
            <div className="calendar-event-more">
              {config.formatEventsOverflowText?.(dayEvents.length - 2) ??
                `외 ${dayEvents.length - 2}개의 항목`}
            </div>
          )}
        </div>
      </>
    )

    return (
      <div
        className={`calendar-week-cell ${isSelected ? 'calendar-week-cell--selected' : ''}`}
        onClick={() => onSelectDate(date)}
      >
        <CalendarPreviewTooltip
          enabled={overlayEnabled && overlayContent != null}
          content={overlayContent}
          tooltipOverlayClassName={tooltipOverlayClassName}
        >
          <div className="calendar-week-cell-tooltip-trigger calendar-week-cell-tooltip-trigger--full-cell">
            {weekCellInnerPlain}
          </div>
        </CalendarPreviewTooltip>
      </div>
    )
  }

  const weekCellInner = (
    <>
      <div
        className={`calendar-week-cell-date ${isSelected ? 'calendar-week-cell-date--selected' : ''}`}
      >
        {date.date()}
      </div>
      <div className="calendar-week-cell-events">
        {dayEvents.slice(0, 2).map(event => {
          const displayTitle = String(event.title ?? '').replace(/^\[.*?\]\s*/, '')
          const isEventSelected = selectedKeys.includes(event.id)
          const colors =
            config.resolveEventColors?.(event) ??
            resolveItemColor(event, colorMap, SCHEDULE_COLORS[0])
          return (
            <div key={String(event.id)}>
              <div
                className={`calendar-event ${isEventSelected ? 'calendar-event--selected' : ''}`}
                style={{
                  backgroundColor: colors.bg,
                  border: isEventSelected ? 'none' : `1px solid ${colors.border}`,
                }}
                onClick={e => e.stopPropagation()}
              >
                <span className="calendar-event-title" style={{ color: colors.text }}>
                  {displayTitle}
                </span>
              </div>
            </div>
          )
        })}
        {dayEvents.length > 2 && (
          <div className="calendar-event-more">
            {config.formatEventsOverflowText?.(dayEvents.length - 2) ??
              `외 ${dayEvents.length - 2}개의 항목`}
          </div>
        )}
      </div>
    </>
  )

  return (
    <CalendarPreviewTooltip
      enabled={overlayEnabled && overlayContent != null}
      content={overlayContent}
      tooltipOverlayClassName={tooltipOverlayClassName}
    >
      <div
        className={`calendar-week-cell ${isSelected ? 'calendar-week-cell--selected' : ''}`}
        onClick={() => onSelectDate(date)}
      >
        {weekCellInner}
      </div>
    </CalendarPreviewTooltip>
  )
}
