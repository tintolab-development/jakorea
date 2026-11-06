import assert from 'node:assert/strict'
import {
  lectureReportCompleteSettlementWritePath,
  lectureReportCompleteTabPath,
  resolveInstructorLectureApplicationId,
  resolveLectureSettlementSessionId,
} from './lecture-report-complete-navigation.ts'

assert.equal(
  resolveInstructorLectureApplicationId({
    routeApplicationId: '12',
    instructorApplicationId: 99,
  }),
  '99',
)
assert.equal(
  resolveInstructorLectureApplicationId({ routeApplicationId: '12', instructorApplicationId: null }),
  '12',
)
assert.equal(resolveLectureSettlementSessionId({ scheduleId: 88, assignmentId: 10 }), '88')
assert.equal(resolveLectureSettlementSessionId({ scheduleId: null, assignmentId: 10 }), '10')
assert.equal(resolveLectureSettlementSessionId({ scheduleId: 0, assignmentId: null }), '')
assert.equal(lectureReportCompleteTabPath('12'), '/mypage/lectures/INSTRUCTOR/12?section=lecture-report')
assert.equal(
  lectureReportCompleteSettlementWritePath('12', '88'),
  '/mypage/lectures/INSTRUCTOR/12/settlement/write?sessionId=88',
)
assert.equal(lectureReportCompleteSettlementWritePath('12', ''), null)

console.log('lecture-report-complete-navigation.selfcheck: ok')
