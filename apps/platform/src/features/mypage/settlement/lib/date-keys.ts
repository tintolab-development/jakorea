export function pad2(value: number) {
  return String(value).padStart(2, '0')
}

export function formatMonthKey(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`
}

export function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
}

export function parseMonthKey(month: string): Date | null {
  const match = /^(\d{4})-(\d{2})$/.exec(month)
  if (!match) return null
  const year = Number(match[1])
  const monthIndex = Number(match[2]) - 1
  if (!Number.isFinite(year) || monthIndex < 0 || monthIndex > 11) return null
  return new Date(year, monthIndex, 1)
}

export function parseDateKey(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const year = Number(match[1])
  const monthIndex = Number(match[2]) - 1
  const day = Number(match[3])
  const date = new Date(year, monthIndex, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== monthIndex ||
    date.getDate() !== day
  ) {
    return null
  }
  return date
}

export function isoDateKey(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return formatDateKey(date)
}

export function isDateInMonth(date: Date, monthKey: string) {
  return formatMonthKey(date) === monthKey
}

export function defaultDateInMonth(monthKey: string, today = new Date()) {
  if (isDateInMonth(today, monthKey)) return formatDateKey(today)
  return `${monthKey}-01`
}

export function monthNumberFromKey(monthKey: string) {
  const parsed = parseMonthKey(monthKey)
  if (!parsed) return null
  return parsed.getMonth() + 1
}

export function formatMonthHeadingTitle(monthKey: string) {
  const parsed = parseMonthKey(monthKey)
  if (!parsed) return '정산 현황'
  return `${parsed.getFullYear()}년 ${parsed.getMonth() + 1}월 정산 현황`
}

export function formatMonthHeading(monthKey: string, count: number) {
  return `${formatMonthHeadingTitle(monthKey)} ${count}건`
}

export function formatMonthPaidLabel(monthKey: string) {
  const monthNumber = monthNumberFromKey(monthKey)
  return monthNumber == null ? '정산 완료금' : `${monthNumber}월 정산 완료금`
}

export function formatMonthExpectedLabel(monthKey: string) {
  const monthNumber = monthNumberFromKey(monthKey)
  return monthNumber == null ? '정산 예정금' : `${monthNumber}월 정산 예정금`
}

export function formatCalendarMonthLabel(monthKey: string) {
  const parsed = parseMonthKey(monthKey)
  if (!parsed) return monthKey
  return `${parsed.getFullYear()}. ${pad2(parsed.getMonth() + 1)}`
}
