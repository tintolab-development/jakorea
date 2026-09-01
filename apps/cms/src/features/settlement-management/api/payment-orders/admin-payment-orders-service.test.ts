import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buildPaymentOrdersDetailListParams,
  getPaymentOrdersListRemote,
} from './admin-payment-orders-service'
import { fetchSettlementAggregatesRemote } from '@/features/settlement-management/api/settlement-api-client'

vi.mock('@/features/settlement-management/api/settlement-api-client', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@/features/settlement-management/api/settlement-api-client')>()
  return {
    ...actual,
    fetchSettlementAggregatesRemote: vi.fn(),
  }
})

describe('buildPaymentOrdersDetailListParams', () => {
  it('프로그램 aggregateKey → programId 스코프', () => {
    expect(
      buildPaymentOrdersDetailListParams({
        type: 'program',
        aggregateKey: '42',
        dateRange: null,
      })
    ).toEqual({ programId: 42 })
  })

  it('강사 aggregateKey → instructorMemberId 스코프', () => {
    expect(
      buildPaymentOrdersDetailListParams({
        type: 'instructor',
        aggregateKey: '9001',
        dateRange: null,
      })
    ).toEqual({ instructorMemberId: 9001 })
  })

  it('목록 기간을 fromDate/toDate로 전달', () => {
    expect(
      buildPaymentOrdersDetailListParams({
        type: 'program',
        aggregateKey: '10',
        dateRange: { from: '2026-08-01', to: '2026-09-01' },
      })
    ).toEqual({
      programId: 10,
      fromDate: '2026-08-01',
      toDate: '2026-09-01',
    })
  })

  it('상세 필터 search·statementStatus를 전달', () => {
    expect(
      buildPaymentOrdersDetailListParams({
        type: 'program',
        aggregateKey: '170302',
        dateRange: { from: '2026-08-01', to: '2026-09-01' },
        search: '박틴토',
        statementStatus: 'REQUESTED',
      })
    ).toEqual({
      programId: 170302,
      fromDate: '2026-08-01',
      toDate: '2026-09-01',
      search: '박틴토',
      statementStatus: 'REQUESTED',
    })
  })

  it('aggregateKey가 숫자가 아니면 빈 params', () => {
    expect(
      buildPaymentOrdersDetailListParams({
        type: 'program',
        aggregateKey: 'invalid',
        dateRange: null,
      })
    ).toEqual({})
  })
})

describe('getPaymentOrdersListRemote', () => {
  const fetchMock = vi.mocked(fetchSettlementAggregatesRemote)

  beforeEach(() => {
    fetchMock.mockReset()
    fetchMock.mockResolvedValue([])
  })

  it('프로그램별 진입 시 groupBy=program만 호출한다', async () => {
    await getPaymentOrdersListRemote('program')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(expect.objectContaining({ groupBy: 'program' }))
  })

  it('신청자별 진입 시 groupBy=instructor만 호출한다', async () => {
    await getPaymentOrdersListRemote('instructor')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(expect.objectContaining({ groupBy: 'instructor' }))
  })
})
