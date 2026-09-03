import { describe, expect, it } from 'vitest'
import {
  educationRecordFiltersFromSearchParams,
  performanceFilterSearchKey,
  performanceListParamsFromSearchParams,
  performanceRecordsParamsFromSearchParams,
} from './performance-filter-params'

describe('performance-filter-params', () => {
  it('maps URL filters to the shared list/summary query', () => {
    const search = new URLSearchParams(
      'tab=summary&er_year=2026&er_q=2&er_area=경제&er_sponsor=현대&er_main=대표&er_title=세부&er_book=교재&er_org=학교&er_sido=서울특별시&er_sigungu=강남구&er_ips=Y&er_etype=offline'
    )
    expect(performanceRecordsParamsFromSearchParams(search)).toEqual({
      year: 2026,
      quarter: 2,
      businessArea: '경제',
      sponsorNameKo: '현대',
      mainTitle: '대표',
      title: '세부',
      textbookName: '교재',
      institutionName: '학교',
      sido: '서울특별시',
      sigungu: '강남구',
      ips: 'Y',
      educationType: 'offline',
    })
    expect(performanceListParamsFromSearchParams(search)).toMatchObject({
      year: 2026,
      page: 0,
      size: 50,
    })
  })

  it('omits tab from the query key so list/summary share the same filter identity', () => {
    const dataTab = new URLSearchParams('er_year=2026&tab=data')
    const summaryTab = new URLSearchParams('er_year=2026&tab=summary')
    expect(performanceFilterSearchKey(dataTab)).toBe(performanceFilterSearchKey(summaryTab))
    expect(performanceFilterSearchKey(dataTab)).toBe('er_year=2026')
  })

  it('returns empty filters for a blank URL', () => {
    expect(educationRecordFiltersFromSearchParams(new URLSearchParams()).quarter).toBe('ALL')
    expect(performanceRecordsParamsFromSearchParams(new URLSearchParams())).toEqual({})
  })
})
