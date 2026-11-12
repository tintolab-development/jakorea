/**
 * 교사 회원정보 설정 — 학교 저장 PATCH 매핑 검증.
 */
import assert from 'node:assert/strict'
import type { SettingsTeacherEditFormValues } from './map-edit'
import { mapTeacherSettingsEditToPortalProfileUpdate } from './map-teacher-profile-update.ts'

const base: SettingsTeacherEditFormValues = {
  schoolName: '서울공항초등학교',
  schoolOrganizationId: 190112,
  schoolAddress: '',
  schoolNeisCode: '',
  schoolEducationOfficeCode: '',
  employmentStatus: 'ACTIVE',
}

// CMS 학교(organizationId 있음) — schoolOrganizationId만, schoolSelection 없음
const cms = mapTeacherSettingsEditToPortalProfileUpdate(base)
assert.equal(cms.schoolOrganizationId, 190112)
assert.equal(cms.schoolSelection, undefined)
// 강사가 아닌 교사는 affiliationName 전송 금지(BE PORTAL_TEACHER_PROFILE_FIELD_NOT_EDITABLE)
assert.equal('affiliationName' in cms, false)

// 휴직 상태도 그대로 전달
const onLeave = mapTeacherSettingsEditToPortalProfileUpdate({ ...base, employmentStatus: 'ON_LEAVE' })
assert.equal(onLeave.teacherEmploymentStatus, 'ON_LEAVE')

// NEIS 검색으로 새로 고름 — schoolSelection만, schoolOrganizationId 없음
const neis = mapTeacherSettingsEditToPortalProfileUpdate({
  ...base,
  schoolName: '고양고등학교',
  schoolOrganizationId: null,
  schoolNeisCode: '7530576',
  schoolEducationOfficeCode: 'J10',
  schoolAddress: '경기도 고양시 덕양구 삼송로 171',
  schoolSource: 'neis',
})
assert.equal('schoolOrganizationId' in neis, false)
assert.equal(neis.schoolSelection?.provider, 'NEIS')
assert.equal(neis.schoolSelection?.externalSchoolCode, '7530576')
assert.equal(neis.schoolSelection?.educationOfficeCode, 'J10')
assert.equal(neis.schoolSelection?.name, neis.schoolName)

// 학교를 바꾸지 않은 저장 + 기존 학교에 CMS id 없음 — 학교 코드 없는 schoolSelection을 보내지 않음
const unchangedWithoutId = mapTeacherSettingsEditToPortalProfileUpdate({
  ...base,
  schoolOrganizationId: null,
})
assert.equal('schoolOrganizationId' in unchangedWithoutId, false)
assert.equal('schoolSelection' in unchangedWithoutId, false)
assert.equal(unchangedWithoutId.schoolName, '서울공항초등학교')

console.log('map-teacher-profile-update selfcheck ok')
