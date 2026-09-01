/**
 * 방문자 통계 도메인
 */

export type VisitorStatsUnit = 'year' | 'month' | 'day'

export const VISITOR_STATS_UNITS = ['year', 'month', 'day'] as const

export const VISITOR_STATS_UNIT_LABELS: Record<VisitorStatsUnit, string> = {
  year: '연도별',
  month: '월별',
  day: '일별',
}

/** 검색 조건 — 빈 years/months = 전체 */
export type VisitorStatsFilter = {
  years: string[]
  months: string[]
  /** 일별: YYYY-MM-DD */
  from: string | null
  to: string | null
}

export type VisitorStatsQuery = VisitorStatsFilter & {
  unit: VisitorStatsUnit
}

export type VisitorStatsRow = {
  id: string
  /** 정렬·필터 키: year | YYYY-MM | YYYY-MM-DD */
  periodKey: string
  /** 화면 표시 라벨 */
  label: string
  visitors: number
}

export type VisitorStatsResult = {
  unit: VisitorStatsUnit
  rows: VisitorStatsRow[]
  totalVisitors: number
}

/** 일 단위 시드 행 */
export type VisitorDayRecord = {
  /** YYYY-MM-DD */
  date: string
  year: number
  month: number
  day: number
  visitors: number
}
