import assert from 'node:assert/strict'
import {
  formatEducationProgressSessionCount,
  formatInstructorFeeAssignment,
  formatLectureFeeSessionProgress,
  formatLectureFeeWon,
  formatRecognizedSessionCountLabel,
  formatTotalLectureFee,
  hasConfirmedLectureFeeTotal,
  isLectureFeeSettlementBlocked,
  lectureFeeSettlementBlockerMessage,
  lectureFeeTypeDisplayLabel,
  parseLectureFeePreview,
} from './lecture-fee-preview.ts'

const EMPTY_COUNTS = {
  recognizedSessionCount: null,
  actualTrainingMinutes: null,
  settlementBlockerCode: null,
} as const

assert.equal(parseLectureFeePreview(null), null)
assert.equal(parseLectureFeePreview(undefined), null)
assert.deepEqual(
  parseLectureFeePreview({
    lectureFeeType: 'GRADE_3',
    instructorFeeCalculationUnit: 'PER_HOUR',
    instructorFeeAmount: 240000,
    totalLectureFee: 480000,
    educationSessionCount: 2,
    recognizedSessionCount: 2,
    actualTrainingMinutes: 90,
    settlementBlockerCode: null,
  }),
  {
    lectureFeeType: 'GRADE_3',
    instructorFeeCalculationUnit: 'PER_HOUR',
    instructorFeeAmount: 240000,
    totalLectureFee: 480000,
    educationSessionCount: 2,
    recognizedSessionCount: 2,
    actualTrainingMinutes: 90,
    settlementBlockerCode: null,
  }
)
assert.equal(
  parseLectureFeePreview({ instructorFeeCalculationUnit: 'PER_CLASS' })
    ?.instructorFeeCalculationUnit,
  'PER_CLASS'
)
assert.equal(lectureFeeTypeDisplayLabel('GRADE_3'), '3급 강사비')
assert.equal(lectureFeeTypeDisplayLabel(null), '-')
assert.equal(lectureFeeTypeDisplayLabel('BUSINESS_INCOME'), '-')
assert.equal(formatLectureFeeWon(240000), '240,000원')
assert.equal(formatLectureFeeWon(0), '0원')
assert.equal(formatLectureFeeWon(null), '-')
assert.equal(formatLectureFeeWon(450000.5), '-')
assert.equal(formatTotalLectureFee(null), '-')
assert.equal(hasConfirmedLectureFeeTotal(null), false)

const qaPreview = parseLectureFeePreview({
  lectureFeeType: 'GRADE_1',
  instructorFeeCalculationUnit: 'PER_HOUR',
  instructorFeeAmount: 450000,
  totalLectureFee: 450000,
  educationSessionCount: 2,
  recognizedSessionCount: 1,
  actualTrainingMinutes: 60,
  settlementBlockerCode: null,
})
assert.equal(qaPreview?.totalLectureFee, 450000)
assert.equal(formatTotalLectureFee(qaPreview), '450,000원')
assert.notEqual(
  formatLectureFeeWon(
    (qaPreview?.instructorFeeAmount ?? 0) * (qaPreview?.educationSessionCount ?? 0)
  ),
  formatTotalLectureFee(qaPreview)
)

const stringTotal = parseLectureFeePreview({
  lectureFeeType: 'GRADE_1',
  instructorFeeCalculationUnit: 'PER_HOUR',
  instructorFeeAmount: 450000,
  totalLectureFee: '450000',
  educationSessionCount: 2,
})
assert.equal(stringTotal?.totalLectureFee, null)
assert.equal(formatTotalLectureFee(stringTotal), '-')
assert.equal(stringTotal?.recognizedSessionCount, null)
assert.equal(stringTotal?.settlementBlockerCode, null)

const missingTotal = parseLectureFeePreview({
  lectureFeeType: 'GRADE_1',
  instructorFeeCalculationUnit: 'PER_HOUR',
  instructorFeeAmount: 450000,
  educationSessionCount: 2,
})
assert.equal(missingTotal?.totalLectureFee, null)
assert.equal(formatTotalLectureFee(missingTotal), '-')
assert.equal(hasConfirmedLectureFeeTotal(missingTotal), false)

