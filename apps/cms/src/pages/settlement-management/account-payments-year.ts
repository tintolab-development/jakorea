import type { Dayjs } from 'dayjs'

/** 계좌 지급 확인 — 상단 연도 탭 URL 키 (`ap_detail`과 동일 prefix) */
export const AP_YEAR_PARAM = 'ap_year'

export function parseAccountPaymentsYearParam(
  raw: string | null | undefined,
  opts: { minYear: number; maxYear: number; fallback: number }
): number {
  const { minYear, maxYear, fallback } = opts
  const clampedFallback = Math.min(maxYear, Math.max(minYear, fallback))
  if (raw == null || !/^\d{4}$/.test(raw.trim())) return clampedFallback
  const y = Number(raw.trim())
  if (!Number.isFinite(y) || y < minYear || y > maxYear) return clampedFallback
  return y
}

/** 이체 예정일 구간의 연도만 교체(월·일 유지). null은 유지. */
export function shiftTransferDateRangeToYear(
  range: [Dayjs | null, Dayjs | null] | null | undefined,
  year: number
): [Dayjs | null, Dayjs | null] | null {
  if (range == null) return null
  const [start, end] = range
  return [
    start != null && start.isValid() ? start.year(year) : null,
    end != null && end.isValid() ? end.year(year) : null,
  ]
}
