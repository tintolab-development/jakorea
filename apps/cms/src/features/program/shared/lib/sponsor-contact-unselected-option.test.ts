import { describe, expect, it } from 'vitest'
import {
  normalizeSponsorContactUnselectedSelection,
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
})