assert.equal(
  formatInstructorFeeAssignment({
    lectureFeeType: 'GRADE_3',
    instructorFeeCalculationUnit: 'PER_HOUR',
    instructorFeeAmount: 240000,
    totalLectureFee: null,
    educationSessionCount: null,
    ...EMPTY_COUNTS,
  }),
  '차시당 240,000원'
)
assert.equal(
  formatInstructorFeeAssignment({
    lectureFeeType: null,
    instructorFeeCalculationUnit: 'PER_HOUR',
    instructorFeeAmount: null,
    totalLectureFee: null,
    educationSessionCount: null,
    ...EMPTY_COUNTS,
  }),
  '차시당'
)
assert.equal(
  formatInstructorFeeAssignment({
    lectureFeeType: null,
    instructorFeeCalculationUnit: 'FIXED',
    instructorFeeAmount: 240000,
    totalLectureFee: null,
    educationSessionCount: null,
    ...EMPTY_COUNTS,
  }),
  '240,000원'
)
assert.equal(
  formatInstructorFeeAssignment({
    lectureFeeType: 'GRADE_2',
    instructorFeeCalculationUnit: 'PER_LECTURE',
    instructorFeeAmount: 180000,
    totalLectureFee: 180000,
    educationSessionCount: null,
    recognizedSessionCount: 0,
    actualTrainingMinutes: 10,
    settlementBlockerCode: null,
  }),
  '출강 1회당 180,000원'
)
assert.equal(formatInstructorFeeAssignment(null), '-')

const orgProgress = formatLectureFeeSessionProgress({
  sessionNo: 2,
  startAt: '2026-11-05T00:00:00Z',
  endAt: '2026-11-05T02:20:00Z',
})
assert.equal(orgProgress, '2회차, 09:00 ~ 11:20')
assert.equal(formatLectureFeeSessionProgress({ educationSessionCount: 1 }), '1회차')
assert.equal(formatLectureFeeSessionProgress({}), '-')
assert.equal(formatLectureFeeSessionProgress({ educationSessionCount: null }), '-')

const assignment1694890 = parseLectureFeePreview({
  lectureFeeType: 'GRADE_1',
  instructorFeeCalculationUnit: 'PER_HOUR',
  instructorFeeAmount: 450000,
  totalLectureFee: null,
  educationSessionCount: null,
  recognizedSessionCount: null,
  actualTrainingMinutes: null,
  settlementBlockerCode: 'SETTLEMENT_ACTUAL_TRAINING_TIME_REQUIRED',
})
assert.equal(assignment1694890?.totalLectureFee, null)
assert.equal(hasConfirmedLectureFeeTotal(assignment1694890), false)
assert.equal(formatTotalLectureFee(assignment1694890), '-')
assert.notEqual(formatTotalLectureFee(assignment1694890), '75,000원')
assert.equal(formatInstructorFeeAssignment(assignment1694890), '차시당 450,000원')
assert.equal(isLectureFeeSettlementBlocked(assignment1694890), true)
assert.equal(
  lectureFeeSettlementBlockerMessage(assignment1694890),
  '실적 시작·종료 시간이 없어 정산을 신청할 수 없습니다.'
)
assert.equal(formatRecognizedSessionCountLabel(assignment1694890?.recognizedSessionCount), null)

const tenMinuteZeroSession = parseLectureFeePreview({
  lectureFeeType: 'GRADE_1',
  instructorFeeCalculationUnit: 'PER_HOUR',
  instructorFeeAmount: 450000,
  totalLectureFee: 0,
  educationSessionCount: null,
  recognizedSessionCount: 0,
  actualTrainingMinutes: 10,
  settlementBlockerCode: null,
})
assert.equal(formatTotalLectureFee(tenMinuteZeroSession), '0원')
assert.equal(hasConfirmedLectureFeeTotal(tenMinuteZeroSession), true)
assert.equal(formatRecognizedSessionCountLabel(0), '0차시')
assert.equal(formatEducationProgressSessionCount(1), '1차시')
assert.equal(formatEducationProgressSessionCount(null), '-')
assert.notEqual(formatEducationProgressSessionCount(1), '3차시')
assert.equal(isLectureFeeSettlementBlocked(tenMinuteZeroSession), false)

