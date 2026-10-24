import { describe, expect, it } from 'vitest'
import {
  UJAT_INSTITUTION_APPLICATION_VIEW_PARAM,
  UJAT_INSTITUTION_CALENDAR_DATE_PARAM,
} from '@/features/program/ujat/lib/ujat-program-detail-url'
import {
  applyUjatInstitutionApplicationViewMode,
  clearUjatInstitutionApplicationViewParams,
  parseUjatInstitutionApplicationViewMode,
  parseUjatInstitutionCalendarDateParam,
  resolveUjatInstitutionCalendarFocusIso,
  shouldKeepUjatInstitutionApplicationViewParams,
} from './calendar-query'

describe('UJAT 기관 신청 캘린더 URL', () => {
  it('calendar 값만 캘린더 뷰로 읽는다', () => {
    expect(
      parseUjatInstitutionApplicationViewMode(
        new URLSearchParams(`${UJAT_INSTITUTION_APPLICATION_VIEW_PARAM}=calendar`)
      )
    ).toBe('calendar')
    expect(parseUjatInstitutionApplicationViewMode(new URLSearchParams())).toBe('table')
  })

  it('캘린더 전환 시 view·날짜를 쓰고 리스트는 둘 다 지운다', () => {
    const next = new URLSearchParams()
    applyUjatInstitutionApplicationViewMode(next, 'calendar', '2026-10-16')
    expect(next.get(UJAT_INSTITUTION_APPLICATION_VIEW_PARAM)).toBe('calendar')
    expect(next.get(UJAT_INSTITUTION_CALENDAR_DATE_PARAM)).toBe('2026-10-16')
    applyUjatInstitutionApplicationViewMode(next, 'table')
    expect(next.get(UJAT_INSTITUTION_APPLICATION_VIEW_PARAM)).toBeNull()
    expect(next.get(UJAT_INSTITUTION_CALENDAR_DATE_PARAM)).toBeNull()
  })

  it('신청 기관 목록 탭에서만 캘린더 쿼리를 유지한다', () => {
    expect(shouldKeepUjatInstitutionApplicationViewParams('institution_applications', 'inst_all')).toBe(
      true
    )
    expect(
      shouldKeepUjatInstitutionApplicationViewParams('institution_applications', 'inst_schedule_assign')
    ).toBe(false)
    const next = new URLSearchParams(
      `${UJAT_INSTITUTION_APPLICATION_VIEW_PARAM}=calendar&${UJAT_INSTITUTION_CALENDAR_DATE_PARAM}=2026-10-16`
    )
    clearUjatInstitutionApplicationViewParams(next)
    expect(next.toString()).toBe('')
  })

  it('잘못된 날짜는 버리고 URL → 이벤트 → 오늘 순으로 포커스한다', () => {
    expect(parseUjatInstitutionCalendarDateParam('2026-13-01')).toBeNull()
    expect(resolveUjatInstitutionCalendarFocusIso('2026-10-16', ['2026-11-06'], '2026-10-23')).toBe(
      '2026-10-16'
    )
    expect(resolveUjatInstitutionCalendarFocusIso(null, ['2026-11-06T00:00:00'], '2026-10-23')).toBe(
      '2026-11-06'
    )
    expect(resolveUjatInstitutionCalendarFocusIso(null, [], '2026-10-23')).toBe('2026-10-23')
    expect(resolveUjatInstitutionCalendarFocusIso(null, [], null)).toBeNull()
  })
})
