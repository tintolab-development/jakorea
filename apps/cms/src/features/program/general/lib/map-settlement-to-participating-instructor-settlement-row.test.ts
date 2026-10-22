import { describe, expect, it } from 'vitest'
import {
  buildParticipatingInstructorEducationScheduleLabel,
  inferParticipatingInstructorLectureProgress,
  mapSettlementsToParticipatingInstructorSettlementRows,
  summarizeParticipatingInstructorPaymentStatementStatus,
  summarizeParticipatingInstructorSettlementProgress,
} from '@/features/program/general/lib/map-settlement-to-participating-instructor-settlement-row'
import { shouldShowIndividualSettlementDash } from '@/features/program/general/lib/participating-individual-instructor-settlement-display'

describe('mapSettlementsToParticipatingInstructorSettlementRows', () => {
  it('maps settlement list items to table rows', () => {
    const rows = mapSettlementsToParticipatingInstructorSettlementRows([
      {
        settlementId: 101,
        institutionName: '강서초등학교',
        lectureDate: '2026-01-09T09:20:00',
        sessionOrdinal: 1,
        statementStatus: 'CONFIRMED',
        netPaymentAmount: 915_000,
        sessionCompleted: 1,
        sessionTotal: 5,
      },
      {
        settlementId: 102,
        institutionName: '서울등현초등학교',
        lectureDate: '2027-02-06T09:20:00',
        sessionOrdinal: 5,
        statementStatus: 'REQUESTED',
        netPaymentAmount: 880_000,
        sessionCompleted: 0,
        sessionTotal: 5,
      },
    ])

    expect(rows).toHaveLength(2)
    expect(rows[0]?.settlementId).toBe(102)
    expect(rows[0]?.no).toBe(2)
    expect(rows[1]?.institutionName).toBe('강서초등학교')
    expect(rows[1]?.paymentStatementStatus).toBe('payment_statement_verified')
    expect(rows[1]?.scheduledSettlementAmount).toBe(915_000)
    expect(rows[0]?.lectureProgress).toBe('scheduled')
  })

  it('builds education schedule label from session display or date', () => {
    expect(
      buildParticipatingInstructorEducationScheduleLabel({
        programSessionProgressDisplay: '2026.01.09(금) 09:20 ~ 11:20 | 1회차',
      })
    ).toBe('2026.01.09(금) 09:20 ~ 11:20 | 1회차')

    expect(
      buildParticipatingInstructorEducationScheduleLabel({
        lectureDate: '2026-01-09T09:20:00',
        sessionOrdinal: 2,
      })
    ).toContain('2회차')
  })

  it('summarizes completed lecture count and total sessions', () => {
    const rows = mapSettlementsToParticipatingInstructorSettlementRows([
      {
        settlementId: 1,
        lectureDate: '2025-01-01',
        sessionTotal: 7,
        statementStatus: 'CONFIRMED',
        paymentStatus: 'PAID',
      },
      {
        settlementId: 2,
        lectureDate: '2027-01-01',
        sessionTotal: 7,
      },
    ])

    expect(summarizeParticipatingInstructorSettlementProgress(rows)).toEqual({
      completed: 1,
      total: 7,
    })
    expect(inferParticipatingInstructorLectureProgress({ lectureDate: '2025-01-01' })).toBe(
      'completed'
    )
  })

  it('진행 예정·지급조서 없음은 대시 대상이다', () => {
    const rows = mapSettlementsToParticipatingInstructorSettlementRows([
      {
        settlementId: 10,
        lectureDate: '2027-12-01T09:00:00',
        statementStatus: 'CONFIRMED',
        netPaymentAmount: 300_000,
      },
    ])

    expect(rows[0]?.lectureProgress).toBe('scheduled')
    expect(shouldShowIndividualSettlementDash(rows[0]!)).toBe(true)
    expect(
      shouldShowIndividualSettlementDash({
        lectureProgress: 'completed',
        hasPaymentStatementApplication: false,
      })
    ).toBe(true)
  })

  it('지급조서 상태가 섞이면 확인 진행 중이다', () => {
    const rows = mapSettlementsToParticipatingInstructorSettlementRows([
      {
        settlementId: 1,
        lectureDate: '2025-01-01T09:00:00',
        statementStatus: 'CONFIRMED',
        paymentStatus: 'PAID',
        sessionTotal: 7,
      },
      {
        settlementId: 2,
        lectureDate: '2025-02-01T09:00:00',
        statementStatus: 'REQUESTED',
        sessionTotal: 7,
      },
      {
        settlementId: 3,
        lectureDate: '2027-12-01T09:00:00',
        statementStatus: 'NONE',
        sessionTotal: 7,
      },
    ])

    expect(summarizeParticipatingInstructorPaymentStatementStatus(rows)).toBe(
      'partial_confirmation'
    )
  })

  it('표시 가능한 지급조서 상태가 모두 같으면 그 상태를 쓴다', () => {
    const rows = mapSettlementsToParticipatingInstructorSettlementRows([
      {
        settlementId: 1,
        lectureDate: '2025-01-01T09:00:00',
        statementStatus: 'CONFIRMED',
        paymentStatus: 'CONFIRMED',
      },
      {
        settlementId: 2,
        lectureDate: '2025-02-01T09:00:00',
        statementStatus: 'CONFIRMED',
        paymentStatus: 'CONFIRMED',
      },
    ])

    expect(summarizeParticipatingInstructorPaymentStatementStatus(rows)).toBe(
      'payment_statement_verified'
    )
  })
})
