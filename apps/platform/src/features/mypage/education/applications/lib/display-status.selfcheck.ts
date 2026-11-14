import assert from 'node:assert/strict'
import {
  canCancelEducationApplication,
  shouldShowEducationApplicationCancelCta,
} from './display-status.ts'

assert.equal(canCancelEducationApplication('waiting_result'), true)
assert.equal(canCancelEducationApplication('document_passed'), true)
assert.equal(canCancelEducationApplication('rejected'), false)
assert.equal(canCancelEducationApplication('in_progress'), false)

assert.equal(shouldShowEducationApplicationCancelCta('waiting_result', true), true)
assert.equal(shouldShowEducationApplicationCancelCta('waiting_result', false), true)
assert.equal(shouldShowEducationApplicationCancelCta('rejected', true), false)
assert.equal(shouldShowEducationApplicationCancelCta('cancelled', true), false)
assert.equal(shouldShowEducationApplicationCancelCta('in_progress', true), false)
assert.equal(shouldShowEducationApplicationCancelCta('completed', true), false)

console.log('display-status.selfcheck: ok')
