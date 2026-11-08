/**
 * 실적 관리 필터 — 년도/분기 초기값(시안: 현재 연도 · 현재 분기 선택 상태)
 * - URL에 년도·분기 쿼리가 모두 없을 때 첫 진입에서만 채운다(초기화 후 빈 값 유지).
 * - 년도 선택지는 목록 행 연도 + 현재 연도부터 최근 5년을 합친다.
 *   (년도 필터 적용 후 목록이 해당 연도만 남아도 다른 연도를 고를 수 있어야 함)
 */

import type { EducationRecordQuarter } from '../model/education-record-types'
import { EDUCATION_RECORD_PARAM_KEYS } from '../api/performance-filter-params'

const RECENT_YEAR_SPAN = 5

export function getCurrentEducationRecordPeriod(now: Date = new Date()): {
  year: number
  quarter: EducationRecordQuarter
} {
  return {
    year: now.getFullYear(),
    quarter: (Math.floor(now.getMonth() / 3) + 1) as EducationRecordQuarter,
  }
}

/** 년도·분기 쿼리가 모두 없으면 현재 연도·분기를 넣은 새 쿼리를, 하나라도 있으면 `null`을 반환한다. */
export function withDefaultEducationRecordPeriod(
  searchParams: URLSearchParams,
  now: Date = new Date()
): URLSearchParams | null {
  const { year: yearKey, quarter: quarterKey } = EDUCATION_RECORD_PARAM_KEYS
  if (searchParams.has(yearKey) || searchParams.has(quarterKey)) return null
  const { year, quarter } = getCurrentEducationRecordPeriod(now)
  const next = new URLSearchParams(searchParams)
  next.set(yearKey, String(year))
  next.set(quarterKey, String(quarter))
  return next
}

export function buildEducationRecordYearOptions(
  rowYears: readonly number[],
  now: Date = new Date()
): number[] {
  const currentYear = now.getFullYear()
  const set = new Set<number>(rowYears)
  for (let i = 0; i < RECENT_YEAR_SPAN; i += 1) set.add(currentYear - i)
  return Array.from(set).sort((a, b) => b - a)
}
