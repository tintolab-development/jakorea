/**
 * 강의 진행 가능일 등 요약 문구: 교시·차시 문구는 빼고 시각만 노출.
 * 예: `1교시 - 3교시 (9:20 - 12:00)` → `9:20 ~ 12:00`
 *
 * 우선 문자열에 포함된 **마지막** `(...)` 안을 시각 구간으로 보고,
 * 없으면 `HH:mm - HH:mm` 패턴만 추출한다.
 */
export function extractClockTimeRangeForScheduleSummary(timeRange: string): string {
  const trimmed = timeRange.trim()
  let lastParenContent: string | undefined
  for (const m of trimmed.matchAll(/\(([^)]+)\)/g)) {
    lastParenContent = m[1]?.trim()
  }
  if (lastParenContent != null && /\d{1,2}:\d{2}/.test(lastParenContent)) {
    return lastParenContent.replace(/–/g, '-').replace(/\s*-\s*/, ' ~ ')
  }
  const direct = trimmed.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/)
  if (direct) {
    return `${direct[1]} ~ ${direct[2]}`
  }
  return trimmed.replace(/–/g, '-').replace(/\s*-\s*/, ' ~ ')
}
