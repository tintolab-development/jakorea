import assert from 'node:assert/strict'
import { filterItemsUpToLastParticipatedSession } from '../../applications/lib/display-status.ts'
import type { EducationScheduleItem } from '../../schedules/model/types.ts'
import { EDUCATION_SETTLEMENT_PAGE_SIZE } from '../model/types.ts'
import {
  buildAssignedSettlementItems,
  paginateAssignedSettlementItems,
} from './assigned-settlement-items.ts'
import {
  EDUCATION_SETTLEMENT_PROGRESS_LABEL,
  resolveEducationSettlementStatus,
  resolveEducationSettlementStatusResult,
  resolvePaymentStatementProcessLabel,
} from './settlement-rules.ts'
import {
  EDUCATION_SETTLEMENT_STATUS_UI,
  isSettlementWriteCtaDisabled,
  PAYMENT_STATEMENT_OPERATION_ENDED_MESSAGE,
  resolveSettlementDocumentKind,
  resolveSettlementStatusUi,
} from './settlement-status-ui.ts'
import {
  isGeminiSettlementProgram,
  mapPaymentStatementServerStatus,
  PAYMENT_STATEMENT_AGGREGATE_LABEL,
} from './payment-statement-status.ts'
import { buildReceiptSubmitPath, buildReceiptViewPath } from './receipt-path.ts'

const NOW = new Date('2026-04-20T09:00:00+09:00')

function schedule(
  input: Partial<EducationScheduleItem> &
    Pick<EducationScheduleItem, 'id' | 'sessionNumber' | 'heldAt'>,
): EducationScheduleItem {
  return {
    title: '-',
    attendanceStatus: null,
    ...input,
  }
}

function assigned(items: EducationScheduleItem[]) {
  return buildAssignedSettlementItems({
    schedules: items,
    scopeStatus: 'ASSIGNMENT_SCOPED',
    now: NOW,
    programId: '100',
  })
}

assert.equal(EDUCATION_SETTLEMENT_PROGRESS_LABEL.upcoming, '진행 예정')
assert.equal(EDUCATION_SETTLEMENT_PROGRESS_LABEL.completed, '진행 완료')

const empty = assigned([])
assert.equal(empty.length, 0)

const oneUpcoming = assigned([
  schedule({
    id: '11',
    scheduleId: 11,
    sessionNumber: 1,
    heldAt: '2026-05-01T12:00:00+09:00',
    progressTimeLabel: '12:00~13:20',
    sessionLabel: '1차시',
  }),
])
assert.equal(oneUpcoming.length, 1)
assert.equal(oneUpcoming[0]?.status, 'upcoming')
assert.equal(oneUpcoming[0]?.progress, 'upcoming')
assert.equal(oneUpcoming[0]?.id, '11')
assert.equal(oneUpcoming[0]?.sessionMeta, '12:00~13:20 1차시')
assert.equal(oneUpcoming[0]?.amount, undefined)
assert.equal(oneUpcoming[0]?.status, 'upcoming')

const fiveNoReceipts = assigned(
  Array.from({ length: 5 }, (_, index) =>
    schedule({
      id: String(index + 1),
      scheduleId: index + 1,
      sessionNumber: index + 1,
      heldAt: `2026-04-0${index + 1}T10:00:00+09:00`,
      sessionLabel: `${index + 1}차시`,
    }),
  ),
)
assert.equal(fiveNoReceipts.length, 5)
assert.ok(fiveNoReceipts.every(item => item.status === 'pending_submit' || item.status === 'upcoming'))
assert.equal(
  fiveNoReceipts.filter(item => item.progress === 'completed').length,
  5,
)

