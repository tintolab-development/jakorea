import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DependencyList,
  type RefObject,
} from 'react'
import { Spin } from 'antd'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import type { Program } from '@/types/domain'
import { CalendarMain } from '@/features/calendar/ui/calendar-main/CalendarMain'
import { CalendarMini } from './calendar-mini'
import { CalendarSearch } from './calendar-search'
import { CalendarSubRightList } from './calendar-sub-right-list'
import './calendar-set.css'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

interface CalendarSetMainProps {
  programs: Program[]
  loading?: boolean
  onProgramClick: (program: Program) => void
}

function useCalendarUIState() {
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs())
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs().startOf('month'))
  const [calendarMode, setCalendarMode] = useState<'month' | 'week'>('month')

  const handleDateSelect = useCallback((date: Dayjs) => {
    setSelectedDate(date)
    setCurrentMonth(prevMonth => (date.isSame(prevMonth, 'month') ? prevMonth : date.startOf('month')))
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

function useCalendarFilter(programs: Program[]) {
  const [calendarSearchKeyword, setCalendarSearchKeyword] = useState('')
  const [calendarProgramSelection, setCalendarProgramSelection] = useState<string[] | null>(null)

  const normalizedKeyword = useMemo(() => calendarSearchKeyword.trim().toLowerCase(), [calendarSearchKeyword])

  const allProgramIds = useMemo(() => programs.map(program => program.id), [programs])

  const programFilterOptions = useMemo(() => {
    const keywordFiltered = normalizedKeyword
      ? programs.filter(program => (program.title ?? '').toLowerCase().includes(normalizedKeyword))
      : programs
    const sortedPrograms = [...keywordFiltered].sort((a, b) =>
      (a.title ?? '').localeCompare(b.title ?? '', 'ko')
    )
    return sortedPrograms.map(program => ({
      id: program.id,
      title: program.title?.trim() || '이름 없음',
    }))
  }, [programs, normalizedKeyword])

  const effectiveProgramSelection = useMemo(
    () => calendarProgramSelection ?? allProgramIds,
    [calendarProgramSelection, allProgramIds]
  )

  const handleProgramFilterChange = useCallback(
    (programId: string, checked: boolean) => {
      const ids = programs.map(program => program.id)
      setCalendarProgramSelection(prev => {
        const base = prev ?? ids
        const next = checked ? [...new Set([...base, programId])] : base.filter(id => id !== programId)
        const allSelected = next.length === ids.length && ids.every(id => next.includes(id))
        return allSelected ? null : next
      })
    },
    [programs]
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

function useCalendarPrograms(programs: Program[], keyword: string, selection: string[] | null) {
  const normalizedKeyword = useMemo(() => keyword.trim().toLowerCase(), [keyword])

  const filteredByCalendar = useMemo(() => {
    const keywordFiltered = normalizedKeyword
      ? programs.filter(program => (program.title ?? '').toLowerCase().includes(normalizedKeyword))
      : programs

    if (selection === null) return keywordFiltered
    if (selection.length === 0) return []

    const selectedIdSet = new Set(selection)
    return keywordFiltered.filter(program => selectedIdSet.has(program.id))
  }, [programs, normalizedKeyword, selection])

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

function useElementHeight(ref: RefObject<HTMLElement | null>, deps: DependencyList = []) {
  const [height, setHeight] = useState<number | null>(null)

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const updateHeight = () => {
      setHeight(element.offsetHeight)
    }

    updateHeight()

    let resizeObserver: ResizeObserver | undefined
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateHeight)
      resizeObserver.observe(element)
    }

    window.addEventListener('resize', updateHeight)
    return () => {
      resizeObserver?.disconnect()
      window.removeEventListener('resize', updateHeight)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, ...deps])

  return height
}

function CalendarSetMain({ programs, loading, onProgramClick }: CalendarSetMainProps) {
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
  } = useCalendarFilter(programs)
  const { filteredByCalendar, programDates } = useCalendarPrograms(
    programs,
    calendarSearchKeyword,
    calendarProgramSelection
  )
  const mainCalendarRef = useRef<HTMLDivElement>(null)
  const sidebarHeight = useElementHeight(mainCalendarRef, [calendarMode])

  if (loading) {
    return (
      <div className="program-calendar-view program-calendar-view--loading">
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
          onKeywordChange={onKeywordChange}
          onOptionToggle={handleProgramFilterChange}
        />
      </div>
      <div className="calendar-main">
        <CalendarMain
          ref={mainCalendarRef}
          programs={filteredByCalendar}
          selectedDate={selectedDate}
          currentMonth={currentMonth}
          mode={calendarMode}
          onSelectDate={handleDateSelect}
          onMonthChange={handleMonthChange}
          onModeChange={onModeChange}
          onProgramClick={onProgramClick}
        />
      </div>
      <div className="calendar-sub-right-list" style={sidebarHeight ? { height: sidebarHeight } : undefined}>
        <CalendarSubRightList
          selectedDate={selectedDate}
          programs={filteredByCalendar}
          onProgramClick={onProgramClick}
        />
      </div>
    </div>
  )
}

export const CalendarSet = Object.assign(() => null, {
  Main: CalendarSetMain,
})

export type { CalendarSetMainProps }

