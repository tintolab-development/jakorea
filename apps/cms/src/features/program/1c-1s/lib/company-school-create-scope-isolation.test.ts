/** @vitest-environment node */
import { afterEach, describe, expect, it } from 'vitest'
import {
  getGeneralRecruitOverlayRecord,
  patchGeneralRecruitOverlay,
  peekGeneralRecruitOverlayRecord,
  replaceGeneralRecruitOverlayForScope,
  resetGeneralRecruitOverlayStoreForTests,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import {
  patchActiveCompanySchoolRecruitmentOverlay,
  peekCompanySchoolRegistrationRhf,
  registerCompanySchoolRegistrationRhf,
  type CompanySchoolRegistrationRhfApi,
} from './registration-rhf-api'
import {
  applyCompanySchoolRhfOverlayRecord,
  createDefaultCompanySchoolRegistrationRhfValues,
  type CompanySchoolRegistrationRhfValues,
} from './registration-rhf-values'

function mockRhfApi(
  values: CompanySchoolRegistrationRhfValues
): CompanySchoolRegistrationRhfApi {
  let current = values
  return {
    getValues: () => current,
    getPath: path => {
      if (path === 'recruitment') return current.recruitment
      if (path === 'instructorRecruit') return current.instructorRecruit
      if (path === 'application') return current.application
      return undefined
    },
    setPath: (path, value) => {
      if (path === 'recruitment') {
        current = { ...current, recruitment: value as CompanySchoolRegistrationRhfValues['recruitment'] }
      }
      if (path === 'instructorRecruit') {
        current = {
          ...current,
          instructorRecruit: value as CompanySchoolRegistrationRhfValues['instructorRecruit'],
        }
      }
      if (path === 'application') {
        current = { ...current, application: value as CompanySchoolRegistrationRhfValues['application'] }
      }
    },
    reset: next => {
      current = next
    },
    applyOverlayRecord: overlay => {
      current = applyCompanySchoolRhfOverlayRecord(current, overlay)
    },
    isDirty: () => false,
    markBaseline: () => undefined,
  }
}

describe('1사1교 CREATE 공유 모집 scope 격리', () => {
  afterEach(() => {
    registerCompanySchoolRegistrationRhf(null)
    resetGeneralRecruitOverlayStoreForTests()
  })

  it('1사1교 위저드 활성이면 기관·강사 키는 RHF로만 간다', () => {
    const api = mockRhfApi(createDefaultCompanySchoolRegistrationRhfValues())
    registerCompanySchoolRegistrationRhf(api)
    patchGeneralRecruitOverlay({
      'recruit.maxClassCount': 7,
      'recruit.instructor.inquiryContact': '강사 문의',
    })
    expect(api.getValues().recruitment.maxClassCount).toBe(7)
    expect(api.getValues().instructorRecruit.inquiryContact).toBe('강사 문의')
    expect(getGeneralRecruitOverlayRecord()['recruit.maxClassCount']).toBeUndefined()
    expect(getGeneralRecruitOverlayRecord()['recruit.instructor.inquiryContact']).toBeUndefined()
  })

  it('기관 모집과 강사 모집은 서로 덮지 않는다', () => {
    const api = mockRhfApi(createDefaultCompanySchoolRegistrationRhfValues())
    registerCompanySchoolRegistrationRhf(api)
    patchActiveCompanySchoolRecruitmentOverlay({
      'recruit.inquiryContact': '기관',
      'recruit.instructor.inquiryContact': '강사',
    })
    expect(api.getValues().recruitment.inquiryContact).toBe('기관')
    expect(api.getValues().instructorRecruit.inquiryContact).toBe('강사')
  })

  it('CS RHF가 꺼지면 일반 catalog 값과 섞이지 않는다', () => {
    const api = mockRhfApi(createDefaultCompanySchoolRegistrationRhfValues())
    registerCompanySchoolRegistrationRhf(api)
    patchGeneralRecruitOverlay({ 'recruit.instructor.inquiryContact': 'CS 강사' })
    registerCompanySchoolRegistrationRhf(null)
    replaceGeneralRecruitOverlayForScope('recruitment-instructor', {
      'recruit.instructor.inquiryContact': '일반 강사',
    })
    expect(peekGeneralRecruitOverlayRecord('recruitment-instructor')['recruit.instructor.inquiryContact']).toBe(
      '일반 강사'
    )
    expect(peekCompanySchoolRegistrationRhf()).toBeNull()
  })

  it('다른 catalog peek는 CS RHF 값을 넣지 않는다', () => {
    const api = mockRhfApi(createDefaultCompanySchoolRegistrationRhfValues())
    api.setPath('instructorRecruit', {
      ...api.getValues().instructorRecruit,
      inquiryContact: 'CS only',
    })
    registerCompanySchoolRegistrationRhf(api)
    expect(peekGeneralRecruitOverlayRecord('recruitment-instructor')['recruit.instructor.inquiryContact']).toBe(
      'CS only'
    )
    expect(
      peekGeneralRecruitOverlayRecord('recruitment-individual')['recruit.instructor.inquiryContact']
    ).toBeUndefined()
    expect(
      peekGeneralRecruitOverlayRecord('recruitment-volunteer')['recruit.maxClassCount']
    ).toBeUndefined()
  })

  it('위저드 종료 후 다음 프로그램 RHF는 이전 값을 갖지 않는다', () => {
    const first = mockRhfApi(createDefaultCompanySchoolRegistrationRhfValues())
    registerCompanySchoolRegistrationRhf(first)
    patchGeneralRecruitOverlay({ 'recruit.maxClassCount': 12 })
    registerCompanySchoolRegistrationRhf(null)
    const second = mockRhfApi(createDefaultCompanySchoolRegistrationRhfValues())
    registerCompanySchoolRegistrationRhf(second)
    expect(second.getValues().recruitment.maxClassCount).toBeNull()
    expect(peekCompanySchoolRegistrationRhf()?.getValues().recruitment.maxClassCount).toBeNull()
  })
})
