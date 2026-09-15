import assert from 'node:assert/strict'

type PlatformMemberProfile =
  | 'individual'
  | 'school_teacher'
  | 'instructor_only'
  | 'instructor_dual'

function isSchoolTeacherMypageProfile(profile: PlatformMemberProfile) {
  return profile === 'school_teacher'
}

function showTeacherAssignment(
  profile: PlatformMemberProfile,
  hasAssignment: boolean,
): boolean {
  return isSchoolTeacherMypageProfile(profile) && hasAssignment
}

assert.equal(showTeacherAssignment('school_teacher', true), true)
assert.equal(showTeacherAssignment('school_teacher', false), false)
assert.equal(showTeacherAssignment('individual', true), false)
assert.equal(showTeacherAssignment('instructor_only', true), false)
assert.equal(showTeacherAssignment('instructor_dual', true), false)

console.log('teacher-assignment-visibility.selfcheck: ok')
