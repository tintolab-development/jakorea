import { Fragment, type CSSProperties, type ReactElement, type ReactNode } from 'react'
import type { Dayjs } from 'dayjs'
import type { Program } from '@/types/domain'
import {
  SCHEDULE_COLORS,
  type ScheduleColorPair,
} from '@/features/program/ui/program-schedule-colors'
import { ProgramCalendarOverlayFollowCursor } from '@/shared/components/program-calendar-cursor-overlay'
import {
  buildEventsPreview,
  CalendarCellSchedulePreview,
  type CalendarEventsConfig,
} from '../calendar-core/calendar-cell'
import {
  calendarItemsForEventMode,
  getItemsForDate,
  isProgramOriginal,
  resolveItemColor,
  type CalendarItem,
} from '../calendar-core/calendar-helpers'

const WEEK_TIME_GRID_HOURS = 24
const WEEK_TIME_GRID_HOUR_PX = 54
const WEEK_TIME_GRID_TOTAL_PX = WEEK_TIME_GRID_HOUR_PX * WEEK_TIME_GRID_HOURS
const WEEK_HEADER_WEEKDAY_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const

const WEEK_TIME_GRID_HOUR_ROWS: readonly { period: '오전' | '오후'; hour: string }[] = (() => {
  const rows: { period: '오전' | '오후'; hour: string }[] = []
  rows.push({ period: '오전', hour: '12시' })
  for (let h = 1; h <= 11; h++) rows.push({ period: '오전', hour: `${h}시` })
  rows.push({ period: '오후', hour: '12시' })
  for (let h = 1; h <= 11; h++) rows.push({ period: '오후', hour: `${h}시` })
  return rows
})()

function formatWeekHeaderDayLabel(date: Dayjs): string {
  return String(date.date())
}

function parseHHmmToMinutes(s: string | undefined): number | null {
  if (!s?.trim()) return null
  const t = s.trim()
  if (t === '24:00') return 24 * 60
  const m = /^(\d{1,2}):(\d{2})$/.exec(t)
  if (!m) return null
  const h = parseInt(m[1], 10)
  const min = parseInt(m[2], 10)
  if (h < 0 || h > 23 || min < 0 || min > 59) return null
  return h * 60 + min
}

function readStartEndFromUnknown(original: unknown): { startTime?: string; endTime?: string } {
  if (original == null || typeof original !== 'object') return {}
  const o = original as Record<string, unknown>
  const st = o.startTime
  const et = o.endTime
  return {
    startTime: typeof st === 'string' ? st : undefined,
    endTime: typeof et === 'string' ? et : undefined,
  }
}

