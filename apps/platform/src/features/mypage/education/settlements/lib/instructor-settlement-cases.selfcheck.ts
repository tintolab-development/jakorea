import assert from 'node:assert/strict'
import type { EducationScheduleItem } from '../../schedules/model/types.ts'
import { buildAssignedSettlementItems } from './assigned-settlement-items.ts'
import {
  isSettlementWriteCtaDisabled,
  resolveSettlementStatusUi,
} from './settlement-status-ui.ts'
import {
  readInstructorBusinessIncomeLabel,
  readInstructorFeeGradeLabel,
} from './instructor-settlement-summary.ts'
import {
  buildSettlementConfirmPath,
  buildSettlementWritePath,
  resolveSettlementAreaFromPathname,
} from './write-path.ts'

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

type InstructorSettlementBuildInput = Omit<
  Parameters<typeof buildAssignedSettlementItems>[0],
  'scopeStatus' | 'now' | 'programId' | 'deadlinePolicy'
>

function build(input: InstructorSettlementBuildInput) {
  return buildAssignedSettlementItems({
    ...input,
    scopeStatus: 'ASSIGNMENT_SCOPED',
    now: NOW,
    programId: '100',
    deadlinePolicy: 'payment_statement',
  })
}

const completedSchedule = schedule({
  id: '1',
  scheduleId: 1,
  sessionNumber: 3,
  heldAt: '2026-04-03T10:00:00+09:00',
  progressTimeLabel: '10:00~11:20',
  sessionLabel: '3차시',
  locationName: '가천 대학교',
})

const upcomingSchedule = schedule({
  id: '11',
  scheduleId: 11,
  sessionNumber: 4,
  heldAt: '2026-04-17T10:00:00+09:00',
  progressTimeLabel: '10:00~11:20',
  sessionLabel: '4차시',
})

const case01 = build({
  schedules: [completedSchedule],
  lectureReports: [{ scheduleId: 1, reportStatus: 'AVAILABLE', lectureStatus: 'COMPLETED' }],
})[0]
assert.equal(case01?.status, 'report_pending')
assert.equal(case01?.progress, 'completed')
const case01Ui = resolveSettlementStatusUi(case01!.status, 'payment_statement')
assert.equal(case01Ui.writeDisabled, true)
assert.equal(case01Ui.writeLabel, '지급조서 작성하기')
assert.equal(
  isSettlementWriteCtaDisabled({
    documentKind: 'payment_statement',
    writeDisabledByStatus: case01Ui.writeDisabled,
    canSubmit: case01?.canSubmitReceipt,
    status: case01?.status,
  }),
  true,
)

const case02 = build({
  schedules: [completedSchedule],
  lectureReports: [{
    scheduleId: 1,
    assignmentId: 12345,
    reportStatus: 'SUBMITTED',
    lectureStatus: 'COMPLETED',
  }],
  settlements: [
    {
      programId: 100,
      programScheduleId: 1,
      submitDeadlineAt: '2026-04-30T23:59:59+09:00',
      availableActions: ['SUBMIT'],
    },
  ],
})[0]
assert.equal(case02?.status, 'pending_submit')
assert.equal(case02?.assignmentId, 12345)
const case02Ui = resolveSettlementStatusUi(case02!.status, 'payment_statement')
assert.equal(case02Ui.writeDisabled, undefined)
assert.equal(case02Ui.writeLabel, '지급조서 작성하기')
assert.equal(
  isSettlementWriteCtaDisabled({
    documentKind: 'payment_statement',
    writeDisabledByStatus: case02Ui.writeDisabled,
    canSubmit: case02?.canSubmitReceipt,
    status: case02?.status,
  }),
  false,
)

const case03 = build({
  schedules: [completedSchedule],
  lectureReports: [{ scheduleId: 1, reportStatus: 'SUBMITTED', lectureStatus: 'COMPLETED' }],
  settlements: [
    {
      programId: 100,
      programScheduleId: 1,
      submitDeadlineAt: '2026-04-10T23:59:59+09:00',
    },
  ],
})[0]
assert.equal(case03?.status, 'overdue')
const case03Ui = resolveSettlementStatusUi(case03!.status, 'payment_statement')
assert.equal(case03Ui.markLabel, '지급조서 미제출')
assert.equal(case03Ui.cardTone, 'danger')
assert.equal(
  isSettlementWriteCtaDisabled({
    documentKind: 'payment_statement',
    writeDisabledByStatus: case03Ui.writeDisabled,
    canSubmit: false,
    status: case03?.status,
  }),
  true,
)
assert.equal(
  isSettlementWriteCtaDisabled({
    documentKind: 'payment_statement',
    writeDisabledByStatus: case03Ui.writeDisabled,
    canSubmit: true,
    status: case03?.status,
  }),
  false,
)

