import type { PlatformMemberProfile } from '../model/types'

export function showInstructorApplyCta(profile: PlatformMemberProfile) {
  return profile === 'individual' || profile === 'school_teacher'
}

export function isGeneralMypageReady(profile: PlatformMemberProfile) {
  return profile === 'individual'
}

export function getMypageProfileLabel(profile: PlatformMemberProfile) {
  switch (profile) {
    case 'individual':
      return '일반회원'
    case 'school_teacher':
      return '교사회원'
    case 'instructor_only':
      return '강사회원'
    case 'instructor_dual':
      return '교사+강사회원'
  }
}