/** `CalendarItem.original` 또는 중첩 `originalItem`에서 주간 격자용 시각 */
function readTimesFromCalendarItem(item: CalendarItem): { startTime?: string; endTime?: string } {
  const direct = readStartEndFromUnknown(item.original)
  if (direct.startTime) return direct
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

type TimedItemSpan = {
  item: CalendarItem
  startM: number
  endM: number
}

/** 구간이 겹치면 true (끝점만 맞닿은 경우는 겹침 아님) */
function timedSpansOverlap(a: TimedItemSpan, b: TimedItemSpan): boolean {
  return a.startM < b.endM && b.startM < a.endM
}

function buildTimedItemSpans(items: CalendarItem[]): TimedItemSpan[] {
  const spans: TimedItemSpan[] = []
  for (const item of items) {
    const { startTime, endTime } = readTimesFromCalendarItem(item)
    const startM = parseHHmmToMinutes(startTime)
    if (startM == null) continue
    const endRaw = parseHHmmToMinutes(endTime)
    let endM = endRaw != null && endRaw > startM ? endRaw : startM + 60
    endM = Math.min(endM, 24 * 60)
    spans.push({ item, startM, endM })
  }
  return spans
}

/** 겹치지 않는 열에 시간 블록을 배치 (같은 열은 끝 시각만 맞닿거나 이전이면 재사용) */
function assignGreedyTimedColumns(spans: TimedItemSpan[]): Map<TimedItemSpan, number> {
  const sorted = [...spans].sort(
    (a, b) => a.startM - b.startM || b.endM - a.endM || String(a.item.id).localeCompare(String(b.item.id))
  )
  const columnLastEnd: number[] = []
  const colBySpan = new Map<TimedItemSpan, number>()
  for (const sp of sorted) {
    let col = columnLastEnd.findIndex(end => end <= sp.startM)
    if (col === -1) {
      col = columnLastEnd.length
      columnLastEnd.push(sp.endM)
    } else {
      columnLastEnd[col] = sp.endM
    }
    colBySpan.set(sp, col)
  }
  return colBySpan
}

/** 이 블록과 겹치는 모든 블록 중 (열 인덱스+1)의 최댓값 → 가로 폭 분할에 사용 */
function overlapColumnCount(
  sp: TimedItemSpan,
  spans: TimedItemSpan[],
  colBySpan: Map<TimedItemSpan, number>
): number {
  let m = 1
  for (const o of spans) {
    if (!timedSpansOverlap(sp, o)) continue
    m = Math.max(m, (colBySpan.get(o) ?? 0) + 1)
  }
  return m
}

type TimedItemLayout = {
  item: CalendarItem
  top: number
  height: number
  col: number
  colCount: number
}

/** 항목마다 시작·종료 시각에 맞는 세로 위치; 겹침은 가로 열로 분할 */
function buildTimedItemLayouts(items: CalendarItem[], hourPx: number): TimedItemLayout[] {
  const spans = buildTimedItemSpans(items)
  if (spans.length === 0) return []
  const colBySpan = assignGreedyTimedColumns(spans)
  const layouts: TimedItemLayout[] = spans.map(sp => ({
    item: sp.item,
    top: (sp.startM / 60) * hourPx,
    height: Math.max(((sp.endM - sp.startM) / 60) * hourPx, 28),
    col: colBySpan.get(sp) ?? 0,
    colCount: overlapColumnCount(sp, spans, colBySpan),
  }))
  layouts.sort((a, b) => a.top - b.top || b.height - a.height)
  return layouts
}

function timedBlockPositionStyle(
  layout: TimedItemLayout,
  zIndex: number,
  colors: ScheduleColorPair,
  border: string
): CSSProperties {
  const sidePad = 4
  const colCount = Math.max(layout.colCount, 1)
  const left =
    colCount > 1
      ? `calc(${sidePad}px + (100% - ${sidePad * 2}px) * ${layout.col} / ${colCount})`
      : sidePad
  const width =
    colCount > 1
      ? `calc((100% - ${sidePad * 2}px) / ${colCount})`
      : `calc(100% - ${sidePad * 2}px)`
  return {
    position: 'absolute',
    top: layout.top,
    left,
    width,
    height: layout.height,
    minHeight: 28,
    zIndex,
    backgroundColor: colors.bg,
    border,
  }
}

function weekTimeGridItemLabel(item: CalendarItem): string {
  const custom = timeGridLabelFromOriginal(item)
  if (custom) return custom
  return String(item.title ?? '')
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
    } as ScheduleColorPair
  }
  return resolveEventColors?.(item) ?? resolvedDayColors.get(item.id) ?? SCHEDULE_COLORS[0]
}

