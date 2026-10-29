import type { GetMemberGuardianVerificationResponse } from '../api/guardian-verifications.types'
import type { PortraitGuardianVerificationResult } from './portrait-guardian-verification-result'

export const PORTRAIT_GUARDIAN_VERIFICATION_UNAVAILABLE_MESSAGE =
  '보호자 본인인증을 지금 진행할 수 없어요. 잠시 후 다시 시도해 주세요.'

export class PortraitGuardianVerificationUnavailableError extends Error {
  constructor(message = PORTRAIT_GUARDIAN_VERIFICATION_UNAVAILABLE_MESSAGE) {
    super(message)
    this.name = 'PortraitGuardianVerificationUnavailableError'
  }
}

export type InterpretedGuardianVerification =
  | { kind: 'pending' }
  | { kind: 'verified'; result: PortraitGuardianVerificationResult }
  | { kind: 'failed'; error: Error }

function failedGetMessage(response: GetMemberGuardianVerificationResponse): string {
  if (response.message?.trim()) return response.message.trim()
  if (response.failureCode === 'GUARDIAN_IDENTITY_MISMATCH') {
    return '등록된 보호자와 본인인증 정보가 일치하지 않습니다.'
  }
  if (response.failureCode === 'GUARDIAN_NOT_ADULT') {
    return '보호자는 만 19세 이상이어야 합니다.'
  }
  if (response.failureCode?.trim()) return response.failureCode.trim()
  return PORTRAIT_GUARDIAN_VERIFICATION_UNAVAILABLE_MESSAGE
}

/** GET 본문 → 진행/성공/실패. verificationToken 은 result에만 두고 Error에 넣지 않는다. */
export function interpretMemberGuardianVerificationGet(
  response: GetMemberGuardianVerificationResponse,
): InterpretedGuardianVerification {
  const status = response.status?.trim().toUpperCase()
  if (status === 'VERIFIED') {
    const verifiedAt = response.verifiedAt?.trim()
    if (!verifiedAt) {
      return {
        kind: 'failed',
        error: new PortraitGuardianVerificationUnavailableError(),
      }
    }
    const verificationToken = response.verificationToken?.trim()
    if (!verificationToken) {
      return {
        kind: 'failed',
        error: new PortraitGuardianVerificationUnavailableError(),
      }
    }
    return { kind: 'verified', result: { verifiedAt, verificationToken } }
  }
  if (status === 'FAILED') {
    return {
      kind: 'failed',
      error: new PortraitGuardianVerificationUnavailableError(failedGetMessage(response)),
    }
  }
  if (status === 'EXPIRED') {
    return {
      kind: 'failed',
      error: new PortraitGuardianVerificationUnavailableError(
        response.message?.trim() || '보호자 본인인증 세션이 만료되었습니다. 다시 시도해 주세요.',
      ),
    }
  }
  return { kind: 'pending' }
}
