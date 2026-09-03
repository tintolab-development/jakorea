import { describe, expect, it } from 'vitest'
import { passwordChangeRequiredPaths } from '@/shared/utils/post-auth-redirect'
import { resolvePasswordChangeRequiredGuardPath } from './use-password-change-required-guard'

describe('resolvePasswordChangeRequiredGuardPath', () => {
  it('완료 플래그가 있으면 대시보드·로그인보다 완료 화면을 우선한다', () => {
    expect(
      resolvePasswordChangeRequiredGuardPath({
        complete: true,
        isAuthenticated: true,
        hasUser: true,
        passwordChangeRequired: false,
        dashboardPath: '/',
      })
    ).toBe(passwordChangeRequiredPaths.complete)

    expect(
      resolvePasswordChangeRequiredGuardPath({
        complete: true,
        isAuthenticated: false,
        hasUser: false,
        passwordChangeRequired: false,
        dashboardPath: '/',
      })
    ).toBe(passwordChangeRequiredPaths.complete)
  })

  it('미완료·미인증이면 로그인으로 보낸다', () => {
    expect(
      resolvePasswordChangeRequiredGuardPath({
        complete: false,
        isAuthenticated: false,
        hasUser: false,
        passwordChangeRequired: true,
        dashboardPath: '/',
      })
    ).toBe('/login')
  })

  it('온보딩이 끝났고 완료 화면이 아니면 대시보드로 보낸다', () => {
    expect(
      resolvePasswordChangeRequiredGuardPath({
        complete: false,
        isAuthenticated: true,
        hasUser: true,
        passwordChangeRequired: false,
        dashboardPath: '/',
      })
    ).toBe('/')
  })

  it('온보딩 중이면 이동하지 않는다', () => {
    expect(
      resolvePasswordChangeRequiredGuardPath({
        complete: false,
        isAuthenticated: true,
        hasUser: true,
        passwordChangeRequired: true,
        dashboardPath: '/',
      })
    ).toBeNull()
  })
})
