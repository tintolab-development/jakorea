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
  isAllDayScheduleSpan,
  readTimesOrAllDaySpan,
  resolveWeekTimeGridSubtext,
  WEEK_TIME_GRID_HOUR_PX,
  WEEK_TIME_GRID_TOTAL_PX,
} from '../lib/week-time-grid-layout'

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
    } as ScheduleColorPair
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

function WeekTimeGridEventText({
  title,
  subtext,
  textColor,
}: {
  title: string
  subtext?: string
  textColor: string
}) {
  if (subtext) {
    return (
      <span
        className="calendar-event-title calendar-week-time-grid__event-text"
        style={{ color: textColor }}
      >
        <span>{title}</span>
        <span className="calendar-week-time-grid__event-subtext">{subtext}</span>
      </span>
    )
  }
  return (
    <span
      className="calendar-event-title calendar-week-time-grid__event-text"
      style={{ color: textColor }}
    >
      {title}
    </span>
  )
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
                const timedGroups = buildTimedItemGroupLayouts(dayEvents, hourPx, item =>
                  readTimesOrAllDaySpan(item, readTimesFromCalendarItem)
                )

                const fullDayPreview =
                  eventsConfig.previewTooltipContent != null
                    ? buildEventsPreview(
                        dayEvents,
                        resolvedDayColors,
                        eventsConfig.previewTooltipContent
                      )
                    : null

                return (
                  <div
                    key={dateKey}
                    className="calendar-week-time-grid__column"
                    role="presentation"
                    onClick={() => onSelectDate(date)}
                  >
                    <CalendarPreviewTooltip
                      enabled={fullDayPreview != null}
                      content={fullDayPreview}
                      tooltipOverlayClassName={tooltipOverlayClassName}
                    >
                      <div
                        className="calendar-week-time-grid__column-inner"
                        style={{ height: totalPx }}
                      >
                        {timedGroups.map((group, idx) => {
                          const item = group.representative
                          const displayTitle = weekTimeGridItemLabel(item)
                          const subtext = resolveWeekTimeGridSubtext(
                            item,
                            group.items.length,
                            readTimesFromCalendarItem
                          )
                          const isAllDay = isAllDayScheduleSpan(item, readTimesFromCalendarItem)
                          const isSelected = group.items.some(grouped =>
                            eventsConfig.selectedRowKeys.includes(grouped.id)
                          )
                          const colors = weekTimeGridItemColors(
                            item,
                            eventsConfig.resolveEventColors,
                            resolvedDayColors
                          )
                          const pos: CSSProperties & Record<string, string | number> = {
                            ...buildWeekTimeGridGroupStyle(group),
                            zIndex: 20 + idx,
                            '--calendar-week-event-overlay-bg': colors.bg,
                            border: isSelected ? 'none' : `1px solid ${colors.border}`,
                          }
                          return (
                            <div
                              key={`${String(item.id)}-${group.startM}-${group.endM}-${group.items.length}`}
                              className="calendar-event-tooltip-trigger"
                            >
                              <div
                                className={[
                                  'calendar-week-time-grid__event',
                                  'calendar-event',
                                  'calendar-week-time-grid__event--timed',
                                  isAllDay ? 'calendar-week-time-grid__event--all-day' : '',
                                  isSelected ? 'calendar-event--selected' : '',
                                ]
                                  .filter(Boolean)
                                  .join(' ')}
                                style={pos}
                                onClick={e => e.stopPropagation()}
                              >
                                <WeekTimeGridEventText
                                  title={displayTitle}
                                  subtext={subtext}
                                  textColor={colors.text}
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

              const gridDayItems = dedupeProgramWeekGridItems(dayItems)
              const timedGroups = buildTimedItemGroupLayouts(gridDayItems, hourPx, item =>
                readTimesOrAllDaySpan(item, readTimesFromCalendarItem)
              )

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
                      const groupedPrograms = group.items
                        .map(it => (isProgramOriginal(it.original) ? it.original : null))
                        .filter((p): p is Program => p != null)
                      const uniquePrograms = Array.from(
                        new Map(groupedPrograms.map(p => [String(p.id), p])).values()
                      )
                      const preview =
                        uniquePrograms.length > 0 ? (
                          <CalendarCellSchedulePreview
                            date={date}
                            items={uniquePrograms}
                            colorMap={colorMap}
                          />
                        ) : (
                          <div className="program-preview">
                            <div className="program-preview-item program-preview-item--stack">
                              <span
                                className="program-preview-item__title"
                                style={{ color: colors.text }}
                              >
                                {weekTimeGridItemLabel(item)}
                              </span>
                            </div>
                          </div>
                        )
                      const pos: CSSProperties & Record<string, string | number> = {
                        ...buildWeekTimeGridGroupStyle(group),
                        zIndex: 20 + idx,
                        '--calendar-week-event-overlay-bg': colors.bg,
                        border: `1px solid ${colors.border}`,
                      }
                      const displayTitle = item.title ?? weekTimeGridItemLabel(item)
                      const subtext = resolveWeekTimeGridSubtext(
                        item,
                        group.items.length,
                        readTimesFromCalendarItem
                      )
                      const isAllDay = isAllDayScheduleSpan(item, readTimesFromCalendarItem)
                      return (
                        <Fragment
                          key={`${String(item.id)}-${group.startM}-${group.endM}-${group.items.length}`}
                        >
                          {withScheduleOverlay(
                            <div className="calendar-event-tooltip-trigger">
                              <div
                                className={[
                                  'calendar-week-time-grid__event',
                                  'calendar-event',
                                  'calendar-week-time-grid__event--timed',
                                  isAllDay ? 'calendar-week-time-grid__event--all-day' : '',
                                ]
                                  .filter(Boolean)
                                  .join(' ')}
                                style={pos}
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
                                <WeekTimeGridEventText
                                  title={displayTitle}
                                  subtext={subtext}
                                  textColor={colors.text}
                                />
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
