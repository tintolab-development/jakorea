import { isValidRegisterPassword } from '@/features/auth/lib/validate-register-password'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

const VERIFICATION_TTL_MS = 10 * 60 * 1000

export type FindPasswordEmailVerifyResult = { kind: 'found' } | { kind: 'not_found' }

export type SendPasswordVerificationEmailResult = {
  kind: 'sent'
  resetSessionUuid: string
  expiresAt: string
}

export type ChangePasswordAfterResetResult =
  | { kind: 'success' }
  | { kind: 'wrong_current' }
  | { kind: 'same_as_old' }
  | { kind: 'invalid_new_password' }

export interface ChangePasswordAfterResetInput {
  email: string
  resetSessionUuid: string
  currentPassword: string
  newPassword: string
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    window.setTimeout(resolve, ms)
  })
}

function createMockSessionUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `mock-reset-${Date.now()}`
}

async function verifyFindPasswordEmailMock(email: string): Promise<FindPasswordEmailVerifyResult> {
  await delay(200)

  if (email.includes('없음')) {
    return { kind: 'not_found' }
  }

  return { kind: 'found' }
}

async function verifyFindPasswordEmailRemote(_email: string): Promise<FindPasswordEmailVerifyResult> {
  // TODO(backend): POST /api/admin/auth/find-password/verify-email 스펙 확정 후 연동
  throw new Error('비밀번호 찾기 이메일 확인 API가 아직 연동되지 않았습니다.')
}

export async function verifyFindPasswordEmail(
  email: string
): Promise<FindPasswordEmailVerifyResult> {
  if (isRealApiModuleEnabled('findPassword')) {
    return verifyFindPasswordEmailRemote(email)
  }

  return verifyFindPasswordEmailMock(email.trim())
}

async function sendPasswordVerificationEmailMock(
  _email: string
): Promise<SendPasswordVerificationEmailResult> {
  await delay(300)

  return {
    kind: 'sent',
    resetSessionUuid: createMockSessionUuid(),
    expiresAt: new Date(Date.now() + VERIFICATION_TTL_MS).toISOString(),
  }
}

async function sendPasswordVerificationEmailRemote(
  _email: string
): Promise<SendPasswordVerificationEmailResult> {
  // TODO(backend): POST /api/admin/auth/find-password/send-verification-email 스펙 확정 후 연동
  throw new Error('비밀번호 찾기 인증메일 API가 아직 연동되지 않았습니다.')
}

export async function sendPasswordVerificationEmail(
  email: string
): Promise<SendPasswordVerificationEmailResult> {
  if (isRealApiModuleEnabled('findPassword')) {
    return sendPasswordVerificationEmailRemote(email)
  }

  return sendPasswordVerificationEmailMock(email.trim())
}

async function changePasswordAfterResetMock(
  input: ChangePasswordAfterResetInput
): Promise<ChangePasswordAfterResetResult> {
  await delay(300)

  if (input.currentPassword === '틀림') {
    return { kind: 'wrong_current' }
  }

  if (!isValidRegisterPassword(input.newPassword)) {
    return { kind: 'invalid_new_password' }
  }

  if (input.newPassword === input.currentPassword) {
    return { kind: 'same_as_old' }
  }

  return { kind: 'success' }
}

async function changePasswordAfterResetRemote(
  _input: ChangePasswordAfterResetInput
): Promise<ChangePasswordAfterResetResult> {
  // TODO(backend): POST /api/admin/auth/find-password/change 스펙 확정 후 연동
  throw new Error('비밀번호 변경 API가 아직 연동되지 않았습니다.')
}

export async function changePasswordAfterReset(
  input: ChangePasswordAfterResetInput
): Promise<ChangePasswordAfterResetResult> {
  if (isRealApiModuleEnabled('findPassword')) {
    return changePasswordAfterResetRemote(input)
  }

  return changePasswordAfterResetMock(input)
}

export const FIND_PASSWORD_VERIFICATION_TTL_MS = VERIFICATION_TTL_MS
