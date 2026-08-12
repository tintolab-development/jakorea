import { describe, expect, it } from 'vitest'
import { isRequiredAddressIncomplete } from '@jakorea/domain/shared/required-address'

describe('isRequiredAddressIncomplete', () => {
  it('사람은 주소·상세주소가 모두 있어야 완료', () => {
    expect(
      isRequiredAddressIncomplete({
        address: '서울시 중구 세종대로 110',
        addressDetail: '101호',
        subject: 'person',
      })
    ).toBe(false)
    expect(
      isRequiredAddressIncomplete({
        address: '서울시 중구 세종대로 110',
        addressDetail: '',
        subject: 'person',
      })
    ).toBe(true)
    expect(
      isRequiredAddressIncomplete({
        address: '',
        addressDetail: '101호',
        subject: 'person',
      })
    ).toBe(true)
  })

  it('기관은 도로명 주소만 있으면 완료 (상세 선택)', () => {
    expect(
      isRequiredAddressIncomplete({
        address: '서울시 중구 세종대로 110',
        addressDetail: '',
        subject: 'organization',
      })
    ).toBe(false)
    expect(
      isRequiredAddressIncomplete({
        address: '',
        addressDetail: '별관',
        subject: 'organization',
      })
    ).toBe(true)
  })
})