const mixed = buildAssignedSettlementItems({
  schedules: [
    schedule({
      id: '1',
      scheduleId: 1,
      sessionNumber: 1,
      heldAt: '2026-04-01T10:00:00+09:00',
      sessionLabel: '1차시',
    }),
    schedule({
      id: '2',
      scheduleId: 2,
      sessionNumber: 2,
      heldAt: '2026-04-02T10:00:00+09:00',
      sessionLabel: '2차시',
    }),
    schedule({
      id: '3',
      scheduleId: 3,
      sessionNumber: 3,
      heldAt: '2026-04-03T10:00:00+09:00',
      sessionLabel: '3차시',
    }),
    schedule({
      id: '4',
      scheduleId: 4,
      sessionNumber: 4,
      heldAt: '2026-04-04T10:00:00+09:00',
      sessionLabel: '4차시',
    }),
    schedule({
      id: '5',
      scheduleId: 5,
      sessionNumber: 5,
      heldAt: '2026-05-04T10:00:00+09:00',
      sessionLabel: '5차시',
    }),
  ],
  scopeStatus: 'ASSIGNMENT_SCOPED',
  programId: '100',
  now: NOW,
  settlements: [
    {
      applicationId: 501,
      programId: 100,
      programScheduleId: 2,
      status: 'SUBMITTED',
      submittedAt: '2026-04-05T09:00:00+09:00',
      netPaymentAmount: 300000,
    },
  ],
  receipts: [
    {
      receiptId: 9,
      programScheduleId: 3,
      receiptStatus: 'RESUBMITTED',
      revisionNo: 2,
      originalReceiptId: 8,
      submittedAt: '2026-04-06T09:00:00+09:00',
      amount: 120000,
    },
  ],
})
assert.equal(mixed.length, 5)
assert.equal(mixed[0]?.status, 'pending_submit')
assert.equal(mixed[1]?.status, 'waiting_confirm')
assert.equal(mixed[1]?.amount, 300000)
assert.equal(mixed[2]?.status, 'reapplied')
assert.equal(mixed[4]?.status, 'upcoming')

const overdue = buildAssignedSettlementItems({
  schedules: [
    schedule({
      id: '21',
      scheduleId: 21,
      sessionNumber: 1,
      heldAt: '2026-04-03T12:00:00+09:00',
    }),
  ],
  scopeStatus: 'ASSIGNMENT_SCOPED',
  programId: '100',
  now: NOW,
  receipts: [
    {
      receiptId: 1,
      programScheduleId: 21,
      receiptStatus: 'NOT_SUBMITTED',
      submitDeadlineAt: '2026-04-10T23:59:59+09:00',
    },
  ],
})
assert.equal(overdue[0]?.status, 'overdue')
assert.equal(overdue[0]?.deadlineAt, '2026-04-10T23:59:59+09:00')

const confirmed = buildAssignedSettlementItems({
  schedules: [
    schedule({
      id: '22',
      scheduleId: 22,
      sessionNumber: 1,
      heldAt: '2026-04-03T12:00:00+09:00',
    }),
  ],
  scopeStatus: 'ASSIGNMENT_SCOPED',
  programId: '100',
  now: NOW,
  settlements: [
    {
      applicationId: 700,
      programId: 100,
      programScheduleId: 22,
      status: 'CONFIRMED',
      paymentStatus: 'WAITING_PAYMENT',
      netPaymentAmount: 300000,
      submittedAt: '2026-04-08T09:00:00+09:00',
    },
  ],
})
assert.equal(confirmed[0]?.status, 'confirmed')
assert.equal(confirmed[0]?.amount, 300000)

const paid = buildAssignedSettlementItems({
  schedules: [
    schedule({
      id: '23',
      scheduleId: 23,
      sessionNumber: 1,
      heldAt: '2026-04-03T12:00:00+09:00',
    }),
  ],
  scopeStatus: 'ASSIGNMENT_SCOPED',
  programId: '100',
  now: NOW,
  settlements: [
    {
      applicationId: 701,
      programId: 100,
      programScheduleId: 23,
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      netPaymentAmount: 300000,
    },
  ],
})
assert.equal(paid[0]?.status, 'paid')

const duplicateReceipts = buildAssignedSettlementItems({
  schedules: [
    schedule({
      id: '30',
      scheduleId: 30,
      sessionNumber: 3,
      heldAt: '2026-04-03T12:00:00+09:00',
      sessionLabel: '3차시',
    }),
  ],
  scopeStatus: 'ASSIGNMENT_SCOPED',
  programId: '100',
  now: NOW,
  receipts: [
    {
      receiptId: 1,
      programScheduleId: 30,
      receiptStatus: 'SUBMITTED',
      submittedAt: '2026-04-04T09:00:00+09:00',
      amount: 1000,
    },
    {
      receiptId: 2,
      programScheduleId: 30,
      receiptStatus: 'RESUBMITTED',
      revisionNo: 2,
      originalReceiptId: 1,
      submittedAt: '2026-04-05T09:00:00+09:00',
      amount: 2000,
    },
  ],
})
assert.equal(duplicateReceipts.length, 1)
assert.equal(duplicateReceipts[0]?.status, 'reapplied')
assert.equal(duplicateReceipts[0]?.receiptId, 2)
assert.equal(duplicateReceipts[0]?.amount, 2000)

