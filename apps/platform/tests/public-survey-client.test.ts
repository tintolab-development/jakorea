import { describe, expect, it } from 'vitest'
import {
  publicSurveySubmitMatchesForm,
  resolvePublicSurveyDisplayTitle,
  resolvePublicSurveyKind,
} from '../src/features/public-survey/api/client'

describe('resolvePublicSurveyDisplayTitle', () => {
  it('uses mapped form name when satisfaction is not per-schedule', () => {
    expect(
      resolvePublicSurveyDisplayTitle({
        formType: 'SATISFACTION',
        templateName: '만족도조사 (학생용)',
        targetScope: 'PROGRAM',
        satisfactionRunMode: 'ONCE_AT_END',
      }),
    ).toBe('만족도조사 (학생용)')
  })

  it('prefixes the schedule for per-schedule satisfaction', () => {
    expect(
      resolvePublicSurveyDisplayTitle({
        formType: 'SATISFACTION',
        templateName: '만족도조사 (학생용)',
        targetScope: 'SCHEDULE',
        satisfactionRunMode: 'PER_SCHEDULE',
        targetScopeLabel: '공통 교육 예정 1',
        sessionNo: 1,
        scheduleStartAt: '2026-11-12T03:00:00.000Z',
      }),
    ).toBe('1회차 · 2026.11.12(목) 만족도조사 (학생용)')
  })
})

describe('resolvePublicSurveyKind', () => {
  it('treats SATISFACTION aliases as satisfaction UI', () => {
    expect(resolvePublicSurveyKind('SATISFACTION')).toBe('satisfaction')
    expect(resolvePublicSurveyKind('SATISFACTION_SURVEY')).toBe('satisfaction')
    expect(resolvePublicSurveyKind('PROGRAM_SATISFACTION')).toBe('satisfaction')
  })

  it('does not treat nested WRITING or SURVEY as satisfaction', () => {
    expect(resolvePublicSurveyKind('SURVEY')).toBe('survey')
    expect(resolvePublicSurveyKind('WRITING')).toBe('survey')
    expect(resolvePublicSurveyKind(undefined)).toBe('survey')
  })
})

describe('publicSurveySubmitMatchesForm', () => {
  it('requires the same bindingId and formType when both sides send them', () => {
    expect(
      publicSurveySubmitMatchesForm(
        { bindingId: 92053, formType: 'SATISFACTION' },
        { bindingId: 92053, formType: 'SATISFACTION' }
      )
    ).toBe(true)
    expect(
      publicSurveySubmitMatchesForm(
        { bindingId: 92053, formType: 'SATISFACTION' },
        { bindingId: 92011, formType: 'SATISFACTION' }
      )
    ).toBe(false)
    expect(
      publicSurveySubmitMatchesForm(
        { bindingId: 92053, formType: 'SATISFACTION' },
        { bindingId: 92053, formType: 'SURVEY' }
      )
    ).toBe(false)
  })
})
