import { describe, expect, it } from 'vitest'
import { listIncompleteCompanySchoolRegistrationRhfRequiredFields } from './registration-rhf-required-fields'
import { createDefaultCompanySchoolRegistrationRhfValues } from './registration-rhf-values'
import {
  COMPANY_SCHOOL_WAGE_DEDUCTION_LABEL,
  nextCompanySchoolWagePaymentItemValues,
  resolveCompanySchoolWageDefaultPaymentItemIds,
} from './company-school-wage-defaults'

describe('1사1교 임금 정보 기본값', () => {
  it('지급 항목 기본값은 교통비(일사일교)·숙박비(일사일교) id다', () => {
    expect(resolveCompanySchoolWageDefaultPaymentItemIds()).toEqual(['p-1', 'p-7'])
  })

  it('공제 항목 표시는 원천징수세액이다', () => {
    expect(COMPANY_SCHOOL_WAGE_DEDUCTION_LABEL).toBe('원천징수세액')
  })

  it('미설정(undefined)이면 기본 지급 항목을 채운다', () => {
    expect(nextCompanySchoolWagePaymentItemValues(undefined, false)).toEqual(['p-1', 'p-7'])
  })

  it('사용자가 비운 []는 기본값으로 다시 채우지 않는다', () => {
    expect(nextCompanySchoolWagePaymentItemValues([], true)).toBeNull()
  })

  it('이미 선택된 값은 유지한다', () => {
    expect(nextCompanySchoolWagePaymentItemValues(['p-3'], false)).toBeNull()
  })

  it('등록 위저드 초기 RHF 값에 지급 항목 기본값을 넣는다', () => {
    expect(createDefaultCompanySchoolRegistrationRhfValues().paymentItemValues).toEqual([
      'p-1',
      'p-7',
    ])
  })

  it('초기 기본값이면 지급 항목 필수 누락으로 보지 않는다', () => {
    expect(
      listIncompleteCompanySchoolRegistrationRhfRequiredFields(
        createDefaultCompanySchoolRegistrationRhfValues()
      )
    ).not.toContain('wage.paymentItemValues')
  })
})
