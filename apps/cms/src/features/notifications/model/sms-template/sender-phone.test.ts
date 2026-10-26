import { describe, expect, it } from 'vitest'
import { buildSmsSenderPhoneOptions } from './sender-phone'

describe('buildSmsSenderPhoneOptions', () => {
  const profiles = [
    { senderKey: ' 027832367 ', displayName: '' },
    { senderKey: '15881234', displayName: '대표번호' },
  ]

  it('maps NHN sender profiles to select options (senderKey as-is, displayName label)', () => {
    expect(buildSmsSenderPhoneOptions(profiles)).toEqual([
      { label: '027832367', value: '027832367' },
      { label: '대표번호', value: '15881234' },
    ])
  })

  it('prepends an orphan value only when it is not in the list', () => {
    expect(buildSmsSenderPhoneOptions(profiles, '0212345678')[0]).toEqual({
      label: '0212345678',
      value: '0212345678',
    })
    expect(buildSmsSenderPhoneOptions(profiles, '15881234')).toHaveLength(2)
    expect(buildSmsSenderPhoneOptions(undefined)).toEqual([])
  })
})
