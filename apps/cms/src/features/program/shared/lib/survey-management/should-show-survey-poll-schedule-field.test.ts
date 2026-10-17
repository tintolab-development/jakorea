import { describe, expect, it } from 'vitest'
import {
  GENERAL_PROGRAM_ORG_SCHEDULE_MULTI_ID,
  GENERAL_PROGRAM_ORG_SCHEDULE_SINGLE_ID,
} from '@/features/program/general/lib/detail-common-info-display'
import {
  isSurveyPollPeriodProgram,
  shouldShowSurveyPollScheduleSelectField,
} from '@/features/program/shared/lib/survey-management/should-show-survey-poll-schedule-field'
import type { Program } from '@/types/domain'

describe('shouldShowSurveyPollScheduleSelectField', () => {
  it('returns true when program is null (conservative default)', () => {
    expect(shouldShowSurveyPollScheduleSelectField(null)).toBe(true)
    expect(shouldShowSurveyPollScheduleSelectField(undefined)).toBe(true)
  })

  it('returns false for period mode (curriculum or schedule)', () => {
    expect(
      shouldShowSurveyPollScheduleSelectField({
        id: 'period-curriculum',
        generalProgramEducationStructure: 'curriculum',
        generalProgramSessionRound: 'multi',
        generalCommonInfo: { educationScheduleMode: 'period' },
      } as Program)
    ).toBe(false)
    expect(isSurveyPollPeriodProgram({ generalCommonInfo: { educationScheduleMode: 'period' } } as Program)).toBe(
      true
    )
  })

  it('returns false for single slot date mode (not schedule multi)', () => {
    expect(
      shouldShowSurveyPollScheduleSelectField({
        id: 'single-slot-curriculum',
        generalProgramEducationStructure: 'curriculum',
        generalProgramSessionRound: 'single',
        generalCommonInfo: {
          educationScheduleMode: 'date',
          educationScheduleLines: ['26년 10월 30일(금) 10:00 ~ 12:00'],
        },
      } as Program)
    ).toBe(false)
  })

  it('returns true for date mode with multiple choice slots', () => {
    expect(
      shouldShowSurveyPollScheduleSelectField({
        id: GENERAL_PROGRAM_ORG_SCHEDULE_SINGLE_ID,
        generalProgramEducationStructure: 'schedule',
        generalProgramSessionRound: 'single',
      } as Program)
    ).toBe(true)
  })

  it('returns true for schedule multi even when only one event schedule', () => {
    expect(
      shouldShowSurveyPollScheduleSelectField({
        id: GENERAL_PROGRAM_ORG_SCHEDULE_MULTI_ID,
        generalProgramEducationStructure: 'schedule',
        generalProgramSessionRound: 'multi',
        generalCommonInfo: {
          educationScheduleLines: ['26년 4월 3일(금) 9:30 ~ 12:20'],
          scheduleDetails: [{ scheduleLabel: '행사 일정 01', name: '본 행사' }],
        },
      } as Program)
    ).toBe(true)
  })
})