const case04 = build({
  schedules: [completedSchedule],
  lectureReports: [{ scheduleId: 1, reportStatus: 'SUBMITTED', lectureStatus: 'COMPLETED' }],
  settlements: [
    {
      applicationId: 401,
      programId: 100,
      programScheduleId: 1,
      statementStatus: 'SUBMITTED',
      netPaymentAmount: 300000,
    },
  ],
})[0]
assert.equal(case04?.status, 'waiting_confirm')
assert.equal(case04?.amount, 300000)
assert.equal(resolveSettlementStatusUi(case04!.status, 'payment_statement').markLabel, '확인 대기')

const case05 = build({
  schedules: [completedSchedule],
  lectureReports: [{ scheduleId: 1, reportStatus: 'SUBMITTED', lectureStatus: 'COMPLETED' }],
  settlements: [
    {
      applicationId: 501,
      programId: 100,
      programScheduleId: 1,
      statementStatus: 'REAPPLICATION',
      netPaymentAmount: 300000,
    },
  ],
})[0]
assert.equal(case05?.status, 'reapplied')
assert.equal(resolveSettlementStatusUi(case05!.status, 'payment_statement').markLabel, '재신청')

const case06 = build({
  schedules: [completedSchedule],
  lectureReports: [{ scheduleId: 1, reportStatus: 'SUBMITTED', lectureStatus: 'COMPLETED' }],
  settlements: [
    {
      applicationId: 601,
      programId: 100,
      programScheduleId: 1,
      statementStatus: 'CONFIRMED',
      netPaymentAmount: 300000,
    },
  ],
})[0]
assert.equal(case06?.status, 'confirmed')
assert.equal(resolveSettlementStatusUi(case06!.status, 'payment_statement').markLabel, '확인 완료')

const case07 = build({
  schedules: [completedSchedule],
  lectureReports: [{ scheduleId: 1, reportStatus: 'SUBMITTED', lectureStatus: 'COMPLETED' }],
  settlements: [
    {
      applicationId: 701,
      programId: 100,
      programScheduleId: 1,
      statementStatus: 'CONFIRMED',
      paymentStatus: 'PAID',
      netPaymentAmount: 300000,
    },
  ],
})[0]
assert.equal(case07?.status, 'paid')
assert.equal(resolveSettlementStatusUi(case07!.status, 'payment_statement').markLabel, '지급 완료')

const case08 = build({
  schedules: [completedSchedule],
  lectureReports: [{ scheduleId: 1, reportStatus: 'SUBMITTED', lectureStatus: 'COMPLETED' }],
  settlements: [
    {
      applicationId: 801,
      programId: 100,
      programScheduleId: 1,
      statementStatus: 'CORRECTION_REQUESTED',
      netPaymentAmount: 300000,
    },
  ],
})[0]
assert.equal(case08?.status, 'correction_requested')
assert.equal(resolveSettlementStatusUi(case08!.status, 'payment_statement').markLabel, '정정 요청')
assert.deepEqual(resolveSettlementStatusUi(case08!.status, 'payment_statement').actions, ['view'])

const case09 = build({
  schedules: [completedSchedule],
  lectureReports: [{ scheduleId: 1, reportStatus: 'SUBMITTED', lectureStatus: 'COMPLETED' }],
  settlements: [
    {
      applicationId: 901,
      programId: 100,
      programScheduleId: 1,
      statementStatus: 'WAITING_CONFIRM',
      correctionStatus: 'CORRECTION_COMPLETED',
      netPaymentAmount: 280000,
      previousNetPaymentAmount: 300000,
    },
  ],
})[0]
assert.equal(case09?.status, 'correction_completed')
assert.equal(case09?.previousAmount, 300000)
assert.deepEqual(resolveSettlementStatusUi(case09!.status, 'payment_statement').actions, [
  'view-correction',
  'reapply',
])

