/** 목록용: 2026년 05월 08일 */
export function formatNoticePublishedAtLabel(isoDate: string): string {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return '-'

  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}년 ${m}월 ${d}일`
}

/** 상세 메타용 — 예: 2026년 01월 15일 오후 3:00 */
export function formatNoticePublishedAtDetailLabel(isoDate: string): string {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return '-'

  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hours24 = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const period = hours24 < 12 ? '오전' : '오후'
  const hours12 = hours24 % 12 || 12
  return `${y}년 ${m}월 ${d}일 ${period} ${hours12}:${minutes}`
}
