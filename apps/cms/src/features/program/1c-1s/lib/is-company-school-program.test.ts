import { describe, expect, it } from 'vitest'
import { isCompanySchoolProgram } from './is-company-school-program'

describe('isCompanySchoolProgram', () => {
  it('COMPANY_SCHOOL 유형이면 제목·숫자 id와 무관하게 true', () => {
    expect(
      isCompanySchoolProgram({
        id: '186063',
        backendProgramType: 'COMPANY_SCHOOL',
      })
    ).toBe(true)
    expect(
      isCompanySchoolProgram({
        id: '186063',
        backendProgramType: 'company_school',
      })
    ).toBe(true)
    expect(
      isCompanySchoolProgram({
        id: '186063',
        backendProgramType: 'ONE_COMPANY_ONE_SCHOOL',
      })
    ).toBe(true)
  })

  it('유형·접두·Primary가 없으면 false', () => {
    expect(isCompanySchoolProgram({ id: '186063' })).toBe(false)
    expect(isCompanySchoolProgram({ id: '4021', backendProgramType: 'GENERAL' })).toBe(false)
  })

  it('제목에만 1사1교·ONE-0가 있으면 false', () => {
    const titled = { id: '4021', title: '1사1교 태스트', mainTitle: 'ONE-01' }
    expect(isCompanySchoolProgram(titled)).toBe(false)
  })

  it('GENERAL + 일반 제목은 false', () => {
    expect(
      isCompanySchoolProgram({
        id: '186021',
        backendProgramType: 'GENERAL',
      })
    ).toBe(false)
  })

  it('company-school-local- 접두·Primary id는 유형 없어도 true', () => {
    expect(isCompanySchoolProgram({ id: 'company-school-local-draft' })).toBe(true)
    expect(isCompanySchoolProgram({ id: 'economy-prog-1' })).toBe(true)
    expect(isCompanySchoolProgram({ id: 'company-school-prog-1' })).toBe(true)
    expect(isCompanySchoolProgram({ id: 'company-school-primary-01' })).toBe(true)
    expect(isCompanySchoolProgram({ id: '170001' })).toBe(true)
  })

  it('null·빈 id는 false', () => {
    expect(isCompanySchoolProgram(null)).toBe(false)
    expect(isCompanySchoolProgram(undefined)).toBe(false)
    expect(isCompanySchoolProgram({ id: '' })).toBe(false)
  })
})
