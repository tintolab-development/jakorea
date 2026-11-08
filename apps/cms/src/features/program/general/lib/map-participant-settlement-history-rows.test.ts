import { describe, expect, it } from 'vitest'
import type { ParticipatingSchoolSession } from '@/features/program/general/model/participating-schools'
import {
  mapParticipantSettlementHistoryRows,
  participantSettlementHistoryFromInstructorRows,
} from '@/features/program/general/lib/map-participant-settlement-history-rows'

function session(
  overrides: Partial<ParticipatingSchoolSession> & Pick<ParticipatingSchoolSession, 'round'>
): ParticipatingSchoolSession {
  return {
    date: '2026-01-09',
    dayOfWeek: '금',
    duration: '',
    format: '',
    classNum: '',
    timeRange: '09:20 ~ 11:20',
    ...overrides,
  }
}

describe('mapParticipantSettlementHistoryRows', () => {
  it('배정 일정을 행으로 만들고 지급조서는 scheduleId로만 붙인다', () => {
    const rows = mapParticipantSettlementHistoryRows({
      assignedSessions: [
        session({
          round: 1,
          resolvedScheduleId: 11,
          educationScheduleLabel: '2026.01.09(금) 09:20 ~ 11:20 | 1회차',
          status: 'completed',
          deliveryScheduleStatus: 'COMPLETED',
          startAt: '2026-01-09T09:20:00',
        }),
        session({
          round: 2,
          resolvedScheduleId: 12,
          educationScheduleLabel: '2026.01.16(금) 09:20 ~ 11:20 | 2회차',
          status: 'pending',
          deliveryScheduleStatus: 'SCHEDULED',
          startAt: '2026-01-16T09:20:00',
        }),
      ],
      settlementItems: [
        {
          settlementId: 501,
          scheduleId: 11,
          statementStatus: 'CONFIRMED',
          netPaymentAmount: 300_000,
        },
      ],
    })

    expect(rows).toHaveLength(2)
    expect(rows[0]?.no).toBe(1)
    expect(rows[0]?.lectureProgress).toBe('scheduled')
    expect(rows[0]?.paymentStatementStatus).toBe('none')
    expect(rows[0]?.canViewPaymentStatement).toBe(false)
    expect(rows[1]?.lectureProgress).toBe('completed')
    expect(rows[1]?.paymentStatementStatus).toBe('payment_statement_verified')
    expect(rows[1]?.scheduledSettlementAmount).toBe(300_000)
    expect(rows[1]?.sourceSettlement?.settlementId).toBe(501)
  })

  it('settlement가 없어도 배정 일정 행은 유지한다', () => {
    const rows = mapParticipantSettlementHistoryRows({
      assignedSessions: [
        session({
          round: 1,
          resolvedScheduleId: 11,
          educationScheduleLabel: '1회차',
        }),
      ],
      settlementItems: [],
    })

    expect(rows).toHaveLength(1)
    expect(rows[0]?.paymentStatementStatus).toBe('none')
    expect(rows[0]?.scheduledSettlementAmount).toBeNull()
  })

  it('강사 settlement 행이 있으면 그대로 이력 행으로 옮긴다', () => {
    const rows = participantSettlementHistoryFromInstructorRows([
      {
        id: '9',
        settlementId: 9,
        settlementApplicationId: null,
        isPendingApplication: false,
        availableActions: [],
        no: 1,
        institutionName: '-',
        educationGrade: '-',
        educationScheduleLabel: '1회차',
        lectureProgressLabel: '진행 완료',
        lectureProgress: 'completed',
        hasPaymentStatementApplication: true,
        paymentStatementStatus: 'application_rejected',
        scheduledSettlementAmount: 300_000,
        canViewPaymentStatement: true,
      },
    ])

    expect(rows[0]?.sourceSettlement?.settlementId).toBe(9)
    expect(rows[0]?.paymentStatementStatus).toBe('application_rejected')
  })
})
