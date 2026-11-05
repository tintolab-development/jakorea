import assert from 'node:assert/strict'
import {
  isPortalLectureReportDeadlineEventType,
  lectureReportDeadlineCalendarTitle,
} from './lecture-report-calendar.ts'

assert.equal(isPortalLectureReportDeadlineEventType('LECTURE_REPORT_DEADLINE'), true)
assert.equal(isPortalLectureReportDeadlineEventType('lecture_report_deadline'), true)
assert.equal(isPortalLectureReportDeadlineEventType('education'), false)
assert.equal(lectureReportDeadlineCalendarTitle(undefined), '강의보고서 제출 마감')
assert.equal(lectureReportDeadlineCalendarTitle('제출 완료'), '제출 완료')

console.log('lecture-report-calendar.selfcheck: ok')
