import { describe, expect, it } from 'vitest'
import { isRequiredAddressIncomplete } from '@jakorea/domain/shared/required-address'

/** 학교 등록 — 기관 주소 규칙(상세 비필수) */
describe('school register address rule', () => {
  it('allows missing detail address for organization', () => {
    expect(
      isRequiredAddressIncomplete({
        address: '서울특별시 종로구 세종대로 110',
        addressDetail: '',
        subject: 'organization',
      })
    ).toBe(false)
  })

  it('requires road address for organization', () => {
    expect(
      isRequiredAddressIncomplete({
        address: '',
        addressDetail: '본관',
        subject: 'organization',
      })
    ).toBe(true)
  })
})
