import assert from 'node:assert/strict'
import {
  resolveAssignedInstructorCardBody,
  resolveAssignedInstructorQueryView,
  shouldMountTeacherEducationAssignmentAside,
  shouldShowTeacherAssignmentAside,
} from '../../lib/teacher-assignment-aside.ts'

assert.equal(
  shouldMountTeacherEducationAssignmentAside({
    isTeacher: true,
    applicationType: 'ORGANIZATION',
    hasTeacherAssignment: false,
  }),
  true,
)
assert.equal(
  shouldMountTeacherEducationAssignmentAside({
    isTeacher: true,
    applicationType: 'INDIVIDUAL',
    hasTeacherAssignment: false,
  }),
  true,
)
assert.equal(
  shouldMountTeacherEducationAssignmentAside({
    isTeacher: true,
    applicationType: 'VOLUNTEER',
    hasTeacherAssignment: false,
  }),
  false,
)
assert.equal(
  shouldMountTeacherEducationAssignmentAside({
    isTeacher: false,
    applicationType: 'ORGANIZATION',
    hasTeacherAssignment: true,
  }),
  false,
)
assert.equal(
  shouldMountTeacherEducationAssignmentAside({
    isTeacher: true,
    applicationType: 'ORGANIZATION',
    hasTeacherAssignment: true,
    displayStatus: 'rejected',
  }),
  false,
)
assert.equal(
  shouldMountTeacherEducationAssignmentAside({
    isTeacher: true,
    applicationType: 'ORGANIZATION',
    hasTeacherAssignment: true,
    displayStatus: 'waiting_result',
  }),
  false,
)
assert.equal(
  shouldMountTeacherEducationAssignmentAside({
    isTeacher: true,
    applicationType: 'ORGANIZATION',
    hasTeacherAssignment: true,
    displayStatus: 'in_progress',
  }),
  true,
)

assert.equal(
  shouldShowTeacherAssignmentAside({
    hasTextbook: false,
    instructorView: resolveAssignedInstructorQueryView({
      enabled: true,
      isPending: true,
      isError: false,
      isSuccess: false,
      instructorCount: 0,
    }),
  }),
  true,
)
assert.equal(
  shouldShowTeacherAssignmentAside({
    hasTextbook: false,
    instructorView: resolveAssignedInstructorQueryView({
      enabled: true,
      isPending: false,
      isError: true,
      isSuccess: false,
      instructorCount: 0,
    }),
  }),
  true,
)
assert.equal(
  shouldShowTeacherAssignmentAside({
    hasTextbook: false,
    instructorView: resolveAssignedInstructorQueryView({
      enabled: true,
      isPending: false,
      isError: false,
      isSuccess: true,
      instructorCount: 0,
    }),
  }),
  false,
)
assert.equal(
  shouldShowTeacherAssignmentAside({
    hasTextbook: true,
    instructorView: resolveAssignedInstructorQueryView({
      enabled: true,
      isPending: false,
      isError: false,
      isSuccess: true,
      instructorCount: 0,
    }),
  }),
  true,
)
assert.equal(
  shouldShowTeacherAssignmentAside({
    hasTextbook: false,
    instructorView: resolveAssignedInstructorQueryView({
      enabled: true,
      isPending: false,
      isError: false,
      isSuccess: true,
      instructorCount: 2,
    }),
  }),
  true,
)

assert.equal(resolveAssignedInstructorCardBody(undefined), 'consents')
assert.equal(resolveAssignedInstructorCardBody('ja_system'), 'consents')
assert.equal(resolveAssignedInstructorCardBody('site_direct'), 'site_direct')
assert.equal(resolveAssignedInstructorCardBody('site_online'), 'site_online')
assert.equal(resolveAssignedInstructorCardBody(null), 'name_only')

console.log('teacher-assignment-visibility.selfcheck: ok')
