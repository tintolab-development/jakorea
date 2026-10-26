import { Fragment, type CSSProperties, type ReactElement, type ReactNode } from 'react'
import type { Dayjs } from 'dayjs'
import type { Program } from '@/types/domain'
import {
  SCHEDULE_COLORS,
  type ScheduleColorPair,
} from '@/features/program/shared/ui/program-schedule-colors'
import {
  buildEventsPreview,
  CalendarCellSchedulePreview,
  type CalendarEventsConfig,
} from './calendar-cell'
import { CalendarPreviewTooltip } from './preview-tooltip/calendar-preview-tooltip'
import {
  calendarItemsForEventMode,
  getItemsForDate,
  isProgramOriginal,
  type CalendarItem,
} from '../lib/calendar-helpers'
import {
  buildTimedItemGroupLayouts,
  buildWeekTimeGridGroupStyle,
  formatTimedGroupOverflowText,
  readTimesOrAllDaySpan,
  resolveWeekEventCardContent,
  WEEK_TIME_GRID_HOUR_PX,
  WEEK_TIME_GRID_HOURS,
  WEEK_TIME_GRID_TOTAL_PX,
  type TimedItemGroupLayout,
} from '../lib/week-time-grid-layout'
import { formatCalendarEventTimeLabel } from '../lib/format-calendar-event-time-label'

const WEEK_HEADER_WEEKDAY_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const

const WEEK_TIME_GRID_HOUR_LABELS: readonly string[] = Array.from(
  { length: WEEK_TIME_GRID_HOURS + 1 },
  (_, hour) => `${String(hour).padStart(2, '0')}:00`
)

function formatWeekHeaderDayLabel(date: Dayjs, weekDates: readonly Dayjs[]): string {
  const anchor = weekDates[3] ?? weekDates[0]
  if (anchor && !date.isSame(anchor, 'month') && date.date() === 1) {
    return `${date.month() + 1}.${date.date()}`
  }
  return String(date.date())
}

function readStartEndFromUnknown(original: unknown): { startTime?: string; endTime?: string } {
  if (original == null || typeof original !== 'object') return {}
  const o = original as Record<string, unknown>
  const st = o.startTime
  const et = o.endTime
  return {
    startTime: typeof st === 'string' && st.trim() ? st.trim() : undefined,
    endTime: typeof et === 'string' && et.trim() ? et.trim() : undefined,
  }
}

/** `CalendarMainEventInput` 등 이벤트 래퍼에 시각 필드가 있으면 그 값만 사용(없으면 종일) */
function hasEventLevelTimeFields(original: unknown): boolean {
  if (original == null || typeof original !== 'object') return false
  return 'startTime' in original || 'endTime' in original
}

/** `CalendarItem.original` 또는 중첩 `originalItem`에서 주간 격자용 시각 */
function readTimesFromCalendarItem(item: CalendarItem): { startTime?: string; endTime?: string } {
  const direct = readStartEndFromUnknown(item.original)
  if (hasEventLevelTimeFields(item.original)) return direct
  if (
    item.original != null &&
    typeof item.original === 'object' &&
    'originalItem' in item.original
  ) {
    return readStartEndFromUnknown((item.original as { originalItem?: unknown }).originalItem)
  }
  return direct
}

function timeGridLabelFromOriginal(item: CalendarItem): string | undefined {
  const tryRead = (o: unknown): string | undefined => {
    if (o == null || typeof o !== 'object') return undefined
    const v = (o as { timeGridLabel?: unknown }).timeGridLabel
    return typeof v === 'string' && v.trim() ? v.trim() : undefined
  }
  return (
    tryRead(item.original) ?? tryRead((item.original as { originalItem?: unknown })?.originalItem)
  )
}

function weekGridSurfaceFromOriginal(
  item: CalendarItem
): { bg: string; border: string; text: string } | undefined {
  const tryRead = (o: unknown) => {
    if (o == null || typeof o !== 'object') return undefined
    const w = (o as { weekGridSurface?: { bg?: string; border?: string; text?: string } })
      .weekGridSurface
    if (!w || typeof w.bg !== 'string') return undefined
    return {
      bg: w.bg,
      border: typeof w.border === 'string' ? w.border : w.bg,
      text: typeof w.text === 'string' ? w.text : '#3d3d3d',
    }
  }
  return (
    tryRead(item.original) ?? tryRead((item.original as { originalItem?: unknown })?.originalItem)
  )
}

