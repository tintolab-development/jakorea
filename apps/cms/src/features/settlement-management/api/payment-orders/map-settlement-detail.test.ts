import { describe, expect, it } from 'vitest'
import {
  buildInstructorDetailFromSettlements,
  buildProgramDetailFromSettlements,
} from './map-settlement-detail'
import type {
  PaymentOrderAdminInstructorRow,
  PaymentOrderAdminProgramRow,
} from '@/data/mock/payment-order-admin-list'
import type { SettlementListItemResponse } from '@/shared/api/generated/settlement/schemas'

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

function listItem(
  overrides: Partial<SettlementListItemResponse> = {}
): SettlementListItemResponse {
  return {
    settlementId: 1001,
    programId: 42,
    programNameKo: 'JA 경제교실',
    instructorMemberId: 9001,
    instructorName: '홍길동',
    lectureDate: '2026-08-15',
    statementStatus: 'REQUESTED',
    netPaymentAmount: 915000,
    scheduleId: 88001,
    ...overrides,
  }
}

describe('buildProgramDetailFromSettlements', () => {
  it('institutionName·sessionOrdinal·statementId를 목록 DTO에서 매핑', () => {
    const detail = buildProgramDetailFromSettlements(
      programRow,
      [
        listItem({
          institutionName: '○○초등학교',
          sessionOrdinal: 3,
          statementId: 501,
        }),
      ],
      []
    )
    expect(detail.instructorRows[0]).toMatchObject({
      institutionName: '○○초등학교',
      sessionOrdinal: 3,
      statementId: 501,
    })
    expect(detail.instructorRows[0]?.sessionOrdinal).not.toBe(88001)
  })

  it('진행 회차·사업기간은 라인 건수/lectureDate가 아니라 DTO 헤더', () => {
    const detail = buildProgramDetailFromSettlements(
      programRow,
      [
        listItem({
          sessionCompleted: 4,
          sessionTotal: 16,
          businessPeriodStart: '2025-12-08',
          businessPeriodEnd: '2026-12-30',
          lectureDate: '2026-08-15',
        }),
        listItem({
          settlementId: 1002,
          sessionCompleted: 4,
          sessionTotal: 16,
          businessPeriodStart: '2025-12-08',
          businessPeriodEnd: '2026-12-30',
          lectureDate: '2026-09-01',
        }),
      ],
      []
    )
    expect(detail.sessionCompleted).toBe(4)
    expect(detail.sessionTotal).toBe(16)
    expect(detail.sessionCompleted).not.toBe(detail.instructorRows.length)
    expect(detail.businessPeriodStart).toBe('2025-12-08')
    expect(detail.businessPeriodEnd).toBe('2026-12-30')
  })

  it('statementId가 없으면 statements join으로 채움', () => {
    const detail = buildProgramDetailFromSettlements(
      programRow,
      [listItem({ statementId: undefined })],
      [{ settlementId: 1001, statementId: 777 }]
    )
    expect(detail.instructorRows[0]?.statementId).toBe(777)
  })
})

describe('buildInstructorDetailFromSettlements', () => {
  it('프로그램 행에 기관명·차시를 매핑', () => {
    const detail = buildInstructorDetailFromSettlements(
      instructorRow,
      [
        listItem({
          institutionName: '△△중학교',
          sessionOrdinal: 2,
          statementId: 9,
        }),
      ],
      []
    )
    expect(detail.programRows[0]).toMatchObject({
      institutionName: '△△중학교',
      sessionOrdinal: 2,
      statementId: 9,
    })
  })
})
