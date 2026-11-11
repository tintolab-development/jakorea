import assert from 'node:assert/strict'
import {
  findSupersededInstructorApplicationIds,
  mapSettlementOverviewStatus,
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

// 재신청 이력은 한 줄씩 남기고, 같은 배정에서 최신이 아닌 신청만 대체된 이전 신청으로 본다 (QA 배정 1694905: 신청 16·17·20)
{
  const superseded = findSupersededInstructorApplicationIds([
    { applicationId: 16, assignmentId: 1694905, status: 'RESUBMITTED', createdAt: '2026-11-09T18:42:00Z' },
    { applicationId: 20, assignmentId: 1694905, status: 'CONFIRMED', createdAt: '2026-11-09T18:45:00Z' },
    { applicationId: 17, assignmentId: 1694905, status: 'RESUBMITTED', createdAt: '2026-11-09T18:43:00Z' },
    { applicationId: 14, assignmentId: 1694899, status: 'CONFIRMED', createdAt: '2026-11-07T17:01:00Z' },
    { applicationId: 30, status: 'SUBMITTED' },
  ])
  assert.deepEqual([...superseded].sort((a, b) => a - b), [16, 17])
}
// 생성 시각이 같거나 없으면 applicationId가 큰 쪽이 최신
{
  const superseded = findSupersededInstructorApplicationIds([
    { applicationId: 40, assignmentId: 1, createdAt: '2026-11-01T00:00:00Z' },
    { applicationId: 41, assignmentId: 1, createdAt: '2026-11-01T00:00:00Z' },
    { applicationId: 51, assignmentId: 2 },
    { applicationId: 50, assignmentId: 2 },
  ])
  assert.deepEqual([...superseded].sort((a, b) => a - b), [40, 50])
}

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
