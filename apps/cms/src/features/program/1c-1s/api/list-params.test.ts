import { describe, expect, it } from 'vitest'
import {
  companySchoolListParams,
  companySchoolListParamsFromOverviewStatus,
} from './list-params'
import { COMPANY_SCHOOL_PROGRAM_API_TYPE } from './adapters'

describe('companySchoolListParamsFromOverviewStatus', () => {
  it('maps scheduled to a single SCHEDULED periodStatus (BE aliases legacy RECRUITING to the same bucket)', () => {
    expect(companySchoolListParamsFromOverviewStatus('scheduled', { title: ' ONE ' })).toEqual({
      keyword: 'ONE',
      periodStatus: 'SCHEDULED',
      businessYear: undefined,
    })
  })

  it('maps in_progress / completed to a single periodStatus', () => {
    expect(companySchoolListParamsFromOverviewStatus('in_progress')).toEqual({
      keyword: undefined,
      periodStatus: 'IN_PROGRESS',
      businessYear: undefined,
    })
    expect(companySchoolListParamsFromOverviewStatus('completed', { businessYear: 2026 })).toEqual({
      keyword: undefined,
      periodStatus: 'COMPLETED',
      businessYear: 2026,
    })
  })

  it('omits period filters for 전체', () => {
    expect(companySchoolListParamsFromOverviewStatus(null)).toEqual({
      keyword: undefined,
      periodStatus: undefined,
      businessYear: undefined,
    })
  })
})

describe('companySchoolListParams', () => {
  it('always scopes list requests to COMPANY_SCHOOL', () => {
    expect(companySchoolListParams({ keyword: ' 금융 ' })).toEqual({
      programType: COMPANY_SCHOOL_PROGRAM_API_TYPE,
      keyword: '금융',
      periodStatus: undefined,
      businessYear: undefined,
      page: 0,
      size: 20,
    })
  })
})
