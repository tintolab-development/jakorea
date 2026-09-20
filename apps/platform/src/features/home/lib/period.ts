const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

function parseBoundary(value: string, bound: 'start' | 'end'): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined

  const dateOnly = DATE_ONLY.exec(trimmed)
  if (dateOnly) {
    const year = Number(dateOnly[1])
    const month = Number(dateOnly[2]) - 1
    const day = Number(dateOnly[3])
    if (bound === 'start') return new Date(year, month, day, 0, 0, 0, 0).getTime()
    return new Date(year, month, day, 23, 59, 59, 999).getTime()
  }

  const ms = Date.parse(trimmed)
  return Number.isNaN(ms) ? undefined : ms
}

/** public 띠배너·팝업 기간. 필드가 없으면 서버 필터를 그대로 신뢰한다. 종료일은 해당 일자 포함. */
export function isWithinDisplayPeriod(
  start: string | undefined,
  end: string | undefined,
  nowMs: number = Date.now(),
): boolean {
  const startMs = start ? parseBoundary(start, 'start') : undefined
  const endMs = end ? parseBoundary(end, 'end') : undefined
  if (startMs != null && nowMs < startMs) return false
  if (endMs != null && nowMs > endMs) return false
  return true
}
