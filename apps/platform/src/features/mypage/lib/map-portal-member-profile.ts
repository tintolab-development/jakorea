import type { HomepageMeResponse, PortalProfileResponse } from '@/features/auth/sign-in'
import type { PlatformMemberProfile } from '../model/types'

/** API 회원 플래그 → 마이페이지 PlatformMemberProfile */
export function mapPortalMemberToPlatformProfile(input: {
  me?: HomepageMeResponse | null
  profile?: PortalProfileResponse | null
}): PlatformMemberProfile {
  const memberType = (input.profile?.memberType ?? input.me?.memberType)?.trim().toUpperCase()
  const instructorMemberType = input.profile?.instructorProfile?.profile?.memberType
    ?.trim()
    .toUpperCase()
  const teacher =
    input.profile?.teacher === true ||
    input.me?.teacher === true ||
    memberType === 'TEACHER' ||
    instructorMemberType === 'SCHOOL_TEACHER'
  const instructor = input.profile?.instructor === true || input.me?.instructor === true

  if (teacher && instructor) return 'instructor_dual'
  if (instructor) return 'instructor_only'
  if (teacher) return 'school_teacher'
  return 'individual'
}

export function resolvePortalDisplayName(input: {
  me?: HomepageMeResponse | null
  profile?: PortalProfileResponse | null
  fallback: string
}) {
  const name = input.profile?.name?.trim() || input.me?.name?.trim()
  return name || input.fallback
}
