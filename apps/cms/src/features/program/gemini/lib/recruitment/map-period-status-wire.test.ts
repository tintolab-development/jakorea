import { describe, expect, it } from 'vitest'
import { mapGeminiRecruitmentUiStatusToPeriodStatusWire } from './map-period-status-wire'

describe('mapGeminiRecruitmentUiStatusToPeriodStatusWire', () => {
  it('maps Primary Case UI labels to BE period_status', () => {
    expect(mapGeminiRecruitmentUiStatusToPeriodStatusWire('SCHEDULED')).toBe('SCHEDULED')
    expect(mapGeminiRecruitmentUiStatusToPeriodStatusWire('IN_PROGRESS')).toBe('RECRUITING')
    expect(mapGeminiRecruitmentUiStatusToPeriodStatusWire('ENDED')).toBe('COMPLETED')
  })

  it('omits ALL and DRAFT from periodStatus query', () => {
    expect(mapGeminiRecruitmentUiStatusToPeriodStatusWire('ALL')).toBeUndefined()
    expect(mapGeminiRecruitmentUiStatusToPeriodStatusWire('DRAFT')).toBeUndefined()
    expect(mapGeminiRecruitmentUiStatusToPeriodStatusWire(undefined)).toBeUndefined()
  })

  it('passes through known BE wire values', () => {
    expect(mapGeminiRecruitmentUiStatusToPeriodStatusWire('RECRUITING')).toBe('RECRUITING')
    expect(mapGeminiRecruitmentUiStatusToPeriodStatusWire('COMPLETED')).toBe('COMPLETED')
  })
})
