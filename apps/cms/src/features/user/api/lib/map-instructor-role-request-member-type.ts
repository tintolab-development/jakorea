import type { MemberPermissionApplicationRow } from '@/types/member-permission-application'

type MemberCategory = MemberPermissionApplicationRow['memberCategory']

/**
 * 강사 권한승인 목록 `memberTypeLabel` → UI `memberCategory`
 * BE 실측: `"개인"` | `"학교/기관"` → 표시는 `개인` | `학교(교사)`
 */
export function mapInstructorRoleRequestMemberTypeLabel(
  memberTypeLabel: string | undefined
): MemberCategory {
  const raw = memberTypeLabel?.trim() ?? ''
  if (!raw) return 'INDIVIDUAL'

  const key = raw.toUpperCase().replace(/-/g, '_').replace(/\s+/g, '')

  if (
    raw === '학교/기관' ||
    raw === '학교(교사)' ||
    raw === '교사 회원' ||
    key === 'SCHOOL' ||
    key === 'SCHOOL_TEACHER'
  ) {
    return 'SCHOOL'
  }

  if (raw === '강사' || key === 'INSTRUCTOR') {
    return 'INSTRUCTOR'
  }

  if (raw === '관리자' || key === 'ADMIN') {
    return 'ADMIN'
  }

  // `"개인"` · `GENERAL` · `일반 회원` 등
  if (
    raw === '개인' ||
    raw === '일반' ||
    raw === '일반 회원' ||
    key === 'INDIVIDUAL' ||
    key === 'GENERAL'
  ) {
    return 'INDIVIDUAL'
  }

  return 'INDIVIDUAL'
}
