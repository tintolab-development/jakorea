/**
 * ISO 시각 → Asia/Seoul `YYYY.MM.DD HH:mm:ss`. null/invalid → "-"
 * sentAt/deliveredAt 대체 표시용으로 requestedAt을 넣지 말 것.
 */
export function formatDeliveryDateTimeSeoul(value: string | null | undefined): string {
  if (!value?.trim()) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(part => part.type === type)?.value ?? ''

  const year = get('year')
  const month = get('month')
  const day = get('day')
  const hour = get('hour')
  const minute = get('minute')
  const second = get('second')
  if (!year || !month || !day) return '-'
  return `${year}.${month}.${day} ${hour}:${minute}:${second}`
}
