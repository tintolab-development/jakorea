import { parsePerformanceTime } from './import-wire-values'

/** 연수 시작~종료 시간 차이(시간 단위 정수, 최소 1) */
export function calculateTrainingHours(startTime: string, endTime: string): number {
  const start = parsePerformanceTime(startTime)
  const end = parsePerformanceTime(endTime)
  if (!start || !end) return 0

  const diffMinutes = end.diff(start, 'minute')
  if (diffMinutes <= 0) return 0

  return Math.max(1, Math.round(diffMinutes / 60))
}

export function formatDetailTimeText(startTime: string, endTime: string): string {
  const start = parsePerformanceTime(startTime)
  const end = parsePerformanceTime(endTime)
  const startText = start ? start.format('HH:mm') : startTime.trim()
  const endText = end ? end.format('HH:mm') : endTime.trim()
  return `${startText}~${endText}`
}
