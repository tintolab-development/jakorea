import dayjs from 'dayjs'

const dayShort = ['일', '월', '화', '수', '목', '금', '토']

export const formatDateRange = (start?: string | Date, end?: string | Date): string => {
  if (start == null || end == null) return '-'

  const s = dayjs(start)
  const e = dayjs(end)

  if (!s.isValid() || !e.isValid()) return '-'

  return `${s.format('YY.MM.DD')}(${dayShort[s.day()]}) ~ ${e.format('YY.MM.DD')}(${dayShort[e.day()]})`
}
