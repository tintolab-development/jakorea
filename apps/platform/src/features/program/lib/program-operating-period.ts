import type { ProgramListItem } from '../model/types'

/** 프로그램 운영 기간이 선택한 연도(YYYY)와 겹치면 true */
export function programOverlapsOperatingYear(
  program: Pick<ProgramListItem, 'operatingPeriodStart' | 'operatingPeriodEnd'>,
  year: string
) {
  const selectedYear = Number.parseInt(year, 10)
  if (!Number.isFinite(selectedYear)) {
    return true
  }

  const startYear = Number.parseInt(program.operatingPeriodStart.slice(0, 4), 10)
  const endYear = Number.parseInt(program.operatingPeriodEnd.slice(0, 4), 10)
  if (!Number.isFinite(startYear) || !Number.isFinite(endYear)) {
    return false
  }

  return startYear <= selectedYear && endYear >= selectedYear
}

/** 프로그램 운영 기간이 선택한 일자(YYYY-MM-DD)를 포함하면 true */
export function programIncludesOperatingDate(
  program: Pick<ProgramListItem, 'operatingPeriodStart' | 'operatingPeriodEnd'>,
  date: string
) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return true
  }

  const start = program.operatingPeriodStart
  const end = program.operatingPeriodEnd
  if (!start || !end) {
    return false
  }

  return start <= date && end >= date
}

/** 프로그램 운영 기간이 선택한 구간과 겹치면 true */
export function programOverlapsOperatingDateRange(
  program: Pick<ProgramListItem, 'operatingPeriodStart' | 'operatingPeriodEnd'>,
  rangeStart: string,
  rangeEnd: string
) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(rangeStart) || !/^\d{4}-\d{2}-\d{2}$/.test(rangeEnd)) {
    return true
  }

  const start = program.operatingPeriodStart
  const end = program.operatingPeriodEnd
  if (!start || !end) {
    return false
  }

  const from = rangeStart <= rangeEnd ? rangeStart : rangeEnd
  const to = rangeStart <= rangeEnd ? rangeEnd : rangeStart
  return start <= to && end >= from
}
