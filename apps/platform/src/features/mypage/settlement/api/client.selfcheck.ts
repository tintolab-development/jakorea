import assert from 'node:assert/strict'
import {
  buildSummary,
  findSupersededInstructorApplicationIds,
  mapIndividualScheduleItem,
  mapInstructorSettlementOverviewStatus,
  mapReceiptScheduleOverviewStatus,
  mapSettlementOverviewStatus,
  mapSupersededResultStatus,
  resolveInstructorSettlementAmount,
  resolveInstructorSettlementPeriod,
} from './client.ts'
import { settlementStatusListLabel } from '../lib/status-presentation.ts'

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

assert.equal(
  mapInstructorSettlementOverviewStatus({ confirmationStatus: 'WAITING_CONFIRM' }),
  'waiting_confirm',
)
assert.equal(
  mapInstructorSettlementOverviewStatus({ confirmationStatus: 'REAPPLICATION' }),
  'reapplied',
)
assert.equal(
  mapInstructorSettlementOverviewStatus({ confirmationStatus: 'CORRECTION_REQUESTED' }),
  'correction_requested',
)
assert.equal(
  mapInstructorSettlementOverviewStatus({
    confirmationStatus: 'CORRECTION_REQUESTED',
    statementReapplyAvailable: true,
  }),
  'correction_requested',
)
assert.equal(
  mapInstructorSettlementOverviewStatus({ confirmationStatus: 'REJECTED' }),
  'rejected',
)
assert.equal(
  mapInstructorSettlementOverviewStatus({ confirmationStatus: 'CONFIRMED' }),
  'confirmed',
)
assert.equal(
  mapInstructorSettlementOverviewStatus({
    confirmationStatus: 'CONFIRMED',
    paymentStatus: 'PAID',
  }),
  'paid',
)
assert.equal(mapInstructorSettlementOverviewStatus({ confirmationStatus: null }), null)
assert.equal(
  mapInstructorSettlementOverviewStatus({
    confirmationStatus: null,
    statementStatus: 'WAITING_CONFIRM',
  }),
  'waiting_confirm',
)
assert.equal(
  mapInstructorSettlementOverviewStatus({ confirmationStatus: 'REAPPLICATION', status: 'SUBMITTED' }),
  'reapplied',
)
assert.equal(
  mapInstructorSettlementOverviewStatus({ confirmationStatus: null, status: 'SUBMITTED' }),
  'waiting_confirm',
)
assert.equal(
  mapInstructorSettlementOverviewStatus({
    statementStatus: 'DRAFT',
    confirmationStatus: 'CORRECTION_REQUESTED',
    statementReapplyAvailable: false,
  }),
  'correction_requested',
)
assert.equal(
  mapInstructorSettlementOverviewStatus({
    paymentStatus: 'PAID',
    confirmationStatus: 'REAPPLICATION',
  }),
  'paid',
)
assert.equal(mapReceiptScheduleOverviewStatus({ statementStatus: null, paymentStatus: null }), null)
assert.equal(mapReceiptScheduleOverviewStatus({ status: 'SUBMITTED' } as never), null)
assert.equal(
  mapReceiptScheduleOverviewStatus({ statementStatus: 'WAITING_CONFIRM' }),
  'waiting_confirm',
)
assert.equal(
  mapReceiptScheduleOverviewStatus({ statementStatus: 'REAPPLICATION' }),
  'reapplied',
)
assert.equal(mapReceiptScheduleOverviewStatus({ statementStatus: 'REJECTED' }), 'rejected')
assert.equal(
  mapReceiptScheduleOverviewStatus({
    statementStatus: 'CONFIRMED',
    paymentStatus: 'WAITING_PAYMENT',
  }),
  'confirmed',
)
assert.equal(
  mapReceiptScheduleOverviewStatus({ statementStatus: 'CONFIRMED', paymentStatus: 'PAID' }),
  'paid',
)
assert.equal(settlementStatusListLabel({ status: 'reapplied', documentKind: 'receipt' }), '영수증 재신청')
assert.equal(settlementStatusListLabel({ status: 'paid', documentKind: 'receipt' }), '계좌 지급 완료')
assert.equal(settlementStatusListLabel({ status: 'confirmed', documentKind: 'receipt' }), '확인 완료')

const receipt15 = mapIndividualScheduleItem({
  programTitle: '영수증 프로그램',
  schedule: {
    settlementApplicationId: 15,
    status: 'SUBMITTED',
    statementStatus: 'REAPPLICATION',
    paymentStatus: null,
    startAt: '2026-10-06T00:00:00+09:00',
    endAt: '2026-10-06T01:00:00+09:00',
    submittedItems: [{ amount: 15000 }],
  },
})
assert.equal(receipt15?.status, 'reapplied')
assert.equal(receipt15?.documentKind, 'receipt')
assert.equal(receipt15?.paidAt, undefined)

const receipt17 = mapIndividualScheduleItem({
  programTitle: '영수증 프로그램',
  schedule: {
    settlementApplicationId: 17,
    statementStatus: 'CONFIRMED',
    paymentStatus: 'PAID',
    paidAt: '2026-11-16T15:00:00Z',
    startAt: '2026-10-06T00:00:00+09:00',
    endAt: '2026-10-06T01:00:00+09:00',
    submittedItems: [{ amount: 17000 }],
  },
})
assert.equal(receipt17?.status, 'paid')
assert.equal(receipt17?.paidAt, '2026-11-16T15:00:00Z')

const receipt14 = mapIndividualScheduleItem({
  programTitle: '영수증 프로그램',
  schedule: {
    settlementApplicationId: 14,
    statementStatus: 'CONFIRMED',
    paymentStatus: 'WAITING_PAYMENT',
    startAt: '2026-11-14T00:00:00+09:00',
    endAt: '2026-11-14T01:00:00+09:00',
    submittedItems: [{ amount: 14000 }],
  },
})
assert.equal(receipt14?.status, 'confirmed')
assert.equal(receipt14?.paidAt, undefined)

assert.equal(
  mapIndividualScheduleItem({
    programTitle: '영수증 프로그램',
    schedule: {
      settlementApplicationId: 18,
      status: 'SUBMITTED',
      statementStatus: null,
      paymentStatus: null,
    },
  }),
  null,
)

const november = buildSummary([receipt17!, receipt14!], '2026-11')
assert.equal(november.totalPaidAmount, 17000)
assert.equal(november.monthPaidAmount, 17000)
assert.equal(november.monthExpectedAmount, 14000)
const october = buildSummary([receipt17!], '2026-10')
assert.equal(october.monthPaidAmount, null)
assert.equal(october.monthExpectedAmount, null)

console.log('settlement api client.selfcheck: ok')
