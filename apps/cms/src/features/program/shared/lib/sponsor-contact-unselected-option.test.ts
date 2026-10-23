import { describe, expect, it } from 'vitest'
import {
  isProgramSponsorManagerUnselected,
  normalizeSponsorContactUnselectedSelection,
  resolveSponsorContactIdsForEdit,
  resolveSponsorContactIdsFromProgram,
  toWireSponsorManagerContactIds,
  SPONSOR_CONTACT_UNSELECTED_VALUE,
  withSponsorContactUnselectedIfSponsorsSelected,
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

  it('후원사가 선택돼 있으면 담당자 0명이어도 미선택을 붙인다', () => {
    expect(withSponsorContactUnselectedIfSponsorsSelected([], true)).toEqual([
      { value: SPONSOR_CONTACT_UNSELECTED_VALUE, label: '미선택' },
    ])
    expect(withSponsorContactUnselectedIfSponsorsSelected([], false)).toEqual([])
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

  it('후원사 전체(__all__) 담당자 기본값은 실제 담당자로 보지 않는다', () => {
    expect(
      resolveSponsorContactIdsForEdit({
        ids: [],
        id: '__all__',
        managerLine: '',
        hasSelectedSponsors: true,
      })
    ).toEqual([SPONSOR_CONTACT_UNSELECTED_VALUE])
  })

  it('전송용 contactIds는 미선택 sentinel을 빼고 []로 정규화한다', () => {
    expect(toWireSponsorManagerContactIds([SPONSOR_CONTACT_UNSELECTED_VALUE])).toEqual([])
    expect(
      toWireSponsorManagerContactIds(['1627251::1627253', SPONSOR_CONTACT_UNSELECTED_VALUE])
    ).toEqual(['1627251::1627253'])
  })

  it('Program 스냅샷에 후원사만 있으면 수정 폼에 미선택을 넣는다', () => {
    expect(
      resolveSponsorContactIdsFromProgram({
        sponsorId: '1627251',
        managerName: '',
        generalCommonInfo: {
          sponsorManagementIds: ['1627251'],
          sponsorManagerContactIds: [],
          sponsorManagerLine: '',
        },
      })
    ).toEqual([SPONSOR_CONTACT_UNSELECTED_VALUE])
    expect(
      resolveSponsorContactIdsFromProgram({
        sponsorId: '1627251',
        managerName: '미선택',
        generalCommonInfo: {
          sponsorManagementIds: ['1627251'],
          sponsorManagerContactIds: [],
          sponsorManagerLine: '미선택',
        },
      })
    ).toEqual([SPONSOR_CONTACT_UNSELECTED_VALUE])
  })
})
