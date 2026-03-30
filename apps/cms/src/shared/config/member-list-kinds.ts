/**
 * 관리자 회원 목록 통합 라우트 `/users/list` 쿼리 `kind` 값
 */
export const MEMBER_LIST_KINDS = ['all', 'institutions', 'instructors', 'admins'] as const
export type MemberListKind = (typeof MEMBER_LIST_KINDS)[number]

export const DEFAULT_MEMBER_LIST_KIND: MemberListKind = 'all'

export function isMemberListKind(v: string): v is MemberListKind {
  return (MEMBER_LIST_KINDS as readonly string[]).includes(v)
}

export function memberListHref(kind: MemberListKind): string {
  return `/users/list?kind=${kind}`
}
