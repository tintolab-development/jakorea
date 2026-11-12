/**
 * 알림 발송 「발표일에 맞춰서」 — 발표일 경과 여부 (CMS-FUNC-0075·0076·0102·0103·0107·0112).
 * 모든 프로그램 유형·승인·반려·일괄·심사 팝업 공통: 발표일이 지났으면 해당 라디오를 비활성한다.
 *
 * 발표일 값은 GET `recruitments[].finalPassAnnouncementAt`(Instant). 기준은 서울 시간이다.
 * - 서울 00:00:00이면 날짜만 지정한 발표일로 본다 → 서울 날짜가 발표일보다 뒤일 때 경과.
 * - 그 외 시각이 있으면 그 시각이 지났을 때 경과.
 * 값이 없거나 해석할 수 없으면 경과로 보지 않는다. 미설정 비활성은 `isNotifyAnnouncementOptionDisabled`.
 */

const SEOUL_PARTS_FORMAT = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
})

function seoulParts(date: Date): { dateKey: string; isMidnight: boolean } {
  const parts = SEOUL_PARTS_FORMAT.formatToParts(date)
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(part => part.type === type)?.value ?? ''
  const dateKey = `${value('year')}-${value('month')}-${value('day')}`
  const isMidnight = value('hour') === '00' && value('minute') === '00' && value('second') === '00'
  return { dateKey, isMidnight }
}

/** `YYYY-MM-DD`만 오면 서울 그날 00:00, Instant·offset 문자열은 그대로 해석한다 */
function parseAnnouncementAt(raw: string): Date | null {
  const text = raw.trim()
  if (!text) return null
  const date = /^\d{4}-\d{2}-\d{2}$/.test(text) ? new Date(`${text}T00:00:00+09:00`) : new Date(text)
  return Number.isNaN(date.getTime()) ? null : date
}

export function isNotifyAnnouncementPassed(
  announcementAt: string | null | undefined,
  now: Date = new Date()
): boolean {
  if (typeof announcementAt !== 'string') return false
  const at = parseAnnouncementAt(announcementAt)
  if (!at) return false
  const atParts = seoulParts(at)
  if (atParts.isMidnight) {
    return seoulParts(now).dateKey > atParts.dateKey
  }
  return now.getTime() > at.getTime()
}

/**
 * 「발표일에 맞춰서」 비활성 여부 — 발표일을 아는 화면(Provider·prop) 기준.
 * 발표일이 null(미설정·행 값이 서로 달라 판단 불가)이거나 해석할 수 없거나 지났으면 비활성.
 */
export function isNotifyAnnouncementOptionDisabled(
  announcementAt: string | null | undefined,
  now: Date = new Date()
): boolean {
  if (typeof announcementAt !== 'string' || !parseAnnouncementAt(announcementAt)) return true
  return isNotifyAnnouncementPassed(announcementAt, now)
}