const otherProgram = buildAssignedSettlementItems({
  schedules: [
    schedule({
      id: '40',
      scheduleId: 40,
      sessionNumber: 1,
      heldAt: '2026-04-03T12:00:00+09:00',
    }),
  ],
  scopeStatus: 'ASSIGNMENT_SCOPED',
  programId: '100',
  now: NOW,
  settlements: [
    {
      applicationId: 1,
      programId: 999,
      programScheduleId: 40,
      status: 'PAID',
      netPaymentAmount: 999999,
    },
  ],
})
assert.equal(otherProgram.length, 1)
assert.equal(otherProgram[0]?.status, 'pending_submit')
assert.equal(otherProgram[0]?.amount, undefined)

const noJoinKeyReceipts = buildAssignedSettlementItems({
  schedules: [
    schedule({
      id: '41',
      scheduleId: 41,
      sessionNumber: 1,
      heldAt: '2026-04-03T12:00:00+09:00',
    }),
  ],
  scopeStatus: 'ASSIGNMENT_SCOPED',
  programId: '100',
  now: NOW,
  receipts: [
    { receiptId: 88, receiptStatus: 'SUBMITTED', amount: 50000, submittedAt: '2026-04-04T00:00:00+09:00' },
  ],
})
assert.equal(noJoinKeyReceipts.length, 1)
assert.equal(noJoinKeyReceipts[0]?.status, 'pending_submit')
assert.equal(noJoinKeyReceipts[0]?.amount, undefined)

const unknownStatus = buildAssignedSettlementItems({
  schedules: [
    schedule({
      id: '42',
      scheduleId: 42,
      sessionNumber: 1,
      heldAt: '2026-04-03T12:00:00+09:00',
    }),
  ],
  scopeStatus: 'ASSIGNMENT_SCOPED',
  programId: '100',
  now: NOW,
  receipts: [{ receiptId: 3, programScheduleId: 42, receiptStatus: 'UNKNOWN' }],
})
assert.equal(unknownStatus[0]?.status, 'unresolved')

const programSchedulePreview = buildAssignedSettlementItems({
  schedules: [
    schedule({
      id: '50',
      scheduleId: 50,
      sessionNumber: 1,
      heldAt: '2026-04-03T12:00:00+09:00',
    }),
  ],
  scopeStatus: 'PROGRAM_SCHEDULE',
  now: NOW,
  programId: '100',
})
assert.equal(programSchedulePreview.length, 0)

const noScope = buildAssignedSettlementItems({
  schedules: [
    schedule({
      id: '51',
      scheduleId: 51,
      sessionNumber: 1,
      heldAt: '2026-04-03T12:00:00+09:00',
    }),
  ],
  scopeStatus: 'NO_SCOPE_EVIDENCE',
  now: NOW,
  programId: '100',
})
assert.equal(noScope.length, 0)

const cancelled = buildAssignedSettlementItems({
  schedules: [
    schedule({
      id: '52',
      scheduleId: 52,
      sessionNumber: 1,
      heldAt: '2026-04-03T12:00:00+09:00',
      assignmentStatus: 'CANCELLED',
    }),
    schedule({
      id: '53',
      scheduleId: 53,
      sessionNumber: 2,
      heldAt: '2026-04-04T12:00:00+09:00',
    }),
  ],
  scopeStatus: 'ASSIGNMENT_SCOPED',
  now: NOW,
  programId: '100',
})
assert.equal(cancelled.length, 1)
assert.equal(cancelled[0]?.scheduleId, 53)

