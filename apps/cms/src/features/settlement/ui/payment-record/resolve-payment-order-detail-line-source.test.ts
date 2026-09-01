import { describe, expect, it } from 'vitest'
import type {
  PaymentOrderAdminInstructorRow,
  PaymentOrderAdminProgramRow,
} from '@/data/mock/payment-order-admin-list'
import {
  resolvePaymentOrderInstructorDetailForLines,
  resolvePaymentOrderInstructorDetailLineRows,
  resolvePaymentOrderProgramDetailForLines,
  resolvePaymentOrderProgramDetailLineRows,
} from './resolve-payment-order-detail-line-source'

const programRow: PaymentOrderAdminProgramRow = {
  no: 1,
  programId: 42,
  aggregateKey: '42',
  programName: 'JA 경제교실',
  instructorCount: 1,
  processingStatus: 'pending',
  estimatedAmount: 915000,
  referenceDate: '2026-08-15',
  settlementRelevantAttendanceDates: ['2026-08-15'],
  pendingPaymentSettlementItemCount: 1,
}

const instructorRow: PaymentOrderAdminInstructorRow = {
  no: 1,
  instructorMemberId: 9001,
  aggregateKey: '9001',
  instructorName: '홍길동',
  programCount: 1,
  processingStatus: 'pending',
  estimatedAmount: 915000,
  relatedProgramNames: ['JA 경제교실'],
  referenceDate: '2026-08-15',
  settlementRelevantAttendanceDates: ['2026-08-15'],
  pendingPaymentSettlementItemCount: 1,
}

describe('resolvePaymentOrderDetailLineSource — remote mock 금지', () => {
  it('remote이고 contextData가 없으면 프로그램 상세·행을 mock으로 채우지 않는다', () => {
    expect(
      resolvePaymentOrderProgramDetailForLines(true, programRow, undefined)
    ).toBeNull()
    expect(resolvePaymentOrderProgramDetailLineRows(true, programRow, undefined)).toEqual([])
  })

  it('remote이고 contextData가 없으면 강사 상세·행을 mock으로 채우지 않는다', () => {
    expect(
      resolvePaymentOrderInstructorDetailForLines(true, instructorRow, undefined)
    ).toBeNull()
    expect(resolvePaymentOrderInstructorDetailLineRows(true, instructorRow, undefined)).toEqual(
      []
    )
  })

  it('remote 빈 items면 행이 비어 있고 김민준 mock이 없다', () => {
    const rows = resolvePaymentOrderProgramDetailLineRows(true, programRow, {
      items: [],
      statements: [],
    })
    expect(rows).toEqual([])
    expect(JSON.stringify(rows)).not.toContain('김민준')
  })

  it('로컬(remote 아님)은 mock 상세를 쓴다', () => {
    const detail = resolvePaymentOrderProgramDetailForLines(false, programRow, undefined)
    expect(detail).not.toBeNull()
    expect(detail?.instructorRows.length).toBeGreaterThan(0)
  })
})
