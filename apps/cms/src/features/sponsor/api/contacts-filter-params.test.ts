import { describe, expect, it } from 'vitest'
import {
  contactFiltersFromParamsKey,
  contactsParamsFromFilters,
  EMPTY_CONTACT_LIST_FILTERS,
  EMPTY_CONTACTS_PARAMS_KEY,
  matchesContactFilter,
  serializeContactsParams,
} from './contacts-filter-params'

describe('contactsParamsFromFilters', () => {
  it('omits blank fields', () => {
    expect(contactsParamsFromFilters(EMPTY_CONTACT_LIST_FILTERS)).toEqual({})
    expect(
      contactsParamsFromFilters({ department: ' 기획 ', position: '', name: '김' })
    ).toEqual({ department: '기획', name: '김' })
  })
})

describe('serializeContactsParams', () => {
  it('uses a stable empty key', () => {
    expect(serializeContactsParams({})).toBe(EMPTY_CONTACTS_PARAMS_KEY)
    expect(serializeContactsParams({ department: '', position: '', name: '' })).toBe(
      EMPTY_CONTACTS_PARAMS_KEY
    )
  })
})

describe('matchesContactFilter', () => {
  const row = { department: '기획팀', position: '매니저', name: '김후원' }

  it('matches when every filled field is a substring', () => {
    expect(matchesContactFilter(row, EMPTY_CONTACT_LIST_FILTERS)).toBe(true)
    expect(
      matchesContactFilter(row, { department: '기획', position: '매니', name: '김' })
    ).toBe(true)
  })

  it('rejects a field that does not include the query', () => {
    expect(
      matchesContactFilter(row, { department: '영업', position: '', name: '' })
    ).toBe(false)
  })
})

describe('contactFiltersFromParamsKey', () => {
  it('round-trips serialized params', () => {
    const key = serializeContactsParams({ department: '기획', name: '김' })
    expect(contactFiltersFromParamsKey(key)).toEqual({
      department: '기획',
      position: '',
      name: '김',
    })
  })

  it('returns null for invalid json', () => {
    expect(contactFiltersFromParamsKey('not-json')).toBeNull()
  })
})
