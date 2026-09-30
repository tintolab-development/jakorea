import { describe, expect, it } from 'vitest'
import {
  isProgramSponsorManagerUnselected,
  normalizeSponsorContactUnselectedSelection,
  resolveSponsorContactIdsForEdit,
  SPONSOR_CONTACT_UNSELECTED_VALUE,
  withSponsorContactUnselectedOption,
} from './sponsor-contact-unselected-option'

describe('sponsor contact unselected option', () => {
  it('appends 미선택 after real contacts', () => {
    expect(
      withSponsorContactUnselectedOption([
        { value: 'c1', label: '김담당' },
        { value: 'c2', label: '이담당' },
      ]).map(option => option.label)
    ).toEqual(['김담당', '이담당', '미선택'])
  })

  it('keeps 미선택 as the only option when there are no contacts', () => {
    expect(withSponsorContactUnselectedOption([])).toEqual([
      { value: SPONSOR_CONTACT_UNSELECTED_VALUE, label: '미선택' },
    ])
  })

  it('treats 미선택 as exclusive', () => {
    expect(
      normalizeSponsorContactUnselectedSelection(['c1', SPONSOR_CONTACT_UNSELECTED_VALUE], ['c1'])
    ).toEqual([SPONSOR_CONTACT_UNSELECTED_VALUE])
    expect(
      normalizeSponsorContactUnselectedSelection(
        [SPONSOR_CONTACT_UNSELECTED_VALUE, 'c1'],
        [SPONSOR_CONTACT_UNSELECTED_VALUE]
      )
    ).toEqual(['c1'])
  })

  it('저장 id가 미선택이면 담당자 미선택으로 판별한다', () => {
    expect(
      isProgramSponsorManagerUnselected({
        sponsorManagerContactIds: [SPONSOR_CONTACT_UNSELECTED_VALUE],
        managerName: null,
      })
    ).toBe(true)
    expect(
      isProgramSponsorManagerUnselected({
        sponsorManagerContactIds: ['1627251::1627253'],
        managerName: '김담당',
      })
    ).toBe(false)
  })

  it('저장된 라벨이 미선택이면 수정 폼에 미선택 값을 넣는다', () => {
    expect(
      resolveSponsorContactIdsForEdit({
        ids: [],
        managerLine: '미선택',
      })
    ).toEqual([SPONSOR_CONTACT_UNSELECTED_VALUE])
    expect(
      resolveSponsorContactIdsForEdit({
        ids: [SPONSOR_CONTACT_UNSELECTED_VALUE],
        managerLine: '',
      })
    ).toEqual([SPONSOR_CONTACT_UNSELECTED_VALUE])
    expect(
      resolveSponsorContactIdsForEdit({
        ids: ['1627251::1627253'],
        managerLine: '김담당',
      })
    ).toEqual(['1627251::1627253'])
  })

  it('후원사만 있고 담당자 ref·표시명이 없으면 수정 폼에 미선택을 넣는다', () => {
    expect(
      resolveSponsorContactIdsForEdit({
        ids: [],
        managerLine: '',
        hasSelectedSponsors: true,
      })
    ).toEqual([SPONSOR_CONTACT_UNSELECTED_VALUE])
    expect(
      resolveSponsorContactIdsForEdit({
        ids: [],
        managerLine: '',
        hasSelectedSponsors: false,
      })
    ).toEqual([])
  })
})
