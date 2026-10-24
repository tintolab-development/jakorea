import assert from 'node:assert/strict'
import { canSubmitEducationAbsenceReason } from './schedule-rules.ts'

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

console.log('schedule-rules.selfcheck: ok')
