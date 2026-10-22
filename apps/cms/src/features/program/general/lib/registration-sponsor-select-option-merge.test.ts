import { describe, expect, it } from 'vitest'
import {
  mergeSponsorContactSelectOptions,
  mergeSponsorRegistrationSelectOptions,
  sponsorSelectIdListsEqual,
} from './registration-sponsor-select-option-merge'

describe('mergeSponsorRegistrationSelectOptions', () => {
  it('숫자 id 후원사 상세를 문자열 선택값과 매칭해 이름 라벨을 쓴다', () => {
    const options = mergeSponsorRegistrationSelectOptions({
      sponsorIds: ['163336'],
      apiOptions: [],
      sponsors: [{ id: 163336, name: 'JA파운데이션' }],
    })
    expect(options).toEqual([{ value: '163336', label: 'JA파운데이션' }])
  })

  it('빈 카탈로그에서도 선택된 두 후원사 옵션을 유지한다', () => {
    const options = mergeSponsorRegistrationSelectOptions({
      sponsorIds: ['1627251', '163301'],
      apiOptions: [],
      sponsors: [],
    })
    expect(options.map(option => option.value)).toEqual(['1627251', '163301'])
  })
})

describe('mergeSponsorContactSelectOptions', () => {
  it('카탈로그에 없는 GET 담당자 ref를 옵션에서 버리지 않는다', () => {
    const options = mergeSponsorContactSelectOptions({
      selectedIds: ['1627251::1627253', '163301::163322'],
      apiOptions: [],
    })
    expect(options.map(option => option.value)).toEqual([
      '1627251::1627253',
      '163301::163322',
    ])
  })
})

describe('sponsorSelectIdListsEqual', () => {
  it('같은 순서의 선택값을 동등으로 본다', () => {
    expect(sponsorSelectIdListsEqual(['1627251', '163301'], ['1627251', '163301'])).toBe(true)
    expect(sponsorSelectIdListsEqual(['1627251', '163301'], ['1627251'])).toBe(false)
  })
})