const case10 = build({
  schedules: [completedSchedule],
  lectureReports: [{ scheduleId: 1, reportStatus: 'SUBMITTED', lectureStatus: 'COMPLETED' }],
  settlements: [
    {
      applicationId: 1001,
      programId: 100,
      programScheduleId: 1,
      statementStatus: 'REJECTED',
      netPaymentAmount: 200000,
      rejectedReason: '계좌 정보가 일치하지 않습니다.',
    },
  ],
})[0]
assert.equal(case10?.status, 'rejected')
assert.equal(case10?.rejectReason, '계좌 정보가 일치하지 않습니다.')
assert.deepEqual(resolveSettlementStatusUi(case10!.status, 'payment_statement').actions, [
  'reject-reason',
  'reapply',
])

const case11 = build({
  schedules: [upcomingSchedule],
  lectureReports: [{ scheduleId: 11, reportStatus: 'UPCOMING', lectureStatus: 'UPCOMING' }],
})[0]
assert.equal(case11?.status, 'upcoming')
assert.equal(case11?.progress, 'upcoming')
assert.equal(resolveSettlementStatusUi(case11!.status, 'payment_statement').actions, undefined)

const mixed = build({
  schedules: [completedSchedule, upcomingSchedule],
  lectureReports: [
    { scheduleId: 1, reportStatus: 'SUBMITTED', lectureStatus: 'COMPLETED' },
    { scheduleId: 11, reportStatus: 'UPCOMING', lectureStatus: 'UPCOMING' },
  ],
  settlements: [
    {
      applicationId: 401,
      programId: 100,
      programScheduleId: 1,
      statementStatus: 'SUBMITTED',
      netPaymentAmount: 300000,
    },
  ],
})
assert.equal(mixed.length, 2)
assert.equal(mixed[0]?.status, 'waiting_confirm')
assert.equal(mixed[1]?.status, 'upcoming')
assert.equal(mixed[0]?.institutionLabel, undefined)

assert.equal(
  resolveSettlementAreaFromPathname('/mypage/lectures/INSTRUCTOR/12'),
  'lecture',
)
assert.equal(
  buildSettlementWritePath({
    applicationId: '12',
    sessionId: '1',
    area: 'lecture',
    applicationType: 'INSTRUCTOR',
  }),
  '/mypage/lectures/INSTRUCTOR/12/settlement/write?sessionId=1',
)
assert.equal(
  buildSettlementConfirmPath({
    applicationId: '12',
    sessionId: '1',
    area: 'lecture',
    applicationType: 'INSTRUCTOR',
    mode: 'view',
  }),
  '/mypage/lectures/INSTRUCTOR/12/settlement/confirm?sessionId=1&mode=view',
)

assert.equal(
  readInstructorFeeGradeLabel({ listMetrics: { instructorFeeGradeLabel: '1급 강사비' } }),
  '1급 강사비',
)
assert.equal(readInstructorFeeGradeLabel({}), '-')
assert.equal(
  readInstructorBusinessIncomeLabel({
    instructorProfile: { settlement: { businessIncome: true } },
  }),
  '해당',
)
assert.equal(readInstructorBusinessIncomeLabel({}), '-')

assert.equal(
  isSettlementWriteCtaDisabled({ documentKind: 'receipt', hasPayableItems: false }),
  true,
)

const fromLectureOnly = build({
  schedules: [],
  lectureReports: [
    {
      scheduleId: 31,
      reportStatus: 'SUBMITTED',
      lectureStatus: 'COMPLETED',
      institutionName: '가천 대학교',
      grade: '초등',
      startAt: '2026-04-03T10:00:00+09:00',
      endAt: '2026-04-03T11:20:00+09:00',
      sessionNo: 3,
    },
  ],
})
assert.equal(fromLectureOnly.length, 1)
assert.equal(fromLectureOnly[0]?.id, '31')
assert.equal(fromLectureOnly[0]?.institutionLabel, '가천 대학교 · 초등')
assert.equal(fromLectureOnly[0]?.status, 'pending_submit')

console.log('instructor-settlement-cases.selfcheck: ok')
