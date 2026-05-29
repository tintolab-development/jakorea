import dayjs, { type Dayjs } from 'dayjs'

export type CalendarViewMode = 'month' | 'week'

export type CalendarNavigationState = {
  selectedDate: Dayjs
  /** 월간: 해당 월 1일. 주간: 선택일이 속한 주의 시작(week start). */
  viewAnchor: Dayjs
}

/** 초기 진입 — 선택일·표시 앵커 모두 실시간 오늘 기준 (모드에 맞는 앵커). */
export function createInitialCalendarNavigationState(
  mode: CalendarViewMode = 'month'
): CalendarNavigationState {
  const selectedDate = dayjs()
  return {
    selectedDate,
    viewAnchor: resolveViewAnchor(mode, selectedDate),
  }
}

export function resolveViewAnchor(mode: CalendarViewMode, selectedDate: Dayjs): Dayjs {
  return mode === 'week' ? selectedDate.startOf('week') : selectedDate.startOf('month')
}

/** 메인 CalendarMain 날짜 클릭 시 표시 앵커 동기화 (좌측 CalendarMini와 무관) */
export function syncViewAnchorOnDateSelect(
  mode: CalendarViewMode,
  date: Dayjs,
  currentAnchor: Dayjs
): Dayjs {
  if (mode === 'week') {
    return date.isSame(currentAnchor, 'week') ? currentAnchor : date.startOf('week')
  }
  return date.isSame(currentAnchor, 'month') ? currentAnchor : date.startOf('month')
}

/** 월간 ↔ 주간 전환 시 — 월간에서 보던 선택일(selectedDate) 기준으로 앵커만 맞춤 */
export function syncViewAnchorOnModeChange(
  nextMode: CalendarViewMode,
  selectedDate: Dayjs
): Dayjs {
  return resolveViewAnchor(nextMode, selectedDate)
}

/** [오늘] 버튼 */
export function goToTodayState(mode: CalendarViewMode): CalendarNavigationState {
  const selectedDate = dayjs()
  return {
    selectedDate,
    viewAnchor: resolveViewAnchor(mode, selectedDate),
  }
}

/** 월간 뷰 ◀▶ 이동 후 기본 선택일 — 해당 월 1일 */
export function resolveMonthDefaultFocusDate(monthViewAnchor: Dayjs): Dayjs {
  return monthViewAnchor.startOf('month')
}

/**
 * 주간 뷰 ◀▶ 이동 후 기본 선택일 — 해당 주 월요일.
 * 그리드·앵커는 dayjs `startOf('week')`(일요일) 기준이므로 +1일.
 */
export function resolveWeekDefaultFocusDate(weekViewAnchor: Dayjs): Dayjs {
  return weekViewAnchor.startOf('week').add(1, 'day')
}

/** 메인 캘린더 헤더 ◀▶ — 월간 ±1개월·주간 ±1주 + 모드별 기본 포커스일 */
export function shiftCalendarViewByStep(
  mode: CalendarViewMode,
  viewAnchor: Dayjs,
  direction: -1 | 1
): CalendarNavigationState {
  if (mode === 'week') {
    const nextAnchor = viewAnchor.add(direction, 'week').startOf('week')
    return {
      viewAnchor: nextAnchor,
      selectedDate: resolveWeekDefaultFocusDate(nextAnchor),
    }
  }
  const nextAnchor = viewAnchor.add(direction, 'month').startOf('month')
  return {
    viewAnchor: nextAnchor,
    selectedDate: resolveMonthDefaultFocusDate(nextAnchor),
  }
}

/**
 * 주간 모드 헤더 연·월 (`YYYY. MM`).
 * 주 시작(일요일)이 전월이면 `weekDates[0]`만 쓰면 5/1 선택 후에도 `2026.04`처럼 어긋남.
 */
export function resolveWeekViewHeaderTitle(
  selectedDate: Dayjs,
  weekDates: readonly Dayjs[]
): string {
  if (weekDates.length === 0) {
    return selectedDate.format('YYYY. MM')
  }
  const selectedInWeek = weekDates.some(d => d.isSame(selectedDate, 'day'))
  const anchor = selectedInWeek ? selectedDate : (weekDates[3] ?? weekDates[0])
  return anchor.format('YYYY. MM')
}
