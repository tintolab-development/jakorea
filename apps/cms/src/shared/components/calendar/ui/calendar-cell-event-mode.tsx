import { Fragment } from 'react'
import dayjs from 'dayjs'
import { SCHEDULE_COLORS } from '@/features/program/ui/program-schedule-colors'
import { calendarItemsForEventMode, getItemsForDate, resolveItemColor } from '../lib/calendar-helpers'
import { buildEventsPreview, withOverlay } from './calendar-cell-commons'
import type { CalendarCellEventModeProps } from './calendar-cell-types'

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
    buildResolvedColorMap,
  } = props

  const overlayProps = { tooltipOverlayClassName }

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

    if (config.eventsTooltipTrigger === 'cell') {
      const cellInner = (
        <div className={cellClass} onClick={() => onSelectDate(date)}>
          <div className="calendar-cell-date">{date.date()}</div>
          <div className="calendar-cell-events">
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
                    style={{ backgroundColor: colors.bg }}
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
        </div>
      )

      return withOverlay(
        <div className="calendar-cell-tooltip-trigger calendar-cell-tooltip-trigger--full-cell">
          {cellInner}
        </div>,
        overlayEnabled,
        overlayContent,
        overlayProps
      )
    }

    return (
      <div className={cellClass} onClick={() => onSelectDate(date)}>
        <div className="calendar-cell-date">{date.date()}</div>
        <div className="calendar-cell-events">
          {dayEvents.slice(0, 2).map(event => {
            const displayTitle = String(event.title ?? '').replace(/^\[.*?\]\s*/, '')
            const isEventSelected = selectedKeys.includes(event.id)
            const colors =
              config.resolveEventColors?.(event) ??
              resolveItemColor(event, colorMap, SCHEDULE_COLORS[0])
            const tooltipList = config.eventsTooltipScope === 'full-day' ? dayEvents : [event]
            const tooltipColorMap =
              config.overrideEventColorMap != null
                ? config.overrideEventColorMap(
                    config.eventsTooltipScope === 'full-day' ? dayEvents : [event]
                  )
                : buildResolvedColorMap(tooltipList)
            const previewOne = buildEventsPreview(
              tooltipList,
              tooltipColorMap,
              config.previewTooltipContent
            )
            return (
              <Fragment key={String(event.id)}>
                {withOverlay(
                  <div className="calendar-event-tooltip-trigger">
                    <div
                      className={`calendar-event ${isEventSelected ? 'calendar-event--selected' : ''}`}
                      style={{ backgroundColor: colors.bg }}
                      onClick={e => e.stopPropagation()}
                    >
                      <span className="calendar-event-title" style={{ color: colors.text }}>
                        {displayTitle}
                      </span>
                    </div>
                  </div>,
                  true,
                  previewOne,
                  overlayProps
                )}
              </Fragment>
            )
          })}
          {dayEvents.length > 2 && (
            <Fragment key="more">
              {withOverlay(
                <div className="calendar-event-tooltip-trigger calendar-event-more">
                  {config.formatEventsOverflowText?.(dayEvents.length - 2) ??
                    `외 ${dayEvents.length - 2}개의 항목`}
                </div>,
                true,
                (() => {
                  const moreList =
                    config.eventsTooltipScope === 'full-day' ? dayEvents : dayEvents.slice(2)
                  const moreColorMap =
                    config.overrideEventColorMap != null
                      ? config.overrideEventColorMap(moreList)
                      : buildResolvedColorMap(moreList)
                  return buildEventsPreview(
                    moreList,
                    moreColorMap,
                    config.previewTooltipContent
                  )
                })(),
                overlayProps
              )}
            </Fragment>
          )}
        </div>
      </div>
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
        {withOverlay(
          <div className="calendar-week-cell-tooltip-trigger calendar-week-cell-tooltip-trigger--full-cell">
            {weekCellInnerPlain}
          </div>,
          overlayEnabled,
          overlayContent,
          overlayProps
        )}
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
          const tooltipList = config.eventsTooltipScope === 'full-day' ? dayEvents : [event]
          const tooltipColorMap =
            config.overrideEventColorMap != null
              ? config.overrideEventColorMap(
                  config.eventsTooltipScope === 'full-day' ? dayEvents : [event]
                )
              : buildResolvedColorMap(tooltipList)
          const previewOne = buildEventsPreview(
            tooltipList,
            tooltipColorMap,
            config.previewTooltipContent
          )
          return (
            <Fragment key={String(event.id)}>
              {withOverlay(
                <div className="calendar-event-tooltip-trigger">
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
                </div>,
                true,
                previewOne,
                overlayProps
              )}
            </Fragment>
          )
        })}
        {dayEvents.length > 2 && (
          <Fragment key="more">
            {withOverlay(
              <div className="calendar-event-tooltip-trigger calendar-event-more">
                {config.formatEventsOverflowText?.(dayEvents.length - 2) ??
                  `외 ${dayEvents.length - 2}개의 항목`}
              </div>,
              true,
              (() => {
                const moreList =
                  config.eventsTooltipScope === 'full-day' ? dayEvents : dayEvents.slice(2)
                const moreColorMap =
                  config.overrideEventColorMap != null
                    ? config.overrideEventColorMap(moreList)
                    : buildResolvedColorMap(moreList)
                return buildEventsPreview(
                  moreList,
                  moreColorMap,
                  config.previewTooltipContent
                )
              })(),
              overlayProps
            )}
          </Fragment>
        )}
      </div>
    </>
  )

  return (
    <div
      className={`calendar-week-cell ${isSelected ? 'calendar-week-cell--selected' : ''}`}
      onClick={() => onSelectDate(date)}
    >
      {weekCellInner}
    </div>
  )
}
