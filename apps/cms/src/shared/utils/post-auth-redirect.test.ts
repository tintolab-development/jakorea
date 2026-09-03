import { describe, expect, it } from 'vitest'
import {
  PASSWORD_CHANGE_REQUIRED_PATH,
  PASSWORD_CHANGE_REQUIRED_STORAGE_KEY,
  isAdminFirstLoginOnboardingIncomplete,
  isPasswordChangeRequiredPath,
  passwordChangeRequiredPaths,
  resolvePostAuthRedirectPath,
  resolveSessionAuthFailureRedirect,
} from './post-auth-redirect'

describe('resolvePostAuthRedirectPath', () => {
  it('임시 비밀번호 변경이 필요하면 온보딩 안내로 보낸다', () => {
    expect(
      resolvePostAuthRedirectPath({ passwordChangeRequired: true, fallbackPath: '/' })
    ).toBe(PASSWORD_CHANGE_REQUIRED_PATH)
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
    expect(
      resolveSessionAuthFailureRedirect({ pathname: '/', complete: true })
    ).toBe(passwordChangeRequiredPaths.complete)
  })

  it('온보딩 경로면 현재 화면을 유지한다', () => {
    expect(
      resolveSessionAuthFailureRedirect({
        pathname: passwordChangeRequiredPaths.changePassword,
        complete: false,
      })
    ).toBeNull()
  })

  it('일반 경로면 로그인으로 보낸다', () => {
    expect(
      resolveSessionAuthFailureRedirect({ pathname: '/', search: '', complete: false })
    ).toBe('/login?next=%2F')
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
