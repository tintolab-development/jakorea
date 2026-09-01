import type { PlatformMemberProfile } from '@/features/mypage'

const DEV_MEMBER_PROFILE_STORAGE_KEY = 'platform:dev:member-profile'

const VALID_PROFILES: PlatformMemberProfile[] = [
  'individual',
  'school_teacher',
  'instructor_only',
  'instructor_dual',
]

export function getDevMemberProfile(): PlatformMemberProfile {
  const stored = window.localStorage.getItem(DEV_MEMBER_PROFILE_STORAGE_KEY)

  if (stored && VALID_PROFILES.includes(stored as PlatformMemberProfile)) {
    return stored as PlatformMemberProfile
  }

  return 'individual'
}

export function setDevMemberProfile(profile: PlatformMemberProfile) {
  window.localStorage.setItem(DEV_MEMBER_PROFILE_STORAGE_KEY, profile)
}

export const DEV_MEMBER_PROFILE_OPTIONS: { value: PlatformMemberProfile; label: string }[] = [
  { value: 'individual', label: '일반회원' },
  { value: 'school_teacher', label: '교사회원' },
  { value: 'instructor_only', label: '강사회원' },
  { value: 'instructor_dual', label: '교사+강사' },
]
