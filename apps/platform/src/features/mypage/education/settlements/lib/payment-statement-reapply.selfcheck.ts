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

assert.equal(
  INSTRUCTOR_SETTLEMENT_ERROR_MESSAGE.SETTLEMENT_REAPPLICATION_NOT_AVAILABLE,
  '지금은 지급조서를 재신청할 수 없어요. 화면을 새로고침한 뒤 다시 확인해 주세요.',
)

// 재신청 기한이 지난 정정 건(DRAFT + available false)도 '지급 정정 요청'(correction_completed) 상태를 유지한다
assert.equal(
  mapPaymentStatementServerStatus({ statementStatus: 'DRAFT', statementReapplyAvailable: false }),
  'correction_completed',
)
// 강사 지급조서 배지 (기획 1번)
assert.equal(resolveSettlementStatusUi('waiting_confirm', 'payment_statement').markLabel, '확인 대기 중')
assert.equal(resolveSettlementStatusUi('confirmed', 'payment_statement').markLabel, '지급조서 확인 완료')

console.log('payment-statement-reapply.selfcheck: ok')
