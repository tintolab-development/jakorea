import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'

dayjs.extend(customParseFormat)

const TIME_FORMATS = ['HH:mm', 'H:mm', 'HH:mm:ss', 'H:mm:ss'] as const

function parseTimeValue(raw: string): dayjs.Dayjs | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  for (const format of TIME_FORMATS) {
    const parsed = dayjs(trimmed, format, true)
    if (parsed.isValid()) return parsed
  }

  const loose = dayjs(`2000-01-01 ${trimmed}`)
  return loose.isValid() ? loose : null
}

/** 연수 시작~종료 시간 차이(시간 단위 정수, 최소 1) */
export function calculateTrainingHours(startTime: string, endTime: string): number {
  const start = parseTimeValue(startTime)
  const end = parseTimeValue(endTime)
  if (!start || !end) return 0

  const diffMinutes = end.diff(start, 'minute')
  if (diffMinutes <= 0) return 0

  return Math.max(1, Math.round(diffMinutes / 60))
}

export function formatDetailTimeText(startTime: string, endTime: string): string {
  const start = parseTimeValue(startTime)
  const end = parseTimeValue(endTime)
  const startText = start ? start.format('HH:mm') : startTime.trim()
  const endText = end ? end.format('HH:mm') : endTime.trim()
  return `${startText}~${endText}`
}
