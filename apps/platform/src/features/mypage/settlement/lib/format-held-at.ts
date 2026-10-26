import { pad2 } from './date-keys.ts'

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const

function formatClock(date: Date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

export function formatSettlementHeldAt(startsAt: string, endsAt: string): string {
  const start = new Date(startsAt)
  const end = new Date(endsAt)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '-'
  const weekday = WEEKDAYS[start.getDay()]
  return `${start.getFullYear()}년 ${pad2(start.getMonth() + 1)}월 ${pad2(start.getDate())}일(${weekday}) ${formatClock(start)}~${formatClock(end)}`
}