const twoSessionUncapped = parseLectureFeePreview({
  lectureFeeType: 'GRADE_2',
  instructorFeeCalculationUnit: 'PER_CLASS',
  instructorFeeAmount: 400000,
  totalLectureFee: 800000,
  educationSessionCount: 2,
  recognizedSessionCount: 2,
  actualTrainingMinutes: 90,
  settlementBlockerCode: null,
})
assert.equal(formatTotalLectureFee(twoSessionUncapped), '800,000원')
assert.notEqual(formatTotalLectureFee(twoSessionUncapped), '400,000원')

const wageMissing = parseLectureFeePreview({
  lectureFeeType: 'GRADE_2',
  instructorFeeCalculationUnit: null,
  instructorFeeAmount: null,
  totalLectureFee: null,
  educationSessionCount: 1,
  settlementBlockerCode: 'SETTLEMENT_WAGE_RATE_NOT_CONFIGURED',
})
assert.equal(
  lectureFeeSettlementBlockerMessage(wageMissing),
  '프로그램 강사비 단가가 없어 정산을 신청할 수 없습니다.'
)

const assignedScheduleMissing = parseLectureFeePreview({
  lectureFeeType: 'GRADE_1',
  instructorFeeCalculationUnit: 'PER_HOUR',
  instructorFeeAmount: 300000,
  totalLectureFee: null,
  educationSessionCount: 3,
  recognizedSessionCount: null,
  actualTrainingMinutes: null,
  settlementBlockerCode: 'SETTLEMENT_ASSIGNED_SCHEDULE_TIME_REQUIRED',
})
assert.equal(isLectureFeeSettlementBlocked(assignedScheduleMissing), true)
assert.equal(
  lectureFeeSettlementBlockerMessage(assignedScheduleMissing),
  '배정 일정 시작·종료 시간이 없어 정산을 신청할 수 없습니다.'
)
assert.notEqual(
  lectureFeeSettlementBlockerMessage(assignedScheduleMissing),
  '실적 시작·종료 시간이 없어 정산을 신청할 수 없습니다.'
)

const threeRoundOneRecognized = parseLectureFeePreview({
  lectureFeeType: 'GRADE_1',
  instructorFeeCalculationUnit: 'PER_CLASS',
  instructorFeeAmount: 300000,
  totalLectureFee: 300000,
  educationSessionCount: 3,
  recognizedSessionCount: 1,
  actualTrainingMinutes: 60,
  settlementBlockerCode: null,
})
assert.equal(formatTotalLectureFee(threeRoundOneRecognized), '300,000원')
assert.equal(formatEducationProgressSessionCount(threeRoundOneRecognized?.recognizedSessionCount), '1차시')
assert.notEqual(
  formatEducationProgressSessionCount(threeRoundOneRecognized?.educationSessionCount),
  formatEducationProgressSessionCount(threeRoundOneRecognized?.recognizedSessionCount)
)

const twentyMinuteZero = parseLectureFeePreview({
  lectureFeeType: 'GRADE_1',
  instructorFeeCalculationUnit: 'PER_CLASS',
  instructorFeeAmount: 300000,
  totalLectureFee: 0,
  educationSessionCount: 3,
  recognizedSessionCount: 0,
  actualTrainingMinutes: 20,
  settlementBlockerCode: null,
})
assert.equal(formatTotalLectureFee(twentyMinuteZero), '0원')
assert.equal(formatEducationProgressSessionCount(twentyMinuteZero?.recognizedSessionCount), '0차시')
assert.equal(isLectureFeeSettlementBlocked(twentyMinuteZero), false)

const geminiUnsubmitted = parseLectureFeePreview({
  lectureFeeType: null,
  instructorFeeCalculationUnit: 'PER_CLASS',
  instructorFeeAmount: 170000,
  totalLectureFee: null,
  educationSessionCount: 1,
  recognizedSessionCount: null,
  actualTrainingMinutes: null,
  settlementBlockerCode: 'SETTLEMENT_ACTUAL_TRAINING_TIME_REQUIRED',
})
assert.equal(formatEducationProgressSessionCount(geminiUnsubmitted?.recognizedSessionCount), '-')
assert.equal(formatTotalLectureFee(geminiUnsubmitted), '-')

console.log('lecture-fee-preview.selfcheck: ok')
