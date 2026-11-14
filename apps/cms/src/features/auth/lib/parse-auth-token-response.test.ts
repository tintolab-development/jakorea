import { describe, expect, it } from 'vitest'
import {
  expiresAtIsoFromExpiresInSeconds,
  isAccessTokenUnauthorizedCode,
  parseAuthTokenResponse,
} from './parse-auth-token-response'

describe('parseAuthTokenResponse', () => {
  it('OpenAPI bare AuthTokenResponse', () => {
    const parsed = parseAuthTokenResponse({
      accessToken: 'a',
      refreshToken: 'r',
      tokenType: 'Bearer',
      expiresInSeconds: 3600,
      passwordChangeRequired: false,
    })
    expect(parsed).toEqual({
      accessToken: 'a',
      refreshToken: 'r',
      tokenType: 'Bearer',
      expiresInSeconds: 3600,
      passwordChangeRequired: false,
      adminProvisionedOnboardingRequired: undefined,
      adminProvisionedOnboardingStep: undefined,
      registeredByAdmin: undefined,
      identitySelfSignupCompletedAfterAdminRegistration: undefined,
    })
  })

  it('envelope { success, data }', () => {
    const parsed = parseAuthTokenResponse({
      success: true,
      data: { accessToken: 'a2', refreshToken: 'r2', expiresInSeconds: 120 },
    })
    expect(parsed?.accessToken).toBe('a2')
    expect(parsed?.refreshToken).toBe('r2')
    expect(parsed?.expiresInSeconds).toBe(120)
  })

  it('QA-0137: refreshToken이 본문에 없어도 access만으로 파싱하고 refreshToken은 undefined', () => {
    const parsed = parseAuthTokenResponse({ accessToken: 'a', refreshToken: null, expiresInSeconds: 60 })
    expect(parsed?.accessToken).toBe('a')
    expect(parsed?.refreshToken).toBeUndefined()
    expect(parseAuthTokenResponse({ accessToken: 'a' })?.refreshToken).toBeUndefined()
  })

  it('BE R1: identityVerificationRequired를 boolean·null 그대로 읽고, 없으면 undefined', () => {
    expect(
      parseAuthTokenResponse({ accessToken: 'a', identityVerificationRequired: true })
        ?.identityVerificationRequired
    ).toBe(true)
    expect(
      parseAuthTokenResponse({ accessToken: 'a', identityVerificationRequired: null })
        ?.identityVerificationRequired
    ).toBeNull()
    expect(parseAuthTokenResponse({ accessToken: 'a' })?.identityVerificationRequired).toBeUndefined()
  })

  it('accessToken 없으면 null', () => {
    expect(parseAuthTokenResponse({ refreshToken: 'r' })).toBeNull()
  })
})

describe('isAccessTokenUnauthorizedCode', () => {
  it('UNAUTHORIZED / TOKEN_EXPIRED 계열만 true', () => {
    expect(isAccessTokenUnauthorizedCode('UNAUTHORIZED')).toBe(true)
    expect(isAccessTokenUnauthorizedCode('TOKEN_EXPIRED')).toBe(true)
    expect(isAccessTokenUnauthorizedCode('ACCESS_TOKEN_EXPIRED')).toBe(true)
    expect(isAccessTokenUnauthorizedCode('PERMISSION_DENIED')).toBe(false)
    expect(isAccessTokenUnauthorizedCode(undefined)).toBe(false)
  })
})

describe('expiresAtIsoFromExpiresInSeconds', () => {
  it('expiresInSeconds 반영', () => {
    const before = Date.now()
    const iso = expiresAtIsoFromExpiresInSeconds(60)
    const at = Date.parse(iso)
    expect(at).toBeGreaterThanOrEqual(before + 55_000)
    expect(at).toBeLessThanOrEqual(before + 65_000)
  })
})
