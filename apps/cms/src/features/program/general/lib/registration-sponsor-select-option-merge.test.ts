import { describe, expect, it } from 'vitest'
import { SPONSOR_CONTACT_UNSELECTED_VALUE } from '@/features/program/shared/lib/sponsor-contact-unselected-option'
import {
  buildGeneralProgramSponsorManagerSelectOptions,
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

  it('선택된 미선택 sentinel은 라벨을 미선택으로 유지한다', () => {
    const options = mergeSponsorContactSelectOptions({
      selectedIds: [SPONSOR_CONTACT_UNSELECTED_VALUE],
      apiOptions: [],
    })
    expect(options).toEqual([
      { value: SPONSOR_CONTACT_UNSELECTED_VALUE, label: '미선택' },
    ])
  })
})

describe('buildGeneralProgramSponsorManagerSelectOptions', () => {
  it('담당자가 없는 후원사도 수정 모드에서 미선택을 보여준다', () => {
    const options = buildGeneralProgramSponsorManagerSelectOptions({
      isFormEdit: true,
      selectedSponsorIds: ['163336'],
      sponsors: [{ id: '163336', name: '○' }],
      contactsBySponsorId: { '163336': [] },
    })
    expect(options).toEqual([
      { value: SPONSOR_CONTACT_UNSELECTED_VALUE, label: '미선택' },
    ])
  })

  it('상세가 아직 없는 선택 후원사여도 미선택을 보여준다', () => {
    const options = buildGeneralProgramSponsorManagerSelectOptions({
      isFormEdit: true,
      selectedSponsorIds: ['1627251', '163336'],
      sponsors: [{ id: '1627251', name: '스타벅스' }],
      contactsBySponsorId: {
        '1627251': [{ id: 'c1', name: '김담당', position: '책임' }],
      },
    })
    expect(options.map(option => option.label)).toEqual(['스타벅스 | 김담당 책임', '미선택'])
  })

  it('후원사를 고르지 않으면 미선택을 붙이지 않는다', () => {
    expect(
      buildGeneralProgramSponsorManagerSelectOptions({
        isFormEdit: true,
        selectedSponsorIds: [],
        sponsors: [],
        contactsBySponsorId: {},
      })
    ).toEqual([])
  })
})

describe('sponsorSelectIdListsEqual', () => {
  it('같은 순서의 선택값을 동등으로 본다', () => {
    expect(sponsorSelectIdListsEqual(['1627251', '163301'], ['1627251', '163301'])).toBe(true)
    expect(sponsorSelectIdListsEqual(['1627251', '163301'], ['1627251'])).toBe(false)
  })
})
