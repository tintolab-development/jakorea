import assert from 'node:assert/strict'
import {
  canSubmitEducationAssignment,
  canSubmitEducationAbsenceReason,
  resolveEducationAssignmentGuide,
} from './schedule-rules.ts'

assert.equal(canSubmitEducationAssignment({ canSubmit: true }, 'submit'), true)
assert.equal(canSubmitEducationAssignment({ canSubmit: false }, 'submit'), false)
assert.equal(canSubmitEducationAssignment({}, 'submit'), false)
assert.equal(canSubmitEducationAssignment({ canResubmit: true }, 'revise'), true)
assert.equal(canSubmitEducationAssignment({ canResubmit: false }, 'revise'), false)
assert.equal(canSubmitEducationAssignment({}, 'revise'), false)

assert.equal(canSubmitEducationAbsenceReason('scheduled', null), true)
assert.equal(canSubmitEducationAbsenceReason('scheduled', 'absent'), true)
assert.equal(canSubmitEducationAbsenceReason('scheduled', 'present'), false)
assert.equal(canSubmitEducationAbsenceReason('scheduled', 'late'), false)
assert.equal(canSubmitEducationAbsenceReason('completed', 'absent'), true)
assert.equal(canSubmitEducationAbsenceReason('completed', 'present'), false)
assert.equal(canSubmitEducationAbsenceReason('completed', 'late'), false)
assert.equal(canSubmitEducationAbsenceReason('completed', 'excused'), false)
assert.equal(canSubmitEducationAbsenceReason('scheduled', null, ['SUBMIT_ABSENCE_REASON']), true)
assert.equal(canSubmitEducationAbsenceReason('scheduled', null, ['VIEW_ATTENDANCE']), false)
assert.equal(canSubmitEducationAbsenceReason('completed', 'absent', ['VIEW_ATTENDANCE']), false)
assert.equal(canSubmitEducationAbsenceReason('completed', 'absent', ['SUBMIT_ABSENCE_REASON']), true)
assert.equal(canSubmitEducationAbsenceReason('scheduled', 'present', ['SUBMIT_ABSENCE_REASON']), false)

// 과제 안내 — 시안(팀 프로그램 교육 일정) 카드별 케이스
const beforeDeadline = new Date('2026-06-01T00:00:00+09:00')
const afterDeadline = new Date('2026-06-16T00:00:00+09:00')
const submitEndAt = '2026-06-15T23:59:59+09:00'

const notSubmittedOpen = resolveEducationAssignmentGuide('not_submitted', submitEndAt, beforeDeadline)
assert.equal(notSubmittedOpen.statusLabel, undefined)
assert.equal(notSubmittedOpen.message, '기한 내에 과제를 제출해 주세요')
assert.equal(notSubmittedOpen.submitLabel, '과제 제출하기')
assert.equal(notSubmittedOpen.submitDisabled, false)

const submittedOpen = resolveEducationAssignmentGuide('submitted', submitEndAt, beforeDeadline)
assert.equal(submittedOpen.statusLabel, '과제 제출 완료')
assert.equal(submittedOpen.message, '제출한 과제는 마감 전까지는 수정이 가능해요')
assert.equal(submittedOpen.submitDisabled, false)

const submittedClosed = resolveEducationAssignmentGuide('submitted', submitEndAt, afterDeadline)
assert.equal(submittedClosed.statusLabel, '과제 제출 완료')
assert.equal(submittedClosed.message, '과제 제출기한이 마감되었어요')
assert.equal(submittedClosed.submitDisabled, true)

const notSubmittedClosed = resolveEducationAssignmentGuide('not_submitted', submitEndAt, afterDeadline)
assert.equal(notSubmittedClosed.statusLabel, '미제출')
assert.equal(notSubmittedClosed.statusTone, 'unsubmitted')
assert.equal(notSubmittedClosed.message, '과제 제출기한이 마감되었어요')
assert.equal(notSubmittedClosed.submitDisabled, false)

const feedback = resolveEducationAssignmentGuide('feedback', submitEndAt, beforeDeadline)
assert.equal(feedback.statusLabel, undefined)
assert.equal(feedback.message, '담당자의 피드백이 있어요')
assert.equal(feedback.submitLabel, '수정 제출하기')
assert.equal(feedback.showFeedbackButton, true)

const revisionSubmitted = resolveEducationAssignmentGuide('revision_submitted', submitEndAt, beforeDeadline)
assert.equal(revisionSubmitted.statusLabel, '과제 제출 완료')
assert.equal(revisionSubmitted.message, '과제 수정 제출이 완료되었어요')
assert.equal(revisionSubmitted.submitDisabled, true)

console.log('schedule-rules.selfcheck: ok')
