import assert from 'node:assert/strict'
import type { PortalProfileResponse } from '@/features/auth/sign-in'
import { mapPortalMemberToPlatformProfile } from './map-portal-member-profile.ts'

assert.equal(
  mapPortalMemberToPlatformProfile({
    me: { memberType: 'GENERAL', teacher: false },
    profile: { teacher: false, instructor: false },
  }),
  'individual',
)

assert.equal(
  mapPortalMemberToPlatformProfile({
    me: { memberType: 'TEACHER', teacher: true },
    profile: { teacher: true, instructor: false },
  }),
  'school_teacher',
)

assert.equal(
  mapPortalMemberToPlatformProfile({
    me: { memberType: 'GENERAL', teacher: false },
    profile: { teacher: false, instructor: true },
  }),
  'instructor_only',
)

assert.equal(
  mapPortalMemberToPlatformProfile({
    me: { memberType: 'TEACHER', teacher: true },
    profile: { teacher: true, instructor: true },
  }),
  'instructor_dual',
)

/** me에 instructor 필드가 없어도 profile.instructor만으로 강사 판정 */
assert.equal(
  mapPortalMemberToPlatformProfile({
    me: { memberType: 'GENERAL' },
    profile: { instructor: true },
  }),
  'instructor_only',
)

/** 교사 겸직 강사: teacher boolean이 false여도 memberType=TEACHER와 instructor 신호를 함께 본다 */
assert.equal(
  mapPortalMemberToPlatformProfile({
    me: { memberType: 'TEACHER', teacher: false, instructor: true },
    profile: { memberType: 'TEACHER', teacher: false, instructor: true },
  }),
  'instructor_dual',
)

/** 강사 프로필 자체가 SCHOOL_TEACHER이면 교사 겸직 강사로 본다 */
assert.equal(
  mapPortalMemberToPlatformProfile({
    me: { memberType: 'GENERAL', teacher: false },
    profile: {
      teacher: false,
      instructor: true,
      instructorProfile: { profile: { memberType: 'SCHOOL_TEACHER' } },
    } as PortalProfileResponse,
  }),
  'instructor_dual',
)

/** 교사: profile.teacher 또는 me.memberType=TEACHER */
assert.equal(
  mapPortalMemberToPlatformProfile({
    me: { memberType: 'TEACHER' },
    profile: null,
  }),
  'school_teacher',
)

console.log('map-portal-member-profile.selfcheck: ok')
