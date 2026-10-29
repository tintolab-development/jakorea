import assert from 'node:assert/strict'
import {
  filterBasicConsentItemsByAudience,
  isMinorSettingsMember,
  isTeacherSettingsProfile,
  isUnder14FromBirthDate,
} from './consent-visibility.ts'
import { getBasicConsentItems } from './consent-catalog.ts'

assert.equal(isTeacherSettingsProfile('individual'), false)
assert.equal(isTeacherSettingsProfile('instructor_only'), false)
assert.equal(isTeacherSettingsProfile('school_teacher'), true)
assert.equal(isTeacherSettingsProfile('instructor_dual'), true)

assert.equal(isMinorSettingsMember({ ageGroup: 'UNDER_14' }), true)
assert.equal(isMinorSettingsMember({ under14: true, ageGroup: 'OVER_14' }), true)
assert.equal(isMinorSettingsMember({ under14: false, ageGroup: 'UNDER_14' }), true)
assert.equal(isMinorSettingsMember({ ageGroup: 'OVER_14', birthDate: '2015-01-01' }), false)
assert.equal(isUnder14FromBirthDate('2015-01-01', new Date('2026-10-06')), true)
assert.equal(isUnder14FromBirthDate('2012-10-06', new Date('2026-10-06')), false)
assert.equal(isMinorSettingsMember({ birthDate: '2015-01-01' }), true)
assert.equal(isMinorSettingsMember({ birthDate: '1999-01-01' }), false)

const minorMock = getBasicConsentItems({ isTeacher: false, isMinor: true })
assert.equal(minorMock.some(item => item.id === 'privacyCollection'), false)

const minorRemoteFiltered = filterBasicConsentItemsByAudience(
  getBasicConsentItems({ isTeacher: false, isMinor: false }),
  { isTeacher: false, isMinor: true },
)
assert.deepEqual(
  minorRemoteFiltered.map(item => item.id),
  ['serviceTerms', 'marketing', 'portrait'],
)

console.log('consent-visibility.selfcheck: ok')
