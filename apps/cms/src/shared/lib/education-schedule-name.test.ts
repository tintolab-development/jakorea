import { describe, expect, it } from 'vitest'
import {
  composeSatisfactionSurveyDisplayTitle,
  formatEducationRoundSessionLabel,
  formatSatisfactionPerScheduleDisplayName,
  isDefaultEducationSlotName,
  parseConfirmedCurriculumSessionCount,
  stripDefaultEducationSlotNameFromLabel,
  toDisplayEducationScheduleName,
} from './education-schedule-name'
import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import { mapEducationSlotToAdminScheduleShape } from '@/features/program/general/lib/program-planned-education-slots'
import { formatSurveyPollScheduleOptionLabel } from '@/features/program/shared/lib/survey-management/survey-poll-schedule-options'
import { mapScheduleItem } from '@/features/dashboard/api/adapters/dashboard-adapters'

describe('education schedule default name', () => {
  it('treats only the backend default pattern as a default name', () => {
    expect(isDefaultEducationSlotName('공통 교육 예정 3')).toBe(true)
    expect(isDefaultEducationSlotName(' 공통 교육 예정 ')).toBe(true)
    expect(isDefaultEducationSlotName('공통교육예정12')).toBe(true)
    expect(isDefaultEducationSlotName('공통 교육')).toBe(false)
    expect(isDefaultEducationSlotName('공통 교육 예정 안내문')).toBe(false)
    expect(isDefaultEducationSlotName('가을 공통 교육 예정')).toBe(false)
    expect(isDefaultEducationSlotName('')).toBe(false)
    expect(isDefaultEducationSlotName(null)).toBe(false)
  })

  it('returns display names only for real names', () => {
    expect(toDisplayEducationScheduleName('공통 교육 예정 1')).toBeUndefined()
    expect(toDisplayEducationScheduleName('  ')).toBeUndefined()
    expect(toDisplayEducationScheduleName(undefined)).toBeUndefined()
    expect(toDisplayEducationScheduleName(' 오리엔테이션 ')).toBe('오리엔테이션')
    expect(toDisplayEducationScheduleName('공통 교육 예정 안내문')).toBe('공통 교육 예정 안내문')
  })

  it('shows a 사전교육 schedule name as 「사전교육」 only', () => {
    expect(toDisplayEducationScheduleName('사전 교육')).toBe('사전교육')
    expect(toDisplayEducationScheduleName(' 사전  교육 ')).toBe('사전교육')
    expect(toDisplayEducationScheduleName('사전교육')).toBe('사전교육')
    expect(toDisplayEducationScheduleName('사전 교육 안내')).toBe('사전 교육 안내')
    expect(toDisplayEducationScheduleName('교육 연수')).toBe('교육 연수')
  })

  it('strips the default name from composed labels and keeps custom names', () => {
    expect(stripDefaultEducationSlotNameFromLabel('2026.11.06 18:38 ~ 19:38 | 공통 교육 예정 3')).toBe(
      '2026.11.06 18:38 ~ 19:38'
    )
    expect(
      stripDefaultEducationSlotNameFromLabel('2026년 11월 6일(금) 18:38 ~ 19:38  공통 교육 예정 3')
    ).toBe('2026년 11월 6일(금) 18:38 ~ 19:38')
    expect(stripDefaultEducationSlotNameFromLabel('A기관 | 2026.11.06 18:38 ~ 19:38 | 공통 교육 예정 3')).toBe(
      'A기관 | 2026.11.06 18:38 ~ 19:38'
    )
    expect(stripDefaultEducationSlotNameFromLabel('2026.11.06 18:38 ~ 19:38 | 오리엔테이션')).toBe(
      '2026.11.06 18:38 ~ 19:38 | 오리엔테이션'
    )
    expect(stripDefaultEducationSlotNameFromLabel('가을 공통 교육 예정')).toBe('가을 공통 교육 예정')
    expect(stripDefaultEducationSlotNameFromLabel('공통 교육 예정 2')).toBe('')
  })
})

