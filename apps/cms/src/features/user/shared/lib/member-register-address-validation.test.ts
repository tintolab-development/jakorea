import { describe, expect, it } from 'vitest'
import { isRequiredAddressIncomplete } from '@jakorea/domain/shared/required-address'

/** CMS 일반회원 등록 — 사람 주소 규칙(상세 필수) */
describe('member register address rule', () => {
  it('requires detail address for person', () => {
    expect(
      isRequiredAddressIncomplete({
        address: '서울특별시 강남구 테헤란로 1',
        addressDetail: '',
        subject: 'person',
      })
    ).toBe(true)
  })

  it('passes when address and detail are present', () => {
    expect(
      isRequiredAddressIncomplete({
        address: '서울특별시 강남구 테헤란로 1',
        addressDetail: '101호',
        subject: 'person',
      })
    ).toBe(false)
  })
})
