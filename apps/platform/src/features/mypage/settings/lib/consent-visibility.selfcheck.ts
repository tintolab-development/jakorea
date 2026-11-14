import assert from 'node:assert/strict'
import {
  filterBasicConsentItemsByAudience,
  ensureApplyGateRequiredDocumentConsentItems,
  filterListedDocumentConsentItems,
  parseApplyGateRequiredConsentItemIds,
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

// 신청 게이트에서 넘어온 빠진 항목 — 비강사·작성 전(listed 아님)이어도 카드 노출
const gateRequired = parseApplyGateRequiredConsentItemIds(
  ' facilitator_pledge,CRIMINAL_HISTORY_CHECK_CONSENT,UNKNOWN ',
)
assert.deepEqual([...gateRequired].sort(), ['educatorPledge', 'sexOffenseCheck'])
const unlisted = DOCUMENT_CONSENT_ITEMS.map(item => ({ ...item, listed: false }))
assert.deepEqual(
  filterListedDocumentConsentItems(unlisted, {
    isRemoteSession: true,
    isInstructor: false,
    requiredIds: gateRequired,
  })
    .map(item => item.id)
    .sort(),
  ['educatorPledge', 'sexOffenseCheck'],
)
assert.equal(
  filterListedDocumentConsentItems(unlisted, { isRemoteSession: true, isInstructor: false }).length,
  0,
)
assert.deepEqual(
  ensureApplyGateRequiredDocumentConsentItems([], gateRequired)
    .map(item => item.id)
    .sort(),
  ['educatorPledge', 'sexOffenseCheck'],
)

console.log('consent-visibility.selfcheck: ok')