function withScheduleOverlay(
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

export type WeekViewProps = {
  weekDates: Dayjs[]
  selectedDate: Dayjs
  onSelectDate: (date: Dayjs) => void
  items: CalendarItem[]
  colorMap: Map<string | number, ScheduleColorPair>
  scheduleOverlay: 'popover' | 'tooltip'
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
  scheduleOverlay,
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

  const overlayProps = { scheduleOverlay, tooltipOverlayClassName }

  return (
    <div className="calendar-week calendar-week--time-grid" style={rootStyle}>
      <div className="calendar-week-time-grid__header-row" role="row">
        <div className="calendar-week-time-grid__header-corner" aria-hidden />
        {weekDates.map(date => {
          const isSelected = date.isSame(selectedDate, 'day')
          const dateKey = date.format('YYYY-MM-DD')
          const dayLabel = formatWeekHeaderDayLabel(date)
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
      <div className="calendar-week-time-grid__scroll">
        <div className="calendar-week-time-grid__shell">
          <div className="calendar-week-time-grid__gutter">
            {WEEK_TIME_GRID_HOUR_ROWS.map((row, hourIdx) => (
              <div
                key={`week-gutter-${hourIdx}`}
                className={[
                  'calendar-week-time-grid__gutter-cell',
                  hourIdx === 0 ? 'calendar-week-time-grid__gutter-cell--first' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{ top: hourIdx * hourPx }}
              >
                <span className="calendar-week-time-grid__gutter-period">{row.period}</span>
                <span className="calendar-week-time-grid__gutter-hour">{row.hour}</span>
              </div>
            ))}
          </div>
          <div className="calendar-week-time-grid__columns">
            {weekDates.map(date => {
              const dateKey = date.format('YYYY-MM-DD')
              const dayItems = getItemsForDate(items, date)

              if (isEventsMode && eventsConfig) {
                const dayEvents = calendarItemsForEventMode(dayItems)
                const resolvedDayColors =
                  eventsConfig.overrideEventColorMap != null
                    ? eventsConfig.overrideEventColorMap(dayEvents)
                    : buildResolvedColorMap(dayEvents)
                const allDayItems = dayEvents.filter(
                  e => parseHHmmToMinutes(readTimesFromCalendarItem(e).startTime) == null
                )
                const timedItems = dayEvents.filter(
                  e => parseHHmmToMinutes(readTimesFromCalendarItem(e).startTime) != null
                )
                const timedLayouts = buildTimedItemLayouts(timedItems, hourPx)

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
                      {allDayItems.map((item, idx) => {
                        const displayTitle = weekTimeGridItemLabel(item)
                        const isSelected = eventsConfig.selectedRowKeys.includes(item.id)
                        const colors = weekTimeGridItemColors(
                          item,
                          eventsConfig.resolveEventColors,
                          resolvedDayColors
                        )
                        const tooltipList =
                          eventsConfig.eventsTooltipScope === 'full-day' ? dayEvents : [item]
                        const tooltipColorMap =
                          eventsConfig.overrideEventColorMap != null
                            ? eventsConfig.overrideEventColorMap(tooltipList)
                            : buildResolvedColorMap(tooltipList)
                        const previewOne = buildEventsPreview(
                          tooltipList,
                          tooltipColorMap,
                          eventsConfig.renderEventsTooltipContent
                        )
                        const pos: CSSProperties = {
                          position: 'absolute',
                          top: idx * 36,
                          left: 4,
                          right: 4,
                          height: 32,
                          zIndex: 10 + idx,
                          backgroundColor: colors.bg,
                          border: isSelected ? 'none' : `1px solid ${colors.border}`,
                        }
                        return (
                          <Fragment key={String(item.id)}>
                            {withScheduleOverlay(
                              <div className="calendar-event-tooltip-trigger">
                                <div
                                  className={[
                                    'calendar-week-time-grid__event',
                                    'calendar-event',
                                    isSelected ? 'calendar-event--selected' : '',
                                  ]
                                    .filter(Boolean)
                                    .join(' ')}
                                  style={pos}
                                  onClick={e => e.stopPropagation()}
                                >
                                  <span
                                    className="calendar-event-title calendar-week-time-grid__event-text"
                                    style={{ color: colors.text }}
                                  >
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
                      {timedLayouts.map((layout, idx) => {
                        const it = layout.item
                        const displayTitle = weekTimeGridItemLabel(it)
                        const isSelected = eventsConfig.selectedRowKeys.includes(it.id)
                        const colors = weekTimeGridItemColors(
                          it,
                          eventsConfig.resolveEventColors,
                          resolvedDayColors
                        )
                        const tooltipList =
                          eventsConfig.eventsTooltipScope === 'full-day' ? dayEvents : [it]
                        const tooltipColorMap =
                          eventsConfig.overrideEventColorMap != null
                            ? eventsConfig.overrideEventColorMap(tooltipList)
                            : buildResolvedColorMap(tooltipList)
                        const previewOne = buildEventsPreview(
                          tooltipList,
                          tooltipColorMap,
                          eventsConfig.renderEventsTooltipContent
                        )
                        const pos = timedBlockPositionStyle(
                          layout,
                          20 + idx,
                          colors,
                          isSelected ? 'none' : `1px solid ${colors.border}`
                        )
                        return (
                          <Fragment key={`${String(it.id)}-${layout.top}-${layout.col}`}>
                            {withScheduleOverlay(
                              <div className="calendar-event-tooltip-trigger">
                                <div
                                  className={[
                                    'calendar-week-time-grid__event',
                                    'calendar-event',
                                    'calendar-week-time-grid__event--timed',
                                    isSelected ? 'calendar-event--selected' : '',
                                  ]
                                    .filter(Boolean)
                                    .join(' ')}
                                  style={pos}
                                  onClick={e => e.stopPropagation()}
                                >
                                  <span
                                    className="calendar-event-title calendar-week-time-grid__event-text"
                                    style={{ color: colors.text }}
                                  >
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
                    </div>
                  </div>
                )
              }

              const untimedItems = dayItems.filter(
                it => parseHHmmToMinutes(readTimesFromCalendarItem(it).startTime) == null
              )
              const timedItems = dayItems.filter(
                it => parseHHmmToMinutes(readTimesFromCalendarItem(it).startTime) != null
              )
              const timedLayouts = buildTimedItemLayouts(timedItems, hourPx)

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
                    {untimedItems.map((item, idx) => {
                      const colors = resolveItemColor(item, colorMap, SCHEDULE_COLORS[0])
                      const preview =
                        isProgramOriginal(item.original) ? (
                          <CalendarCellSchedulePreview
                            date={date}
                            items={[item.original]}
                            colorMap={colorMap}
                          />
                        ) : (
                          <div className="calendar-cell-preview">
                            <span className="calendar-cell-preview__title" style={{ color: colors.text }}>
                              {weekTimeGridItemLabel(item)}
                            </span>
                          </div>
                        )
                      const pos: CSSProperties = {
                        position: 'absolute',
                        top: idx * 36,
                        left: 4,
                        right: 4,
                        height: 32,
                        zIndex: 10 + idx,
                        backgroundColor: colors.bg,
                        border: `1px solid ${colors.border}`,
                      }
                      return (
                        <Fragment key={String(item.id)}>
                          {withScheduleOverlay(
                            <div className="calendar-event-tooltip-trigger">
                              <div
                                className="calendar-week-time-grid__event calendar-event"
                                style={pos}
                                onClick={e => {
                                  e.stopPropagation()
                                  if (isProgramOriginal(item.original)) {
                                    onProgramClick?.(item.original)
                                  }
                                }}
                              >
                                <span
                                  className="calendar-event-title calendar-week-time-grid__event-text"
                                  style={{ color: colors.text }}
                                >
                                  {item.title ?? weekTimeGridItemLabel(item)}
                                </span>
                              </div>
                            </div>,
                            true,
                            preview,
                            overlayProps
                          )}
                        </Fragment>
                      )
                    })}
                    {timedLayouts.map((layout, idx) => {
                      const item = layout.item
                      const colors = resolveItemColor(item, colorMap, SCHEDULE_COLORS[0])
                      const preview =
                        isProgramOriginal(item.original) ? (
                          <CalendarCellSchedulePreview
                            date={date}
                            items={[item.original]}
                            colorMap={colorMap}
                          />
                        ) : (
                          <div className="calendar-cell-preview">
                            <span className="calendar-cell-preview__title" style={{ color: colors.text }}>
                              {weekTimeGridItemLabel(item)}
                            </span>
                          </div>
                        )
                      const pos = timedBlockPositionStyle(
                        layout,
                        20 + idx,
                        colors,
                        `1px solid ${colors.border}`
                      )
                      return (
                        <Fragment key={`${String(item.id)}-${layout.top}-${layout.col}`}>
                          {withScheduleOverlay(
                            <div className="calendar-event-tooltip-trigger">
                              <div
                                className={[
                                  'calendar-week-time-grid__event',
                                  'calendar-event',
                                  'calendar-week-time-grid__event--timed',
                                ]
                                  .filter(Boolean)
                                  .join(' ')}
                                style={pos}
                                onClick={e => {
                                  e.stopPropagation()
                                  if (isProgramOriginal(item.original)) {
                                    onProgramClick?.(item.original)
                                  }
                                }}
                              >
                                <span
                                  className="calendar-event-title calendar-week-time-grid__event-text"
                                  style={{ color: colors.text }}
                                >
                                  {item.title ?? weekTimeGridItemLabel(item)}
                                </span>
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
    </div>
  )
}
