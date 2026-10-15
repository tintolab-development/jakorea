import assert from 'node:assert/strict'
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

/** 교사: profile.teacher 또는 me.memberType=TEACHER */
assert.equal(
  mapPortalMemberToPlatformProfile({
    me: { memberType: 'TEACHER' },
    profile: null,
  }),
  'school_teacher',
)

console.log('map-portal-member-profile.selfcheck: ok')
