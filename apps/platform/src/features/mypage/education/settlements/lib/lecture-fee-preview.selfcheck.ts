import assert from 'node:assert/strict'
import {
  formatInstructorFeeAssignment,
  formatLectureFeeSessionProgress,
  formatLectureFeeWon,
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
