import { describe, expect, it } from 'vitest'
import {
  composeSatisfactionSurveyDisplayTitle,
  formatSatisfactionPerScheduleDisplayName,
  isDefaultEducationSlotName,
  stripDefaultEducationSlotNameFromLabel,
  toDisplayEducationScheduleName,
} from '../src/shared/lib/education-schedule-name'
import { normalizeScheduleDisplayLabel } from '../src/shared/lib/format-display-date'
import { readRuntimeFixedScheduleChoiceItems } from '../src/features/program/lib/apply-form-schedule'
import { mapPortalScheduleItem } from '../src/features/mypage/home/api/mappers'
import { resolveEducationScheduleRowLabel } from '../src/features/mypage/education/schedules/lib/common-info-label'

describe('education schedule default name helper', () => {
  it('matches only the exact backend default pattern', () => {
    expect(isDefaultEducationSlotName('공통 교육 예정 3')).toBe(true)
    expect(isDefaultEducationSlotName('공통 교육 예정')).toBe(true)
    expect(isDefaultEducationSlotName('공통 교육')).toBe(false)
    expect(isDefaultEducationSlotName('공통 교육 예정 안내문')).toBe(false)
    expect(toDisplayEducationScheduleName('공통 교육 예정 1')).toBeUndefined()
    expect(toDisplayEducationScheduleName(' 오리엔테이션 ')).toBe('오리엔테이션')
  })

  it('strips trailing default names from composed labels', () => {
    expect(stripDefaultEducationSlotNameFromLabel('2026년 11월 6일(금) 18:38 ~ 19:38 | 공통 교육 예정 3')).toBe(
      '2026년 11월 6일(금) 18:38 ~ 19:38',
    )
    expect(stripDefaultEducationSlotNameFromLabel('가을 공통 교육 예정')).toBe('가을 공통 교육 예정')
    expect(normalizeScheduleDisplayLabel('2026.11.06 18:38 ~ 19:38 | 공통 교육 예정 3')).not.toContain(
      '공통 교육 예정',
    )
    expect(normalizeScheduleDisplayLabel('2026.11.06 18:38 ~ 19:38 | 오리엔테이션')).toContain('오리엔테이션')
  })
})

describe('portal apply 진행 희망 교육 일정 options', () => {
  const runtime = {
    scheduleInputMode: 'fixed_schedule_options',
    scheduleOptions: [
      { value: 'schedule:101', label: '2026년 11월 6일(금) 18:38 ~ 19:38 | 공통 교육 예정 3', scheduleId: 101 },
      { value: 'schedule:102', label: '2026년 11월 9일(월) 10:00 ~ 11:00 | 오리엔테이션', scheduleId: 102 },
      { value: 'schedule:103', label: '공통 교육 예정 2', scheduleId: 103 },
    ],
  }
  const paragraph = { scheduleInputMode: 'fixed_schedule_options' }

  it('hides the default slot name and keeps ids and custom names', () => {
    const items = readRuntimeFixedScheduleChoiceItems(runtime, paragraph)
    expect(items).not.toBeNull()
    expect(items?.map(item => item.id)).toEqual(['schedule:101', 'schedule:102', 'schedule:103'])
    expect(items?.[0]?.label).toBe('2026년 11월 6일(금) 18:38 ~ 19:38')
    expect(items?.[1]?.label).toBe('2026년 11월 9일(월) 10:00 ~ 11:00 | 오리엔테이션')
    expect(items?.[2]?.label).toBe('교육 일정')
    for (const item of items ?? []) expect(item.label).not.toContain('공통 교육 예정')
  })
})

describe('portal mypage surfaces', () => {
  it('home calendar title falls back to location instead of the default name', () => {
    const event = mapPortalScheduleItem({
      scheduleId: 1,
      startAt: '2026-11-06T09:38:00Z',
      endAt: '2026-11-06T10:38:00Z',
      scheduleName: '공통 교육 예정 3',
      locationName: '서울초등학교',
    })
    expect(event?.title).toBe('서울초등학교')
  })

  it('schedule row label uses - for default names and keeps custom ones', () => {
    expect(
      resolveEducationScheduleRowLabel({ educationStructure: 'SCHEDULE', scheduleName: '공통 교육 예정 1' }),
    ).toBe('-')
    expect(resolveEducationScheduleRowLabel({ educationStructure: 'SCHEDULE', scheduleName: '발대식' })).toBe(
      '발대식',
    )
  })
})

describe('formatSatisfactionPerScheduleDisplayName', () => {
  it('matches CMS list/select copy', () => {
    expect(
      formatSatisfactionPerScheduleDisplayName({
        scheduleName: '공통 교육 예정 1',
        sessionNo: 1,
        startAt: '2026-11-12T03:00:00.000Z',
      }),
    ).toBe('1회차 · 2026.11.12(목)')
  })
})

describe('composeSatisfactionSurveyDisplayTitle', () => {
  it('joins schedule and mapped form name for per-schedule', () => {
    expect(
      composeSatisfactionSurveyDisplayTitle({
        formName: '만족도조사 (학생용)',
        perSchedule: true,
        scheduleDisplayName: '1회차 · 2026.11.12(목)',
      }),
    ).toBe('1회차 · 2026.11.12(목) 만족도조사 (학생용)')
  })
})

describe('기관 승인 일정 내부명 (기관 확정 YYYY-MM-DD)', () => {
  it('내부 일정명만 판별하고 라벨에서 그 구간만 제거한다', async () => {
    const { isAutoMaterializedScheduleName, stripAutoMaterializedScheduleNameFromLabel } =
      await import('../src/shared/lib/education-schedule-name')
    expect(isAutoMaterializedScheduleName('기관 확정 2026-11-09')).toBe(true)
    expect(isAutoMaterializedScheduleName('계남중학교')).toBe(false)
    expect(isAutoMaterializedScheduleName('기관 확정 일정 안내')).toBe(false)
    expect(
      stripAutoMaterializedScheduleNameFromLabel(
        '계남중학교 | 26년 11월 9일(월) 09:00 ~ 10:00 | 기관 확정 2026-11-09',
      ),
    ).toBe('계남중학교 | 26년 11월 9일(월) 09:00 ~ 10:00')
    expect(stripAutoMaterializedScheduleNameFromLabel('기관 확정 2026-11-09')).toBe('')
    expect(stripAutoMaterializedScheduleNameFromLabel('1차시 | 09:00 ~ 10:00 | 오전반')).toBe(
      '1차시 | 09:00 ~ 10:00 | 오전반',
    )
  })
})
