import { describe, expect, it } from 'vitest'
import {
  formatUjatEventRangeLabel,
  resolveUjatEducationScheduleSettingsSemesterDisplay,
} from './ujat-education-schedule-settings-display'
import { ujatHalfScheduleOverlayKeys } from './ujat-half-education-schedule-types'
import { ujatEducationScheduleSettingsOverlayKeys } from './ujat-education-schedule-settings-types'

describe('formatUjatEventRangeLabel', () => {
  it('기간 시작·종료 모두 한글 요일·2자리 연도로 표기한다', () => {
    const text = formatUjatEventRangeLabel({
      start: '2026-11-20T00:00:00.000Z',
      end: '2026-12-11T00:00:00.000Z',
    })
    expect(text).not.toMatch(/\(Mon|Tue|Wed|Thu|Fri|Sat|Sun\)/)
    expect(text).toBe('2026.11.20(금) ~ 2026.12.11(금)')
  })
})

describe('resolveUjatEducationScheduleSettingsSemesterDisplay', () => {
  it('신규 등록 폼(overlay 비어 있음)에서는 목업 기본값이 노출되지 않는다 (버그 수정 확인)', () => {
    const h1 = resolveUjatEducationScheduleSettingsSemesterDisplay('h1', {})
    const h2 = resolveUjatEducationScheduleSettingsSemesterDisplay('h2', {})

    // 교육 진행 일정 — 목업 날짜(26년 4월 3일 ~ 26년 6월 19일 등)가 미리 채워지면 안 된다.
    expect(h1.scheduleRangeText).toBe('-')
    expect(h2.scheduleRangeText).toBe('-')

    // 교육 진행 불가일 — 목업 날짜(26년 5월 15일, 26년 6월 12일 등)가 미리 채워지면 안 된다.
    expect(h1.unavailableDates).toEqual([])
    expect(h2.unavailableDates).toEqual([])
    expect(h1.unavailableDatesText).toBe('-')
    expect(h2.unavailableDatesText).toBe('-')

    // 공휴일 제외 등 옵션도 미리 체크되어 있으면 안 된다.
    expect(h1.exclusion.excludeHoliday).toBe(false)
    expect(h2.exclusion.excludeHoliday).toBe(false)
  })

  it('실제 저장된 overlay 값이 있으면 그대로 반영한다', () => {
    const eventKeys = ujatHalfScheduleOverlayKeys('h1')
    const settingsKeys = ujatEducationScheduleSettingsOverlayKeys('h1')
    const overlay = {
      [eventKeys.eventRange]: {
        start: '2026-04-03T00:00:00.000Z',
        end: '2026-06-19T00:00:00.000Z',
      },
      [settingsKeys.unavailableDates]: ['2026-05-15'],
      [settingsKeys.exclusion]: {
        excludeNone: false,
        excludeSaturday: false,
        excludeSunday: false,
        excludeHoliday: true,
      },
    }

    const h1 = resolveUjatEducationScheduleSettingsSemesterDisplay('h1', overlay)
    expect(h1.scheduleRangeText).not.toBe('-')
    expect(h1.unavailableDates).toEqual(['2026-05-15'])
    expect(h1.exclusion.excludeHoliday).toBe(true)
  })
})
