import type { User } from '@/types/user'
import { resolveInstructorMemberProfile } from '@/entities/user/lib/resolve-instructor-member-profile'
import { isInstructorPermissionRevoked } from '@/features/user/shared/lib/member-list-display'

/**
 * 강사 권한 박탈 후 CMS User 스냅샷.
 * - 순수 강사 → 개인(INDIVIDUAL), 전체 회원 목록
 * - 교사·겸직 → 일반 교사(school_teacher) 상세, 강사 목록 제외
 * - 회원 유형 라벨은 `instructorApprovalStatus: REVOKED` → 강사(권한박탈)
 */
export function applyInstructorPermissionRevokedToUser(
  user: Omit<User, 'password'>
): Omit<User, 'password'> {
  const profile = resolveInstructorMemberProfile(user)
  const keepAsTeacher = profile === 'school_teacher' || profile === 'instructor_dual'

  if (keepAsTeacher) {
    return {
      ...user,
      role: 'INSTRUCTOR',
      instructorMemberProfile: 'school_teacher',
      instructorInfo: undefined,
      instructorApprovalStatus: 'REVOKED',
    }
  }

  return {
    ...user,
    role: 'INDIVIDUAL',
    instructorMemberProfile: undefined,
    instructorInfo: undefined,
    instructorApprovalStatus: 'REVOKED',
  }
}

/** API/목록 매핑 후 — REVOKED(또는 세션 오버레이)면 목록·상세용 role/profile 정리 */
export function normalizeRevokedInstructorUser<T extends Omit<User, 'password'>>(user: T): T {
  if (!isInstructorPermissionRevoked(user)) return user
  return applyInstructorPermissionRevokedToUser({
    ...user,
    instructorApprovalStatus: 'REVOKED',
  }) as T
}
