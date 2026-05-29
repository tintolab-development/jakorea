import { useCallback, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'

export type CalendarMiniState = {
  selectedDate: Dayjs
  /** 미니캘린더에 표시 중인 월 (해당 월 1일) */
  currentMonth: Dayjs
}

/** 좌측 CalendarMini 초기 state — 메인 캘린더와 별도 스냅샷 */
export function createInitialCalendarMiniState(
  initialDate: Dayjs = dayjs()
): CalendarMiniState {
  const selectedDate = initialDate
  return {
    selectedDate,
    currentMonth: selectedDate.startOf('month'),
  }
}

/**
 * 좌측 `CalendarMini` 전용 navigation state.
 * `CalendarMain`의 selectedDate / currentMonth / mode와 **연동하지 않음**.
 */
export function useCalendarMiniState(initialDate?: Dayjs) {
  const initial = createInitialCalendarMiniState(initialDate)
  const [selectedDate, setSelectedDate] = useState(initial.selectedDate)
  const [currentMonth, setCurrentMonth] = useState(initial.currentMonth)

  const onSelectDate = useCallback((date: Dayjs) => {
    setSelectedDate(date)
    setCurrentMonth(prev => (date.isSame(prev, 'month') ? prev : date.startOf('month')))
  }, [])

  const onMonthChange = useCallback((next: Dayjs) => {
    setCurrentMonth(next.startOf('month'))
  }, [])

  return {
    selectedDate,
    currentMonth,
    onSelectDate,
    onMonthChange,
    setSelectedDate,
    setCurrentMonth,
  }
}
