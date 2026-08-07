/**
 * 회원 로그인 이력
 */

export type MemberLoginAudience = 'admin' | 'user'

export type MemberLoginLog = {
  id: string
  audience: MemberLoginAudience
  name: string
  loginId: string
  loggedAt: string
  ip: string
}

export type MemberLoginListFilter = {
  audience: MemberLoginAudience
  name?: string
  loginId?: string
  from?: string | null
  to?: string | null
}

export type MemberLoginListResult = {
  rows: MemberLoginLog[]
  total: number
}
