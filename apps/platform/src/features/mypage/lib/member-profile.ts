import type { PlatformMemberProfile } from '../model/types'

export function showInstructorApplyCta(profile: PlatformMemberProfile) {
  return profile === 'individual' || profile === 'school_teacher'
}

export function isInstructorMypageProfile(profile: PlatformMemberProfile) {
  return profile === 'instructor_only' || profile === 'instructor_dual'
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

export function resolveEmploymentStatusLabel(status: string | undefined): string | undefined {
  const normalized = status?.trim().toUpperCase()
  if (!normalized) return undefined
  if (normalized === 'ACTIVE' || normalized === 'EMPLOYED') return '재직중'
  if (normalized === 'ON_LEAVE' || normalized === 'LEAVE') return '휴직'
  if (normalized === 'TRANSFERRED' || normalized === 'TRANSFER') return '전근'
  if (normalized === 'WITHDRAWN' || normalized === 'RESIGNED') return '탈퇴'
  return undefined
}

export function resolveAffiliationLabel(input: {
  schoolName?: string
  affiliationName?: string
}): string | undefined {
  const school = input.schoolName?.trim()
  if (school) return school
  const affiliation = input.affiliationName?.trim()
  return affiliation || undefined
}
