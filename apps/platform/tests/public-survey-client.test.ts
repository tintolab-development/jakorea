import { describe, expect, it } from 'vitest'
import {
  publicSurveySubmitMatchesForm,
  resolvePublicSurveyKind,
} from '../src/features/public-survey/api/client'

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
