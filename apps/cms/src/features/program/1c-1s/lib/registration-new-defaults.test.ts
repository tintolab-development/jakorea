import { describe, expect, it } from 'vitest'
import {
  createDefaultCompanySchoolRegistrationRhfValues,
  createNewCompanySchoolRegistrationRhfValues,
  rhfValuesFromCompanySchoolCanonical,
} from './registration-rhf-values'

describe('1사1교 신규 등록 기본값 (시안 9899:215345)', () => {
  it('신규 작성은 시안 기본 선택값으로 시작하되 대표 프로그램명은 비운다(QA-0389-8556)', () => {
    expect(createNewCompanySchoolRegistrationRhfValues()).toMatchObject({
      repKo: '',
      repEn: '',
      businessField: 'economy_finance',
      ipOwned: 'ja',
      courseDeliveredBy: 'ja',
      partnerInvolvement: 'no',
      ipsCategory: 'prepare',
      detailedProgramId: '',
    })
  })

  it('임시저장·재조회 복원 기준값은 비워 둔 채 유지한다 (저장된 빈 값을 덮지 않음)', () => {
    const blank = createDefaultCompanySchoolRegistrationRhfValues()
    expect(blank.repKo).toBe('')
    expect(blank.businessField).toBe('')
    expect(blank.partnerInvolvement).toBe('')
    const { recruitment: _r, instructorRecruit: _i, application: _a, sidecar: _s, ...common } = blank
    const restored = rhfValuesFromCompanySchoolCanonical(common)
    expect(restored.repKo).toBe('')
    expect(restored.ipOwned).toBe('')
    expect(restored.ipsCategory).toBe('')
  })
})
