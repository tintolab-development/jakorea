import { Fragment, type ReactElement, type ReactNode } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import type { Program } from '@/types/domain'
import { getProgramDayScheduleLine } from '@/entities/program/lib/program-day-schedule-line'
import {
  SCHEDULE_COLORS,
  type ScheduleColorPair,
} from '@/features/program/ui/program-schedule-colors'
import { ApplicantCalendarEventPopoverContent } from '@/features/program/program-detail/ui/applicant-list/applicant-calendar-schedule-helpers'
import { ProgramCalendarOverlayFollowCursor } from '@/shared/components/program-calendar-cursor-overlay'
import {
  calendarItemForScheduleSource,
  calendarItemsForEventMode,
  getItemsForDate,
  resolveItemColor,
  uniqueScheduleSourcesForDay,
  type CalendarItem,
} from './calendar-helpers'

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

export type CalendarEventsConfig = {
  selectedRowKeys: React.Key[]
  renderEventsTooltipContent?: (args: {
    events: CalendarItem[]
    colorMap: Map<string | number, ScheduleColorPair>
  }) => ReactNode
  overrideEventColorMap?: (dayEvents: CalendarItem[]) => Map<string | number, ScheduleColorPair>
  resolveEventColors?: (item: CalendarItem) => ScheduleColorPair | undefined
  eventsTooltipScope: 'trigger-only' | 'full-day'
  formatEventsOverflowText?: (hiddenCount: number) => string
  eventsTooltipTrigger: 'event-strip' | 'cell'
}

export type CalendarCellProps = {
  date: Dayjs
  items: CalendarItem[]
  selectedDate: Dayjs
  currentMonth: Dayjs
  mode: 'month' | 'week'
  selectedKeys: React.Key[]
  colorMap: Map<string | number, ScheduleColorPair>
  onSelectDate: (date: Dayjs) => void
  overlayEnabled: boolean
  overlayContent: ReactNode
  scheduleOverlay: 'popover' | 'tooltip'
  tooltipOverlayClassName?: string
  /** 이벤트 모드에서만 전달 (스트립 툴팁 등). */
  eventsConfig?: CalendarEventsConfig
  buildResolvedColorMap?: (dayEvents: CalendarItem[]) => Map<string | number, ScheduleColorPair>
}

export function CalendarItemList({
  items,
  selectedKeys,
  colorMap,
  limit = 2,
  onItemClick,
}: {
  items: CalendarItem[]
  selectedKeys: React.Key[]
  colorMap: Map<string | number, ScheduleColorPair>
  limit?: number
  onItemClick?: (item: CalendarItem) => void
}) {
  return (
    <>
      {items.slice(0, limit).map(item => {
        const colors = resolveItemColor(item, colorMap, SCHEDULE_COLORS[0])
        const isSelected = selectedKeys.includes(item.id)

        return (
          <div
            key={item.id}
            className={`calendar-event ${isSelected ? 'calendar-event--selected' : ''}`}
            style={{ backgroundColor: colors.bg }}
            onClick={e => {
              e.stopPropagation()
              onItemClick?.(item)
            }}
          >
            <span className="calendar-event-title">{item.title}</span>
          </div>
        )
      })}

      {items.length > limit && (
        <div className="calendar-event-more">외 {items.length - limit}개의 항목</div>
      )}
    </>
  )
}

export function CalendarCellSchedulePreview({
  date,
  items,
  colorMap,
}: {
  date: Dayjs
  items: Program[]
  colorMap: Map<string | number, ScheduleColorPair>
}) {
  return (
    <div className="calendar-cell-preview">
      {items.map(entity => {
        const { statusLabel, time } = getProgramDayScheduleLine(entity, date)
        const title = entity.title ?? ''
        const colorPair = resolveItemColor(
          calendarItemForScheduleSource(entity),
          colorMap,
          SCHEDULE_COLORS[0]
        )
        return (
          <button key={entity.id} type="button" className="calendar-cell-preview__item">
            <span className="calendar-cell-preview__title" style={{ color: colorPair.text }}>
              [{title}]
            </span>
            <span className="calendar-cell-preview__desc">
              {statusLabel} | {time}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function withOverlay(
  node: ReactElement,
  enabled: boolean,
  content: ReactNode,
  props: {
    scheduleOverlay: 'popover' | 'tooltip'
    tooltipOverlayClassName?: string
  }
) {
  if (!enabled) return node

  return (
    <ProgramCalendarOverlayFollowCursor
      variant={props.scheduleOverlay}
      tooltipOverlayClassName={props.tooltipOverlayClassName}
      content={content}
    >
      {node}
    </ProgramCalendarOverlayFollowCursor>
  )
}

/** 툴팁 패널은 행마다 `originalItem`을 쓰므로 `CalendarItem.original`에서 맞춘다 */
function calendarItemsToPopoverRows(
  items: CalendarItem[]
): Array<{ id: string | number; title?: string; originalItem?: unknown }> {
  return items.map(item => {
    const o = item.original
    const nested =
      o != null && typeof o === 'object' && 'originalItem' in o
        ? (o as { originalItem?: unknown }).originalItem
        : o
    return {
      id: item.id,
      title: item.title,
      originalItem: nested,
    }
  })
}

export function buildEventsPreview(
  dayItems: CalendarItem[],
  colorMap: Map<string | number, ScheduleColorPair>,
  renderEventsTooltipContent?: (args: {
    events: CalendarItem[]
    colorMap: Map<string | number, ScheduleColorPair>
  }) => ReactNode
) {
  return renderEventsTooltipContent ? (
    renderEventsTooltipContent({ events: dayItems, colorMap })
  ) : (
    <ApplicantCalendarEventPopoverContent
      events={calendarItemsToPopoverRows(dayItems)}
      colorMap={colorMap}
    />
  )
}

export function CalendarCell(props: CalendarCellProps) {
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
    scheduleOverlay,
    tooltipOverlayClassName,
    eventsConfig,
    buildResolvedColorMap,
  } = props

  const overlayProps = { scheduleOverlay, tooltipOverlayClassName }

  if (eventsConfig != null && buildResolvedColorMap != null) {
    const dayEvents = calendarItemsForEventMode(getItemsForDate(items, date))
    const hasItems = dayEvents.length > 0
    const config = eventsConfig

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
                config.renderEventsTooltipContent
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
                      config.renderEventsTooltipContent
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
              config.renderEventsTooltipContent
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
                    config.renderEventsTooltipContent
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
