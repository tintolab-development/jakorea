import dayjs from 'dayjs'

const dayShort = ['일', '월', '화', '수', '목', '금', '토']

/** 예: 2025. 12. 08(월) ~ 2026. 12. 30(수) — 점 뒤 공백·요일 붙임·~ 앞뒤 공백 유지 */
function formatDateWithWeekday(d: dayjs.Dayjs): string {
  return `${d.format('YYYY')}. ${d.format('MM')}. ${d.format('DD')}(${dayShort[d.day()]})`
}

export const formatDateRange = (start?: string | Date, end?: string | Date): string => {
  if (start == null || end == null) return '-'

  const s = dayjs(start)
  const e = dayjs(end)

  if (!s.isValid() || !e.isValid()) return '-'

  return `${formatDateWithWeekday(s)} ~ ${formatDateWithWeekday(e)}`
}
