import { describe, expect, it } from 'vitest'
import {
  excludeCompanySchoolOnlyPaymentItemOptions,
  isCompanySchoolOnlyPaymentItemOption,
} from './program-wage-payment-item-helpers'

const OPTIONS = [
  { value: '11', label: '강사 교통비' },
  { value: '12', label: '숙박비' },
  { value: '13', label: '숙박비 (1사1교)' },
  { value: '14', label: '숙박비(일사일교)' },
  { value: 'NONE', label: '해당없음' },
]

describe('R14 일반 지급 항목에서 1사1교 전용 항목 제외', () => {
  it('라벨로 1사1교 전용 항목을 판별한다', () => {
    expect(isCompanySchoolOnlyPaymentItemOption(OPTIONS[2]!)).toBe(true)
    expect(isCompanySchoolOnlyPaymentItemOption(OPTIONS[3]!)).toBe(true)
    expect(isCompanySchoolOnlyPaymentItemOption(OPTIONS[1]!)).toBe(false)
  })

  it('선택되지 않은 1사1교 전용 항목은 제외한다', () => {
    expect(excludeCompanySchoolOnlyPaymentItemOptions(OPTIONS).map(o => o.value)).toEqual([
      '11',
      '12',
      'NONE',
    ])
  })

  it('이미 선택된 값은 기존 데이터 보존을 위해 남긴다', () => {
    expect(
      excludeCompanySchoolOnlyPaymentItemOptions(OPTIONS, ['13']).map(o => o.value)
    ).toEqual(['11', '12', '13', 'NONE'])
  })
})
