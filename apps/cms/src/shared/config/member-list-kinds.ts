/**
 * 관리자 회원 목록 통합 라우트 `/users/list` 쿼리 `kind` 값
 * 메뉴·리다이렉트: all, individual, institutions, instructors, admins
 * 별칭: school→institutions, instructor→instructors, admin→admins
 */
import type { UserRole } from '@/types/user'

export const MEMBER_LIST_KINDS = [
  'all',
  'individual',
  'institutions',
  'instructors',
  'admins',
] as const
export type MemberListKind = (typeof MEMBER_LIST_KINDS)[number]

export const DEFAULT_MEMBER_LIST_KIND: MemberListKind = 'all'

/** kind 쿼리 별칭 → 정식 값 */
const KIND_ALIASES: Record<string, MemberListKind> = {
  school: 'institutions',
  institution: 'institutions',
  instructor: 'instructors',
  admin: 'admins',
}

export function isMemberListKind(v: string): v is MemberListKind {
  return (MEMBER_LIST_KINDS as readonly string[]).includes(v)
}

/** URL의 kind(및 별칭)를 정식 MemberListKind로 통일 */
export function normalizeMemberListKind(raw: string | null | undefined): MemberListKind {
  if (!raw) return DEFAULT_MEMBER_LIST_KIND
  const lower = raw.toLowerCase()
  if (isMemberListKind(lower)) return lower
  return KIND_ALIASES[lower] ?? DEFAULT_MEMBER_LIST_KIND
}

/** 목록 API·getUsersPage 필터용 role */
export function memberListKindToUserRole(kind: MemberListKind): UserRole | undefined {
  switch (kind) {
    case 'all':
      return undefined
    case 'individual':
      return 'INDIVIDUAL'
    case 'institutions':
      return 'SCHOOL'
    case 'instructors':
      return 'INSTRUCTOR'
    case 'admins':
      return 'ADMIN'
    default:
      return undefined
  }
}

export function memberListKindToPendingRole(kind: MemberListKind): UserRole | 'ALL' {
  switch (kind) {
    case 'all':
      return 'ALL'
    case 'individual':
      return 'INDIVIDUAL'
    case 'institutions':
      return 'SCHOOL'
    case 'instructors':
      return 'INSTRUCTOR'
    case 'admins':
      return 'ADMIN'
    default:
      return 'ALL'
  }
}

export function pendingRoleToMemberListKind(role: UserRole | 'ALL'): MemberListKind {
  if (role === 'ALL') return 'all'
  if (role === 'INDIVIDUAL') return 'individual'
  if (role === 'SCHOOL') return 'institutions'
  if (role === 'INSTRUCTOR') return 'instructors'
  if (role === 'ADMIN') return 'admins'
  return 'all'
}

/**
 * kind가 있으면 우선 적용(kind=all이면 role 쿼리로 개인만 등 세부 필터 가능).
 * kind 없으면 legacy `role` 쿼리 사용.
 */
export function resolveRoleFilterFromMemberListParams(params: {
  kind?: string
  role?: string
}): UserRole | undefined {
  const hasKind = params.kind !== undefined && params.kind !== ''
  if (hasKind) {
    const kind = normalizeMemberListKind(params.kind)
    if (kind !== 'all') {
      const r = memberListKindToUserRole(kind)
      if (r !== undefined) return r
    }
  }
  if (params.role && params.role !== 'ALL') {
    return params.role as UserRole
  }
  return undefined
}

/** 회원 상세 기본정보 `UserBasicInfoSection` 진입 분기 */
export function memberListKindToBasicInfoEntrySource(
  kind: MemberListKind
): 'all_users' | 'institution' | 'instructor' | 'admin' {
  switch (kind) {
    case 'institutions':
      return 'institution'
    case 'instructors':
      return 'instructor'
    case 'admins':
      return 'admin'
    default:
      return 'all_users'
  }
}

/** 클릭한 회원의 역할 → 기본정보 테이블 본문 (전체 회원 목록 등 혼합 리스트용) */
export function userRoleToBasicInfoEntrySource(
  role: UserRole
): 'all_users' | 'institution' | 'instructor' | 'admin' {
  switch (role) {
    case 'SCHOOL':
      return 'institution'
    case 'INSTRUCTOR':
      return 'instructor'
    case 'ADMIN':
      return 'admin'
    case 'INDIVIDUAL':
    default:
      return 'all_users'
  }
}

export function memberListHref(kind: MemberListKind): string {
  return `/users/list?kind=${kind}`
}

/** 회원 목록 페이지 상단 제목 */
export function memberListPageTitle(kind: MemberListKind): string {
  switch (kind) {
    case 'individual':
      return '개인 회원 목록'
    case 'institutions':
      return '학교(교사) 회원 목록'
    case 'instructors':
      return '강사 회원 목록'
    case 'admins':
      return '관리자 회원 목록'
    default:
      return '전체 회원 목록'
  }
}
