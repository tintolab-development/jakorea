import { describe, expect, it } from 'vitest'
import {
  buildAdminMfaEnrollmentRequest,
  buildMfaResetRequest,
  mapMfaResetError,
  mapMfaVerifyError,
  parseAdminMfaChallenge,
  pickEnrollmentManualKey,
  pickEnrollmentQrDataUrl,
} from './admin-mfa-contract'

describe('parseAdminMfaChallenge', () => {
  it('mfaSetupRequired를 읽고 로그인 응답의 QR/Secret은 담지 않는다', () => {
    const parsed = parseAdminMfaChallenge({
      success: true,
      data: {
        requiresMfa: true,
        challengeUuid: 'challenge-1',
        mfaMethod: 'TOTP',
        expiresAt: '2026-10-20T00:00:00Z',
        mfaSetupRequired: true,
        totpSecret: 'SHOULD_NOT_LEAK',
        secretKey: 'SHOULD_NOT_LEAK',
        qrCodeDataUrl: 'data:image/png;base64,xx',
        qrDataUrl: 'data:image/png;base64,yy',
      },
    })

    expect(parsed).toEqual({
      requiresMfa: true,
      challengeUuid: 'challenge-1',
      mfaMethod: 'TOTP',
      expiresAt: '2026-10-20T00:00:00Z',
      mfaSetupRequired: true,
    })
    expect(JSON.stringify(parsed)).not.toContain('SHOULD_NOT_LEAK')
  })

  it('기등록 계정은 mfaSetupRequired false', () => {
    expect(
      parseAdminMfaChallenge({
        challengeUuid: 'challenge-2',
        mfaMethod: 'TOTP',
        expiresAt: '2026-10-20T00:00:00Z',
        mfaSetupRequired: false,
      })?.mfaSetupRequired
    ).toBe(false)
  })
})

describe('buildAdminMfaEnrollmentRequest', () => {
  it('challenge와 qrSize만 보내고 Secret 필드는 넣지 않는다', () => {
    const body = buildAdminMfaEnrollmentRequest('challenge-1')
    expect(body).toEqual({
      challengeUuid: 'challenge-1',
      mfaMethod: 'TOTP',
      qrSize: 220,
    })
    expect(body).not.toHaveProperty('totpSecret')
    expect(body).not.toHaveProperty('enabled')
    expect(body).not.toHaveProperty('backupCodesHashJson')
  })
})

describe('enrollment QR alias', () => {
  it('qrCodeDataUrl을 우선하고 수동 키는 manualEntryKey를 우선한다', () => {
    expect(
      pickEnrollmentQrDataUrl({
        qrImageUrl: 'image',
        qrDataUrl: 'data',
        qrCodeDataUrl: 'code-data',
      })
    ).toBe('code-data')
    expect(
      pickEnrollmentManualKey({
        totpSecret: 'totp',
        secretKey: 'secret',
        manualEntryKey: 'manual',
      })
    ).toBe('manual')
  })
})

describe('mapMfaVerifyError', () => {
  it('challenge 만료, OTP 실패, 잠금, 429를 구분한다', () => {
    expect(mapMfaVerifyError('MFA_CHALLENGE_EXPIRED').kind).toBe('challenge')
    expect(mapMfaVerifyError('MFA_CHALLENGE_INVALID').kind).toBe('challenge')
    expect(mapMfaVerifyError('MFA_VERIFICATION_FAILED').kind).toBe('otp')
    expect(mapMfaVerifyError('MFA_NOT_CONFIGURED').kind).toBe('not-configured')
    expect(mapMfaVerifyError('ACCOUNT_LOCKED').kind).toBe('lock')
    expect(mapMfaVerifyError('UNKNOWN', 429).kind).toBe('rate')
    expect(mapMfaVerifyError('UNKNOWN', 400).kind).toBe('validation')
  })
})

describe('buildMfaResetRequest', () => {
  const valid = {
    reason: 'Authenticator device replaced',
    recoveryType: 'DEVICE_CHANGED',
    verificationReference: 'HELPDESK-20261020-001',
    stepUpProof: 'proof-1',
  }

  it('허용된 recoveryType과 길이 제한을 통과한다', () => {
    const built = buildMfaResetRequest(valid)
    expect(built.ok).toBe(true)
    if (built.ok) {
      expect(built.body.recoveryType).toBe('DEVICE_CHANGED')
      expect(built.body.stepUpProof).toBe('proof-1')
    }
  })

  it('알 수 없는 recoveryType과 길이 초과, 인증번호 입력을 거부한다', () => {
    expect(buildMfaResetRequest({ ...valid, recoveryType: 'OTHER' }).ok).toBe(false)
    expect(buildMfaResetRequest({ ...valid, reason: 'a'.repeat(501) }).ok).toBe(false)
    expect(buildMfaResetRequest({ ...valid, verificationReference: 'b'.repeat(121) }).ok).toBe(false)
    expect(buildMfaResetRequest({ ...valid, reason: '123456' }).ok).toBe(false)
  })
})

describe('mapMfaResetError', () => {
  it('409 재등록 차단과 timeout, step-up 실패를 구분한다', () => {
    expect(mapMfaResetError('MFA_ALREADY_ENROLLED', 409).action).toBe('refresh-status')
    expect(mapMfaResetError('MFA_RESET_ALREADY_UNENROLLED').action).toBe('refresh-status')
    expect(mapMfaResetError('MFA_RESET_OUTCOME_UNKNOWN').action).toBe('timeout')
    expect(mapMfaResetError('MFA_RESET_STEP_UP_EXPIRED', 401).action).toBe('restart-step-up')
    expect(mapMfaResetError('MFA_RESET_RATE_LIMITED', 429).action).toBe('rate-limited')
    expect(mapMfaResetError('MFA_RESET_TARGET_INACTIVE', 423).action).toBe('inactive')
    expect(mapMfaResetError('ACCOUNT_LOCKED', 423).action).toBe('rate-limited')
    expect(mapMfaResetError('PERMISSION_DENIED', 403).action).toBe('permission')
    expect(mapMfaResetError('MFA_RESET_SELF_FORBIDDEN', 403).message).toContain('본인 MFA')
    expect(mapMfaResetError('MFA_RESET_TARGET_PRIVILEGE_FORBIDDEN', 403).message).not.toContain(
      '마스터'
    )
    expect(mapMfaResetError('MFA_RESET_TARGET_PRIVILEGE_FORBIDDEN', 403).action).toBe('permission')
    expect(mapMfaResetError('UNAUTHORIZED', 401).action).toBe('permission')
    expect(mapMfaResetError('MFA_VERIFICATION_FAILED').action).toBe('restart-step-up')
  })
})
