import { describe, expect, it } from 'vitest'
import type { User } from '@/types/user'
import { getRedirectPathByRole, resolveLoginRedirectTarget } from './auth-redirect'

type SessionUser = Omit<User, 'password'>

function makeUser(role: User['role'], extra: Partial<SessionUser> = {}): SessionUser {
  return { id: 'u-1', email: 'qa@example.com', name: 'QA', role, ...extra } as SessionUser
}

describe('resolveLoginRedirectTarget', () => {
  const settlementLink =
    '/settlement-management/payment-orders?po_exp=instructor&po_inst=%EA%B9%80%EC%84%B1%EC%9E%AC'

  it('관리자는 접근 가능한 딥링크로 쿼리까지 그대로 돌아간다', () => {
    expect(resolveLoginRedirectTarget(settlementLink, makeUser('ADMIN'))).toBe(settlementLink)
  })

  it('redirect가 없으면 역할별 기본 경로로 보낸다', () => {
    const instructor = makeUser('INSTRUCTOR')
    expect(resolveLoginRedirectTarget(undefined, instructor)).toBe(
      getRedirectPathByRole(instructor)
    )
  })

  it('외부 URL이면 역할별 기본 경로로 보낸다', () => {
    expect(resolveLoginRedirectTarget('//evil.com', makeUser('ADMIN'))).toBe('/')
    expect(resolveLoginRedirectTarget('https://evil.com', makeUser('ADMIN'))).toBe('/')
  })

  it('로그인 화면으로 되돌아가는 redirect는 무시한다', () => {
    expect(resolveLoginRedirectTarget('/login', makeUser('ADMIN'))).toBe('/')
  })

  it('역할상 접근할 수 없는 경로면 역할별 기본 경로로 보낸다', () => {
    expect(resolveLoginRedirectTarget('/logs/security', makeUser('INSTRUCTOR'))).toBe(
      '/instructor/schedule'
    )
    expect(resolveLoginRedirectTarget('/data-management', makeUser('SCHOOL'))).toBe(
      '/school/my-learning'
    )
  })

  it('역할에 맞는 경로는 그대로 돌아간다', () => {
    expect(
      resolveLoginRedirectTarget('/instructor/schedule?month=2026-11', makeUser('INSTRUCTOR'))
    ).toBe('/instructor/schedule?month=2026-11')
  })

  it('사용자 정보가 없으면 로그인 경로(기존 기본값)를 반환한다', () => {
    expect(resolveLoginRedirectTarget(settlementLink, null)).toBe('/login')
  })
})
