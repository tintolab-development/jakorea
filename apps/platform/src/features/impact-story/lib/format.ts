/** 목록 메타용 — 예: 2026년 08월 15일 */
export function formatPublishedAtLabel(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}년 ${m}월 ${d}일`
}

/** 상세 메타용 — 예: 2026년 08월 15일 오전 12:00 */
export function formatPublishedAtDetailLabel(iso: string): string {
  const date = new Date(iso)
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

export function detectStoryBodyFormat(body: string): 'html' | 'markdown' {
  if (/<[a-z][\s\S]*>/i.test(body)) return 'html'
  return 'markdown'
}
