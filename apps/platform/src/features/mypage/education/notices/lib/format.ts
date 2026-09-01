/** 안내사항 게시일 — 예: 2026년 01월 15일 오후 3:00 */
export function formatEducationNoticePublishedAt(isoDate: string): string {
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

/** 파일 업로드일 — 예: 2026년 01월 15일 */
export function formatEducationNoticeFileDate(isoDate: string): string {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return '-'

  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}년 ${m}월 ${d}일`
}

/** 파일 크기 — 1MB 이상은 반올림 MB, 미만은 KB */
export function formatEducationNoticeFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return ''
  const mb = bytes / (1024 * 1024)
  if (mb >= 1) return `${Math.round(mb)}MB`
  const kb = bytes / 1024
  return `${Math.max(1, Math.round(kb))}KB`
}

export function resolveEducationNoticeTitle(title: string, content: string): string {
  const trimmedTitle = title.trim()
  if (trimmedTitle.length > 0) return trimmedTitle
  const firstLine = content.split(/\n/)[0]?.trim() ?? ''
  return firstLine
}
