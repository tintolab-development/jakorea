const SEOUL_ISO_DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function toSeoulIsoDate(input: string | null | undefined): string {
  const trimmed = input?.trim() ?? ''
  if (!trimmed) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) return ''
  return SEOUL_ISO_DATE.format(date)
}

/** 사업 운영 종료일 23:59:59 Asia/Seoul */
export function seoulBusinessEndDeadlineAt(date: string | null | undefined): string | undefined {
  const iso = toSeoulIsoDate(date)
  if (!iso) return undefined
  return `${iso}T23:59:59+09:00`
}

export function createSettlementIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `settlement-${Date.now()}-${Math.random().toString(36).slice(2)}`
}
