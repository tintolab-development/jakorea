import { describe, expect, it } from 'vitest'
import {
  MFA_MAX_FAILED_ATTEMPTS,
  OTP_POLICY,
  clampMfaFailedAttempts,
} from './mfa-policy'

describe('mfa-policy BE SSOT B안 (2026-09-10)', () => {
  it('MFA_MAX_FAILED_ATTEMPTS / OTP_POLICY.maxFailedAttempts 는 5', () => {
    expect(MFA_MAX_FAILED_ATTEMPTS).toBe(5)
    expect(OTP_POLICY.maxFailedAttempts).toBe(5)
    expect(OTP_POLICY.lockoutDurationMinutes).toBe(30)
  })

  it('clampMfaFailedAttempts 는 0~5만 허용 (6+ UI Fail)', () => {
    expect(clampMfaFailedAttempts(-1)).toBe(0)
    expect(clampMfaFailedAttempts(0)).toBe(0)
    expect(clampMfaFailedAttempts(4)).toBe(4)
    expect(clampMfaFailedAttempts(5)).toBe(5)
    expect(clampMfaFailedAttempts(6)).toBe(5)
    expect(clampMfaFailedAttempts(8)).toBe(5)
    expect(clampMfaFailedAttempts(Number.NaN)).toBe(0)
  })
})
