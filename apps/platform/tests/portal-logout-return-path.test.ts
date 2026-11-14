/**
 * 로그아웃·자동 로그아웃·세션 만료 뒤 로그인 화면 이동은 돌아올 경로(`redirect`)를 버린다.
 * 다시 로그인하면 이전 이용 화면이 아니라 기본 첫 화면으로 간다.
 */
import { describe, expect, it } from 'vitest'
import { withoutSignInReturnPath } from '@/features/auth/session/portal-logout'

describe('withoutSignInReturnPath', () => {
  it('로그인 화면의 redirect는 버린다', () => {
    expect(withoutSignInReturnPath('/auth/sign-in?redirect=%2Fmypage%2Feducation%3Ftab%3D1')).toBe(
      '/auth/sign-in',
    )
  })

  it('redirect 외 쿼리는 유지한다', () => {
    expect(withoutSignInReturnPath('/auth/sign-in?redirect=%2Fmypage&socialError=x')).toBe(
      '/auth/sign-in?socialError=x',
    )
  })

  it('로그인 화면이 아니면 그대로 둔다', () => {
    expect(withoutSignInReturnPath('/auth/sign-in')).toBe('/auth/sign-in')
    expect(withoutSignInReturnPath('/auth/required?redirect=%2Fmypage')).toBe(
      '/auth/required?redirect=%2Fmypage',
    )
  })
})
