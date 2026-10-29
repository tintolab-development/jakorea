import assert from 'node:assert/strict'
import {
  isMinorSettingsMember,
  isTeacherSettingsProfile,
  isUnder14FromBirthDate,
} from './consent-visibility.ts'

assert.equal(isTeacherSettingsProfile('individual'), false)
assert.equal(isTeacherSettingsProfile('instructor_only'), false)
assert.equal(isTeacherSettingsProfile('school_teacher'), true)
assert.equal(isTeacherSettingsProfile('instructor_dual'), true)

assert.equal(isMinorSettingsMember({ ageGroup: 'UNDER_14' }), true)
assert.equal(isMinorSettingsMember({ under14: true, ageGroup: 'OVER_14' }), false)
assert.equal(isMinorSettingsMember({ under14: false, ageGroup: 'UNDER_14' }), true)
assert.equal(isMinorSettingsMember({ under14: true }), true)
assert.equal(isMinorSettingsMember({ ageGroup: 'OVER_14', birthDate: '2015-01-01' }), false)
assert.equal(isUnder14FromBirthDate('2015-01-01', new Date('2026-10-06')), true)
assert.equal(isUnder14FromBirthDate('2012-10-06', new Date('2026-10-06')), false)
assert.equal(isMinorSettingsMember({ birthDate: '2015-01-01' }), true)
assert.equal(isMinorSettingsMember({ birthDate: '1999-01-01' }), false)

console.log('consent-visibility.selfcheck: ok')