describe('CMS surfaces hide the default slot name', () => {
  it('formatCmsScheduleDisplayLabel drops the default suffix but keeps a custom one', () => {
    const stripped = formatCmsScheduleDisplayLabel('2026.11.06 18:38 ~ 19:38 | 공통 교육 예정 3')
    expect(stripped).not.toContain('공통 교육 예정')
    expect(stripped).toContain('18:38')
    expect(formatCmsScheduleDisplayLabel('2026.11.06 18:38 ~ 19:38 | 오리엔테이션')).toContain(
      '오리엔테이션'
    )
  })

  it('education-slots adapter does not carry the default name', () => {
    const shaped = mapEducationSlotToAdminScheduleShape({
      scheduleId: 11,
      sessionNo: 3,
      startAt: '2026-11-06T09:38:00Z',
      endAt: '2026-11-06T10:38:00Z',
      scheduleName: '공통 교육 예정 3',
      scheduleOrigin: 'PROGRAM_DEFINED',
    } as Parameters<typeof mapEducationSlotToAdminScheduleShape>[0])
    expect(shaped.scheduleName).toBeUndefined()

    const named = mapEducationSlotToAdminScheduleShape({
      scheduleId: 12,
      sessionNo: 1,
      startAt: '2026-11-06T09:38:00Z',
      endAt: '2026-11-06T10:38:00Z',
      scheduleName: '오리엔테이션',
      scheduleOrigin: 'PROGRAM_DEFINED',
    } as Parameters<typeof mapEducationSlotToAdminScheduleShape>[0])
    expect(named.scheduleName).toBe('오리엔테이션')
  })

  it('survey poll option falls back to 회차 instead of the default name', () => {
    expect(formatSurveyPollScheduleOptionLabel({ id: 1, sessionNo: 2, scheduleName: '공통 교육 예정 2' }, 0)).toBe(
      '2회차'
    )
    expect(formatSurveyPollScheduleOptionLabel({ id: 1, sessionNo: 2, scheduleName: '발대식' }, 0)).toBe('발대식')
  })

  it('dashboard calendar title falls back to the program name', () => {
    const event = mapScheduleItem({
      scheduleId: 1,
      programId: 2,
      startAt: '2026-11-06T09:38:00Z',
      scheduleName: '공통 교육 예정 1',
      programNameKo: '경제교육',
    } as Parameters<typeof mapScheduleItem>[0])
    expect(event?.title).toBe('경제교육')
  })
})

describe('composeSatisfactionSurveyDisplayTitle', () => {
  it('joins schedule and mapped form name for per-schedule', () => {
    expect(
      composeSatisfactionSurveyDisplayTitle({
        formName: '만족도조사 (학생용)',
        perSchedule: true,
        scheduleDisplayName: '1회차 · 2026.11.12(목)',
      })
    ).toBe('1회차 · 2026.11.12(목) 만족도조사 (학생용)')
  })

  it('keeps only the form name when not per-schedule', () => {
    expect(
      composeSatisfactionSurveyDisplayTitle({
        formName: '만족도조사 (학생용)',
        perSchedule: false,
        scheduleDisplayName: '1회차 · 2026.11.12(목)',
      })
    ).toBe('만족도조사 (학생용)')
  })
})

describe('formatEducationRoundSessionLabel', () => {
  it('keeps 회차 and 차시 as independent values', () => {
    expect(
      formatEducationRoundSessionLabel({ roundNumber: 1, curriculumSessionCount: 2 })
    ).toBe('1회차 (2차시)')
    expect(
      formatEducationRoundSessionLabel({ roundNumber: 2, curriculumSessionCount: 2 })
    ).toBe('2회차 (2차시)')
    expect(
      formatEducationRoundSessionLabel({ roundNumber: 3, curriculumSessionCount: 1 })
    ).toBe('3회차 (1차시)')
    expect(formatEducationRoundSessionLabel({ roundNumber: 1 })).toBe('1회차')
    expect(formatEducationRoundSessionLabel({ curriculumSessionCount: 2 })).toBe('2차시')
    expect(formatEducationRoundSessionLabel({})).toBe('')
    expect(parseConfirmedCurriculumSessionCount('2차시')).toBe(2)
    expect(parseConfirmedCurriculumSessionCount('1회차')).toBeNull()
  })
})

describe('formatSatisfactionPerScheduleDisplayName', () => {
  it('uses round or custom name with Seoul calendar date', () => {
    expect(
      formatSatisfactionPerScheduleDisplayName({
        scheduleName: '공통 교육 예정 1',
        sessionNo: 1,
        startAt: '2026-11-12T03:00:00.000Z',
      })
    ).toBe('1회차 · 2026.11.12(목)')
    expect(
      formatSatisfactionPerScheduleDisplayName({
        scheduleName: '오리엔테이션',
        sessionNo: 2,
        startAt: '2026-11-12T03:00:00.000Z',
      })
    ).toBe('오리엔테이션 · 2026.11.12(목)')
    expect(
      formatSatisfactionPerScheduleDisplayName({
        scheduleName: '공통 교육 예정 2',
        scheduleLine: '2026년 11월 5일(목) 02:00 ~ 02:20',
      })
    ).toBe('2회차 · 2026.11.05(목)')
  })
})
