import assert from 'node:assert/strict'
import {
  formatInstructorFeeAssignment,
  formatLectureFeeSessionProgress,
  formatLectureFeeWon,
  formatTotalLectureFee,
  lectureFeeTypeDisplayLabel,
  parseLectureFeePreview,
} from './lecture-fee-preview.ts'

assert.equal(parseLectureFeePreview(null), null)
assert.equal(parseLectureFeePreview(undefined), null)
assert.deepEqual(
  parseLectureFeePreview({
    lectureFeeType: 'GRADE_3',
    instructorFeeCalculationUnit: 'PER_HOUR',
    instructorFeeAmount: 240000,
    totalLectureFee: 480000,
    educationSessionCount: 2,
  }),
  {
    lectureFeeType: 'GRADE_3',
    instructorFeeCalculationUnit: 'PER_HOUR',
    instructorFeeAmount: 240000,
    totalLectureFee: 480000,
    educationSessionCount: 2,
  },
)
assert.equal(lectureFeeTypeDisplayLabel('GRADE_3'), '3급 강의비')
assert.equal(lectureFeeTypeDisplayLabel(null), '-')
assert.equal(lectureFeeTypeDisplayLabel('BUSINESS_INCOME'), '-')
assert.equal(formatLectureFeeWon(240000), '240,000원')
assert.equal(formatLectureFeeWon(0), '0원')
assert.equal(formatLectureFeeWon(null), '-')
assert.equal(formatLectureFeeWon(450000.5), '-')
assert.equal(formatTotalLectureFee(null), '-')

const qaPreview = parseLectureFeePreview({
  lectureFeeType: 'GRADE_1',
  instructorFeeCalculationUnit: 'PER_HOUR',
  instructorFeeAmount: 450000,
  totalLectureFee: 450000,
  educationSessionCount: 2,
})
assert.equal(qaPreview?.totalLectureFee, 450000)
assert.equal(formatTotalLectureFee(qaPreview), '450,000원')
assert.notEqual(
  formatLectureFeeWon((qaPreview?.instructorFeeAmount ?? 0) * (qaPreview?.educationSessionCount ?? 0)),
  formatTotalLectureFee(qaPreview),
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

const missingTotal = parseLectureFeePreview({
  lectureFeeType: 'GRADE_1',
  instructorFeeCalculationUnit: 'PER_HOUR',
  instructorFeeAmount: 450000,
  educationSessionCount: 2,
})
assert.equal(missingTotal?.totalLectureFee, null)
assert.equal(formatTotalLectureFee(missingTotal), '-')
assert.equal(
  formatInstructorFeeAssignment({
    lectureFeeType: 'GRADE_3',
    instructorFeeCalculationUnit: 'PER_HOUR',
    instructorFeeAmount: 240000,
    totalLectureFee: null,
    educationSessionCount: null,
  }),
  '1시간 당, 240,000원',
)
assert.equal(
  formatInstructorFeeAssignment({
    lectureFeeType: null,
    instructorFeeCalculationUnit: 'PER_HOUR',
    instructorFeeAmount: null,
    totalLectureFee: null,
    educationSessionCount: null,
  }),
  '1시간 당',
)
assert.equal(
  formatInstructorFeeAssignment({
    lectureFeeType: null,
    instructorFeeCalculationUnit: 'FIXED',
    instructorFeeAmount: 240000,
    totalLectureFee: null,
    educationSessionCount: null,
  }),
  '240,000원',
)
assert.equal(formatInstructorFeeAssignment(null), '-')

const orgProgress = formatLectureFeeSessionProgress({
  sessionNo: 2,
  startAt: '2026-11-05T00:00:00Z',
  endAt: '2026-11-05T02:20:00Z',
})
assert.equal(orgProgress, '2차시, 09:00 ~ 11:20')
assert.equal(formatLectureFeeSessionProgress({ educationSessionCount: 1 }), '1차시')
assert.equal(formatLectureFeeSessionProgress({}), '-')

console.log('lecture-fee-preview.selfcheck: ok')
