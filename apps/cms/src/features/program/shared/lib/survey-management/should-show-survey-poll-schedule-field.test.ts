import { describe, expect, it } from 'vitest'
import {
  isSurveyPollPeriodProgram,
  shouldShowSurveyPollScheduleSelectField,
} from '@/features/program/shared/lib/survey-management/should-show-survey-poll-schedule-field'
import type { Program } from '@/types/domain'

const dateModeProgram = {
  id: 'date-mode',
  generalProgramEducationStructure: 'curriculum',
  generalProgramSessionRound: 'single',
  generalCommonInfo: {
    educationScheduleMode: 'date',
    educationScheduleLines: ['26년 10월 30일(금) 10:00 ~ 12:00'],
  },
} as Program

const loaded = (options: { disabled?: boolean }[]) => ({ options, isLoading: false })

describe('shouldShowSurveyPollScheduleSelectField', () => {
  it('returns true when program is null (conservative default)', () => {
    expect(shouldShowSurveyPollScheduleSelectField(null, loaded([]))).toBe(true)
    expect(shouldShowSurveyPollScheduleSelectField(undefined, loaded([]))).toBe(true)
  })

  it('returns false for period mode even when schedules exist', () => {
    const periodProgram = {
      id: 'period-curriculum',
      generalProgramEducationStructure: 'curriculum',
      generalProgramSessionRound: 'multi',
      generalCommonInfo: { educationScheduleMode: 'period' },
    } as Program
    expect(shouldShowSurveyPollScheduleSelectField(periodProgram, loaded([{}]))).toBe(false)
    expect(isSurveyPollPeriodProgram(periodProgram)).toBe(true)
  })

  // 기능정의서: 일정 선택 필드는 선택 가능한 일정이 있을 때만 노출
  it('shows the field when at least one schedule is selectable (even a single slot)', () => {
    expect(shouldShowSurveyPollScheduleSelectField(dateModeProgram, loaded([{}]))).toBe(true)
    expect(
      shouldShowSurveyPollScheduleSelectField(dateModeProgram, loaded([{ disabled: true }, {}]))
    ).toBe(true)
  })

  it('hides the field when no schedule is selectable', () => {
    expect(shouldShowSurveyPollScheduleSelectField(dateModeProgram, loaded([]))).toBe(false)
    expect(
      shouldShowSurveyPollScheduleSelectField(dateModeProgram, loaded([{ disabled: true }]))
    ).toBe(false)
  })

  it('keeps the field visible while schedules are loading', () => {
    expect(
      shouldShowSurveyPollScheduleSelectField(dateModeProgram, { options: [], isLoading: true })
    ).toBe(true)
  })
})
