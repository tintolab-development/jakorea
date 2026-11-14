import { describe, expect, it, vi } from 'vitest'
import {
  PASSWORD_CHANGE_REQUIRED_PATH,
  PASSWORD_CHANGE_REQUIRED_STORAGE_KEY,
  assignLoginAfterSessionEnd,
  isAdminFirstLoginOnboardingIncomplete,
  isCmsLoggedOutPublicPath,
  isLoginReturnPathSuppressed,
  isPasswordChangeRequiredPath,
  passwordChangeRequiredPaths,
  resolvePostAuthRedirectPath,
  resolveSessionAuthFailureRedirect,
  buildLoginPathWithRedirect,
  resetLoginReturnPathSuppressedForTest,
  sanitizeLoginRedirectPath,
} from './post-auth-redirect'

describe('resolvePostAuthRedirectPath', () => {
  it('임시 비밀번호 변경이 필요하면 온보딩 안내로 보낸다', () => {
    expect(resolvePostAuthRedirectPath({ passwordChangeRequired: true, fallbackPath: '/' })).toBe(
      PASSWORD_CHANGE_REQUIRED_PATH
    )
  })

  it('비밀번호 변경 완료 플래그가 있으면 대시보드보다 완료 화면을 우선한다', () => {
    expect(
      resolvePostAuthRedirectPath({
        complete: true,
        passwordChangeRequired: false,
        fallbackPath: '/',
      })
    ).toBe(passwordChangeRequiredPaths.complete)
  })
})

describe('resolveSessionAuthFailureRedirect', () => {
  it('완료 플래그가 있으면 로그인 대신 완료 화면으로 보낸다', () => {
    expect(resolveSessionAuthFailureRedirect({ pathname: '/', complete: true })).toBe(
      passwordChangeRequiredPaths.complete
    )
  })

  it('온보딩 경로면 현재 화면을 유지한다', () => {
    expect(
      resolveSessionAuthFailureRedirect({
        pathname: passwordChangeRequiredPaths.changePassword,
        complete: false,
      })
    ).toBeNull()
  })

  it('대시보드(/)면 redirect 없이 로그인으로 보낸다', () => {
    expect(resolveSessionAuthFailureRedirect({ pathname: '/', complete: false })).toBe('/login')
  })

  it('일반 경로여도 세션 만료 뒤에는 redirect 없이 로그인으로 보낸다 (다시 로그인하면 기본 첫 화면)', () => {
    expect(
      resolveSessionAuthFailureRedirect({
        pathname: '/settlement-management/payment-orders',
        complete: false,
      })
    ).toBe('/login')
  })
})

describe('isCmsLoggedOutPublicPath', () => {
  it('로그인·가입 화면은 공개로 본다', () => {
    expect(isCmsLoggedOutPublicPath('/login')).toBe(true)
    expect(isCmsLoggedOutPublicPath('/register/complete')).toBe(true)
    expect(isCmsLoggedOutPublicPath('/')).toBe(false)
  })
})

describe('assignLoginAfterSessionEnd', () => {
  it('대시보드에 남아 있으면 로그인으로 보낸다', () => {
    const assign = vi.fn()
    assignLoginAfterSessionEnd({ pathname: '/', search: '', complete: false, assign })
    expect(assign).toHaveBeenCalledWith('/login')
  })

  it('로그아웃·자동 로그아웃·세션 만료면 현재 경로를 redirect로 남기지 않는다', () => {
    const assign = vi.fn()
    assignLoginAfterSessionEnd({ pathname: '/users/list', search: '?page=2', assign })
    expect(assign).toHaveBeenCalledWith('/login')
  })

  it('최초 로그인 완료 플래그가 있으면 로그인 대신 완료 화면으로 보낸다', () => {
    const assign = vi.fn()
    assignLoginAfterSessionEnd({ pathname: '/programs/general', search: '', complete: true, assign })
    expect(assign).toHaveBeenCalledWith(passwordChangeRequiredPaths.complete)
  })

  it('이미 로그인 화면이면 다시 보내지 않는다', () => {
    resetLoginReturnPathSuppressedForTest()
    const assign = vi.fn()
    assignLoginAfterSessionEnd({ pathname: '/login', search: '', complete: false, assign })
    expect(assign).not.toHaveBeenCalled()
    expect(isLoginReturnPathSuppressed()).toBe(false)
  })

  it('로그인 이동을 시작하면 보호 화면 가드도 redirect를 붙이지 않도록 표시한다', () => {
    resetLoginReturnPathSuppressedForTest()
    expect(isLoginReturnPathSuppressed()).toBe(false)
    assignLoginAfterSessionEnd({ pathname: '/users/list', search: '', assign: vi.fn() })
    expect(isLoginReturnPathSuppressed()).toBe(true)
    resetLoginReturnPathSuppressedForTest()
  })
})

