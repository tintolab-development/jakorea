import type { User } from '@/types/user'
import {
  inferInstructorMemberProfileFromRoles,
  memberRolesWithInstructorRevoked,
} from '@/features/user/api/map-member-role'
import { resolveInstructorMemberProfile } from '@/entities/user/lib/resolve-instructor-member-profile'
import { isInstructorPermissionRevoked } from '@/features/user/shared/lib/member-list-display'

/**
 * 강사 권한 박탈 후 CMS User 스냅샷.
 * 상세 유형(강사/겸직)은 유지하고 `INSTRUCTOR` → `INSTRUCTOR_REVOKED`.
 * 강사 목록에서는 제외되고 전체 회원 목록에만 남는다.
 */
export function applyInstructorPermissionRevokedToUser(
  user: Omit<User, 'password'>
): Omit<User, 'password'> {
  const roles = memberRolesWithInstructorRevoked(user.roles) ?? user.roles
  const profile =
    inferInstructorMemberProfileFromRoles(roles) ??
    resolveInstructorMemberProfile({ ...user, roles }) ??
    user.instructorMemberProfile ??
    'instructor_only'

  return {
    ...user,
    role: 'INSTRUCTOR',
    ...(roles ? { roles } : {}),
    instructorMemberProfile: profile,
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
