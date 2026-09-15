import assert from 'node:assert/strict'
import { showSettingsInstructorConsentDocuments } from './consent-visibility.ts'

assert.equal(showSettingsInstructorConsentDocuments('individual'), false)
assert.equal(showSettingsInstructorConsentDocuments('school_teacher'), false)
assert.equal(showSettingsInstructorConsentDocuments('instructor_only'), true)
assert.equal(showSettingsInstructorConsentDocuments('instructor_dual'), true)

console.log('consent-visibility.selfcheck: ok')
