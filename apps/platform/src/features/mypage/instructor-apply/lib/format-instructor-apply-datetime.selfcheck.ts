import assert from 'node:assert/strict'
import {
  formatInstructorApplyRequestedAtLabel,
  formatInstructorConsentAgreedAtLabel,
} from './format-instructor-apply-datetime.ts'

assert.equal(formatInstructorApplyRequestedAtLabel('2026-10-31T07:30:08Z'), '2026.10.31 16:30')
assert.equal(formatInstructorApplyRequestedAtLabel('2026-10-31T15:30:00Z'), '2026.11.01 00:30')
assert.equal(formatInstructorApplyRequestedAtLabel('2026-10-31'), '2026.10.31')
assert.equal(
  formatInstructorConsentAgreedAtLabel('2026-10-31T07:30:08Z'),
  '2026.10.31 16:30:08',
)
assert.equal(formatInstructorApplyRequestedAtLabel(undefined), '')

console.log('format-instructor-apply-datetime.selfcheck: ok')