function weekTimeGridItemLabel(item: CalendarItem): string {
  const custom = timeGridLabelFromOriginal(item)
  if (custom) return custom
  return String(item.title ?? '')
}

/** 교육·신청 `CalendarItem` 중 프로그램당 1건만(교육 우선) — 종일·집약 라벨 정확도 */
function dedupeProgramWeekGridItems(dayItems: CalendarItem[]): CalendarItem[] {
  const byProgramId = new Map<string, CalendarItem>()
  const nonProgram: CalendarItem[] = []

  for (const item of dayItems) {
    if (!isProgramOriginal(item.original)) {
      nonProgram.push(item)
      continue
    }
    const programId = String(item.original.id)
    const prev = byProgramId.get(programId)
    if (!prev || String(item.id).endsWith('__edu')) {
      byProgramId.set(programId, item)
    }
  }

  return [...nonProgram, ...byProgramId.values()]
}

function weekTimeGridItemColors(
  item: CalendarItem,
  resolveEventColors: CalendarEventsConfig['resolveEventColors'],
  resolvedDayColors: Map<string | number, ScheduleColorPair>
): ScheduleColorPair {
  const surface = weekGridSurfaceFromOriginal(item)
  if (surface) {
    return {
      ...SCHEDULE_COLORS[0],
      bg: surface.bg,
      border: surface.border,
      text: surface.text,
    }
  }
  return resolveEventColors?.(item) ?? resolvedDayColors.get(item.id) ?? SCHEDULE_COLORS[0]
}

function weekProgramItemColor(
  item: CalendarItem,
  colorMap: Map<string | number, ScheduleColorPair>
): ScheduleColorPair {
  if (isProgramOriginal(item.original)) {
    return colorMap.get(String(item.original.id)) ?? SCHEDULE_COLORS[0]
  }
  return colorMap.get(item.id) ?? SCHEDULE_COLORS[0]
}

