import assert from 'node:assert/strict'
import {
  MOCK_SETTINGS_GUARDIAN,
  MOCK_SETTINGS_PROFILE,
  MOCK_TEACHER_SETTINGS_PROFILE,
} from './constants.ts'
import {
  formatSettingsDateDot,
  formatSettingsEmployment,
  formatSettingsEnrollment,
  formatSettingsGender,
  formatSettingsGrade,
  formatSettingsJoinedAt,
  formatSettingsPhone,
  mapPortalProfileToSettingsView,
} from './map-view.ts'

assert.equal(formatSettingsJoinedAt('2026-09-15'), '2026년 09월 15일')
assert.equal(formatSettingsDateDot('1999-01-01'), '1999.01.01')
assert.equal(formatSettingsPhone('01012345678'), '010-1234-5678')
assert.equal(formatSettingsPhone('0212345678'), '02-1234-5678')
assert.equal(formatSettingsGender('F'), '여성')
assert.equal(formatSettingsEnrollment('ENROLLED'), '재학 중')
assert.equal(formatSettingsGrade('2'), '2학년')
assert.equal(formatSettingsGrade('2학년'), '2학년')

const view = mapPortalProfileToSettingsView(MOCK_SETTINGS_PROFILE, MOCK_SETTINGS_GUARDIAN)
assert.equal(view.basicRows[0]?.value, '2026년 09월 15일')
assert.equal(view.basicRows[6]?.value, '재희 고등학교')
assert.equal(view.basicRows[10]?.value, '-')
assert.equal(view.basicRows[10]?.action, '1365-shortcut')
assert.equal(view.guardian?.relationship, '아빠')

const remoteWithoutGuardian = mapPortalProfileToSettingsView({
  name: '김회원',
  email: 'member@example.com',
})
assert.equal(remoteWithoutGuardian.guardian, null)
assert.equal(remoteWithoutGuardian.basicRows[1]?.value, '김회원')

assert.equal(formatSettingsEmployment('ACTIVE'), '재직 중')
assert.equal(formatSettingsEmployment('ON_LEAVE'), '휴직 중')
assert.equal(formatSettingsEmployment('TRANSFERRED'), '-')

const teacherView = mapPortalProfileToSettingsView(MOCK_TEACHER_SETTINGS_PROFILE, null, {
  variant: 'teacher',
})
assert.equal(teacherView.basicRows[5]?.label, '소속/학교')
assert.equal(teacherView.basicRows[5]?.value, '서울초등학교')
assert.equal(teacherView.basicRows[6]?.label, '재직 현황')
assert.equal(teacherView.basicRows[6]?.value, '재직 중')
assert.equal(teacherView.guardian, null)

console.log('map-view.selfcheck: ok')
