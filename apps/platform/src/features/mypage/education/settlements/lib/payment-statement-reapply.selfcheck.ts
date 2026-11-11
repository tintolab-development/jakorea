import assert from 'node:assert/strict'
import type { EducationSettlementItem } from '../model/types.ts'
import {
  mapPaymentStatementServerStatus,
  resolveInstructorPaymentStatementAggregateLabel,
} from './payment-statement-status.ts'
import { resolveSettlementStatusUi } from './settlement-status-ui.ts'
import { INSTRUCTOR_SETTLEMENT_ERROR_MESSAGE } from './instructor-settlement-contract.ts'

// 정정 승인 후 최신 revision DRAFT + 재신청 가능 → 재신청 대기 화면
assert.equal(
  mapPaymentStatementServerStatus({ statementStatus: 'DRAFT', statementReapplyAvailable: true }),
  'correction_completed',
)
// 재신청 가능 표시가 없는 DRAFT는 추측하지 않는다
assert.equal(mapPaymentStatementServerStatus({ statementStatus: 'DRAFT', statementReapplyAvailable: false }), null)
// 재신청 후에는 REAPPLICATION → 지급조서 재신청
assert.equal(mapPaymentStatementServerStatus({ statementStatus: 'REAPPLICATION' }), 'reapplied')
// 지급 완료가 우선
assert.equal(
  mapPaymentStatementServerStatus({ paymentStatus: 'PAID', statementReapplyAvailable: true }),
  'paid',
)

const ui = resolveSettlementStatusUi('correction_completed', 'payment_statement')
assert.deepEqual(ui.actions, ['view-correction', 'reapply'])
assert.equal(ui.viewLabel, '정정 내역 확인하기')
assert.equal(ui.writeLabel, '지급조서 재신청')

// 재신청 전에는 "지급 정정 요청", 재신청 후에는 "지급조서 재신청"으로 집계
const completedItem = (status: EducationSettlementItem['status']) =>
  ({ id: '1', heldAt: '2026-11-01', progress: 'completed', status }) as EducationSettlementItem
assert.equal(resolveInstructorPaymentStatementAggregateLabel([completedItem('correction_completed')]), '지급 정정 요청')
assert.equal(resolveInstructorPaymentStatementAggregateLabel([completedItem('reapplied')]), '지급조서 재신청')

assert.ok(INSTRUCTOR_SETTLEMENT_ERROR_MESSAGE.SETTLEMENT_REAPPLICATION_NOT_AVAILABLE)

console.log('payment-statement-reapply.selfcheck: ok')
