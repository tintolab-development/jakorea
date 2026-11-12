import { describe, expect, it } from 'vitest'
import {
  buildGeneralRegistrationIncompleteItems,
  countGeneralRegistrationIncompleteByStep,
  resolveGeneralRegistrationIncompleteStep,
} from './registration-incomplete-summary'

describe('일반 프로그램 등록 미입력 요약 (QA-0042)', () => {
  it('진단 키를 단계로 나눈다', () => {
    expect(resolveGeneralRegistrationIncompleteStep('basicInfo.sponsorId')).toBe('program')
    expect(resolveGeneralRegistrationIncompleteStep('recruit.instructor.recruitTargets')).toBe(
      'recruit-instructor'
    )
    expect(resolveGeneralRegistrationIncompleteStep('recruit.institution.targetLevels')).toBe(
      'recruit-participant-school'
    )
    expect(resolveGeneralRegistrationIncompleteStep('application.thirdParty.p.0.0')).toBeNull()
    expect(
      resolveGeneralRegistrationIncompleteStep('application.thirdParty.p.0.0', {
        applicationStep: 'application-instructor',
      })
    ).toBe('application-instructor')
  })

  it('「탭 이름 > 항목명」으로 나열하고 같은 문구는 한 번만', () => {
    const items = buildGeneralRegistrationIncompleteItems([
      'basicInfo.sponsorId',
      'recruit.instructor.recruitTargets',
      'recruit.instructor.inquiryContact',
      'recruit.instructor.inquiryContact',
      'recruit.volunteer.interviewRequired',
      'curriculum.sessionTitle[2]',
    ])
    expect(items.map(item => item.text)).toEqual([
      '공통 정보 > 후원사',
      '강사 모집 정보 > 모집 대상',
      '강사 모집 정보 > 문의처',
      '봉사자 모집 정보 > 면접 유무',
      expect.stringMatching(/^공통 정보 > /),
    ])
  })

  it('탭별 개수를 센다', () => {
    expect(
      countGeneralRegistrationIncompleteByStep([
        'recruit.instructor.recruitTargets',
        'recruit.instructor.inquiryContact',
        'recruit.individual.interviewRequired',
        'wage.grade1Fee',
      ])
    ).toEqual({ 'recruit-instructor': 2, 'recruit-participant-individual': 1, program: 1 })
  })
})
