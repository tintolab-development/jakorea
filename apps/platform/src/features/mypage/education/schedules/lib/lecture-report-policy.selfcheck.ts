import assert from 'node:assert/strict'
import { clampLectureReportPage, resolveLectureReportAction } from './lecture-report-policy.ts'

assert.equal(resolveLectureReportAction('UPCOMING', true), 'disabled')
assert.equal(resolveLectureReportAction('AVAILABLE', true), 'write')
assert.equal(resolveLectureReportAction('AVAILABLE', false), 'disabled')
assert.equal(resolveLectureReportAction('OVERDUE', true), 'write')
assert.equal(resolveLectureReportAction('BUSINESS_ENDED', true), 'closed')
assert.equal(resolveLectureReportAction('SUBMITTED', false), 'read')
assert.equal(clampLectureReportPage(0, 0), 0)
assert.equal(clampLectureReportPage(1, 2), 1)
assert.equal(clampLectureReportPage(9, 2), 1)
assert.equal(clampLectureReportPage(-1, 2), 0)
