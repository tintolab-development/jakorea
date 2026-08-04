import dayjs from 'dayjs'
import 'dayjs/locale/ko'

dayjs.locale('ko')

/** YYYY. MM. DD(요일) HH:mm */
export function formatPopupDateTime(iso: string): string {
  const d = dayjs(iso)
  if (!d.isValid()) return iso
  const weekday = d.format('ddd')
  return `${d.format('YYYY. MM. DD')}(${weekday}) ${d.format('HH:mm')}`
}

/** 게시 기간 표시 */
export function formatPopupPeriod(startDate: string, endDate: string): string {
  const s = dayjs(startDate)
  const e = dayjs(endDate)
  if (!s.isValid() || !e.isValid()) return `${startDate} ~ ${endDate}`
  return `${s.format('YYYY.MM.DD')} ~ ${e.format('YYYY.MM.DD')}`
}

/** 오늘이 게시 기간 밖이면 true */
export function isPopupPeriodExpired(endDate: string, now = dayjs()): boolean {
  const end = dayjs(endDate).endOf('day')
  if (!end.isValid()) return false
  return now.isAfter(end)
}

export function isPopupPeriodActive(
  startDate: string,
  endDate: string,
  now = dayjs()
): boolean {
  const start = dayjs(startDate).startOf('day')
  const end = dayjs(endDate).endOf('day')
  if (!start.isValid() || !end.isValid()) return false
  return (now.isAfter(start) || now.isSame(start)) && (now.isBefore(end) || now.isSame(end))
}
