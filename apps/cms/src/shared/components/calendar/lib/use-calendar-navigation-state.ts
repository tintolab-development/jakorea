import { useCallback, useState } from 'react'
import type { Dayjs } from 'dayjs'
import {
  type CalendarViewMode,
  createInitialCalendarNavigationState,
  goToTodayState,
  syncViewAnchorOnDateSelect,
} from './calendar-navigation'

/**
 * CalendarMain과 함께 쓰는 선택일·표시 앵커(currentMonth)·모드 state.
 * `onModeChange`는 모드만 갱신 — 표시 앵커는 CalendarMain이 selectedDate 기준으로 동기화.
 */
export function useCalendarNavigationState(initialMode: CalendarViewMode = 'month') {
  const initial = createInitialCalendarNavigationState(initialMode)
  const [selectedDate, setSelectedDate] = useState<Dayjs>(initial.selectedDate)
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(initial.viewAnchor)
  const [mode, setMode] = useState<CalendarViewMode>(initialMode)

  const onSelectDate = useCallback(
    (date: Dayjs) => {
      setSelectedDate(date)
      setCurrentMonth(prev => syncViewAnchorOnDateSelect(mode, date, prev))
    },
    [mode]
  )

  const onMonthChange = useCallback((anchor: Dayjs) => {
    setCurrentMonth(anchor)
  }, [])

  const onModeChange = useCallback((nextMode: CalendarViewMode) => {
    setMode(nextMode)
  }, [])

  const onTodayClick = useCallback(() => {
    const next = goToTodayState(mode)
    setSelectedDate(next.selectedDate)
    setCurrentMonth(next.viewAnchor)
  }, [mode])

  return {
    selectedDate,
    currentMonth,
    mode,
    onSelectDate,
    onMonthChange,
    onModeChange,
    onTodayClick,
    setMode,
    setSelectedDate,
    setCurrentMonth,
  }
}
