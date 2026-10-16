import { describe, expect, it } from 'vitest'
import {
  GENERAL_PROGRAM_ORG_SCHEDULE_MULTI_ID,
  GENERAL_PROGRAM_ORG_SCHEDULE_SINGLE_DATE_ONE_DAY_ID,
  GENERAL_PROGRAM_ORG_SCHEDULE_SINGLE_ID,
} from '@/features/program/general/lib/detail-common-info-display'
import { shouldShowSurveyPollScheduleSelectField } from '@/features/program/shared/lib/survey-management/should-show-survey-poll-schedule-field'
import type { Program } from '@/types/domain'

describe('shouldShowSurveyPollScheduleSelectField', () => {
  it('returns true when program is null (conservative default)', () => {
    expect(shouldShowSurveyPollScheduleSelectField(null)).toBe(true)
    expect(shouldShowSurveyPollScheduleSelectField(undefined)).toBe(true)
  })

  it('returns true for same-day two slots (same as application schedule paragraph)', () => {
    expect(
      shouldShowSurveyPollScheduleSelectField({
        id: GENERAL_PROGRAM_ORG_SCHEDULE_SINGLE_DATE_ONE_DAY_ID,
        generalProgramEducationStructure: 'schedule',
        generalProgramSessionRound: 'single',
      } as Program)
    ).toBe(true)
  })

  it('returns true for date mode with multiple unique calendar days', () => {
    expect(
      shouldShowSurveyPollScheduleSelectField({
        id: GENERAL_PROGRAM_ORG_SCHEDULE_SINGLE_ID,
        generalProgramEducationStructure: 'schedule',
        generalProgramSessionRound: 'single',
      } as Program)
    ).toBe(true)
  })

  it('returns false for schedule structure + multi session round', () => {
    expect(
      shouldShowSurveyPollScheduleSelectField({
        id: GENERAL_PROGRAM_ORG_SCHEDULE_MULTI_ID,
        generalProgramEducationStructure: 'schedule',
        generalProgramSessionRound: 'multi',
      } as Program)
    ).toBe(false)
  })
})