const ten = assigned(
  Array.from({ length: 10 }, (_, index) =>
    schedule({
      id: String(100 + index),
      scheduleId: 100 + index,
      sessionNumber: index + 1,
      heldAt: `2026-04-${String(index + 1).padStart(2, '0')}T10:00:00+09:00`,
    }),
  ),
)
assert.equal(ten.length, 10)
assert.equal(paginateAssignedSettlementItems(ten, 1, EDUCATION_SETTLEMENT_PAGE_SIZE).length, 7)
assert.equal(paginateAssignedSettlementItems(ten, 2, EDUCATION_SETTLEMENT_PAGE_SIZE).length, 3)

const withdrawn = filterItemsUpToLastParticipatedSession(ten, 3)
assert.equal(withdrawn.length, 3)

assert.equal(
  resolveEducationSettlementStatus({
    educationProgress: 'upcoming',
    reviewStatus: 'SUBMITTED',
  }),
  'upcoming',
)
assert.equal(
  resolveEducationSettlementStatus({
    educationProgress: 'completed',
    paymentStatus: 'PAID',
  }),
  'paid',
)
assert.equal(
  resolveEducationSettlementStatus({
    educationProgress: 'completed',
    reviewStatus: 'CONFIRMED',
  }),
  'confirmed',
)
assert.equal(
  resolveEducationSettlementStatus({
    educationProgress: 'completed',
    isResubmitted: true,
  }),
  'reapplied',
)
assert.equal(
  resolveEducationSettlementStatus({
    educationProgress: 'completed',
    reviewStatus: 'SUBMITTED',
  }),
  'waiting_confirm',
)
assert.equal(
  resolveEducationSettlementStatus({
    educationProgress: 'completed',
    reviewStatus: 'SUBMITTED',
    isResubmitted: false,
  }),
  'waiting_confirm',
)
assert.equal(
  resolveEducationSettlementStatus({
    educationProgress: 'completed',
  }),
  'pending_submit',
)
assert.equal(
  resolveEducationSettlementStatus({
    educationProgress: 'completed',
    reviewStatus: 'UNKNOWN',
  }),
  'unresolved',
)
assert.equal(
  resolveEducationSettlementStatus({
    educationProgress: 'completed',
    receiptDeadlineAt: '2026-04-10T00:00:00+09:00',
    now: NOW,
  }),
  'overdue',
)
assert.equal(
  resolveEducationSettlementStatus({
    educationProgress: 'completed',
    now: NOW,
  }),
  'pending_submit',
)

const receiptUpcomingUi = resolveSettlementStatusUi('upcoming', 'receipt')
assert.equal(receiptUpcomingUi.message, '기한 내에 영수증을 제출해 주세요')
assert.equal(receiptUpcomingUi.actionHint, '교육 진행 완료 이후에 영수증 작성이 가능합니다')
assert.equal(receiptUpcomingUi.writeLabel, '영수증 작성하기')
assert.equal(receiptUpcomingUi.writeDisabled, true)
assert.deepEqual(receiptUpcomingUi.actions, ['write'])

const instructorUpcomingUi = resolveSettlementStatusUi('upcoming', 'payment_statement')
assert.equal(instructorUpcomingUi.message, undefined)
assert.equal(instructorUpcomingUi.actions, undefined)

assert.equal(resolveSettlementDocumentKind('INDIVIDUAL'), 'receipt')
assert.equal(resolveSettlementDocumentKind('ORGANIZATION'), 'receipt')
assert.equal(resolveSettlementDocumentKind('VOLUNTEER'), 'receipt')
assert.equal(resolveSettlementDocumentKind('INSTRUCTOR'), 'payment_statement')

assert.equal(resolveSettlementStatusUi('pending_submit', 'receipt').writeDisabled, undefined)
assert.equal(resolveSettlementStatusUi('pending_submit', 'receipt').writeLabel, '영수증 작성하기')
assert.equal(
  resolveSettlementStatusUi('pending_submit', 'payment_statement').writeLabel,
  '지급조서 작성하기',
)
assert.equal(resolveSettlementStatusUi('overdue', 'receipt').writeDisabled, true)

