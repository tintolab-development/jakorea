import { useDebouncedValue } from '@/shared/hooks/use-debounced-value'
import { useCallback, useMemo, useState, type Key, type ReactNode } from 'react'
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
  buildResolvedScheduleColorMapForPrograms,
  type ScheduleColorPair,
} from '@/features/program/shared/ui/program-schedule-colors'
import { useAdminProgramCalendarQuery } from '../api/program-calendar-query'
import type { AdminProgramCalendarQuery } from '../api/program-calendar-api-client'
import {
  getGeneralProgramCalendarEventFromCalendarItem,
  mapAdminProgramCalendarItemsToEvents,
  resolveGeneralProgramMonthEventLabel,
  resolveProgramCalendarDisplayColors,
} from '../lib/program-calendar-events'
import {
  mapProgramListViewToCalendarProgramStatus,
  resolveProgramCalendarVisibleRange,
} from '../lib/program-calendar-range'
import type { ProgramListView } from './table/program-table-column-resolver'
import '@/shared/components/calendar/styles/calendar.css'
import './program-calendar-view.css'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

interface ProgramCalendarViewProps {
  loading?: boolean
  onItemClick: (program: Program) => void
  view?: ProgramListView
  /** BE `programType`. 예: GENERAL, COMPANY_SCHOOL, TRAINED_TEACHER */
  calendarProgramType?: string
  /** 목록 필터의 프로그램명. 캘린더 검색이 비어 있을 때 API keyword로 보낸다 */
  listKeyword?: string
  /** 3열 grid 1행 — 프로그램 목록 툴바 등 */
  toolbar?: ReactNode
  selectedProgramIds?: Key[]
  onProgramSelectionChange?: (keys: Key[]) => void
}

function renderGeneralProgramMonthEventContent({
  row,
}: {
  row: { sourceEvent: CalendarItem }
}) {
  const event = getGeneralProgramCalendarEventFromCalendarItem(row.sourceEvent)
  return (
    <span className="calendar-event-title">
      {resolveGeneralProgramMonthEventLabel(event, row.sourceEvent.title)}
    </span>
  )
}

function useProgramCalendarSelection() {
  const [calendarSearchKeyword, setCalendarSearchKeyword] = useState('')
  const [calendarProgramSelection, setCalendarProgramSelection] = useState<string[] | null>(null)

  const handleProgramFilterChange = useCallback((programId: string, checked: boolean, allIds: string[]) => {
    setCalendarProgramSelection(prev => {
      const base = prev ?? allIds
      const next = checked
        ? [...new Set([...base, programId])]
        : base.filter(id => id !== programId)
      const allSelected = next.length === allIds.length && allIds.every(id => next.includes(id))
      return allSelected ? null : next
    })
  }, [])

  return {
    calendarSearchKeyword,
    calendarProgramSelection,
    handleProgramFilterChange,
    onKeywordChange: setCalendarSearchKeyword,
  }
}

