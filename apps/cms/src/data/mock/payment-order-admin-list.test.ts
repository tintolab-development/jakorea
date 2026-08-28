import { describe, expect, it } from 'vitest'
import {
  countsTowardPaymentOrderEstimatedAmount,
  mockPaymentOrderAdminInstructorList,
  mockPaymentOrderAdminProgramList,
  getMockPaymentOrderProgramDetail,
} from './payment-order-admin-list'

describe('payment-order-admin-list mock cases', () => {
  it('제미나이 프로그램을 목록에 넣지 않는다', () => {
    expect(mockPaymentOrderAdminProgramList.some(r => r.programName.includes('제미나이'))).toBe(
      false
    )
  })

  it('시안 대표 프로그램·신청자와 버킷 케이스를 포함한다', () => {
    const elementary = mockPaymentOrderAdminProgramList.find(r =>
      r.programName.includes('초등 경제교육')
    )
    expect(elementary?.pendingPaymentSettlementItemCount).toBe(5)
    expect(elementary?.processingStatus).toBe('partial')
    expect(mockPaymentOrderAdminProgramList.some(r => r.pendingPaymentSettlementItemCount === 0)).toBe(
      true
    )
    expect(mockPaymentOrderAdminProgramList.some(r => r.pendingPaymentSettlementItemCount >= 11)).toBe(
      true
    )
    expect(mockPaymentOrderAdminInstructorList[0]?.instructorName).toBe('김틴토')
    expect(mockPaymentOrderAdminInstructorList[1]?.instructorName).toBe('박틴토')
  })

  it('시안 상세 라인에 재신청·반려(합산 제외)·개인 프로그램을 둔다', () => {
    const program = mockPaymentOrderAdminProgramList.find(r =>
      r.programName.includes('초등 경제교육')
    )
    expect(program).toBeDefined()
    const detail = getMockPaymentOrderProgramDetail(program!)
    const statuses = detail.instructorRows.map(r => r.processingStatus)
    expect(statuses).toContain('reapplication')
    expect(statuses).toContain('application_rejected')
    expect(statuses).toContain('pending')
    expect(statuses).toContain('confirmed')
    expect(detail.instructorRows.some(r => r.institutionName === '')).toBe(true)
    const included = detail.instructorRows.filter(r =>
      countsTowardPaymentOrderEstimatedAmount(r.processingStatus)
    )
    const excluded = detail.instructorRows.filter(
      r => !countsTowardPaymentOrderEstimatedAmount(r.processingStatus)
    )
    expect(excluded.length).toBeGreaterThan(0)
    expect(included.length).toBeGreaterThan(0)
  })
})
