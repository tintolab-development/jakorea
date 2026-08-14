/**
 * 방문자 통계 — OpenAPI ↔ 도메인 매핑
 */

import type {
  VisitorStatsQuery,
  VisitorStatsResult,
  VisitorStatsRow,
  VisitorStatsUnit,
} from '@/entities/visitor-stats/model/types'
import type { VisitorStatistics } from '@/shared/api/generated/statistics/schemas/visitorStatistics'
import type { VisitorsParams } from '@/shared/api/generated/statistics/schemas/visitorsParams'
import { VisitorsUnit } from '@/shared/api/generated/statistics/schemas/visitorsUnit'

/** FE mock / 시드와 동일한 연도 구간 */
export const VISITOR_STATS_SEED_FROM = '2022-01-01'
export const VISITOR_STATS_SEED_TO = '2026-07-31'

export const VISITOR_STATS_SEED_YEARS: readonly string[] = [
  '2026',
  '2025',
  '2024',
  '2023',
  '2022',
]

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function parseYmd(raw: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw.trim())
  if (!m) return null
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) }
}

function addDays(ymd: string, delta: number): string {
  const p = parseYmd(ymd)
  if (!p) return ymd
  const dt = new Date(Date.UTC(p.y, p.m - 1, p.d + delta))
  return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`
}

function toApiUnit(unit: VisitorStatsUnit): VisitorsParams['unit'] {
  if (unit === 'year') return VisitorsUnit.YEAR
  if (unit === 'month') return VisitorsUnit.MONTH
  return VisitorsUnit.DAY
}

function yearBounds(years: string[]): { from: string; to: string } | null {
  if (years.length === 0) return null
  const nums = years.map(Number).filter(n => Number.isFinite(n) && n > 0)
  if (nums.length === 0) return null
  const minY = Math.min(...nums)
  const maxY = Math.max(...nums)
  return { from: `${minY}-01-01`, to: `${maxY}-12-31` }
}

function monthBounds(years: string[], months: string[]): { from: string; to: string } | null {
  const yearNums =
    years.length > 0
      ? years.map(Number).filter(n => Number.isFinite(n) && n > 0)
      : VISITOR_STATS_SEED_YEARS.map(Number)
  const monthNums =
    months.length > 0
      ? months.map(m => Number(m)).filter(n => Number.isFinite(n) && n >= 1 && n <= 12)
      : Array.from({ length: 12 }, (_, i) => i + 1)
  if (yearNums.length === 0 || monthNums.length === 0) return null

  let minKey = ''
  let maxKey = ''
  for (const y of yearNums) {
    for (const m of monthNums) {
      const key = `${y}-${pad2(m)}`
      if (!minKey || key < minKey) minKey = key
      if (!maxKey || key > maxKey) maxKey = key
    }
  }
  const [minY, minM] = minKey.split('-').map(Number)
  const [maxY, maxM] = maxKey.split('-').map(Number)
  return {
    from: `${minY}-${pad2(minM)}-01`,
    to: `${maxY}-${pad2(maxM)}-${pad2(daysInMonth(maxY, maxM))}`,
  }
}

/**
 * 도메인 필터 → visitors GET params.
 * 빈 선택 = 시드 전체(연·월). 일별 빈 기간 = 시드 종료일 기준 최대 366일.
 */
export function toVisitorsParams(query: VisitorStatsQuery): VisitorsParams {
  const unit = toApiUnit(query.unit)
  let from = VISITOR_STATS_SEED_FROM
  let to = VISITOR_STATS_SEED_TO

  if (query.unit === 'year') {
    const bounds = yearBounds(query.years)
    if (bounds) {
      from = bounds.from
      to = bounds.to > VISITOR_STATS_SEED_TO ? VISITOR_STATS_SEED_TO : bounds.to
    }
  } else if (query.unit === 'month') {
    const bounds = monthBounds(query.years, query.months)
    if (bounds) {
      from = bounds.from < VISITOR_STATS_SEED_FROM ? VISITOR_STATS_SEED_FROM : bounds.from
      to = bounds.to > VISITOR_STATS_SEED_TO ? VISITOR_STATS_SEED_TO : bounds.to
    }
  } else {
    if (query.from && query.to) {
      from = query.from
      to = query.to
    } else if (query.from) {
      from = query.from
      to = addDays(query.from, 365)
      if (to > VISITOR_STATS_SEED_TO) to = VISITOR_STATS_SEED_TO
    } else if (query.to) {
      to = query.to
      from = addDays(query.to, -365)
      if (from < VISITOR_STATS_SEED_FROM) from = VISITOR_STATS_SEED_FROM
    } else {
      to = VISITOR_STATS_SEED_TO
      from = addDays(VISITOR_STATS_SEED_TO, -365)
      if (from < VISITOR_STATS_SEED_FROM) from = VISITOR_STATS_SEED_FROM
    }
  }

  return { unit, from, to }
}

function mapPointToRow(
  unit: VisitorStatsUnit,
  periodStart: string,
  visitorCount: number,
): VisitorStatsRow | null {
  const p = parseYmd(periodStart)
  if (!p) return null
  const visitors = Number.isFinite(visitorCount) ? visitorCount : 0

  if (unit === 'year') {
    const key = String(p.y)
    return {
      id: `year-${key}`,
      periodKey: key,
      label: key,
      visitors,
    }
  }
  if (unit === 'month') {
    const key = `${p.y}-${pad2(p.m)}`
    return {
      id: `month-${key}`,
      periodKey: key,
      label: `${p.y}.${pad2(p.m)}`,
      visitors,
    }
  }
  const key = `${p.y}-${pad2(p.m)}-${pad2(p.d)}`
  return {
    id: `day-${key}`,
    periodKey: key,
    label: `${p.y}.${pad2(p.m)}.${pad2(p.d)}`,
    visitors,
  }
}

function matchesLocalFilters(query: VisitorStatsQuery, row: VisitorStatsRow): boolean {
  if (query.unit === 'year' || query.unit === 'month') {
    if (query.years.length > 0) {
      const year = row.periodKey.slice(0, 4)
      if (!query.years.includes(year)) return false
    }
  }
  if (query.unit === 'month' && query.months.length > 0) {
    const month = row.periodKey.slice(5, 7)
    const normalized = query.months.map(m => pad2(Number(m)))
    if (!normalized.includes(month)) return false
  }
  return true
}

export function mapVisitorStatisticsToDomain(
  response: VisitorStatistics,
  query: VisitorStatsQuery,
): VisitorStatsResult {
  const unit = query.unit
  const rows = (response.items ?? [])
    .map(item => {
      const periodStart = item.periodStart ?? ''
      const count = item.visitorCount ?? 0
      return mapPointToRow(unit, periodStart, count)
    })
    .filter((row): row is VisitorStatsRow => row != null)
    .filter(row => matchesLocalFilters(query, row))

  const totalVisitors = rows.reduce((sum, row) => sum + row.visitors, 0)

  return {
    unit,
    rows,
    totalVisitors,
  }
}
