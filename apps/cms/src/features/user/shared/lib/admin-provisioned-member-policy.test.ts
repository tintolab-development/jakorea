import { describe, expect, it } from 'vitest'
import {
  isCmsInstructorFeeJaRestrictedEditTarget,
  shouldShowCmsMemberInfoEditButton,
  shouldShowCmsMemberInfoEditButtonOrInstructorRestricted,
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
})
