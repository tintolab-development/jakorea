import assert from 'node:assert/strict'
import {
  mapSettlementOverviewStatus,
  pickLatestInstructorSettlementRows,
  resolveInstructorSettlementPeriod,
} from './client.ts'

// 강사 정산의 교육 진행 일자는 강의 회차 일시. 회차를 못 찾으면 제출 시각 (QA 신청 14: 회차 187744)
{
  const times = new Map([
    [187744, { startAt: '2026-11-07T13:00:00Z', endAt: '2026-11-07T14:00:00Z' }],
  ])
  assert.deepEqual(
    resolveInstructorSettlementPeriod(
      { applicationId: 14, programScheduleId: 187744, submittedAt: '2026-11-07T17:01:00Z' },
      times,
    ),
    { startsAt: '2026-11-07T13:00:00Z', endsAt: '2026-11-07T14:00:00Z' },
  )
  assert.deepEqual(
    resolveInstructorSettlementPeriod(
      { applicationId: 15, programScheduleId: 999, submittedAt: '2026-11-07T19:40:00Z' },
      times,
    ),
    { startsAt: '2026-11-07T19:40:00Z', endsAt: '2026-11-07T19:40:00Z' },
  )
  assert.deepEqual(
    resolveInstructorSettlementPeriod({ applicationId: 16, createdAt: '2026-11-09T18:42:00Z' }, times),
    { startsAt: '2026-11-09T18:42:00Z', endsAt: '2026-11-09T18:42:00Z' },
  )
}

// 같은 배정의 예전 재신청 이력(RESUBMITTED)은 빼고 최신 신청 한 행만 남긴다 (QA 배정 1694905: 신청 16·17·20)
{
  const picked = pickLatestInstructorSettlementRows([
    { applicationId: 16, assignmentId: 1694905, status: 'RESUBMITTED', createdAt: '2026-11-09T18:42:00Z' },
    { applicationId: 20, assignmentId: 1694905, status: 'CONFIRMED', createdAt: '2026-11-09T18:45:00Z' },
    { applicationId: 17, assignmentId: 1694905, status: 'RESUBMITTED', createdAt: '2026-11-09T18:43:00Z' },
    { applicationId: 14, assignmentId: 1694899, status: 'CONFIRMED', createdAt: '2026-11-07T17:01:00Z' },
    { applicationId: 30, status: 'SUBMITTED' },
  ])
  assert.deepEqual(picked.map(row => row.applicationId).sort((a, b) => (a ?? 0) - (b ?? 0)), [14, 20, 30])
}
// 생성 시각이 같거나 없으면 applicationId가 큰 쪽
{
  const picked = pickLatestInstructorSettlementRows([
    { applicationId: 40, assignmentId: 1, createdAt: '2026-11-01T00:00:00Z' },
    { applicationId: 41, assignmentId: 1, createdAt: '2026-11-01T00:00:00Z' },
    { applicationId: 51, assignmentId: 2 },
    { applicationId: 50, assignmentId: 2 },
  ])
  assert.deepEqual(picked.map(row => row.applicationId).sort((a, b) => (a ?? 0) - (b ?? 0)), [41, 51])
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
