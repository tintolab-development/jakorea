import assert from 'node:assert/strict'
import {
  findSupersededInstructorApplicationIds,
  mapSettlementOverviewStatus,
  mapSupersededResultStatus,
  resolveInstructorSettlementAmount,
  resolveInstructorSettlementPeriod,
} from './client.ts'

// 강사 정산의 교육 진행 일자는 목록 응답의 회차 일시. 둘 다 없을 때만 제출(없으면 생성) 시각
{
  // QA 신청 15: 관리자 직접 배정(강사 신청서 없음)도 회차 일시가 온다
  assert.deepEqual(
    resolveInstructorSettlementPeriod({
      applicationId: 15,
      scheduleStartAt: '2026-11-06T06:00:00Z',
      scheduleEndAt: '2026-11-06T06:10:00Z',
      submittedAt: '2026-11-07T19:40:00Z',
    }),
    { startsAt: '2026-11-06T06:00:00Z', endsAt: '2026-11-06T06:10:00Z' },
  )
  assert.deepEqual(
    resolveInstructorSettlementPeriod({
      applicationId: 15,
      scheduleStartAt: null,
      scheduleEndAt: null,
      submittedAt: '2026-11-07T19:40:00Z',
    }),
    { startsAt: '2026-11-07T19:40:00Z', endsAt: '2026-11-07T19:40:00Z' },
  )
  assert.deepEqual(
    resolveInstructorSettlementPeriod({ applicationId: 16, createdAt: '2026-11-09T18:42:00Z' }),
    { startsAt: '2026-11-09T18:42:00Z', endsAt: '2026-11-09T18:42:00Z' },
  )
}

// 이전 이력 판단은 서버 superseded만 쓴다 (QA 배정 1694905: 신청 16·17 superseded, 20 최신)
{
  const superseded = findSupersededInstructorApplicationIds([
    { applicationId: 16, assignmentId: 1694905, status: 'RESUBMITTED', superseded: true, supersededReason: 'REJECTED' },
    { applicationId: 17, assignmentId: 1694905, status: 'RESUBMITTED', superseded: true, supersededReason: 'CORRECTION_REQUESTED' },
    { applicationId: 20, assignmentId: 1694905, status: 'CONFIRMED', superseded: false },
    // superseded가 없으면 status·신청 순서로 추측하지 않는다
    { applicationId: 30, assignmentId: 1, status: 'RESUBMITTED' },
    { applicationId: 31, assignmentId: 1, status: 'CONFIRMED' },
  ])
  assert.deepEqual([...superseded].sort((a, b) => a - b), [16, 17])
}
// 원래 결과 → 신청 반려 / 지급 정정 요청
assert.equal(mapSupersededResultStatus('REJECTED'), 'rejected')
assert.equal(mapSupersededResultStatus('CORRECTION_REQUESTED'), 'correction_requested')
assert.equal(mapSupersededResultStatus(null), null)

// 금액: 최신 revision 금액 우선, 없으면 제출 당시 금액 (QA 신청 14: 488,150 → 294,750)
assert.equal(
  resolveInstructorSettlementAmount({ applicationId: 14, netPaymentAmount: 488150, latestNetPaymentAmount: 294750 }),
  294750,
)
assert.equal(
  resolveInstructorSettlementAmount({ applicationId: 16, netPaymentAmount: 483500, latestNetPaymentAmount: null }),
  483500,
)
assert.equal(resolveInstructorSettlementAmount({ applicationId: 1, grossAmount: 1000 }), 1000)

assert.equal(
  mapSettlementOverviewStatus({ status: 'SUBMITTED' }),
  'waiting_confirm',
)
assert.equal(
  mapSettlementOverviewStatus({ status: 'CONFIRMED' }),
  'confirmed',
)
assert.equal(
  mapSettlementOverviewStatus({ paymentStatus: 'PAID' }),
  'paid',
)
assert.equal(
  mapSettlementOverviewStatus({ status: 'CORRECTION_REQUESTED' }),
  'correction_requested',
)
assert.equal(
  mapSettlementOverviewStatus({ status: 'REAPPLICATION' }),
  'reapplied',
)
assert.equal(
  mapSettlementOverviewStatus({ status: 'REJECTED' }),
  'rejected',
)
// 정정 승인 후 재신청 대기(DRAFT)는 "지급 정정 요청"
assert.equal(
  mapSettlementOverviewStatus({ statementStatus: 'DRAFT', statementReapplyAvailable: true }),
  'correction_requested',
)
assert.equal(
  mapSettlementOverviewStatus({ statementStatus: 'DRAFT' }),
  'correction_requested',
)
assert.equal(
  mapSettlementOverviewStatus({
    status: 'CONFIRMED',
    statementStatus: 'DRAFT',
    paymentStatus: 'NOT_READY',
    statementReapplyAvailable: true,
  }),
  'correction_requested',
)
assert.equal(mapSettlementOverviewStatus({ status: 'UNKNOWN_XYZ' }), null)

console.log('settlement api client.selfcheck: ok')
