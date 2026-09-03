import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import {
  filterSponsorsBySponsorshipStartDateRange,
  serializeSponsorListFilters,
  sponsorsParamsFromSearchParams,
  writeSponsorshipStartDateRangeToSearchParams,
} from './sponsor-filter-params'

describe('writeSponsorshipStartDateRangeToSearchParams', () => {
  it('writes both ends when only start is selected (single-day filter)', () => {
    const params = new URLSearchParams('sp_kind=corporate')
    writeSponsorshipStartDateRangeToSearchParams(params, [dayjs('2026-03-15'), null])
    expect(params.get('sp_from')).toBe('2026-03-15')
    expect(params.get('sp_to')).toBe('2026-03-15')
  })

  it('writes both ends when only end is selected', () => {
    const params = new URLSearchParams()
    writeSponsorshipStartDateRangeToSearchParams(params, [null, dayjs('2026-04-01')])
    expect(params.get('sp_from')).toBe('2026-04-01')
    expect(params.get('sp_to')).toBe('2026-04-01')
  })

  it('keeps a full range and clears when empty', () => {
    const params = new URLSearchParams('sp_from=2025-01-01&sp_to=2025-12-31')
    writeSponsorshipStartDateRangeToSearchParams(params, [
      dayjs('2026-01-01'),
      dayjs('2026-06-30'),
    ])
    expect(params.get('sp_from')).toBe('2026-01-01')
    expect(params.get('sp_to')).toBe('2026-06-30')
    writeSponsorshipStartDateRangeToSearchParams(params, null)
    expect(params.get('sp_from')).toBeNull()
    expect(params.get('sp_to')).toBeNull()
  })
})

describe('serializeSponsorListFilters', () => {
  it('ignores detail overlay params so open/close detail keeps the same list key', () => {
    const filtersOnly = new URLSearchParams('sp_kind=corporate&sp_st=active')
    const withOverlay = new URLSearchParams(
      'sp_kind=corporate&sp_st=active&sponsorId=sp-1&sponsorLnb=sponsor-detail&returnTo=%2Fprograms'
    )
    expect(serializeSponsorListFilters(withOverlay)).toBe(serializeSponsorListFilters(filtersOnly))
  })

  it('keeps filter params in a stable order and defaults missing kind to corporate', () => {
    const shuffled = new URLSearchParams('sp_st=ended&sp_mgr=김&sp_name=우리&sp_kind=foundation')
    expect(serializeSponsorListFilters(shuffled)).toBe(
      'sp_kind=foundation&sp_name=%EC%9A%B0%EB%A6%AC&sp_mgr=%EA%B9%80&sp_st=ended'
    )
    expect(serializeSponsorListFilters(new URLSearchParams())).toBe('sp_kind=corporate')
  })

  it('includes sponsorship start date range', () => {
    expect(
      serializeSponsorListFilters(
        new URLSearchParams('sp_kind=corporate&sp_from=2025-09-15&sp_to=2026-01-30')
      )
    ).toBe('sp_kind=corporate&sp_from=2025-09-15&sp_to=2026-01-30')
  })

  it('omits empty name/status but keeps default kind', () => {
    expect(serializeSponsorListFilters(new URLSearchParams('sponsorId=sp-1'))).toBe(
      'sp_kind=corporate'
    )
    expect(serializeSponsorListFilters(new URLSearchParams('sp_kind=ALL&sp_name=%20'))).toBe(
      'sp_kind=corporate'
    )
  })
})

describe('sponsorsParamsFromSearchParams', () => {
  it('always sends organizationKind and optional date range', () => {
    expect(sponsorsParamsFromSearchParams(new URLSearchParams())).toEqual({
      organizationKind: 'corporate',
    })
    expect(
      sponsorsParamsFromSearchParams(
        new URLSearchParams('sp_kind=foundation&sp_from=2025-09-15&sp_to=2026-01-30')
      )
    ).toEqual({
      organizationKind: 'foundation',
      sponsorshipStartDateFrom: '2025-09-15',
      sponsorshipStartDateTo: '2026-01-30',
    })
  })
})

describe('filterSponsorsBySponsorshipStartDateRange', () => {
  const rows = [
    { id: '1', sponsorshipStartDate: '2026-03-30T00:00:00.000Z' },
    { id: '2', sponsorshipStartDate: '2025-10-01T00:00:00.000Z' },
    { id: '3', sponsorshipStartDate: undefined },
  ]

  it('returns all rows when range is empty', () => {
    expect(filterSponsorsBySponsorshipStartDateRange(rows, null, null)).toEqual(rows)
  })

  it('filters by inclusive YYYY-MM-DD range', () => {
    expect(
      filterSponsorsBySponsorshipStartDateRange(rows, '2025-09-15', '2026-01-30').map(r => r.id)
    ).toEqual(['2'])
  })
})
