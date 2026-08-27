import { describe, expect, it } from 'vitest'
import type {
  PaymentOrderAdminInstructorRow,
  PaymentOrderAdminProgramRow,
} from '@/data/mock/payment-order-admin-list'
import { mapAggregatesToInstructorRows, mapAggregatesToProgramRows } from './map-settlement-aggregates'

describe('map-settlement-aggregates', () => {
  it('서버 aggregateStatus를 우선 반영한다', () => {
    const rows: PaymentOrderAdminProgramRow[] = mapAggregatesToProgramRows([
      {
        programId: 1,
        programName: '초등 경제교육',
        instructorCount: 2,
        pendingPaymentSettlementItemCount: 1,
        estimatedAmount: 2000000,
        aggregateStatus: 'PARTIAL',
      } as never,
    ])
    expect(rows[0]?.processingStatus).toBe('partial')
    expect(rows[0]?.estimatedAmount).toBe(2000000)
  })

  it('서버 REAPPLICATION을 재신청으로 매핑한다', () => {
    const rows: PaymentOrderAdminProgramRow[] = mapAggregatesToProgramRows([
      {
        programId: 2,
        programName: '재신청 프로그램',
        instructorCount: 1,
        pendingPaymentSettlementItemCount: 8,
        estimatedAmount: 1200000,
        aggregateStatus: 'REAPPLICATION',
      } as never,
    ])
    expect(rows[0]?.processingStatus).toBe('reapplication')
  })

  it('서버 상태가 없으면 pendingCount로 fallback 한다', () => {
    const instructorRows: PaymentOrderAdminInstructorRow[] = mapAggregatesToInstructorRows([
      {
        instructorMemberId: 9,
        instructorName: '박틴토',
        participationCount: 3,
        pendingPaymentSettlementItemCount: 0,
        estimatedAmount: 915000,
      },
    ])
    expect(instructorRows[0]?.processingStatus).toBe('confirmed')
  })
})
