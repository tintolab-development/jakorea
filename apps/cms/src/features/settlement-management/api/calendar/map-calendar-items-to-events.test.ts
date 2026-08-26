import { describe, expect, it } from 'vitest'
import type {
  PaymentOrderAdminInstructorRow,
  PaymentOrderAdminProgramRow,
} from '@/data/mock/payment-order-admin-list'
import type { SettlementCalendarItemResponse } from '@/shared/api/generated/settlement/schemas'
import {
  mapCalendarItemsToInstructorEvents,
  mapCalendarItemsToProgramEvents,
} from './map-calendar-items-to-events'

const programRows: PaymentOrderAdminProgramRow[] = [
  {
    no: 1,
    programId: 100,
    aggregateKey: '100',
    programName: 'JA 경제교실',
    instructorCount: 2,
    processingStatus: 'pending',
    estimatedAmount: 50_000,
    referenceDate: '2026-08-10',
    settlementRelevantAttendanceDates: ['2026-08-10'],
    pendingPaymentSettlementItemCount: 1,
  },
]

const instructorRows: PaymentOrderAdminInstructorRow[] = [
  {
    no: 1,
    instructorMemberId: 200,
    aggregateKey: '200',
    instructorName: '홍길동',
    programCount: 1,
    processingStatus: 'pending',
    estimatedAmount: 30_000,
    relatedProgramNames: ['JA 경제교실'],
    referenceDate: '2026-08-10',
    settlementRelevantAttendanceDates: ['2026-08-10'],
    pendingPaymentSettlementItemCount: 1,
  },
]

describe('mapCalendarItemsToProgramEvents', () => {
  it('목록(필터)에 없는 프로그램 캘린더 항목은 제외한다', () => {
    const items: SettlementCalendarItemResponse[] = [
      {
        programId: 100,
        date: '2026-08-10',
        expectedAmount: 50_000,
        statementStatus: 'REQUESTED',
      },
      {
        programId: 999,
        date: '2026-08-11',
        programNameKo: '필터 밖 프로그램',
        expectedAmount: 10_000,
        statementStatus: 'REQUESTED',
      },
    ]

    const events = mapCalendarItemsToProgramEvents(items, programRows)

    expect(events).toHaveLength(1)
    expect(events[0]?.bracketTitle).toBe('JA 경제교실')
    expect(events[0]?.sourceProgramRow?.programId).toBe(100)
  })

  it('같은 프로그램·날짜는 금액을 합산한다', () => {
    const items: SettlementCalendarItemResponse[] = [
      {
        programId: 100,
        date: '2026-08-10',
        expectedAmount: 20_000,
        instructorMemberId: 1,
        statementStatus: 'REQUESTED',
      },
      {
        programId: 100,
        date: '2026-08-10',
        expectedAmount: 30_000,
        instructorMemberId: 2,
        statementStatus: 'CONFIRMED',
      },
    ]

    const events = mapCalendarItemsToProgramEvents(items, programRows)

    expect(events).toHaveLength(1)
    expect(events[0]?.amount).toBe(50_000)
    expect(events[0]?.cardSubtitle).toBe('정산 대상 강사 2명')
  })
})

describe('mapCalendarItemsToInstructorEvents', () => {
  it('목록(필터)에 없는 강사 캘린더 항목은 제외한다', () => {
    const items: SettlementCalendarItemResponse[] = [
      {
        instructorMemberId: 200,
        date: '2026-08-10',
        expectedAmount: 30_000,
        statementStatus: 'REQUESTED',
      },
      {
        instructorMemberId: 888,
        date: '2026-08-12',
        instructorName: '필터 밖 강사',
        expectedAmount: 5_000,
        statementStatus: 'REQUESTED',
      },
    ]

    const events = mapCalendarItemsToInstructorEvents(items, instructorRows)

    expect(events).toHaveLength(1)
    expect(events[0]?.bracketTitle).toBe('홍길동 강사')
    expect(events[0]?.sourceInstructorRow?.instructorMemberId).toBe(200)
  })
})