assert.equal(EDUCATION_SETTLEMENT_STATUS_UI.upcoming.writeDisabled, true)
assert.equal(EDUCATION_SETTLEMENT_STATUS_UI.pending_submit.message, '기한 내에 영수증을 제출해 주세요')
assert.equal(
  EDUCATION_SETTLEMENT_STATUS_UI.overdue.message,
  '미제출 영수증 제출 기한이 지났어요',
)
assert.equal(EDUCATION_SETTLEMENT_STATUS_UI.overdue.markLabel, '영수증 미제출')
assert.equal(EDUCATION_SETTLEMENT_STATUS_UI.waiting_confirm.markLabel, '확인 대기')
assert.equal(
  EDUCATION_SETTLEMENT_STATUS_UI.waiting_confirm.message,
  '영수증 신청이 완료되었어요',
)
assert.equal(EDUCATION_SETTLEMENT_STATUS_UI.reapplied.markLabel, '재신청')
assert.equal(
  EDUCATION_SETTLEMENT_STATUS_UI.reapplied.message,
  '영수증 수정 제출이 완료되었어요',
)
assert.equal(EDUCATION_SETTLEMENT_STATUS_UI.confirmed.markLabel, '확인 완료')
assert.equal(EDUCATION_SETTLEMENT_STATUS_UI.paid.markLabel, '지급 완료')
assert.equal(EDUCATION_SETTLEMENT_STATUS_UI.rejected.markLabel, '신청 반려')
assert.equal(EDUCATION_SETTLEMENT_STATUS_UI.pending_submit.writeLabel, '영수증 작성하기')
assert.equal(EDUCATION_SETTLEMENT_STATUS_UI.waiting_confirm.viewLabel, '영수증 확인하기')

assert.equal(
  buildReceiptSubmitPath({ applicationId: '1', sessionId: '2' }),
  '/mypage/education/1/settlement/write?sessionId=2',
)
assert.equal(
  buildReceiptSubmitPath({ applicationId: '1', sessionId: '2', area: 'volunteer' }),
  '/mypage/volunteer/1/settlement/write?sessionId=2',
)
assert.equal(
  buildReceiptViewPath({ applicationId: '1', sessionId: '2', settlementApplicationId: 9 }),
  '/mypage/education/1/settlement/confirm?sessionId=2&mode=view',
)
assert.equal(buildReceiptViewPath({ applicationId: '1', sessionId: '2' }), null)

assert.equal(resolvePaymentStatementProcessLabel(oneUpcoming), '확인진행중')
assert.equal(resolvePaymentStatementProcessLabel(paid), '지급 완료')
assert.equal(
  resolvePaymentStatementProcessLabel(fiveNoReceipts).startsWith('미작성'),
  true,
)

const withPayable = buildAssignedSettlementItems({
  schedules: [
    schedule({
      id: '80',
      scheduleId: 80,
      sessionNumber: 1,
      heldAt: '2026-04-01T10:00:00+09:00',
    }),
  ],
  scopeStatus: 'ASSIGNMENT_SCOPED',
  now: NOW,
  programId: '100',
  individualSchedules: [
    {
      scheduleId: 80,
      canSubmit: true,
      businessEndDate: '2026-12-31',
      payableItems: [{ itemType: 'MEAL', itemName: '식사비', evidenceRequired: true }],
    },
  ],
})
assert.equal(withPayable[0]?.hasPayableItems, true)
assert.equal(withPayable[0]?.canSubmitReceipt, true)
assert.equal(withPayable[0]?.payableItems?.[0]?.itemType, 'MEAL')
assert.equal(withPayable[0]?.deadlineAt, '2026-12-31T23:59:59+09:00')

const noPayable = buildAssignedSettlementItems({
  schedules: [
    schedule({
      id: '81',
      scheduleId: 81,
      sessionNumber: 1,
      heldAt: '2026-04-01T10:00:00+09:00',
    }),
  ],
  scopeStatus: 'ASSIGNMENT_SCOPED',
  now: NOW,
  programId: '100',
  individualSchedules: [{ scheduleId: 81, canSubmit: false, payableItems: [] }],
})
assert.equal(noPayable[0]?.hasPayableItems, false)
assert.equal(noPayable[0]?.canSubmitReceipt, false)

assert.equal(
  isSettlementWriteCtaDisabled({ documentKind: 'receipt' }),
  false,
)
assert.equal(
  isSettlementWriteCtaDisabled({ documentKind: 'receipt', hasPayableItems: true }),
  false,
)
assert.equal(
  isSettlementWriteCtaDisabled({ documentKind: 'receipt', hasPayableItems: false }),
  true,
)
assert.equal(
  isSettlementWriteCtaDisabled({
    documentKind: 'receipt',
    writeDisabledByStatus: true,
    hasPayableItems: true,
  }),
  true,
)
assert.equal(
  isSettlementWriteCtaDisabled({ documentKind: 'payment_statement', hasPayableItems: false }),
  false,
)

