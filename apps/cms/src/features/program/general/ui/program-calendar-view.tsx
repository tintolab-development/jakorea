import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { Spin } from 'antd'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import type { Program } from '@/types/domain'
import {
  CalendarMain,
  CalendarMini,
  CalendarSearch,
  CalendarSubRightGeneralProgramEventList,
  type CalendarGeneralProgramEventListRow,
  type CalendarItem,
  renderGeneralProgramCalendarPreviewTooltipContent,
} from '@/shared/components/calendar'
import { useCalendarNavigationState } from '@/shared/components/calendar/lib/use-calendar-navigation-state'
import {
  SCHEDULE_COLORS,
  buildResolvedScheduleColorMapForPrograms,
  type ScheduleColorPair,
} from '@/features/program/shared/ui/program-schedule-colors'
import {
  buildGeneralProgramCalendarEvents,
  getGeneralProgramCalendarEventFromCalendarItem,
  type GeneralProgramCalendarView,
} from '../lib/program-calendar-events'
import '@/shared/components/calendar/styles/calendar.css'
import './program-calendar-view.css'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

interface ProgramCalendarViewProps {
  items: Program[]
  loading?: boolean
  onItemClick: (program: Program) => void
  view?: GeneralProgramCalendarView
  /** 3열 grid 1행 — 프로그램 목록 툴바 등 */
  toolbar?: ReactNode
}

function renderGeneralProgramMonthEventContent({
  row,
}: {
  row: { sourceEvent: CalendarItem }
}) {
  const event = getGeneralProgramCalendarEventFromCalendarItem(row.sourceEvent)
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

export function ProgramCalendarView({
  items,
  loading,
  onItemClick,
  view = 'ALL',
  toolbar,
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
    calendarSearchKeyword,
    programFilterOptions,
    effectiveProgramSelection,
    filteredPrograms,
    handleProgramFilterChange,
    onKeywordChange,
  } = useProgramCalendarFilter(items)

  const handleMiniDateSelect = useCallback(
    (date: dayjs.Dayjs) => {
      handleMainDateSelect(date)
    },
    [handleMainDateSelect]
  )

  const handleMiniMonthChange = useCallback(
    (month: dayjs.Dayjs) => {
      handleMainMonthChange(month)
    },
    [handleMainMonthChange]
  )

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
        const event = getGeneralProgramCalendarEventFromCalendarItem(item)
        map.set(item.id, programColorMap.get(event?.programId ?? '') ?? SCHEDULE_COLORS[0])
      })
      return map
    },
    [programColorMap]
  )
  const resolveEventColors = useCallback(
    (event: CalendarGeneralProgramEventListRow) =>
      programColorMap.get(event.programId) ?? SCHEDULE_COLORS[0],
    [programColorMap]
  )

  if (loading) {
    return (
      <div className="calendar-view calendar-view--loading">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div
      className={[
        'calendar-set',
        'calendar-set--shell-shadow',
        toolbar ? 'calendar-set--with-toolbar' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {toolbar ? <div className="calendar-set__toolbar">{toolbar}</div> : null}
      <div className="calendar-sub-left">
        <CalendarMini
          currentMonth={currentMonth}
          selectedDate={selectedDate}
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
          previewTooltipContent={renderGeneralProgramCalendarPreviewTooltipContent}
          renderMonthEventContent={renderGeneralProgramMonthEventContent}
          overrideEventColorMap={overrideEventColorMap}
          eventsTooltipTrigger="cell"
          eventsTooltipScope="full-day"
          formatEventsOverflowText={hiddenCount => `외 ${hiddenCount}개의 일정`}
        />
      </div>
      <div className="calendar-sub-right-list">
        <CalendarSubRightGeneralProgramEventList
          selectedDate={selectedDate}
          events={events}
          onEventClick={onItemClick}
          resolveEventColors={resolveEventColors}
        />
      </div>
    </div>
  )
}
