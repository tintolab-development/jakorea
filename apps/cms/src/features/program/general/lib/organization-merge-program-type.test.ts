import { describe, expect, it } from 'vitest'
import { isGeneralOrganizationProgram } from './organization-merge-program-type'

describe('isGeneralOrganizationProgram', () => {
  it('GENERAL_ORGANIZATION 만 합반 대상이다', () => {
    expect(isGeneralOrganizationProgram({ backendProgramType: 'GENERAL_ORGANIZATION' })).toBe(
      true
    )
    expect(isGeneralOrganizationProgram({ backendProgramType: ' general_organization ' })).toBe(
      true
    )
  })

  it('TRAINED_TEACHER·GENERAL·COMPANY_SCHOOL·유형 없음은 합반 대상이 아니다', () => {
    expect(isGeneralOrganizationProgram({ backendProgramType: 'TRAINED_TEACHER' })).toBe(false)
    expect(isGeneralOrganizationProgram({ backendProgramType: 'GENERAL' })).toBe(false)
    expect(isGeneralOrganizationProgram({ backendProgramType: 'GENERAL_INDIVIDUAL' })).toBe(
      false
    )
    expect(isGeneralOrganizationProgram({ backendProgramType: 'COMPANY_SCHOOL' })).toBe(false)
    expect(isGeneralOrganizationProgram({})).toBe(false)
    expect(isGeneralOrganizationProgram(null)).toBe(false)
  })
})
