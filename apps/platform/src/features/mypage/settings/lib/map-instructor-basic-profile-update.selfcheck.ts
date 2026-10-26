/**
 * 강사 회원정보 설정 — 기본 정보 저장 PATCH 매핑 검증 (교사 겸 강사 dual 분기 중심).
 */
import assert from 'node:assert/strict'
import { INITIAL_INSTRUCTOR_SHARED_PROFILE_VALUES } from '@jakorea/domain/instructor/profile-form-values'
import { mapInstructorBasicSettingsToPortalProfileUpdate } from './map-instructor-basic-profile-update.ts'

const baseValues = {
  ...INITIAL_INSTRUCTOR_SHARED_PROFILE_VALUES,
  name: '홍길동',
  homeAddress: '서울시 중구',
  homeAddressDetail: '101호',
  memberType: 'general' as const,
  schoolName: '서울중학교',
}

const selectedSchool = {
  name: '서울중학교',
  organizationId: 123,
  neisCode: '7010001',
  educationOfficeCode: 'B10',
  source: 'neis' as const,
}

// 1) dual + 재직(ACTIVE) + 새 학교(id) → schoolOrganizationId·affiliation.organizationId 동일, 재직 현황 전송
{
  const body = mapInstructorBasicSettingsToPortalProfileUpdate(
    { ...baseValues, employmentStatus: 'ACTIVE' },
    undefined,
    { dualTeacher: { selectedSchool } },
  )
  assert.equal(body.schoolOrganizationId, 123)
  assert.equal(body.instructorProfile?.profile?.affiliation.organizationId, 123)
  assert.equal(body.teacherEmploymentStatus, 'ACTIVE')
  assert.equal(body.instructorProfile?.profile?.affiliation.employmentStatus, 'ACTIVE')
  assert.equal(body.schoolName, '서울중학교')
  assert.equal('memberType' in (body.instructorProfile?.profile ?? {}), false)
  assert.equal('schoolSelection' in body, false)
}

// 2) dual + 휴직(ON_LEAVE) → teacherEmploymentStatus ON_LEAVE, JSON은 LEAVE
{
  const body = mapInstructorBasicSettingsToPortalProfileUpdate(
    { ...baseValues, employmentStatus: 'ON_LEAVE' },
    undefined,
    { dualTeacher: { selectedSchool } },
  )
  assert.equal(body.teacherEmploymentStatus, 'ON_LEAVE')
  assert.equal(body.instructorProfile?.profile?.affiliation.employmentStatus, 'LEAVE')
}

// 3) dual + BE 비허용 재직 현황(전근·퇴직·빈값) → 두 키 모두 생략
for (const employmentStatus of ['TRANSFERRED', 'WITHDRAWN', ''] as const) {
  const body = mapInstructorBasicSettingsToPortalProfileUpdate(
    { ...baseValues, employmentStatus },
    undefined,
    { dualTeacher: { selectedSchool } },
  )
  assert.equal('teacherEmploymentStatus' in body, false, employmentStatus)
  assert.equal(
    'employmentStatus' in (body.instructorProfile?.profile?.affiliation ?? {}),
    false,
    employmentStatus,
  )
  assert.equal(body.schoolOrganizationId, 123)
}

// 4) dual + 학교 미변경 → 학교 id 키 없음 (BE가 기존 teacher_profile 유지)
{
  const body = mapInstructorBasicSettingsToPortalProfileUpdate(
    { ...baseValues, employmentStatus: 'ACTIVE' },
    undefined,
    { dualTeacher: { selectedSchool: null } },
  )
  assert.equal('schoolOrganizationId' in body, false)
  assert.equal('schoolSelection' in body, false)
  assert.equal('organizationId' in (body.instructorProfile?.profile?.affiliation ?? {}), false)
  assert.equal(body.teacherEmploymentStatus, 'ACTIVE')
}

// 5) dual이 아닌 강사(일반) → 기존 동작 유지 (학교/재직 키 없음)
{
  const body = mapInstructorBasicSettingsToPortalProfileUpdate(
    { ...baseValues, employmentStatus: 'TRANSFERRED', affiliationName: 'JA Korea' },
  )
  assert.equal(body.affiliationName, 'JA Korea')
  assert.equal('teacherEmploymentStatus' in body, false)
  assert.equal('schoolOrganizationId' in body, false)
}

console.log('map-instructor-basic-profile-update selfcheck: ok')
