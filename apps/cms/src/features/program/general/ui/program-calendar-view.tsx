import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { Empty } from 'antd'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import type { Program } from '@/types/domain'
import {
  CalendarMain,
  CalendarMini,
  CalendarSearch,
  type CalendarItem,
} from '@/shared/components/calendar'
import { useCalendarNavigationState } from '@/shared/components/calendar/lib/use-calendar-navigation-state'
import { useCalendarMiniState } from '@/shared/components/calendar/lib/use-calendar-mini-state'
import {
  SCHEDULE_COLORS,
  buildResolvedScheduleColorMapForPrograms,
  type ScheduleColorPair,
} from '@/features/program/shared/ui/program-schedule-colors'
import { DividerVertical } from '@/shared/components/divider-vertical'
import {
  buildGeneralProgramCalendarEvents,
  type GeneralProgramCalendarEvent,
  type GeneralProgramCalendarView,
} from '../lib/program-calendar-events'
import '@/shared/components/calendar/styles/calendar.css'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

interface ProgramCalendarViewProps {
  items: Program[]
  loading?: boolean
  onItemClick: (program: Program) => void
  view?: GeneralProgramCalendarView
}

function getCalendarEvent(item: CalendarItem): GeneralProgramCalendarEvent | null {
  const original = item.original
  if (
    original != null &&
    typeof original === 'object' &&
    'scheduleContent' in original &&
    'originalItem' in original
  ) {
    return original as GeneralProgramCalendarEvent
  }
  return null
}

