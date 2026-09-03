import { describe, expect, it } from 'vitest'
import {
  isCmsInstructorFeeJaRestrictedEditTarget,
  shouldShowAdminRegisteredSchoolDetailCaption,
  shouldShowCmsBasicProfileFieldsEdit,
  shouldShowCmsMemberInfoEditButton,
  shouldShowCmsMemberInfoEditButtonOrInstructorRestricted,
  shouldShowCmsSchoolInfoEditButton,
} from './admin-provisioned-member-policy'

describe('shouldShowCmsMemberInfoEditButton', () => {
  it('is true for admin-provisioned before identity completion', () => {
    expect(
      shouldShowCmsMemberInfoEditButton({
        registeredByAdmin: true,
        identitySelfSignupCompletedAfterAdminRegistration: false,
      })
    ).toBe(true)
  })

  it('is false after identity completion', () => {
    expect(
      shouldShowCmsMemberInfoEditButton({
        registeredByAdmin: true,
        identitySelfSignupCompletedAfterAdminRegistration: true,
      })
    ).toBe(false)
  })
})

describe('isCmsInstructorFeeJaRestrictedEditTarget', () => {
  it('allows instructor_only after admin-provisioned identity completion', () => {
    expect(
      isCmsInstructorFeeJaRestrictedEditTarget({
        role: 'INSTRUCTOR',
        instructorMemberProfile: 'instructor_only',
        registeredByAdmin: true,
        identitySelfSignupCompletedAfterAdminRegistration: true,
      })
    ).toBe(true)
  })

  it('allows instructor_dual with the same restricted edit rule', () => {
    expect(
      isCmsInstructorFeeJaRestrictedEditTarget({
        role: 'INSTRUCTOR',
        instructorMemberProfile: 'instructor_dual',
        registeredByAdmin: true,
        identitySelfSignupCompletedAfterAdminRegistration: true,
      })
    ).toBe(true)
  })

  it('excludes school_teacher (basic + consent only on teacher detail)', () => {
    expect(
      isCmsInstructorFeeJaRestrictedEditTarget({
        role: 'INSTRUCTOR',
        instructorMemberProfile: 'school_teacher',
        registeredByAdmin: true,
        identitySelfSignupCompletedAfterAdminRegistration: true,
      })
    ).toBe(false)
  })

  it('is false before identity completion (full edit applies instead)', () => {
    expect(
      isCmsInstructorFeeJaRestrictedEditTarget({
        role: 'INSTRUCTOR',
        instructorMemberProfile: 'instructor_only',
        registeredByAdmin: true,
        identitySelfSignupCompletedAfterAdminRegistration: false,
      })
    ).toBe(false)
  })

  it('is false for non-instructor roles', () => {
    expect(
      isCmsInstructorFeeJaRestrictedEditTarget({
        role: 'INDIVIDUAL',
        registeredByAdmin: true,
        identitySelfSignupCompletedAfterAdminRegistration: true,
      })
    ).toBe(false)
  })
})

