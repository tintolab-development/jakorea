/**
 * QA-0137: `@jakorea/social-auth` SSO 토큰 응답은 refreshToken 없이도(HttpOnly 쿠키 전용 운영) 토큰으로 인정한다.
 */
import { describe, expect, it } from 'vitest'
import { readSocialLoginMfaChallenge, unwrapAuthTokenResult } from '@jakorea/social-auth'

describe('QA-0137 social-auth 토큰 응답 — refreshToken 선택', () => {
  it('refreshToken이 없어도 access token만으로 토큰 결과를 만든다', () => {
    expect(
      unwrapAuthTokenResult({ success: true, data: { accessToken: 'a', expiresInSeconds: 900 } })
    ).toEqual({
      accessToken: 'a',
      refreshToken: undefined,
      tokenType: undefined,
      expiresInSeconds: 900,
      ageGroup: undefined,
    })
  })

  it('refreshToken이 null/빈 문자열이면 undefined로 정규화한다', () => {
    expect(unwrapAuthTokenResult({ accessToken: 'a', refreshToken: null }).refreshToken).toBeUndefined()
    expect(unwrapAuthTokenResult({ accessToken: 'a', refreshToken: '' }).refreshToken).toBeUndefined()
  })

  it('refreshToken이 있으면 기존처럼 그대로 돌려준다', () => {
    expect(
      unwrapAuthTokenResult({ accessToken: 'a', refreshToken: 'r', ageGroup: 'over_14' })
    ).toMatchObject({ accessToken: 'a', refreshToken: 'r', ageGroup: 'OVER_14' })
  })

  it('access token이 없으면 여전히 형식 오류다', () => {
    expect(() => unwrapAuthTokenResult({ refreshToken: 'r' })).toThrow()
  })

  it('refreshToken 없는 토큰 응답은 MFA challenge로 보지 않는다', () => {
    expect(readSocialLoginMfaChallenge({ success: true, data: { accessToken: 'a' } })).toBeNull()
    expect(
      readSocialLoginMfaChallenge({ success: true, data: { challengeUuid: 'c-1', mfaMethod: 'TOTP' } })
    ).toMatchObject({ challengeUuid: 'c-1', mfaMethod: 'TOTP' })
  })
})
