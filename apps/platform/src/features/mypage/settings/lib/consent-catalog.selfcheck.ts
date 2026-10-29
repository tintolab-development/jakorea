import assert from 'node:assert/strict'
import { BASIC_CONSENT_ITEMS, getBasicConsentItems } from './consent-catalog.ts'

const adult = getBasicConsentItems({ isTeacher: false, isMinor: false })
assert.deepEqual(
  adult.map(item => item.id),
  BASIC_CONSENT_ITEMS.map(item => item.id),
)

const teacher = getBasicConsentItems({ isTeacher: true, isMinor: false })
assert.deepEqual(
  teacher.map(item => item.id),
  ['serviceTerms', 'privacyCollection', 'teacherInfo', 'marketing', 'portrait'],
)
assert.equal(teacher.find(item => item.id === 'teacherInfo')?.required, true)

const minor = getBasicConsentItems({ isTeacher: false, isMinor: true })
assert.deepEqual(
  minor.map(item => item.id),
  ['serviceTerms', 'guardianLegal', 'childPrivacy', 'marketing', 'portrait'],
)
assert.equal(minor.find(item => item.id === 'guardianLegal')?.required, true)
assert.equal(minor.find(item => item.id === 'childPrivacy')?.required, false)

console.log('consent-catalog.selfcheck: ok')
