/**
 * 걸어온 길과 성과 — UI 크롬·타입.
 * 목록 데이터는 GET /api/public/ja-korea/organization 에서 온다.
 */

export type AchievementTabKey = 'history' | 'award' | 'certification'

export type HistoryMonthGroup = {
  month: string
  items: readonly string[]
}

export type HistoryYearData = {
  year: number
  months: readonly HistoryMonthGroup[]
}

export type HistoryPeriod = {
  id: string
  label: string
  years: readonly number[]
}

export type AchievementRecordItem = {
  id: string
  /** 표시용 날짜 (예: 2025년 12월) */
  dateLabel: string
  title: string
  organization: string
}

export const ACHIEVEMENT_SECTION_TITLE = '걸어온 길과 성과'

export const ACHIEVEMENT_TAB_ITEMS: readonly { key: AchievementTabKey; label: string }[] = [
  { key: 'history', label: '연혁' },
  { key: 'award', label: '수상' },
  { key: 'certification', label: '인증' },
] as const

export const ACHIEVEMENT_RECORDS_PAGE_SIZE = 10

export const ACHIEVEMENT_SEARCH_PLACEHOLDER = '제목, 내용으로 검색해 보세요'

/** API에 연혁이 없을 때만 쓰는 폴백 (시안 구간). */
export const DEFAULT_HISTORY_PERIOD_ID = '2016-2020'
export const DEFAULT_HISTORY_YEAR = 2020

export const HISTORY_PERIODS: readonly HistoryPeriod[] = [
  { id: '2026-now', label: '2026 ~ Now', years: [2026] },
  { id: '2021-2025', label: '2021 ~ 2025', years: [2025, 2024, 2023, 2022, 2021] },
  { id: '2016-2020', label: '2016 ~ 2020', years: [2020, 2019, 2018, 2017, 2016] },
  { id: '2011-2015', label: '2011 ~ 2015', years: [2015, 2014, 2013, 2012, 2011] },
  { id: '2002-2010', label: '2002 ~ 2010', years: [2010, 2009, 2008, 2007, 2006, 2005, 2004, 2003, 2002] },
] as const

export function findHistoryPeriodId(year: number): string {
  return HISTORY_PERIODS.find(period => period.years.includes(year))?.id ?? DEFAULT_HISTORY_PERIOD_ID
}

export function latestHistoryYear(
  historyByYear: Readonly<Record<number, HistoryYearData>>,
): number | null {
  const years = Object.values(historyByYear).map(item => item.year)
  if (years.length === 0) return null
  return Math.max(...years)
}

/** 최초 진입: 데이터가 있는 가장 최근 연도. */
export function resolveHistorySelection(
  historyByYear: Readonly<Record<number, HistoryYearData>>,
): { periodId: string; year: number } {
  const year = latestHistoryYear(historyByYear) ?? DEFAULT_HISTORY_YEAR
  return { periodId: findHistoryPeriodId(year), year }
}

/** 기간 클릭: 해당 구간에서 데이터가 있는 가장 최근 연도. 없으면 구간 첫 연도. */
export function resolveYearForPeriod(
  periodId: string,
  historyByYear: Readonly<Record<number, HistoryYearData>>,
): number {
  const period = HISTORY_PERIODS.find(item => item.id === periodId)
  if (!period) return DEFAULT_HISTORY_YEAR
  const withData = period.years.find(year => historyByYear[year] != null)
  return withData ?? period.years[0] ?? DEFAULT_HISTORY_YEAR
}

export function filterAchievementRecords(
  items: readonly AchievementRecordItem[],
  query: string,
): AchievementRecordItem[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return [...items]
  return items.filter(item => {
    const haystack = `${item.title} ${item.organization} ${item.dateLabel}`.toLowerCase()
    return haystack.includes(normalized)
  })
}
