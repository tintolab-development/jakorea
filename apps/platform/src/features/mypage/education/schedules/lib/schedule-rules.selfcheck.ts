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

console.log('schedule-rules.selfcheck: ok')
