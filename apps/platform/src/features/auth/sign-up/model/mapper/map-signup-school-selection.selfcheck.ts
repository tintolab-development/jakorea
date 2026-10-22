/**
 * Run: node --experimental-strip-types --experimental-transform-types src/features/auth/sign-up/model/mapper/map-signup-school-selection.selfcheck.ts
 *
 * 검색 결과 → SelectedSchool → resolveSignupSchoolAttachment
 * (`mapSignUpToGeneralRequest` / `mapSignUpToTeacherRequest`가 동일 함수로 schoolSelection을 붙인다)
 */
import assert from 'node:assert/strict'
import type { CareerNetUniversityItem } from '@jakorea/location/career-net'
import { resolveSignupSchoolAttachment } from '../../lib/signup-school-attachment.ts'
import { hasValidSchoolReference } from '../../lib/profile/profile.logic.ts'
import { mapSearchResultToSelectedSchool } from '../../ui/school-search-modal/map-selected-school.ts'

function careerNetUniversity(overrides: Partial<CareerNetUniversityItem> = {}): CareerNetUniversityItem {
  return {
    seq: '334455',
    schoolName: '한국전문대학교',
    schoolGubun: '전문대학',
    schoolType: '전문대학',
    estType: '사립',
    region: '경기',
    address: '경기도 성남시',
    campusName: '',
    link: '',
    collegeInfoUrl: '',
    ...overrides,
  }
}

const selected = mapSearchResultToSelectedSchool({
  source: 'careerNet',
  item: careerNetUniversity(),
})
assert.ok(selected)
assert.equal(selected.neisCode, '334455')

const careerNetAttached = resolveSignupSchoolAttachment({
  schoolName: selected.name,
  schoolNeisCode: selected.neisCode,
  schoolAddress: selected.address,
  source: selected.source,
})

assert.equal(careerNetAttached.schoolOrganizationId, undefined)
assert.equal(careerNetAttached.schoolSelection?.provider, 'CAREER_NET')
assert.equal(careerNetAttached.schoolSelection?.externalSchoolCode, '334455')
assert.equal(careerNetAttached.schoolSelection?.name, '한국전문대학교')

assert.equal(
  hasValidSchoolReference({ schoolOrganizationId: null, schoolNeisCode: selected.neisCode }),
  true,
)
assert.equal(hasValidSchoolReference({ schoolOrganizationId: 42, schoolNeisCode: null }), true)
assert.equal(hasValidSchoolReference({ schoolOrganizationId: null, schoolNeisCode: '  ' }), false)

const cmsSchoolAttached = resolveSignupSchoolAttachment({
  schoolName: '기존 CMS 학교',
  schoolOrganizationId: 1001,
})
assert.equal(cmsSchoolAttached.schoolOrganizationId, 1001)
assert.equal(cmsSchoolAttached.schoolSelection, undefined)

const missingSeq = mapSearchResultToSelectedSchool({
  source: 'careerNet',
  item: careerNetUniversity({ seq: '' }),
})
assert.equal(missingSeq, null)
assert.equal(
  resolveSignupSchoolAttachment({
    schoolName: '코드없는대학',
    source: 'careerNet',
  }).schoolSelection,
  undefined,
)

console.log('map-signup-school-selection.selfcheck: ok')
