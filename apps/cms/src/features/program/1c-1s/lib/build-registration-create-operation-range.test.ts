import { describe, expect, it } from 'vitest'
import {
  buildCompanySchoolProgramFromRhf,
  CompanySchoolOperationRangeRequiredError,
  hasCompanySchoolOperationRange,
} from './build-registration-create-from-canonical'
import { createDefaultCompanySchoolRegistrationRhfValues } from './registration-rhf-values'

describe('C11 1사1교 CREATE 운영 기간 필수', () => {
  it('운영 기간이 없으면 CREATE 빌드는 검증 오류를 던진다(1/1~12/31 대체 금지)', () => {
    const values = createDefaultCompanySchoolRegistrationRhfValues()
    expect(values.operationRange).toBeNull()
    expect(() =>
      buildCompanySchoolProgramFromRhf({ id: 'c11', values, requireOperationRange: true })
    ).toThrow(CompanySchoolOperationRangeRequiredError)
  })

  it('미리보기(requireOperationRange 없음)는 기존처럼 빌드된다', () => {
    const values = createDefaultCompanySchoolRegistrationRhfValues()
    expect(() => buildCompanySchoolProgramFromRhf({ id: 'c11-preview', values })).not.toThrow()
  })

  it('운영 기간이 있으면 그 기간으로 startDate/endDate를 만든다', () => {
    const values = {
      ...createDefaultCompanySchoolRegistrationRhfValues(),
      operationRange: { start: '2026-11-02', end: '2026-12-18' },
    }
    const program = buildCompanySchoolProgramFromRhf({
      id: 'c11-ok',
      values,
      requireOperationRange: true,
    })
    expect(program.startDate).toBe(new Date('2026-11-02T00:00:00').toISOString())
    const end = String(program.endDate)
    expect(end.startsWith('2026-12-18') || end.startsWith('2026-12-19')).toBe(true)
  })

  it('반쪽 기간은 운영 기간 없음으로 본다', () => {
    expect(hasCompanySchoolOperationRange(null)).toBe(false)
    expect(hasCompanySchoolOperationRange({ start: '2026-11-02', end: '' })).toBe(false)
    expect(hasCompanySchoolOperationRange({ start: '2026-11-02', end: '2026-11-30' })).toBe(true)
  })
})
