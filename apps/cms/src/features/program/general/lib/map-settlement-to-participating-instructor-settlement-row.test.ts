import { describe, expect, it } from 'vitest'
import {
  buildParticipatingInstructorEducationScheduleLabel,
  buildParticipatingInstructorSettlementRowScheduleLabel,
  inferParticipatingInstructorLectureProgress,
  mapSettlementsToParticipatingInstructorSettlementRows,
  summarizeParticipatingInstructorPaymentStatementStatus,
} from '@/features/program/general/lib/map-settlement-to-participating-instructor-settlement-row'
import {
  isIndividualInstructorPaymentStatementViewDisabled,
  shouldShowIndividualSettlementDash,
} from '@/features/program/general/lib/participating-individual-instructor-settlement-display'
import { filterParticipatingInstructorSettlementDownloadRows } from '@/features/program/general/lib/participating-instructor-settlement-download'

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
    expect(rows[0]?.no).toBe(1)
    expect(rows[1]?.institutionName).toBe('강서초등학교')
    expect(rows[1]?.paymentStatementStatus).toBe('payment_statement_verified')
    expect(rows[1]?.scheduledSettlementAmount).toBe(915_000)
    expect(rows[0]?.lectureProgress).toBe('scheduled')
  })

  it('정산 현황 행 일정 칸은 진행 회차 요약보다 날짜·회차를 먼저 보여 준다', () => {
    expect(
      buildParticipatingInstructorSettlementRowScheduleLabel({
        lectureDate: '2026-11-11',
        sessionOrdinal: 4,
        programSessionProgressDisplay: '1 / 1',
      })
    ).toBe('2026.11.11(수) | 4회차')
    expect(
      buildParticipatingInstructorSettlementRowScheduleLabel({ programSessionProgressDisplay: '1 / 1' })
    ).toBe('1 / 1')
    expect(buildParticipatingInstructorSettlementRowScheduleLabel({})).toBe('-')

    const rows = mapSettlementsToParticipatingInstructorSettlementRows([
      { settlementId: 1, lectureDate: '2026-11-09', sessionOrdinal: 3, programSessionProgressDisplay: '2 / 2' },
      { instructorAssignmentId: 2, lectureDate: '2026-11-08', sessionOrdinal: 2, programSessionProgressDisplay: '2 / 2' },
    ])
    expect(rows.map(row => row.educationScheduleLabel)).toEqual([
      '2026.11.09(월) | 3회차',
      '2026.11.08(일) | 2회차',
    ])
  })

  it('일정 시각이 오면 날짜 | 시간 | 회차 형식으로 표시한다', () => {
    expect(
      buildParticipatingInstructorSettlementRowScheduleLabel({
        lectureDate: '2026-11-09',
        sessionOrdinal: 3,
        scheduleStartAt: '2026-11-09T00:30:00Z',
        scheduleEndAt: '2026-11-09T02:30:00Z',
      })
    ).toBe('2026.11.09(월) | 09:30~11:30 | 3회차')
  })

  it('회차 자리는 사전교육 > N회차 > 일정명 순서로 쓰고 자동 기본명은 숨긴다', () => {
    const base = {
      scheduleStartAt: '2026-10-30T01:00:00+00:00',
      scheduleEndAt: '2026-10-30T03:00:00+00:00',
    }
    expect(
      buildParticipatingInstructorSettlementRowScheduleLabel({
        ...base,
        sessionOrdinal: 1,
        scheduleKind: 'PRE_EDUCATION',
        scheduleName: '사전 교육',
      })
    ).toBe('2026.10.30(금) | 10:00~12:00 | 사전교육')
    expect(
      buildParticipatingInstructorSettlementRowScheduleLabel({
        ...base,
        scheduleKind: 'EDUCATION',
        scheduleName: '가을 진로 특강',
      })
    ).toBe('2026.10.30(금) | 10:00~12:00 | 가을 진로 특강')
    expect(
      buildParticipatingInstructorSettlementRowScheduleLabel({
        ...base,
        scheduleKind: 'EDUCATION',
        scheduleName: '공통 교육 예정 2',
      })
    ).toBe('2026.10.30(금) | 10:00~12:00')
  })

  it('일정 시작 일시 최신순으로 정렬하고, 같으면 회차 번호 큰 순이다', () => {
    const rows = mapSettlementsToParticipatingInstructorSettlementRows([
      { instructorAssignmentId: 1, scheduleId: 11, sessionOrdinal: 4, scheduleStartAt: '2026-10-30T00:30:00Z' },
      { instructorAssignmentId: 2, scheduleId: 12, scheduleKind: 'PRE_EDUCATION', scheduleStartAt: '2026-10-30T03:00:00Z' },
      { instructorAssignmentId: 3, scheduleId: 13, sessionOrdinal: 5, scheduleStartAt: '2026-10-30T00:30:00Z' },
      { settlementId: 9, lectureDate: '2026-10-01' },
    ])
    expect(rows.map(row => row.id)).toEqual([
      'NOT_APPLIED:2:12',
      'NOT_APPLIED:3:13',
      'NOT_APPLIED:1:11',
      'SETTLEMENT:9',
    ])
    expect(rows.map(row => row.no)).toEqual([1, 2, 3, 4])
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

  it('확정 전 신청서 행(settlementId null)을 신청서 ID·서버 actions 그대로 표시한다', () => {
    const rows = mapSettlementsToParticipatingInstructorSettlementRows([
      {
        settlementId: null as unknown as undefined,
        settlementApplicationId: 14,
        lectureDate: '2026-11-08',
        sessionOrdinal: 1,
        statementStatus: 'WAITING_CONFIRM',
        grossAmount: 503_000,
        netPaymentAmount: 488_150,
        availableActions: ['VIEW', 'CONFIRM_SETTLEMENT_APPLICATION', 'REJECT_SETTLEMENT_APPLICATION'],
      },
    ])

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      id: 'SETTLEMENT_APPLICATION:14',
      rowType: 'SETTLEMENT_APPLICATION',
      isNotApplied: false,
      settlementId: null,
      settlementApplicationId: 14,
      isPendingApplication: true,
      canViewPaymentStatement: false,
      scheduledSettlementAmount: 488_150,
      paymentStatementStatus: 'awaiting_confirmation',
      availableActions: ['VIEW', 'CONFIRM_SETTLEMENT_APPLICATION', 'REJECT_SETTLEMENT_APPLICATION'],
    })
  })

  it('같은 신청서가 확정 정산 행과 신청서 행으로 동시에 오면 확정 행만 남긴다', () => {
    const rows = mapSettlementsToParticipatingInstructorSettlementRows([
      { settlementId: 500, settlementApplicationId: 14, lectureDate: '2026-11-08' },
      { settlementApplicationId: 14, lectureDate: '2026-11-08' },
      { settlementApplicationId: 15, lectureDate: '2026-11-01' },
    ])

    expect(rows.map(row => row.id)).toEqual(['SETTLEMENT:500', 'SETTLEMENT_APPLICATION:15'])
    expect(rows.map(row => row.no)).toEqual([1, 2])
  })

  it('미신청 배정 일정 행(NOT_APPLIED)을 버리지 않고 처리 현황·금액·보기를 막는다', () => {
    const rows = mapSettlementsToParticipatingInstructorSettlementRows([
      {
        settlementId: null as unknown as undefined,
        settlementApplicationId: null as unknown as undefined,
        programId: 186565,
        scheduleId: 187753,
        sessionOrdinal: 4,
        lectureDate: '2026-11-11',
        instructorAssignmentId: 1694910,
        instructorMemberId: 190023,
        institutionName: '용문중학교',
        statementStatus: null as unknown as undefined,
        paymentStatus: null as unknown as undefined,
        grossAmount: null as unknown as undefined,
        netPaymentAmount: null as unknown as undefined,
        availableActions: [],
        rowType: 'NOT_APPLIED',
        lectureProgressStatus: 'COMPLETED',
      },
    ])

    expect(rows).toHaveLength(1)
    const row = rows[0]!
    expect(row).toMatchObject({
      id: 'NOT_APPLIED:1694910:187753',
      rowType: 'NOT_APPLIED',
      isNotApplied: true,
      settlementId: null,
      settlementApplicationId: null,
      isPendingApplication: false,
      institutionName: '용문중학교',
      lectureProgress: 'completed',
      lectureProgressLabel: '진행 완료',
      hasPaymentStatementApplication: false,
      paymentStatementStatus: 'none',
      scheduledSettlementAmount: null,
      canViewPaymentStatement: false,
    })
    expect(shouldShowIndividualSettlementDash(row)).toBe(true)
    expect(isIndividualInstructorPaymentStatementViewDisabled(row)).toBe(true)
    expect(filterParticipatingInstructorSettlementDownloadRows(rows)).toEqual([])
  })

  it('rowType이 없으면 ID로 행 종류를 추론한다', () => {
    const rows = mapSettlementsToParticipatingInstructorSettlementRows([
      { lectureDate: '2026-11-08', instructorAssignmentId: 7 },
    ])
    expect(rows[0]).toMatchObject({ id: 'NOT_APPLIED:7', rowType: 'NOT_APPLIED', isNotApplied: true })
  })

  it('lectureProgressStatus를 일정일 추론보다 우선한다', () => {
    expect(
      inferParticipatingInstructorLectureProgress({
        lectureDate: '2025-01-01',
        lectureProgressStatus: 'SCHEDULED',
      })
    ).toBe('scheduled')
    expect(
      inferParticipatingInstructorLectureProgress({
        lectureDate: '2099-01-01',
        lectureProgressStatus: 'COMPLETED',
      })
    ).toBe('completed')
    expect(
      inferParticipatingInstructorLectureProgress({
        lectureDate: '2025-01-01',
        lectureProgressStatus: 'GAVE_UP',
      })
    ).toBe('activity_withdrawn')
  })

  it('활동 포기 회차도 제출된 지급조서는 처리 현황을 보여 주고 다운로드 대상에 넣는다', () => {
    const rows = mapSettlementsToParticipatingInstructorSettlementRows([
      {
        settlementId: 31,
        lectureDate: '2026-10-01',
        statementStatus: 'CONFIRMED',
        paymentStatus: 'CONFIRMED',
        netPaymentAmount: 100_000,
        rowType: 'SETTLEMENT',
        lectureProgressStatus: 'GAVE_UP',
      },
    ])
    const row = rows[0]!
    expect(row.lectureProgressLabel).toBe('활동 포기')
    expect(shouldShowIndividualSettlementDash(row)).toBe(false)
    expect(isIndividualInstructorPaymentStatementViewDisabled(row)).toBe(false)
    expect(filterParticipatingInstructorSettlementDownloadRows(rows).map(r => r.id)).toEqual([
      'SETTLEMENT:31',
    ])
  })

  it('진행 예정 행은 [지급조서 보기]를 비활성화한다', () => {
    const rows = mapSettlementsToParticipatingInstructorSettlementRows([
      { settlementApplicationId: 40, lectureProgressStatus: 'SCHEDULED', statementStatus: 'WAITING_CONFIRM' },
    ])
    expect(isIndividualInstructorPaymentStatementViewDisabled(rows[0]!)).toBe(true)
  })

  it('infers lecture progress from lecture date', () => {
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