const joinedByEducationScheduleId = buildAssignedSettlementItems({
  schedules: [
    schedule({
      id: '90',
      scheduleId: 90,
      sessionNumber: 1,
      heldAt: '2026-04-01T10:00:00+09:00',
    }),
  ],
  scopeStatus: 'ASSIGNMENT_SCOPED',
  now: NOW,
  programId: '100',
  individualSchedules: [
    {
      educationScheduleId: 90,
      canSubmit: true,
      payableItems: [{ itemType: 'MEAL', itemName: '식사비', evidenceRequired: true }],
    },
  ],
})
assert.equal(joinedByEducationScheduleId[0]?.hasPayableItems, true)

const individualAttendanceCompletes = buildAssignedSettlementItems({
  schedules: [
    schedule({
      id: '91',
      scheduleId: 91,
      sessionNumber: 1,
      heldAt: '2026-05-10T12:00:00+09:00',
    }),
  ],
  scopeStatus: 'ASSIGNMENT_SCOPED',
  now: NOW,
  programId: '100',
  individualSchedules: [{ scheduleId: 91, attendanceStatus: 'PRESENT', payableItems: [] }],
})
assert.equal(individualAttendanceCompletes[0]?.progress, 'completed')

const attendanceCompleted = assigned([
  schedule({
    id: '60',
    scheduleId: 60,
    sessionNumber: 1,
    heldAt: '2026-05-10T12:00:00+09:00',
    attendanceStatus: 'present',
  }),
])
assert.equal(attendanceCompleted[0]?.progress, 'completed')

const sorted = assigned([
  schedule({
    id: '72',
    scheduleId: 72,
    sessionNumber: 2,
    heldAt: '2026-04-03T15:00:00+09:00',
  }),
  schedule({
    id: '71',
    scheduleId: 71,
    sessionNumber: 1,
    heldAt: '2026-04-03T10:00:00+09:00',
  }),
])
assert.deepEqual(
  sorted.map(item => item.scheduleId),
  [71, 72],
)

assert.equal(mapPaymentStatementServerStatus({ statementStatus: 'WAITING_CONFIRM' }), 'waiting_confirm')
assert.equal(mapPaymentStatementServerStatus({ statementStatus: 'REAPPLICATION' }), 'reapplied')
assert.equal(mapPaymentStatementServerStatus({ statementStatus: 'CONFIRMED' }), 'confirmed')
assert.equal(mapPaymentStatementServerStatus({ paymentStatus: 'PAID' }), 'paid')
assert.equal(mapPaymentStatementServerStatus({ statementStatus: 'REJECTED' }), 'rejected')
assert.equal(
  mapPaymentStatementServerStatus({ statementStatus: 'CORRECTION_REQUESTED' }),
  'correction_requested',
)
assert.equal(
  mapPaymentStatementServerStatus({ correctionStatus: 'CORRECTION_COMPLETED' }),
  'correction_completed',
)
assert.equal(mapPaymentStatementServerStatus({ statementStatus: 'DRAFT' }), null)

assert.equal(
  resolveSettlementStatusUi('waiting_confirm', 'payment_statement').markLabel,
  '확인 대기',
)
assert.equal(
  resolveSettlementStatusUi('reapplied', 'payment_statement').markLabel,
  '재신청',
)
assert.equal(
  resolveSettlementStatusUi('confirmed', 'payment_statement').markLabel,
  '확인 완료',
)
assert.equal(
  resolveSettlementStatusUi('paid', 'payment_statement').markLabel,
  '지급 완료',
)
assert.equal(
  resolveSettlementStatusUi('overdue', 'payment_statement').message,
  '지급조서 제출 기한이 지났어요',
)
assert.equal(
  resolveSettlementStatusUi('correction_requested', 'payment_statement').markLabel,
  '정정 요청',
)
assert.deepEqual(
  resolveSettlementStatusUi('correction_completed', 'payment_statement').actions,
  ['view-correction', 'reapply'],
)
assert.equal(PAYMENT_STATEMENT_OPERATION_ENDED_MESSAGE.includes('프로그램 운영이 종료'), true)

