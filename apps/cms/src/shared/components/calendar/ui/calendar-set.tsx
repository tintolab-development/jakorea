import { useCallback, useMemo, useState } from 'react'
import { Spin } from 'antd'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import type { Program } from '@/types/domain'
import { buildResolvedScheduleColorMapForPrograms } from '@/features/program/shared/ui/program-schedule-colors'
import { useCalendarNavigationState } from '../lib/use-calendar-navigation-state'
import { useCalendarMiniState } from '../lib/use-calendar-mini-state'
import { CalendarMain } from './calendar-main'
import { CalendarMini } from './calendar-mini'
import { CalendarSearch } from './calendar-search'
import { CalendarSubRightList } from './calendar-sub-right-list'
import '../styles/calendar.css'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

interface CalendarSetMainProps {
  items: Program[]
  loading?: boolean
  onItemClick: (item: Program) => void
}

function useCalendarFilter(items: Program[]) {
  const [calendarSearchKeyword, setCalendarSearchKeyword] = useState('')
  const [calendarProgramSelection, setCalendarProgramSelection] = useState<string[] | null>(null)

  const normalizedKeyword = useMemo(
    () => calendarSearchKeyword.trim().toLowerCase(),
    [calendarSearchKeyword]
  )

  const allProgramIds = useMemo(() => items.map(program => program.id), [items])

  const programFilterOptions = useMemo(() => {
    const keywordFiltered = normalizedKeyword
      ? items.filter(program => (program.title ?? '').toLowerCase().includes(normalizedKeyword))
      : items
    const sortedPrograms = [...keywordFiltered].sort((a, b) =>
      (a.title ?? '').localeCompare(b.title ?? '', 'ko')
    )
    return sortedPrograms.map(program => ({
      id: program.id,
      title: program.title?.trim() || '이름 없음',
    }))
  }, [items, normalizedKeyword])

  const effectiveProgramSelection = useMemo(
    () => calendarProgramSelection ?? allProgramIds,
    [calendarProgramSelection, allProgramIds]
  )

  const handleProgramFilterChange = useCallback(
    (programId: string, checked: boolean) => {
      const ids = items.map(program => program.id)
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

  const onKeywordChange = useCallback((value: string) => {
    setCalendarSearchKeyword(value)
  }, [])

  return {
    calendarSearchKeyword,
    calendarProgramSelection,
    programFilterOptions,
    effectiveProgramSelection,
    handleProgramFilterChange,
    onKeywordChange,
  }
}

function useCalendarPrograms(items: Program[], keyword: string, selection: string[] | null) {
  const normalizedKeyword = useMemo(() => keyword.trim().toLowerCase(), [keyword])

  const filteredByCalendar = useMemo(() => {
    const keywordFiltered = normalizedKeyword
      ? items.filter(program => (program.title ?? '').toLowerCase().includes(normalizedKeyword))
      : items

    if (selection === null) return keywordFiltered
    if (selection.length === 0) return []

    const selectedIdSet = new Set(selection)
    return keywordFiltered.filter(program => selectedIdSet.has(program.id))
  }, [items, normalizedKeyword, selection])

  const programDates = useMemo(() => {
    const dates = new Set<string>()
    filteredByCalendar.forEach(program => {
      const start = dayjs(program.startDate)
      const end = dayjs(program.endDate)
      let current = start

      while (current.isSameOrBefore(end, 'day')) {
        dates.add(current.format('YYYY-MM-DD'))
        current = current.add(1, 'day')
      }

      if (program.applicationStartDate && program.applicationEndDate) {
        const appStart = dayjs(program.applicationStartDate)
        const appEnd = dayjs(program.applicationEndDate)
        let appCurrent = appStart

        while (appCurrent.isSameOrBefore(appEnd, 'day')) {
          dates.add(appCurrent.format('YYYY-MM-DD'))
          appCurrent = appCurrent.add(1, 'day')
        }
      }
    })
    return dates
  }, [filteredByCalendar])

  return { filteredByCalendar, programDates }
}

function CalendarSetMain({ items, loading, onItemClick }: CalendarSetMainProps) {
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
    calendarProgramSelection,
    programFilterOptions,
    effectiveProgramSelection,
    handleProgramFilterChange,
    onKeywordChange,
  } = useCalendarFilter(items)
  const { filteredByCalendar, programDates } = useCalendarPrograms(
    items,
    calendarSearchKeyword,
    calendarProgramSelection
  )
  const programScheduleColorMap = useMemo(
    () => buildResolvedScheduleColorMapForPrograms(filteredByCalendar),
    [filteredByCalendar]
  )
  if (loading) {
    return (
      <div className="calendar-view calendar-view--loading">
        <Spin size="large" />
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
          programDates={programDates}
        />
        <CalendarSearch
          keyword={calendarSearchKeyword}
          options={programFilterOptions}
          selectedIds={effectiveProgramSelection}
          programColorMap={programScheduleColorMap}
          onKeywordChange={onKeywordChange}
          onOptionToggle={handleProgramFilterChange}
        />
      </div>
      <div className="calendar-main-container">
        <CalendarMain
          items={filteredByCalendar}
          selectedDate={selectedDate}
          currentMonth={currentMonth}
          mode={calendarMode}
          onSelectDate={handleMainDateSelect}
          onMonthChange={handleMainMonthChange}
          onModeChange={onModeChange}
          onItemClick={onItemClick}
        />
      </div>
      <div className="calendar-sub-right-list">
        <CalendarSubRightList
          selectedDate={selectedDate}
          items={filteredByCalendar}
          onItemClick={onItemClick}
        />
      </div>
    </div>
  )
}

export const CalendarSet = Object.assign(() => null, {
  Main: CalendarSetMain,
})

export type { CalendarSetMainProps }
