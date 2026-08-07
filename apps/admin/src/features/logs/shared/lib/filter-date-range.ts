import dayjs from 'dayjs'

/** ISO 시각이 [fromYmd, toYmd] 일자 범위(포함) 안인지 */
export function isIsoInDateRange(
  iso: string,
  fromYmd: string | null | undefined,
  toYmd: string | null | undefined
): boolean {
  const t = dayjs(iso)
  if (!t.isValid()) return false
  if (fromYmd) {
    const from = dayjs(fromYmd).startOf('day')
    if (t.isBefore(from)) return false
  }
  if (toYmd) {
    const to = dayjs(toYmd).endOf('day')
    if (t.isAfter(to)) return false
  }
  return true
}

export function includesIgnoreCase(haystack: string, needle: string): boolean {
  const n = needle.trim().toLowerCase()
  if (!n) return true
  return haystack.toLowerCase().includes(n)
}