export function ProgramCalendarView({
  loading,
  onItemClick,
  view = 'ALL',
  calendarProgramType,
  listKeyword,
  toolbar,
  selectedProgramIds,
  onProgramSelectionChange,
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
    calendarProgramSelection,
    handleProgramFilterChange,
    onKeywordChange,
  } = useProgramCalendarSelection()

  const visibleRange = useMemo(
    () => resolveProgramCalendarVisibleRange(calendarMode, currentMonth),
    [calendarMode, currentMonth]
  )
  // 검색창 입력은 300ms 멈춘 뒤에만 API 키에 반영한다 — 한 글자마다 캘린더를 다시 조회하지 않는다.
  const debouncedCalendarSearchKeyword = useDebouncedValue(calendarSearchKeyword, 300)
  const apiKeyword = debouncedCalendarSearchKeyword.trim() || listKeyword?.trim() || undefined
  const calendarQueryParams = useMemo((): AdminProgramCalendarQuery => {
    return {
      includeOperationalEvents: true,
      startDate: visibleRange.startDate,
      endDate: visibleRange.endDate,
      programType: calendarProgramType?.trim() || undefined,
      programStatus: mapProgramListViewToCalendarProgramStatus(view),
      keyword: apiKeyword,
    }
  }, [apiKeyword, calendarProgramType, view, visibleRange.endDate, visibleRange.startDate])

  const calendarQuery = useAdminProgramCalendarQuery(calendarQueryParams, true)
  const calendarItems = calendarQuery.data ?? []

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

  const allEvents = useMemo(
    () => mapAdminProgramCalendarItemsToEvents(calendarItems),
    [calendarItems]
  )
  const handleCalendarEventClick = useCallback(
    (item: CalendarItem) => {
      const event = getGeneralProgramCalendarEventFromCalendarItem(item)
      if (event) onItemClick(event.originalItem)
    },
    [onItemClick]
  )

  const programFilterOptions = useMemo(() => {
    const seen = new Map<string, string>()
    for (const event of allEvents) {
      if (!event.programId || seen.has(event.programId)) continue
      seen.set(event.programId, event.programTitle)
    }
    return [...seen.entries()]
      .map(([id, title]) => ({ id, title }))
      .sort((a, b) => a.title.localeCompare(b.title, 'ko'))
  }, [allEvents])

  const allProgramIds = useMemo(
    () => programFilterOptions.map(option => option.id),
    [programFilterOptions]
  )
  const effectiveProgramSelection = calendarProgramSelection ?? allProgramIds

  const events = useMemo(() => {
    if (calendarProgramSelection === null) return allEvents
    if (calendarProgramSelection.length === 0) return []
    const selected = new Set(calendarProgramSelection)
    return allEvents.filter(event => selected.has(event.programId))
  }, [allEvents, calendarProgramSelection])
  const selectedProgramIdSet = useMemo(
    () => new Set((selectedProgramIds ?? []).map(String)),
    [selectedProgramIds]
  )
  const selectedCalendarEventIds = useMemo(
    () =>
      events
        .filter(event => selectedProgramIdSet.has(event.programId))
        .map(event => event.id),
    [events, selectedProgramIdSet]
  )

  const eventDateSet = useMemo(() => {
    const dates = new Set<string>()
    for (const event of events) {
      const start = dayjs(event.startDate)
      const end = dayjs(event.endDate)
      if (!start.isValid() || !end.isValid()) continue
      let cursor = start.startOf('day')
      const last = end.startOf('day')
      while (cursor.isSameOrBefore(last, 'day')) {
        dates.add(cursor.format('YYYY-MM-DD'))
        cursor = cursor.add(1, 'day')
      }
    }
    return dates
  }, [events])

  const programsForColorMap = useMemo(
    () => programFilterOptions.map(option => ({ id: option.id }) as Program),
    [programFilterOptions]
  )
  const programColorMap = useMemo(
    () => buildResolvedScheduleColorMapForPrograms(programsForColorMap),
    [programsForColorMap]
  )
  const overrideEventColorMap = useCallback(
    (dayEvents: CalendarItem[]) => {
      const map = new Map<string | number, ScheduleColorPair>()
      dayEvents.forEach(item => {
        const event = getGeneralProgramCalendarEventFromCalendarItem(item)
        map.set(item.id, resolveProgramCalendarDisplayColors(event?.programId, programColorMap))
      })
      return map
    },
    [programColorMap]
  )
  const resolveEventColors = useCallback(
    (event: CalendarGeneralProgramEventListRow) =>
      resolveProgramCalendarDisplayColors(event.programId, programColorMap),
    [programColorMap]
  )

  const onOptionToggle = useCallback(
    (programId: string, checked: boolean) => {
      handleProgramFilterChange(programId, checked, allProgramIds)
    },
    [allProgramIds, handleProgramFilterChange]
  )

  if (loading || calendarQuery.isLoading) {
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
          onOptionToggle={onOptionToggle}
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
          selectedRowKeys={selectedCalendarEventIds}
          onEventClick={handleCalendarEventClick}
          previewTooltipContent={renderGeneralProgramCalendarPreviewTooltipContent}
          renderMonthEventContent={renderGeneralProgramMonthEventContent}
          overrideEventColorMap={overrideEventColorMap}
          eventsTooltipTrigger="cell"
          eventsTooltipScope="full-day"
          formatEventsOverflowText={hiddenCount => `외 ${hiddenCount}개의 항목`}
          formatWeekEventsOverflowText={hiddenCount => `외 ${hiddenCount}개의 항목`}
        />
      </div>
      <div className="calendar-sub-right-list">
        <CalendarSubRightGeneralProgramEventList
          selectedDate={selectedDate}
          events={events}
          onEventClick={onItemClick}
          resolveEventColors={resolveEventColors}
          selectedProgramIds={selectedProgramIds}
          onProgramSelectionChange={onProgramSelectionChange}
        />
      </div>
    </div>
  )
}
