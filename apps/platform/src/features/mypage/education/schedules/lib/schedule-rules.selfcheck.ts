import assert from 'node:assert/strict'
import {
  canSubmitEducationAbsenceReason,
  EDUCATION_ASSIGNMENT_APPROVED_COPY,
  resolveEducationAssignmentGuide,
  resolveEducationScheduleProgressStatus,
  resolveEducationScheduleRowProgressStatus,
  shouldDisplayEducationAbsenceReason,
} from './schedule-rules.ts'

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
assert.equal(
  canSubmitEducationAbsenceReason('completed', 'late', [], 'NOT_REQUIRED'),
  false,
)
assert.equal(
  canSubmitEducationAbsenceReason('completed', 'absent', ['SUBMIT_ABSENCE_REASON'], 'SUBMITTED'),
  false,
)
assert.equal(
  canSubmitEducationAbsenceReason('completed', 'absent', ['SUBMIT_ABSENCE_REASON'], 'NOT_SUBMITTED'),
  true,
)
assert.equal(shouldDisplayEducationAbsenceReason('late', 'NOT_REQUIRED', '예전 사유'), false)
assert.equal(shouldDisplayEducationAbsenceReason('absent', 'SUBMITTED', '예비군'), true)
assert.equal(shouldDisplayEducationAbsenceReason('absent', 'NOT_SUBMITTED', '예전 사유'), false)
assert.equal(shouldDisplayEducationAbsenceReason('absent', undefined, '예전 사유'), false)
assert.equal(shouldDisplayEducationAbsenceReason('excused', 'SUBMITTED', '개인 사유'), true)

const sameDay = new Date(2026, 9, 31, 23, 30, 0) // 2026-10-31 23:30 local
const heldAtSameDay = '2026-10-31T21:59:00+09:00'
const endAtSameDay = '2026-10-31T22:14:00+09:00'
const heldAtPrevDay = '2026-10-30T21:59:00+09:00'

assert.equal(canSubmitEducationAbsenceReason('in_progress', null), true)

// 기존 일 단위 규칙 — 당일은 scheduled, 전날은 completed
assert.equal(resolveEducationScheduleProgressStatus(heldAtSameDay, sameDay), 'scheduled')
assert.equal(resolveEducationScheduleProgressStatus(heldAtPrevDay, sameDay), 'completed')

assert.equal(
  resolveEducationScheduleRowProgressStatus(
    {
      heldAt: heldAtSameDay,
      endAt: endAtSameDay,
      attendanceStatus: null,
      scheduleStatus: 'IN_PROGRESS',
    },
    sameDay,
  ),
  'in_progress',
)
assert.equal(
  resolveEducationScheduleRowProgressStatus(
    {
      heldAt: heldAtPrevDay,
      attendanceStatus: null,
      scheduleStatus: 'SCHEDULED',
    },
    sameDay,
  ),
  'scheduled',
)
assert.equal(
  resolveEducationScheduleRowProgressStatus(
    {
      heldAt: heldAtSameDay,
      attendanceStatus: null,
      scheduleStatus: 'COMPLETED',
    },
    sameDay,
  ),
  'completed',
)
assert.equal(
  resolveEducationScheduleRowProgressStatus(
    {
      heldAt: heldAtSameDay,
      endAt: '2026-10-31T23:50:00+09:00',
      attendanceStatus: null,
      scheduleStatus: 'MATCHED',
    },
    sameDay,
  ),
  'scheduled',
)
assert.equal(
  resolveEducationScheduleRowProgressStatus(
    {
      heldAt: heldAtSameDay,
      attendanceStatus: 'present',
      scheduleStatus: 'SCHEDULED',
      operationalDayView: true,
    },
    sameDay,
  ),
  'scheduled',
)
assert.equal(
  resolveEducationScheduleRowProgressStatus(
    {
      heldAt: heldAtSameDay,
      attendanceStatus: null,
      scheduleStatus: 'UNSCHEDULED',
      operationalDayView: true,
    },
    sameDay,
  ),
  'unscheduled',
)
assert.equal(
  resolveEducationScheduleRowProgressStatus(
    {
      heldAt: heldAtSameDay,
      attendanceStatus: null,
      scheduleStatus: 'MATCHED',
      operationalDayView: true,
    },
    sameDay,
  ),
  'unscheduled',
)

// 행 뱃지 — 출결 있으면 당일에도 completed
assert.equal(
  resolveEducationScheduleRowProgressStatus(
    { heldAt: heldAtSameDay, endAt: endAtSameDay, attendanceStatus: 'present' },
    sameDay,
  ),
  'completed',
)

// 출결 없고 종료 전 → scheduled
assert.equal(
  resolveEducationScheduleRowProgressStatus(
    {
      heldAt: heldAtSameDay,
      endAt: '2026-10-31T23:50:00+09:00',
      attendanceStatus: null,
    },
    sameDay,
  ),
  'scheduled',
)

// 출결 없고 종료 후 → completed
assert.equal(
  resolveEducationScheduleRowProgressStatus(
    { heldAt: heldAtSameDay, endAt: endAtSameDay, attendanceStatus: null },
    sameDay,
  ),
  'completed',
)

// endAt 없으면 기존 일 단위 폴백
assert.equal(
  resolveEducationScheduleRowProgressStatus(
    { heldAt: heldAtPrevDay, attendanceStatus: null },
    sameDay,
  ),
  'completed',
)
assert.equal(
  resolveEducationScheduleRowProgressStatus(
    { heldAt: heldAtSameDay, attendanceStatus: null },
    sameDay,
  ),
  'scheduled',
)

const openEnd = '2099-12-31T18:00:00+09:00'
const approvedGuide = resolveEducationAssignmentGuide('feedback', openEnd, new Date(), {
  responseStatus: 'APPROVED',
  canResubmit: false,
})
assert.equal(approvedGuide.statusLabel, EDUCATION_ASSIGNMENT_APPROVED_COPY.statusLabel)
assert.equal(approvedGuide.message, EDUCATION_ASSIGNMENT_APPROVED_COPY.message)
assert.equal(approvedGuide.showSubmitButton, false)
assert.equal(approvedGuide.showFeedbackButton, true)

const rejectedGuide = resolveEducationAssignmentGuide('feedback', openEnd, new Date(), {
  responseStatus: 'REJECTED',
  canResubmit: true,
})
assert.equal(rejectedGuide.message, '담당자의 피드백이 있어요')
assert.equal(rejectedGuide.submitLabel, '수정 제출하기')
assert.equal(rejectedGuide.showSubmitButton, true)
assert.equal(rejectedGuide.submitDisabled, false)

const canResubmitFalseGuide = resolveEducationAssignmentGuide('feedback', openEnd, new Date(), {
  canResubmit: false,
})
assert.equal(canResubmitFalseGuide.statusLabel, undefined)
assert.equal(canResubmitFalseGuide.message, '담당자의 피드백이 있어요')
assert.equal(canResubmitFalseGuide.showSubmitButton, false)

const rejectedClosedGuide = resolveEducationAssignmentGuide('feedback', openEnd, new Date(), {
  responseStatus: 'REJECTED',
  canResubmit: false,
})
assert.equal(rejectedClosedGuide.message, '담당자의 피드백이 있어요')
assert.equal(rejectedClosedGuide.showSubmitButton, true)
assert.equal(rejectedClosedGuide.submitDisabled, true)

console.log('schedule-rules.selfcheck: ok')