assert.equal(
  resolveEducationSettlementStatus({
    educationProgress: 'completed',
    deadlinePolicy: 'payment_statement',
    receiptDeadlineAt: '2026-04-10T23:59:59+09:00',
    operationEndAt: '2026-12-31T23:59:59+09:00',
    canSubmit: true,
    now: NOW,
  }),
  'overdue',
)
assert.equal(
  resolveEducationSettlementStatusResult({
    educationProgress: 'completed',
    deadlinePolicy: 'payment_statement',
    operationEndAt: '2026-04-01T23:59:59+09:00',
    now: NOW,
  }).deadlineNotice,
  'operation_ended',
)
assert.equal(
  resolveEducationSettlementStatus({
    educationProgress: 'completed',
    deadlinePolicy: 'payment_statement',
    statementStatus: 'WAITING_CONFIRM',
    now: NOW,
  }),
  'waiting_confirm',
)
assert.equal(
  resolveEducationSettlementStatus({
    educationProgress: 'upcoming',
    statementStatus: 'WAITING_CONFIRM',
    deadlinePolicy: 'payment_statement',
  }),
  'upcoming',
)

assert.equal(
  resolvePaymentStatementProcessLabel(oneUpcoming, { variant: 'payment_statement' }),
  PAYMENT_STATEMENT_AGGREGATE_LABEL.none,
)
assert.equal(
  resolvePaymentStatementProcessLabel(paid, { variant: 'payment_statement' }),
  PAYMENT_STATEMENT_AGGREGATE_LABEL.account_paid,
)
assert.equal(
  resolvePaymentStatementProcessLabel(fiveNoReceipts, { variant: 'payment_statement' }),
  PAYMENT_STATEMENT_AGGREGATE_LABEL.none,
)
assert.equal(
  resolvePaymentStatementProcessLabel(
    [
      { ...fiveNoReceipts[0]!, status: 'waiting_confirm' },
      { ...fiveNoReceipts[1]!, status: 'confirmed' },
    ],
    { variant: 'payment_statement' },
  ),
  PAYMENT_STATEMENT_AGGREGATE_LABEL.partial_confirmation,
)
assert.equal(
  resolvePaymentStatementProcessLabel(paid, { variant: 'gemini' }),
  PAYMENT_STATEMENT_AGGREGATE_LABEL.account_paid,
)
assert.equal(isGeminiSettlementProgram({ programType: 'GEMINI_TRAINING' }), true)
assert.equal(isGeminiSettlementProgram({ detailCase: 'gemini' }), true)
assert.equal(isGeminiSettlementProgram({ programType: 'GENERAL_INDIVIDUAL' }), false)

const instructorCorrection = buildAssignedSettlementItems({
  schedules: [
    schedule({
      id: '92',
      scheduleId: 92,
      sessionNumber: 1,
      heldAt: '2026-04-01T10:00:00+09:00',
    }),
  ],
  scopeStatus: 'ASSIGNMENT_SCOPED',
  now: NOW,
  programId: '100',
  deadlinePolicy: 'payment_statement',
  settlements: [
    {
      applicationId: 920,
      programId: 100,
      programScheduleId: 92,
      statementStatus: 'CORRECTION_REQUESTED',
      netPaymentAmount: 120000,
    },
  ],
})
assert.equal(instructorCorrection[0]?.status, 'correction_requested')

