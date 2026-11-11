import { describe, expect, it } from 'vitest'
import {
  companySchoolListParams,
  companySchoolListParamsFromOverviewStatus,
  readCompanySchoolTableFilters,
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

describe('companySchoolListParamsFromOverviewStatus — 목록 서버 필터', () => {
  it('전체 탭: 진행 현황·교육 대상을 서버로 보내고 운영 기간은 보내지 않는다', () => {
    expect(
      companySchoolListParamsFromOverviewStatus(null, {
        lifecycleStatus: 'in_progress',
        targetLevel: 'high',
        operationStartDate: '2026-11-01',
        operationEndDate: '2026-12-31',
      })
    ).toEqual({
      keyword: undefined,
      periodStatus: undefined,
      businessYear: undefined,
      progressPhase: 'in_progress',
      targetLevel: 'high',
      operationStartDate: undefined,
      operationEndDate: undefined,
    })
  })

  it('예정 탭: 교육 대상·사업 운영 기간을 보내고 진행 현황은 보내지 않는다', () => {
    expect(
      companySchoolListParamsFromOverviewStatus('scheduled', {
        lifecycleStatus: 'completed',
        targetLevel: 'elementary',
        operationStartDate: '2026-11-01',
        operationEndDate: '2026-12-31',
      })
    ).toEqual({
      keyword: undefined,
      periodStatus: 'SCHEDULED',
      businessYear: undefined,
      progressPhase: undefined,
      targetLevel: 'elementary',
      operationStartDate: '2026-11-01',
      operationEndDate: '2026-12-31',
    })
  })

  it('진행 현황 값이 3버킷이 아니면 보내지 않는다', () => {
    expect(
      companySchoolListParamsFromOverviewStatus(null, { lifecycleStatus: 'recruiting_students' })
        .progressPhase
    ).toBeUndefined()
  })

  it('GET 쿼리에 서버 필터 파라미터를 싣는다', () => {
    expect(
      companySchoolListParams({
        progressPhase: 'scheduled',
        targetLevel: 'middle',
        operationStartDate: '2026-11-01',
        operationEndDate: '2026-11-30',
      })
    ).toMatchObject({
      programType: COMPANY_SCHOOL_PROGRAM_API_TYPE,
      progressPhase: 'scheduled',
      targetLevel: 'middle',
      operationStartDate: '2026-11-01',
      operationEndDate: '2026-11-30',
    })
  })
})

describe('readCompanySchoolTableFilters', () => {
  it('URL 목록 필터를 읽는다', () => {
    expect(
      readCompanySchoolTableFilters(
        new URLSearchParams(
          'title=금융&lifecycleStatus=scheduled&targetLevel=high&operationStartDate=2026-11-01&operationEndDate=2026-11-30'
        )
      )
    ).toEqual({
      title: '금융',
      businessYear: undefined,
      lifecycleStatus: 'scheduled',
      targetLevel: 'high',
      operationStartDate: '2026-11-01',
      operationEndDate: '2026-11-30',
    })
  })
})
