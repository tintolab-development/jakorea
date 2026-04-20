import { useCallback, useMemo, useState } from 'react'
import { Spin } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import type { Program } from '@/types/domain'
import { buildResolvedScheduleColorMapForPrograms } from '@/features/program/ui/program-schedule-colors'
import { CalendarMain } from './calendar-main'
import { CalendarMini } from './calendar-mini'
import { CalendarSearch } from './calendar-search'
import { CalendarSubRightList } from './calendar-sub-right-list'
import './calendar.css'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

interface CalendarSetMainProps {
  items: Program[]
  loading?: boolean
  onItemClick: (item: Program) => void
}

function useCalendarUIState() {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs().startOf('month'))
  const [calendarMode, setCalendarMode] = useState<'month' | 'week'>('month')

  const handleDateSelect = useCallback((date: Dayjs) => {
    setSelectedDate(date)
    setCurrentMonth(prevMonth =>
      date.isSame(prevMonth, 'month') ? prevMonth : date.startOf('month')
    )
  }, [])

  const handleMonthChange = useCallback((month: Dayjs) => {
    setCurrentMonth(month)
  }, [])

  const onModeChange = useCallback((mode: 'month' | 'week') => {
    setCalendarMode(mode)
  }, [])

  return {
    selectedDate,
    currentMonth,
    calendarMode,
    handleDateSelect,
    handleMonthChange,
    onModeChange,
  }
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
    calendarMode,
    handleDateSelect,
    handleMonthChange,
    onModeChange,
  } = useCalendarUIState()
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
        <div className="calendar-mini">
          <CalendarMini
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            onMonthChange={handleMonthChange}
            onSelectDate={handleDateSelect}
            programDates={programDates}
          />
        </div>
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
          onSelectDate={handleDateSelect}
          onMonthChange={handleMonthChange}
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
