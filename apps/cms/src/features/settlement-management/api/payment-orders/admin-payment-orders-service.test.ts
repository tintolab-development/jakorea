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

  it('강사 상세는 지급조서 확인 목록이라 instructorMemberId를 붙이지 않는다', () => {
    expect(
      buildPaymentOrdersDetailListParams({
        type: 'instructor',
        aggregateKey: '9001',
        dateRange: null,
      })
    ).toEqual({})
  })

  it('강사 상세의 기간·검색은 instructorMemberId 없이 전달한다', () => {
    expect(
      buildPaymentOrdersDetailListParams({
        type: 'instructor',
        aggregateKey: '9001',
        dateRange: { from: '2026-08-01', to: '2026-09-01' },
        search: '홍길동',
        statementStatus: 'WAITING_CONFIRM',
      })
    ).toEqual({
      fromDate: '2026-08-01',
      toDate: '2026-09-01',
      search: '홍길동',
      statementStatus: 'WAITING_CONFIRM',
    })
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

  it('목록의 정산 대상자 구분을 payeeType으로 전달하고 전체면 생략', () => {
    expect(
      buildPaymentOrdersDetailListParams({
        type: 'program',
        aggregateKey: '170302',
        payeeType: 'VOLUNTEER',
      })
    ).toEqual({ programId: 170302, payeeType: 'VOLUNTEER' })
    expect(
      buildPaymentOrdersDetailListParams({
        type: 'program',
        aggregateKey: '170302',
        payeeType: 'all',
      })
    ).toEqual({ programId: 170302 })
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

  it('size=100으로 받고 100건이 차면 다음 쪽을 이어 받아 합친다(기본 20건 잘림 방지)', async () => {
    const aggregate = (programId: number) =>
      ({ aggregateKey: String(programId), programId, programName: `가상 ${programId}` }) as never
    fetchMock
      .mockResolvedValueOnce(Array.from({ length: 100 }, (_, i) => aggregate(i + 1)))
      .mockResolvedValueOnce([aggregate(101), aggregate(102), aggregate(103)])

    const result = await getPaymentOrdersListRemote('program')

    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(fetchMock).toHaveBeenNthCalledWith(1, expect.objectContaining({ page: 0, size: 100 }))
    expect(fetchMock).toHaveBeenNthCalledWith(2, expect.objectContaining({ page: 1, size: 100 }))
    expect(result.programRows).toHaveLength(103)
  })

  it('첫 쪽이 100건보다 적으면 한 번만 부른다', async () => {
    fetchMock.mockResolvedValueOnce([
      { aggregateKey: '1', programId: 1, programName: '가상 1' } as never,
    ])
    await getPaymentOrdersListRemote('program')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