describe('shouldShowCmsMemberInfoEditButtonOrInstructorRestricted', () => {
  it('shows edit for unverified admin-provisioned individual', () => {
    expect(
      shouldShowCmsMemberInfoEditButtonOrInstructorRestricted({
        role: 'INDIVIDUAL',
        registeredByAdmin: true,
        identitySelfSignupCompletedAfterAdminRegistration: false,
      })
    ).toBe(true)
  })

  it('hides edit for verified admin-provisioned individual', () => {
    expect(
      shouldShowCmsMemberInfoEditButtonOrInstructorRestricted({
        role: 'INDIVIDUAL',
        registeredByAdmin: true,
        identitySelfSignupCompletedAfterAdminRegistration: true,
      })
    ).toBe(false)
  })

  it('shows edit for verified admin-provisioned instructor', () => {
    expect(
      shouldShowCmsMemberInfoEditButtonOrInstructorRestricted({
        role: 'INSTRUCTOR',
        instructorMemberProfile: 'instructor_only',
        registeredByAdmin: true,
        identitySelfSignupCompletedAfterAdminRegistration: true,
      })
    ).toBe(true)
  })

  it('hides restricted edit for verified admin-provisioned school teacher', () => {
    expect(
      shouldShowCmsMemberInfoEditButtonOrInstructorRestricted({
        role: 'INSTRUCTOR',
        instructorMemberProfile: 'school_teacher',
        registeredByAdmin: true,
        identitySelfSignupCompletedAfterAdminRegistration: true,
      })
    ).toBe(false)
  })

  it('hides edit for admin-provisioned school teacher before identity completion', () => {
    expect(
      shouldShowCmsMemberInfoEditButtonOrInstructorRestricted({
        role: 'INSTRUCTOR',
        instructorMemberProfile: 'school_teacher',
        registeredByAdmin: true,
        identitySelfSignupCompletedAfterAdminRegistration: false,
      })
    ).toBe(false)
  })

  it('shows edit for admin-provisioned school without affiliated teachers', () => {
    expect(
      shouldShowCmsMemberInfoEditButtonOrInstructorRestricted({
        role: 'SCHOOL',
        registeredByAdmin: true,
        identitySelfSignupCompletedAfterAdminRegistration: false,
        schoolInfo: { affiliatedTeachers: [] },
      })
    ).toBe(true)
  })

  it('hides edit for admin-provisioned school after affiliated teachers exist', () => {
    expect(
      shouldShowCmsMemberInfoEditButtonOrInstructorRestricted({
        role: 'SCHOOL',
        registeredByAdmin: true,
        identitySelfSignupCompletedAfterAdminRegistration: false,
        schoolInfo: {
          affiliatedTeachers: [{ linkedUserId: 'teacher-1' }],
        },
      })
    ).toBe(false)
  })
})

describe('shouldShowCmsSchoolInfoEditButton', () => {
  it('is true for admin-provisioned school without teachers', () => {
    expect(
      shouldShowCmsSchoolInfoEditButton({
        role: 'SCHOOL',
        registeredByAdmin: true,
        identitySelfSignupCompletedAfterAdminRegistration: false,
        schoolInfo: { affiliatedTeachers: [] },
      })
    ).toBe(true)
  })

  it('is false when affiliated teachers exist', () => {
    expect(
      shouldShowCmsSchoolInfoEditButton({
        role: 'SCHOOL',
        registeredByAdmin: true,
        identitySelfSignupCompletedAfterAdminRegistration: false,
        schoolInfo: {
          affiliatedTeachers: [{ linkedUserId: 't-1' }],
        },
      })
    ).toBe(false)
  })

  it('is false for non-school roles', () => {
    expect(
      shouldShowCmsSchoolInfoEditButton({
        role: 'INDIVIDUAL',
        registeredByAdmin: true,
        identitySelfSignupCompletedAfterAdminRegistration: false,
      })
    ).toBe(false)
  })
})

describe('shouldShowCmsBasicProfileFieldsEdit', () => {
  it('delegates to school info edit for SCHOOL role', () => {
    expect(
      shouldShowCmsBasicProfileFieldsEdit({
        role: 'SCHOOL',
        registeredByAdmin: true,
        identitySelfSignupCompletedAfterAdminRegistration: false,
        schoolInfo: { affiliatedTeachers: [] },
      })
    ).toBe(true)
  })
})

describe('shouldShowAdminRegisteredSchoolDetailCaption', () => {
  it('shows caption for admin-provisioned school without linked teachers', () => {
    expect(
      shouldShowAdminRegisteredSchoolDetailCaption({
        role: 'SCHOOL',
        registeredByAdmin: true,
        identitySelfSignupCompletedAfterAdminRegistration: false,
        schoolInfo: { affiliatedTeachers: [] },
      })
    ).toBe(true)
  })

  it('hides caption when a teacher has linkedUserId', () => {
    expect(
      shouldShowAdminRegisteredSchoolDetailCaption({
        role: 'SCHOOL',
        registeredByAdmin: true,
        identitySelfSignupCompletedAfterAdminRegistration: false,
        schoolInfo: {
          affiliatedTeachers: [{ linkedUserId: 'teacher-uuid' }],
        },
      })
    ).toBe(false)
  })
})