const evidenceUnconfigured = buildAssignedSettlementItems({
  schedules: [
    schedule({
      id: '93',
      scheduleId: 93,
      sessionNumber: 1,
      heldAt: '2026-04-01T10:00:00+09:00',
    }),
  ],
  scopeStatus: 'ASSIGNMENT_SCOPED',
  now: NOW,
  programId: '100',
  individualSchedules: [
    {
      scheduleId: 93,
      eligible: false,
      canSubmit: false,
      ineligibleReason: 'EVIDENCE_POLICY_UNCONFIGURED',
      payableItems: [
        { itemType: 'TRANSPORTATION', itemName: '교통비', evidenceRequired: null },
        { itemType: 'MEAL', itemName: '식사비', evidenceRequired: null },
      ],
    },
  ],
})
assert.equal(evidenceUnconfigured[0]?.hasPayableItems, true)
assert.equal(evidenceUnconfigured[0]?.evidencePolicyUnconfigured, true)
assert.equal(evidenceUnconfigured[0]?.canSubmitReceipt, false)
assert.equal(evidenceUnconfigured[0]?.eligible, false)
assert.equal(
  evidenceUnconfigured[0]?.submitBlockedReason,
  '증빙 정책을 확인할 수 없어 신청할 수 없습니다',
)
assert.equal(
  isSettlementWriteCtaDisabled({
    documentKind: 'receipt',
    hasPayableItems: true,
    evidencePolicyUnconfigured: true,
    eligible: false,
    canSubmit: false,
    status: 'pending_submit',
  }),
  true,
)

const noPayableVsEvidence = buildAssignedSettlementItems({
  schedules: [
    schedule({
      id: '94',
      scheduleId: 94,
      sessionNumber: 1,
      heldAt: '2026-04-01T10:00:00+09:00',
    }),
  ],
  scopeStatus: 'ASSIGNMENT_SCOPED',
  now: NOW,
  programId: '100',
  individualSchedules: [
    {
      scheduleId: 94,
      eligible: false,
      canSubmit: false,
      ineligibleReason: 'NO_PAYABLE_ITEMS',
      payableItems: [],
    },
  ],
})
assert.equal(noPayableVsEvidence[0]?.hasPayableItems, false)
assert.notEqual(noPayableVsEvidence[0]?.evidencePolicyUnconfigured, true)
assert.notEqual(
  noPayableVsEvidence[0]?.submitBlockedReason,
  evidenceUnconfigured[0]?.submitBlockedReason,
)

const preferIndividualOnly = buildAssignedSettlementItems({
  schedules: [
    schedule({
      id: '95',
      scheduleId: 95,
      sessionNumber: 1,
      heldAt: '2026-04-01T10:00:00+09:00',
    }),
    schedule({
      id: '96',
      scheduleId: 96,
      sessionNumber: 2,
      heldAt: '2026-04-02T10:00:00+09:00',
    }),
  ],
  scopeStatus: 'ASSIGNMENT_SCOPED',
  now: NOW,
  programId: '100',
  preferIndividualSchedules: true,
  individualSchedules: [
    {
      scheduleId: 96,
      scheduleName: '공통 교육 예정 6',
      eligible: true,
      canSubmit: true,
      payableItems: [{ itemType: 'MEAL', itemName: '식사비', evidenceRequired: true }],
    },
  ],
})
assert.equal(preferIndividualOnly.length, 1)
assert.equal(preferIndividualOnly[0]?.scheduleId, 96)
assert.equal(preferIndividualOnly[0]?.canSubmitReceipt, true)

const preferIndividualEmpty = buildAssignedSettlementItems({
  schedules: [
    schedule({
      id: '97',
      scheduleId: 97,
      sessionNumber: 1,
      heldAt: '2026-04-01T10:00:00+09:00',
    }),
  ],
  scopeStatus: 'ASSIGNMENT_SCOPED',
  now: NOW,
  programId: '100',
  preferIndividualSchedules: true,
  individualSchedules: [],
})
assert.deepEqual(preferIndividualEmpty, [])

const rejectedCanResubmit = buildAssignedSettlementItems({
  schedules: [
    schedule({
      id: '98',
      scheduleId: 98,
      sessionNumber: 1,
      heldAt: '2026-04-01T10:00:00+09:00',
    }),
  ],
  scopeStatus: 'ASSIGNMENT_SCOPED',
  now: NOW,
  programId: '100',
  individualSchedules: [
    {
      scheduleId: 98,
      eligible: true,
      canSubmit: false,
      canResubmit: true,
      status: 'REJECTED',
      settlementApplicationId: 11,
      payableItems: [{ itemType: 'MEAL', itemName: '식사비', evidenceRequired: true }],
    },
  ],
})
assert.equal(rejectedCanResubmit[0]?.status, 'rejected')
assert.equal(rejectedCanResubmit[0]?.canResubmitReceipt, true)
assert.equal(rejectedCanResubmit[0]?.canSubmitReceipt, false)

console.log('assigned-settlement-items.selfcheck: ok')
