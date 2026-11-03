import { describe, expect, it } from 'vitest'
import {
  defaultSatisfactionAudienceForSurveyTab,
  getSatisfactionAudienceTabsForSurveyTab,
  resolveUjatSatisfactionBindingTargetRole,
} from './ujat-satisfaction-survey'

describe('UJAT satisfaction audience tabs', () => {
  it('survey-satisfaction은 교사·상반기 봉사자·하반기 봉사자 탭을 제공한다', () => {
    const tabs = getSatisfactionAudienceTabsForSurveyTab('survey-satisfaction')
    expect(tabs.map(tab => tab.key)).toEqual(['teacher', 'volunteer_h1', 'volunteer_h2'])
    expect(tabs.map(tab => tab.label)).toEqual(['교사', '상반기 봉사자', '하반기 봉사자'])
  })

  it('survey-volunteer-satisfaction은 상·하반기 봉사자 탭만 제공한다', () => {
    const tabs = getSatisfactionAudienceTabsForSurveyTab('survey-volunteer-satisfaction')
    expect(tabs.map(tab => tab.key)).toEqual(['volunteer_h1', 'volunteer_h2'])
    expect(defaultSatisfactionAudienceForSurveyTab('survey-volunteer-satisfaction')).toBe(
      'volunteer_h1'
    )
  })

  it('survey-school-satisfaction은 교사 탭만 제공한다', () => {
    const tabs = getSatisfactionAudienceTabsForSurveyTab('survey-school-satisfaction')
    expect(tabs.map(tab => tab.key)).toEqual(['teacher'])
  })

  it('SATISFACTION 바인딩 targetRole은 교사·상반기·하반기 봉사자를 구분한다', () => {
    expect(resolveUjatSatisfactionBindingTargetRole('teacher')).toBe('TEACHER')
    expect(resolveUjatSatisfactionBindingTargetRole('volunteer_h1')).toBe('VOLUNTEER_H1')
    expect(resolveUjatSatisfactionBindingTargetRole('volunteer_h2')).toBe('VOLUNTEER_H2')
  })
})
