import { describe, expect, it } from 'vitest'
import { mergeSponsorRegistrationSelectOptions } from './registration-sponsor-select-option-merge'

describe('mergeSponsorRegistrationSelectOptions', () => {
  it('숫자 id 후원사 상세를 문자열 선택값과 매칭해 이름 라벨을 쓴다', () => {
    const options = mergeSponsorRegistrationSelectOptions({
      sponsorIds: ['163336'],
      apiOptions: [],
      sponsors: [{ id: 163336, name: 'JA파운데이션' }],
    })
    expect(options).toEqual([{ value: '163336', label: 'JA파운데이션' }])
  })
})