/** Figma Calendar/Tag/2 Line: 제목(최대 2줄) · 시간(Bold) · 외 N개의 항목(50%) */
function WeekTimeGridEventCardText({
  title,
  titleLines,
  timeText,
  overflowText,
}: {
  title: string
  titleLines: number
  timeText?: string
  overflowText?: string
}) {
  return (
    <span className="calendar-week-time-grid__card-text">
      <span
        className={[
          'calendar-week-time-grid__card-title',
          titleLines <= 1 ? 'calendar-week-time-grid__card-title--single' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        style={titleLines > 1 ? { WebkitLineClamp: titleLines, lineClamp: titleLines } : undefined}
      >
        {title}
      </span>
      {timeText ? <span className="calendar-week-time-grid__card-time">{timeText}</span> : null}
      {overflowText ? (
        <span className="calendar-week-time-grid__event-subtext">{overflowText}</span>
      ) : null}
    </span>
  )
}

function resolveGroupCardText(
  group: TimedItemGroupLayout<CalendarItem>,
  formatOverflow: (hiddenCount: number) => string
): { titleLines: number; timeText?: string; overflowText?: string } {
  const content = resolveWeekEventCardContent({
    height: group.height,
    durationMinutes: Math.max(group.endM - group.startM, 0),
    groupSize: group.items.length,
  })
  // 종일 항목은 00:00 ~ 24:00 시간 일정으로 취급한다.
  const span = readTimesOrAllDaySpan(group.representative, readTimesFromCalendarItem)
  return {
    titleLines: content.titleLines,
    timeText: content.showTime
      ? formatCalendarEventTimeLabel(span.startTime, span.endTime)
      : undefined,
    overflowText: content.showOverflow ? formatOverflow(group.items.length - 1) : undefined,
  }
}

function uniqueProgramsOf(items: CalendarItem[]): Program[] {
  const programs = items
    .map(it => (isProgramOriginal(it.original) ? it.original : null))
    .filter((p): p is Program => p != null)
  return Array.from(new Map(programs.map(p => [String(p.id), p])).values())
}

function withScheduleOverlay(
  node: ReactElement,
  enabled: boolean,
  content: ReactNode,
  props: {
    tooltipOverlayClassName?: string
  }
) {
  if (!enabled || content == null) return node
  return (
    <CalendarPreviewTooltip
      enabled
      content={content}
      tooltipOverlayClassName={props.tooltipOverlayClassName}
    >
      {node}
    </CalendarPreviewTooltip>
  )
}

export type WeekViewProps = {
  weekDates: Dayjs[]
  selectedDate: Dayjs
  onSelectDate: (date: Dayjs) => void
  items: CalendarItem[]
  colorMap: Map<string | number, ScheduleColorPair>
  tooltipOverlayClassName?: string
  isEventsMode: boolean
  eventsConfig?: CalendarEventsConfig
  buildResolvedColorMap: (dayEvents: CalendarItem[]) => Map<string | number, ScheduleColorPair>
  onProgramClick?: (program: Program) => void
}

export function WeekView({
  weekDates,
  selectedDate,
  onSelectDate,
  items,
  colorMap,
  tooltipOverlayClassName,
  isEventsMode,
  eventsConfig,
  buildResolvedColorMap,
  onProgramClick,
}: WeekViewProps) {
  const totalPx = WEEK_TIME_GRID_TOTAL_PX
  const hourPx = WEEK_TIME_GRID_HOUR_PX
  const rootStyle = {
    '--calendar-week-total-px': `${totalPx}px`,
    '--calendar-week-hour-px': `${hourPx}px`,
  } as CSSProperties

  const overlayProps = { tooltipOverlayClassName }
  const eventsModeConfig = isEventsMode ? eventsConfig : undefined
  const formatTimedOverflow =
    eventsModeConfig?.formatWeekEventsOverflowText ?? formatTimedGroupOverflowText
  const readLayoutSpan = (item: CalendarItem) =>
    readTimesOrAllDaySpan(item, readTimesFromCalendarItem)

  const dayModels = weekDates.map(date => {
    const dateKey = date.format('YYYY-MM-DD')
    const dayItems = getItemsForDate(items, date)
    const gridItems = eventsModeConfig
      ? calendarItemsForEventMode(dayItems)
      : dedupeProgramWeekGridItems(dayItems)
    const resolvedDayColors = eventsModeConfig
      ? eventsModeConfig.overrideEventColorMap != null
        ? eventsModeConfig.overrideEventColorMap(gridItems)
        : buildResolvedColorMap(gridItems)
      : colorMap
    return {
      date,
      dateKey,
      gridItems,
      resolvedDayColors,
      // 종일·날짜 전용 일정은 그 날짜 00:00–24:00 시간 일정으로 같은 격자에 배치한다.
      // 겹치는 일정은 N열 분할하지 않고 카드 1개 + 외 N개의 항목
      timedGroups: buildTimedItemGroupLayouts(gridItems, hourPx, readLayoutSpan),
    }
  })

  const itemColors = (item: CalendarItem, resolvedDayColors: Map<string | number, ScheduleColorPair>) =>
    eventsModeConfig
      ? weekTimeGridItemColors(item, eventsModeConfig.resolveEventColors, resolvedDayColors)
      : weekProgramItemColor(item, colorMap)

  return (
    <div className="calendar-week calendar-week--time-grid" style={rootStyle}>
      <div className="calendar-week-time-grid__header-row" role="row">
        <div className="calendar-week-time-grid__header-corner" aria-hidden />
        {weekDates.map(date => {
          const isSelected = date.isSame(selectedDate, 'day')
          const dateKey = date.format('YYYY-MM-DD')
          const dayLabel = formatWeekHeaderDayLabel(date, weekDates)
          const weekday = WEEK_HEADER_WEEKDAY_EN[date.day()]
          return (
            <button
              key={dateKey}
              type="button"
              className={[
                'calendar-week-time-grid__header-day',
                isSelected ? 'calendar-week-time-grid__header-day--selected' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onSelectDate(date)}
            >
              {`${dayLabel} (${weekday})`}
            </button>
          )
        })}
      </div>
      <div className="calendar-week-time-grid__shell">
        <div className="calendar-week-time-grid__gutter">
            {WEEK_TIME_GRID_HOUR_LABELS.map((label, hourIdx) => (
              <div
                key={`week-gutter-${label}`}
                className={[
                  'calendar-week-time-grid__gutter-cell',
                  hourIdx === 0 ? 'calendar-week-time-grid__gutter-cell--first' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{ top: hourIdx * hourPx + 1 }}
              >
                <span className="calendar-week-time-grid__gutter-hour">{label}</span>
              </div>
            ))}
          </div>
          <div className="calendar-week-time-grid__board">
            {dayModels.map(model => {
              const { date, dateKey, gridItems, resolvedDayColors, timedGroups } = model

              if (eventsModeConfig) {
                const fullDayPreview =
                  gridItems.length > 0 && eventsModeConfig.previewTooltipContent != null
                    ? buildEventsPreview(
                        gridItems,
                        resolvedDayColors,
                        eventsModeConfig.previewTooltipContent
                      )
                    : null
                const fullDayPreviewEnabled = gridItems.length > 0 && fullDayPreview != null

                return (
                  <div
                    key={dateKey}
                    className="calendar-week-time-grid__column"
                    role="presentation"
                    onClick={() => onSelectDate(date)}
                  >
                    <CalendarPreviewTooltip
                      enabled={fullDayPreviewEnabled}
                      content={fullDayPreview}
                      tooltipOverlayClassName={tooltipOverlayClassName}
                    >
                      <div
                        className="calendar-week-time-grid__column-inner"
                        style={{ height: totalPx }}
                      >
                        {timedGroups.map((group, idx) => {
                          const item = group.representative
                          const text = resolveGroupCardText(group, formatTimedOverflow)
                          const isSelected = group.items.some(ev =>
                            eventsModeConfig.selectedRowKeys.includes(ev.id)
                          )
                          const colors = itemColors(item, resolvedDayColors)
                          const pos = buildWeekTimeGridGroupStyle(group)
                          return (
                            <div
                              key={`${String(item.id)}-${group.startM}-${group.endM}-${group.items.length}`}
                              className="calendar-event-tooltip-trigger calendar-week-time-grid__event-anchor"
                              style={{ ...pos, zIndex: 20 + idx }}
                            >
                              <div
                                className={[
                                  'calendar-week-time-grid__event',
                                  'calendar-event',
                                  'calendar-week-time-grid__event--timed',
                                  'calendar-week-time-grid__event--card',
                                  isSelected ? 'calendar-event--selected' : '',
                                ]
                                  .filter(Boolean)
                                  .join(' ')}
                                style={{ backgroundColor: colors.bg }}
                                onClick={e => {
                                  e.stopPropagation()
                                  eventsModeConfig.onEventClick?.(item)
                                }}
                              >
                                <WeekTimeGridEventCardText
                                  title={weekTimeGridItemLabel(item)}
                                  {...text}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CalendarPreviewTooltip>
                  </div>
                )
              }

              return (
                <div
                  key={dateKey}
                  className="calendar-week-time-grid__column"
                  role="presentation"
                  onClick={() => onSelectDate(date)}
                >
                  <div
                    className="calendar-week-time-grid__column-inner"
                    style={{ height: totalPx }}
                  >
                    {timedGroups.map((group, idx) => {
                      const item = group.representative
                      const colors = weekProgramItemColor(item, colorMap)
                      const uniquePrograms = uniqueProgramsOf(group.items)
                      const preview =
                        uniquePrograms.length > 0 ? (
                          <CalendarCellSchedulePreview
                            date={date}
                            items={uniquePrograms}
                            colorMap={colorMap}
                          />
                        ) : (
                          <div className="calendar-preview-popover">
                            <div className="calendar-preview-popover__entry">
                              <span className="calendar-preview-popover__title">
                                {weekTimeGridItemLabel(item)}
                              </span>
                            </div>
                          </div>
                        )
                      const pos = buildWeekTimeGridGroupStyle(group)
                      const displayTitle = item.title ?? weekTimeGridItemLabel(item)
                      const text = resolveGroupCardText(group, formatTimedOverflow)
                      return (
                        <Fragment
                          key={`${String(item.id)}-${group.startM}-${group.endM}-${group.items.length}`}
                        >
                          {withScheduleOverlay(
                            <div
                              className="calendar-event-tooltip-trigger calendar-week-time-grid__event-anchor"
                              style={{ ...pos, zIndex: 20 + idx }}
                            >
                              <div
                                className={[
                                  'calendar-week-time-grid__event',
                                  'calendar-event',
                                  'calendar-week-time-grid__event--timed',
                                  'calendar-week-time-grid__event--card',
                                ]
                                  .filter(Boolean)
                                  .join(' ')}
                                style={{ backgroundColor: colors.bg }}
                                onClick={e => {
                                  e.stopPropagation()
                                  if (uniquePrograms.length > 0) {
                                    onProgramClick?.(uniquePrograms[0])
                                    return
                                  }
                                  if (isProgramOriginal(item.original))
                                    onProgramClick?.(item.original)
                                }}
                              >
                                <WeekTimeGridEventCardText title={displayTitle} {...text} />
                              </div>
                            </div>,
                            true,
                            preview,
                            overlayProps
                          )}
                        </Fragment>
                      )
                    })}
                  </div>
                </div>
              )
            })}
        </div>
      </div>
    </div>
  )
}
