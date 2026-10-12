import { describe, expect, it } from 'vitest'
import { SURVEY_POLL_TARGET_ALL_VALUE } from '@/features/program/shared/lib/survey-management/survey-poll-schedule-options'
import { resolveSurveyPollBindingTarget } from '@/features/program/shared/lib/survey-management/resolve-survey-poll-binding-target'

describe('resolveSurveyPollBindingTarget', () => {
  it('maps 전체 to PROGRAM scope', () => {
    expect(resolveSurveyPollBindingTarget(SURVEY_POLL_TARGET_ALL_VALUE)).toEqual({
      targetScope: 'PROGRAM',
    })
  })

  it('maps schedule id to SCHEDULE scope', () => {
    expect(resolveSurveyPollBindingTarget('42')).toEqual({
      targetScope: 'SCHEDULE',
      targetScopeId: 42,
    })
  })

  it('rejects invalid selection', () => {
    expect(() => resolveSurveyPollBindingTarget('')).toThrow('INVALID_SURVEY_POLL_SCHEDULE_SELECTION')
    expect(() => resolveSurveyPollBindingTarget('abc')).toThrow(
      'INVALID_SURVEY_POLL_SCHEDULE_SELECTION'
    )
  })
})
