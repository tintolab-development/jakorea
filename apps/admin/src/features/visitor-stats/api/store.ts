/**
 * 방문자 통계 — 로컬 seed · 집계
 * 일 단위 시드 → 연도/월/일 집계, rows 합 = totalVisitors
 */

import type {
  VisitorDayRecord,
  VisitorStatsQuery,
  VisitorStatsResult,
  VisitorStatsRow,
} from '@/entities/visitor-stats/model/types'

/** 시안 스케일 — 월 합계 (최신 월 우선 표기용 데이터 생성) */
const MONTHLY_TOTALS: ReadonlyArray<{ year: number; month: number; total: number }> = [
  { year: 2026, month: 7, total: 4_975_208 },
  { year: 2026, month: 6, total: 3_210_450 },
  { year: 2026, month: 5, total: 2_890_120 },
  { year: 2026, month: 4, total: 2_450_300 },
  { year: 2026, month: 3, total: 2_105_880 },
  { year: 2026, month: 2, total: 1_880_440 },
  { year: 2026, month: 1, total: 1_720_330 },
  { year: 2025, month: 12, total: 2_150_600 },
  { year: 2025, month: 11, total: 1_980_220 },
  { year: 2025, month: 10, total: 1_870_110 },
  { year: 2025, month: 9, total: 1_760_400 },
  { year: 2025, month: 8, total: 1_650_300 },
  { year: 2025, month: 7, total: 1_540_200 },
  { year: 2025, month: 6, total: 1_430_100 },
  { year: 2025, month: 5, total: 1_320_000 },
  { year: 2025, month: 4, total: 1_210_200 },
  { year: 2025, month: 3, total: 1_100_100 },
  { year: 2025, month: 2, total: 990_400 },
  { year: 2025, month: 1, total: 880_300 },
  { year: 2024, month: 12, total: 820_500 },
  { year: 2024, month: 11, total: 780_400 },
  { year: 2024, month: 10, total: 740_300 },
  { year: 2024, month: 9, total: 700_200 },
  { year: 2024, month: 8, total: 660_100 },
  { year: 2024, month: 7, total: 620_000 },
  { year: 2024, month: 6, total: 580_900 },
  { year: 2024, month: 5, total: 540_800 },
  { year: 2024, month: 4, total: 500_700 },
  { year: 2024, month: 3, total: 460_600 },
  { year: 2024, month: 2, total: 420_500 },
  { year: 2024, month: 1, total: 380_400 },
  { year: 2023, month: 12, total: 420_100 },
  { year: 2023, month: 11, total: 390_050 },
  { year: 2023, month: 10, total: 360_000 },
  { year: 2023, month: 9, total: 330_900 },
  { year: 2023, month: 8, total: 300_800 },
  { year: 2023, month: 7, total: 280_700 },
  { year: 2023, month: 6, total: 260_600 },
  { year: 2023, month: 5, total: 240_500 },
  { year: 2023, month: 4, total: 220_400 },
  { year: 2023, month: 3, total: 200_300 },
  { year: 2023, month: 2, total: 180_200 },
  { year: 2023, month: 1, total: 160_100 },
  { year: 2022, month: 12, total: 200_100 },
  { year: 2022, month: 11, total: 180_090 },
  { year: 2022, month: 10, total: 160_080 },
  { year: 2022, month: 9, total: 150_070 },
  { year: 2022, month: 8, total: 140_060 },
  { year: 2022, month: 7, total: 130_050 },
  { year: 2022, month: 6, total: 120_040 },
  { year: 2022, month: 5, total: 110_030 },
  { year: 2022, month: 4, total: 100_020 },
  { year: 2022, month: 3, total: 90_010 },
  { year: 2022, month: 2, total: 80_005 },
  { year: 2022, month: 1, total: 70_000 },
]

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

function buildDaySeed(): VisitorDayRecord[] {
  const records: VisitorDayRecord[] = []
  for (const { year, month, total } of MONTHLY_TOTALS) {
    const dim = daysInMonth(year, month)
    const base = Math.floor(total / dim)
    let remaining = total - base * dim
    for (let day = 1; day <= dim; day += 1) {
      const extra = remaining > 0 ? 1 : 0
      if (remaining > 0) remaining -= 1
      records.push({
        date: `${year}-${pad2(month)}-${pad2(day)}`,
        year,
        month,
        day,
        visitors: base + extra,
      })
    }
  }
  return records
}

const DAY_SEED: VisitorDayRecord[] = buildDaySeed()

export function listVisitorYearOptions(): string[] {
  const years = new Set(DAY_SEED.map(r => String(r.year)))
  return Array.from(years).sort((a, b) => Number(b) - Number(a))
}

export function listVisitorMonthOptions(): string[] {
  return Array.from({ length: 12 }, (_, i) => pad2(i + 1))
}

function filterDays(query: VisitorStatsQuery): VisitorDayRecord[] {
  let days = DAY_SEED

  if (query.unit === 'year' || query.unit === 'month') {
    if (query.years.length > 0) {
      const yearSet = new Set(query.years)
      days = days.filter(d => yearSet.has(String(d.year)))
    }
  }

  if (query.unit === 'month' && query.months.length > 0) {
    const monthSet = new Set(query.months.map(m => pad2(Number(m))))
    days = days.filter(d => monthSet.has(pad2(d.month)))
  }

  if (query.unit === 'day') {
    if (query.from) {
      days = days.filter(d => d.date >= query.from!)
    }
    if (query.to) {
      days = days.filter(d => d.date <= query.to!)
    }
  }

  return days
}

function aggregateYear(days: VisitorDayRecord[]): VisitorStatsRow[] {
  const map = new Map<number, number>()
  for (const d of days) {
    map.set(d.year, (map.get(d.year) ?? 0) + d.visitors)
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([year, visitors]) => ({
      id: `year-${year}`,
      periodKey: String(year),
      label: String(year),
      visitors,
    }))
}

function aggregateMonth(days: VisitorDayRecord[]): VisitorStatsRow[] {
  const map = new Map<string, number>()
  for (const d of days) {
    const key = `${d.year}-${pad2(d.month)}`
    map.set(key, (map.get(key) ?? 0) + d.visitors)
  }
  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0))
    .map(([key, visitors]) => {
      const [y, m] = key.split('-')
      return {
        id: `month-${key}`,
        periodKey: key,
        label: `${y}.${m}`,
        visitors,
      }
    })
}

function aggregateDay(days: VisitorDayRecord[]): VisitorStatsRow[] {
  return [...days]
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .map(d => ({
      id: `day-${d.date}`,
      periodKey: d.date,
      label: `${d.year}.${pad2(d.month)}.${pad2(d.day)}`,
      visitors: d.visitors,
    }))
}

export function queryVisitorStats(query: VisitorStatsQuery): VisitorStatsResult {
  const filtered = filterDays(query)
  let rows: VisitorStatsRow[]
  if (query.unit === 'year') {
    rows = aggregateYear(filtered)
  } else if (query.unit === 'month') {
    rows = aggregateMonth(filtered)
  } else {
    rows = aggregateDay(filtered)
  }
  const totalVisitors = rows.reduce((sum, row) => sum + row.visitors, 0)
  return {
    unit: query.unit,
    rows,
    totalVisitors,
  }
}
