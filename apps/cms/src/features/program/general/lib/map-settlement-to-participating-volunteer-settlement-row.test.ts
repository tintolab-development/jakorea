import { describe, expect, it } from 'vitest'
import type { SettlementListItemResponse } from '@/shared/api/generated/settlement/schemas'
import type { ParticipatingVolunteerRow } from '@/features/program/general/model/participating-volunteers'
import {
  mapSettlementsToParticipatingVolunteerSettlementRows,
  shouldShowVolunteerSettlementDash,
  summarizeParticipatingVolunteerPaymentStatementStatus,
  summarizeParticipatingVolunteerSettlementProgress,
} from '@/features/program/general/lib/map-settlement-to-participating-volunteer-settlement-row'

const baseVolunteer: ParticipatingVolunteerRow = {
  id: 'v1',
  memberId: 1001,
  no: 1,
  volunteerName: '박틴토',
  id1365: '1365-1',
  assignedInstitutionNames: ['강서초등학교'],
  sessions: [],
  contact: '010-0000-0000',
  email: 'vol@example.com',
}

function settlement(partial: SettlementListItemResponse): SettlementListItemResponse {
  return {
    settlementId: 1,
    lectureDate: '2026-01-09T09:20:00',
    sessionOrdinal: 1,
    institutionName: '강서초등학교',
    sessionCompleted: 1,
    sessionTotal: 7,
    ...partial,
  }
}

describe('mapSettlementsToParticipatingVolunteerSettlementRows', () => {
  it('미신청·진행 예정은 지급조서·금액을 dash 대상으로 표시', () => {
    const rows = mapSettlementsToParticipatingVolunteerSettlementRows(
      [
        settlement({
          settlementId: 10,
          lectureDate: '2026-12-01T09:00:00',
          statementStatus: 'NONE',
          paymentStatus: undefined,
          netPaymentAmount: 300000,
        }),
      ],
      baseVolunteer
    )
    expect(rows).toHaveLength(1)
    expect(rows[0]!.volunteerProgress).toBe('scheduled')
    expect(shouldShowVolunteerSettlementDash(rows[0]!)).toBe(true)
    expect(rows[0]!.canViewPaymentStatement).toBe(false)
  })

  it('정정 요청·재신청 상태는 봉사자에서 none으로 정규화', () => {
    const rows = mapSettlementsToParticipatingVolunteerSettlementRows(
      [
        settlement({
          settlementId: 11,
          lectureDate: '2025-01-01T09:00:00',
          statementStatus: 'CORRECTION_REQUESTED',
          netPaymentAmount: 300000,
        }),
      ],
      baseVolunteer
    )
    expect(rows[0]!.paymentStatementStatus).toBe('none')
    expect(shouldShowVolunteerSettlementDash(rows[0]!)).toBe(true)
  })

  it('확인 완료 건은 보기·다운로드 가능', () => {
    const rows = mapSettlementsToParticipatingVolunteerSettlementRows(
      [
        settlement({
          settlementId: 12,
          lectureDate: '2025-01-01T09:00:00',
          statementStatus: 'CONFIRMED',
          paymentStatus: 'CONFIRMED',
          netPaymentAmount: 300000,
        }),
      ],
      baseVolunteer
    )
    expect(rows[0]!.volunteerProgress).toBe('completed')
    expect(shouldShowVolunteerSettlementDash(rows[0]!)).toBe(false)
    expect(rows[0]!.canViewPaymentStatement).toBe(true)
  })

  it('진행 회차·요약 상태를 집계한다', () => {
    const rows = mapSettlementsToParticipatingVolunteerSettlementRows(
      [
        settlement({
          settlementId: 1,
          lectureDate: '2025-01-01T09:00:00',
          statementStatus: 'CONFIRMED',
          paymentStatus: 'CONFIRMED',
          sessionCompleted: 3,
          sessionTotal: 7,
        }),
        settlement({
          settlementId: 2,
          lectureDate: '2025-02-01T09:00:00',
          statementStatus: 'REQUESTED',
          sessionCompleted: 3,
          sessionTotal: 7,
        }),
        settlement({
          settlementId: 3,
          lectureDate: '2026-12-01T09:00:00',
          statementStatus: 'NONE',
          sessionCompleted: 3,
          sessionTotal: 7,
        }),
      ],
      baseVolunteer
    )
    expect(summarizeParticipatingVolunteerSettlementProgress(rows)).toEqual({
      completed: 2,
      total: 7,
    })
    expect(summarizeParticipatingVolunteerPaymentStatementStatus(rows)).toBe('partial_confirmation')
  })

  it('활동 포기 봉사자는 미완료 일정을 활동 포기로 표시', () => {
    const rows = mapSettlementsToParticipatingVolunteerSettlementRows(
      [
        settlement({
          settlementId: 20,
          lectureDate: '2026-12-01T09:00:00',
          statementStatus: 'NONE',
        }),
      ],
      { ...baseVolunteer, activityWithdrawn: true }
    )
    expect(rows[0]!.volunteerProgress).toBe('activity_withdrawn')
    expect(rows[0]!.volunteerProgressLabel).toBe('활동 포기')
  })
})