function renderGeneralProgramPreviewTooltip({
  events,
  colorMap,
}: {
  events: CalendarItem[]
  colorMap: Map<string | number, ScheduleColorPair>
}): ReactNode {
  return (
    <div className="program-preview">
      {events.map(item => {
        const event = getCalendarEvent(item)
        const colors = colorMap.get(item.id) ?? SCHEDULE_COLORS[0]
        return (
          <button
            key={String(item.id)}
            type="button"
            className="program-preview-item program-preview-item--stack"
          >
            <span className="program-preview-item__title" style={{ color: colors.text }}>
              {event?.programTitle ?? item.title ?? '-'}
            </span>
            <span className="program-preview-item__desc">
              {event?.scheduleContent ?? '-'} | {event?.timeLabel ?? '종일'}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function renderGeneralProgramMonthEventContent({
  row,
}: {
  row: { sourceEvent: CalendarItem }
}) {
  const event = getCalendarEvent(row.sourceEvent)
  return <span className="calendar-event-title">{event?.programTitle ?? row.sourceEvent.title}</span>
}

function useProgramCalendarFilter(items: Program[]) {
  const [calendarSearchKeyword, setCalendarSearchKeyword] = useState('')
  const [calendarProgramSelection, setCalendarProgramSelection] = useState<string[] | null>(null)

  const normalizedKeyword = useMemo(
    () => calendarSearchKeyword.trim().toLowerCase(),
    [calendarSearchKeyword]
  )

  const allProgramIds = useMemo(() => items.map(program => String(program.id)), [items])

  const programFilterOptions = useMemo(() => {
    const keywordFiltered = normalizedKeyword
      ? items.filter(program => (program.title ?? '').toLowerCase().includes(normalizedKeyword))
      : items
    const sortedPrograms = [...keywordFiltered].sort((a, b) =>
      (a.title ?? '').localeCompare(b.title ?? '', 'ko')
    )
    return sortedPrograms.map(program => ({
      id: String(program.id),
      title: program.title?.trim() || '이름 없음',
    }))
  }, [items, normalizedKeyword])

  const effectiveProgramSelection = useMemo(
    () => calendarProgramSelection ?? allProgramIds,
    [calendarProgramSelection, allProgramIds]
  )

  const filteredPrograms = useMemo(() => {
    const keywordFiltered = normalizedKeyword
      ? items.filter(program => (program.title ?? '').toLowerCase().includes(normalizedKeyword))
      : items
    if (calendarProgramSelection === null) return keywordFiltered
    if (calendarProgramSelection.length === 0) return []

    const selectedSet = new Set(calendarProgramSelection)
    return keywordFiltered.filter(program => selectedSet.has(String(program.id)))
  }, [items, normalizedKeyword, calendarProgramSelection])

  const handleProgramFilterChange = useCallback(
    (programId: string, checked: boolean) => {
      const ids = items.map(program => String(program.id))
      setCalendarProgramSelection(prev => {
        const base = prev ?? ids
        const next = checked
          ? [...new Set([...base, programId])]
          : base.filter(id => id !== programId)
        const allSelected = next.length === ids.length && ids.every(id => next.includes(id))
        return allSelected ? null : next
      })
    },
    [items]
  )

  return {
    calendarSearchKeyword,
    programFilterOptions,
    effectiveProgramSelection,
    filteredPrograms,
    handleProgramFilterChange,
    onKeywordChange: setCalendarSearchKeyword,
  }
}

function ProgramCalendarScheduleList({
  selectedDate,
  events,
  programColorMap,
  onProgramClick,
}: {
  selectedDate: Dayjs
  events: GeneralProgramCalendarEvent[]
  programColorMap: Map<string | number, ScheduleColorPair>
  onProgramClick: (program: Program) => void
}) {
  const dayEvents = useMemo(() => {
    return events.filter(event => {
      const start = dayjs(event.startDate)
      const end = dayjs(event.endDate)
      return selectedDate.isSameOrAfter(start, 'day') && selectedDate.isSameOrBefore(end, 'day')
    })
  }, [events, selectedDate])

  return (
    <div className={dayEvents.length === 0 ? 'calendar-list calendar-list--empty' : 'calendar-list'}>
      {dayEvents.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="해당 날짜에 일정이 없습니다" />
      ) : (
        dayEvents.map(event => {
          const color = programColorMap.get(event.programId) ?? SCHEDULE_COLORS[0]
          return (
            <div
              key={event.id}
              className="calendar-list-item"
              data-has-color="true"
              style={{
                backgroundColor: color.bg,
                border: `1px solid ${color.border}`,
              }}
              onClick={() => onProgramClick(event.originalItem)}
            >
              <div className="calendar-list-item__column">
                <div className="calendar-list-item__head" title={event.programTitle}>
                  {event.programTitle}
                </div>
                <div className="calendar-list-item__desc">
                  <span>{event.scheduleContent}</span>
                  <DividerVertical height={12} />
                  <span>{event.timeLabel}</span>
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

export function ProgramCalendarView({
  items,
  loading,
  onItemClick,
  view = 'ALL',
}: ProgramCalendarViewProps) {
  const {
    selectedDate,
    currentMonth,
    mode: calendarMode,
    onSelectDate: handleMainDateSelect,
    onMonthChange: handleMainMonthChange,
    onModeChange,
  } = useCalendarNavigationState('month')
  const {
    selectedDate: miniSelectedDate,
    currentMonth: miniCurrentMonth,
    onSelectDate: handleMiniDateSelect,
    onMonthChange: handleMiniMonthChange,
  } = useCalendarMiniState()
  const {
    calendarSearchKeyword,
    programFilterOptions,
    effectiveProgramSelection,
    filteredPrograms,
    handleProgramFilterChange,
    onKeywordChange,
  } = useProgramCalendarFilter(items)

  const events = useMemo(
    () => buildGeneralProgramCalendarEvents(filteredPrograms, view),
    [filteredPrograms, view]
  )
  const eventDateSet = useMemo(
    () => new Set(events.map(event => dayjs(event.startDate).format('YYYY-MM-DD'))),
    [events]
  )
  const programColorMap = useMemo(
    () => buildResolvedScheduleColorMapForPrograms(filteredPrograms),
    [filteredPrograms]
  )
  const overrideEventColorMap = useCallback(
    (dayEvents: CalendarItem[]) => {
      const map = new Map<string | number, ScheduleColorPair>()
      dayEvents.forEach(item => {
        const event = getCalendarEvent(item)
        map.set(item.id, programColorMap.get(event?.programId ?? '') ?? SCHEDULE_COLORS[0])
      })
      return map
    },
    [programColorMap]
  )

  if (loading) {
    return (
      <div className="calendar-view calendar-view--loading">
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="캘린더를 불러오는 중입니다" />
      </div>
    )
  }

  return (
    <div className="calendar-set">
      <div className="calendar-sub-left">
        <CalendarMini
          currentMonth={miniCurrentMonth}
          selectedDate={miniSelectedDate}
          onMonthChange={handleMiniMonthChange}
          onSelectDate={handleMiniDateSelect}
          programDates={eventDateSet}
        />
        <CalendarSearch
          keyword={calendarSearchKeyword}
          options={programFilterOptions}
          selectedIds={effectiveProgramSelection}
          programColorMap={programColorMap}
          onKeywordChange={onKeywordChange}
          onOptionToggle={handleProgramFilterChange}
        />
      </div>
      <div className="calendar-main-container">
        <CalendarMain
          events={events}
          selectedDate={selectedDate}
          currentMonth={currentMonth}
          mode={calendarMode}
          onSelectDate={handleMainDateSelect}
          onMonthChange={handleMainMonthChange}
          onModeChange={onModeChange}
          previewTooltipContent={renderGeneralProgramPreviewTooltip}
          renderMonthEventContent={renderGeneralProgramMonthEventContent}
          overrideEventColorMap={overrideEventColorMap}
          eventsTooltipTrigger="cell"
          eventsTooltipScope="full-day"
          formatEventsOverflowText={hiddenCount => `외 ${hiddenCount}개의 일정`}
        />
      </div>
      <div className="calendar-sub-right-list">
        <ProgramCalendarScheduleList
          selectedDate={selectedDate}
          events={events}
          programColorMap={programColorMap}
          onProgramClick={onItemClick}
        />
      </div>
    </div>
  )
}