describe('isPasswordChangeRequiredPath', () => {
  it('안내·본인인증·비밀번호 변경 경로를 인식한다', () => {
    expect(isPasswordChangeRequiredPath('/auth/password-change-required')).toBe(true)
    expect(isPasswordChangeRequiredPath('/auth/password-change-required/identity')).toBe(true)
    expect(isPasswordChangeRequiredPath('/auth/password-change-required/complete')).toBe(true)
    expect(isPasswordChangeRequiredPath('/login')).toBe(false)
  })
})

describe('isAdminFirstLoginOnboardingIncomplete', () => {
  it('스토리지 플래그가 있으면 경로와 무관하게 true', () => {
    expect(
      isAdminFirstLoginOnboardingIncomplete({
        pathname: '/login',
        storage: { getItem: () => '1' },
      })
    ).toBe(true)
  })

  it('온보딩 경로면 스토리지가 없어도 true', () => {
    expect(
      isAdminFirstLoginOnboardingIncomplete({
        pathname: '/auth/password-change-required/birth',
        storage: { getItem: () => null },
      })
    ).toBe(true)
  })

  it('플래그·온보딩 경로가 아니면 false', () => {
    expect(
      isAdminFirstLoginOnboardingIncomplete({
        pathname: '/',
        storage: { getItem: () => null },
      })
    ).toBe(false)
  })

  it('스토리지 키 이름을 사용한다', () => {
    expect(PASSWORD_CHANGE_REQUIRED_STORAGE_KEY).toBe('auth_password_change_required')
  })
})

describe('sanitizeLoginRedirectPath', () => {
  it('같은 앱 내부 경로는 쿼리·해시까지 그대로 허용한다', () => {
    expect(
      sanitizeLoginRedirectPath('/settlement-management/payment-orders?po_inst=%EA%B9%80#top')
    ).toBe('/settlement-management/payment-orders?po_inst=%EA%B9%80#top')
  })

  it.each([
    [null],
    [undefined],
    [''],
    ['   '],
    ['https://evil.com'],
    ['//evil.com'],
    ['/\\evil.com'],
    ['/foo?u=https://evil.com'],
    ['javascript:alert(1)'],
    ['users/list'],
  ])('외부·비정상 경로 %s 는 거부한다', value => {
    expect(sanitizeLoginRedirectPath(value)).toBeNull()
  })

  it.each([
    ['/'],
    ['/login'],
    ['/login?redirect=%2Fusers'],
    ['/register/complete'],
    ['/oauth/callback/google'],
    ['/mfa'],
    ['/auth/password-change-required/identity'],
  ])('로그인·인증 화면 %s 는 루프 방지를 위해 거부한다', value => {
    expect(sanitizeLoginRedirectPath(value)).toBeNull()
  })
})

describe('buildLoginPathWithRedirect', () => {
  it('안전한 경로는 인코딩해 redirect로 붙인다', () => {
    expect(buildLoginPathWithRedirect('/users/list?page=2')).toBe(
      '/login?redirect=%2Fusers%2Flist%3Fpage%3D2'
    )
  })

  it('안전하지 않은 경로면 /login만 반환한다', () => {
    expect(buildLoginPathWithRedirect('//evil.com')).toBe('/login')
    expect(buildLoginPathWithRedirect('/login')).toBe('/login')
  })
})
