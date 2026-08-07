export type CalendarDay = {
  date: Date
  day: number
  isCurrentMonth: boolean
  isToday: boolean
  weekday: number
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth()
}

export function addMonths(date: Date, amount: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1)
}

export function formatYearMonth(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}. ${month}`
}

/** Sunday-start grid covering the visible calendar month (4–6 weeks). */
export function getMonthGridDays(viewMonth: Date, today = new Date()): CalendarDay[] {
  const year = viewMonth.getFullYear()
  const month = viewMonth.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const startOffset = firstOfMonth.getDay() // 0 = Sunday
  const gridStart = new Date(year, month, 1 - startOffset)
  const todayStart = startOfDay(today)

  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + index)
    return {
      date,
      day: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
      isToday: isSameDay(date, todayStart),
      weekday: date.getDay(),
    }
  })

  let weekCount = 6
  while (weekCount > 4) {
    const weekStart = (weekCount - 1) * 7
    const week = days.slice(weekStart, weekStart + 7)
    if (week.every(day => !day.isCurrentMonth)) {
      weekCount -= 1
      continue
    }
    break
  }

  return days.slice(0, weekCount * 7)
}
