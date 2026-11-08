import assert from 'node:assert/strict'
import {
  filterBasicConsentItemsByAudience,
  filterListedDocumentConsentItems,
  isMinorSettingsMember,
  isTeacherSettingsProfile,
  isUnder14FromBirthDate,
} from './consent-visibility.ts'
import { DOCUMENT_CONSENT_ITEMS, getBasicConsentItems } from './consent-catalog.ts'

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

// 동의서·서약서 카드 — 기본 미노출, 서버 listed === true만
const listedSample = DOCUMENT_CONSENT_ITEMS.map((item, index) => ({
  ...item,
  listed: index === 0 ? true : index === 1 ? false : undefined,
}))
assert.deepEqual(
  filterListedDocumentConsentItems(listedSample, { isRemoteSession: true, isInstructor: true }).map(
    item => item.id,
  ),
  ['paymentStatement'],
)
assert.equal(
  filterListedDocumentConsentItems(listedSample, { isRemoteSession: false, isInstructor: true })
    .length,
  listedSample.length,
)
assert.equal(
  filterListedDocumentConsentItems([], { isRemoteSession: true, isInstructor: true }).length,
  0,
)

// 지급조서 사전 동의서 — 강사가 아니면 listed여도 미노출
const allListed = DOCUMENT_CONSENT_ITEMS.map(item => ({ ...item, listed: true }))
assert.equal(
  filterListedDocumentConsentItems(allListed, { isRemoteSession: true, isInstructor: false }).some(
    item => item.id === 'paymentStatement',
  ),
  false,
)
assert.equal(
  filterListedDocumentConsentItems(allListed, { isRemoteSession: false, isInstructor: false }).some(
    item => item.id === 'paymentStatement',
  ),
  false,
)
assert.equal(
  filterListedDocumentConsentItems(allListed, { isRemoteSession: true, isInstructor: false }).length,
  allListed.length - 1,
)

console.log('consent-visibility.selfcheck: ok')
