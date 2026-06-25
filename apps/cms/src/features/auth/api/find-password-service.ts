import { isValidRegisterPassword } from '@/features/auth/lib/validate-register-password'
import {
  checkAdminAuthEmail,
  isAdminAuthEmailCheckRemoteEnabled,
  isEmailRegisteredForPasswordReset,
} from '@/features/auth/api/admin-auth-email-check'
import {
  AdminRegisterApiError,
  parseAdminRegisterApiError,
} from '@/features/auth/model/admin-register-api.types'
import { axiosClient } from '@/shared/api'
import type {
  PasswordResetConfirmRequest,
  PasswordResetConfirmResponse,
} from '@/shared/api/generated/members/schemas'
import { adminAuthPaths } from '@/shared/config/api-paths'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'

const VERIFICATION_TTL_MS = 10 * 60 * 1000

export type FindPasswordEmailVerifyResult = { kind: 'found' } | { kind: 'not_found' }

export type ChangePasswordAfterResetResult =
  | { kind: 'success' }
  | { kind: 'invalid_new_password' }
  | { kind: 'api_error'; message: string }

export interface ChangePasswordAfterResetInput {
  email: string
  identityVerificationSessionId: number
  profileToken: string
  newPassword: string
  newPasswordConfirm: string
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    window.setTimeout(resolve, ms)
  })
}

function isFindPasswordRemoteEnabled(): boolean {
  return isRealApiModuleEnabled('findPassword') || isRealApiModuleEnabled('adminAuth')
}

function unwrapPasswordResetConfirm(payload: unknown): PasswordResetConfirmResponse {
  if (!payload || typeof payload !== 'object') {
    throw parseAdminRegisterApiError(payload)
  }

  const o = payload as Record<string, unknown>
  if (o.success === false) {
    throw parseAdminRegisterApiError(payload)
  }
  if (o.data && typeof o.data === 'object') {
    return o.data as PasswordResetConfirmResponse
  }
  return o as PasswordResetConfirmResponse
}

async function verifyFindPasswordEmailMock(email: string): Promise<FindPasswordEmailVerifyResult> {
  await delay(200)

  if (email.includes('없음')) {
    return { kind: 'not_found' }
  }

  return { kind: 'found' }
}

async function verifyFindPasswordEmailRemote(email: string): Promise<FindPasswordEmailVerifyResult> {
  const result = await checkAdminAuthEmail(email, 'PASSWORD_RESET')
  return isEmailRegisteredForPasswordReset(result) ? { kind: 'found' } : { kind: 'not_found' }
}

export async function verifyFindPasswordEmail(
  email: string
): Promise<FindPasswordEmailVerifyResult> {
  if (isAdminAuthEmailCheckRemoteEnabled()) {
    return verifyFindPasswordEmailRemote(email)
  }

  return verifyFindPasswordEmailMock(email.trim())
}

async function changePasswordAfterResetMock(
  input: ChangePasswordAfterResetInput
): Promise<ChangePasswordAfterResetResult> {
  await delay(300)

  if (!isValidRegisterPassword(input.newPassword)) {
    return { kind: 'invalid_new_password' }
  }

  if (input.newPassword !== input.newPasswordConfirm) {
    return { kind: 'api_error', message: '비밀번호가 서로 달라요. 다시 한 번 확인해 주세요.' }
  }

  return { kind: 'success' }
}

async function changePasswordAfterResetRemote(
  input: ChangePasswordAfterResetInput
): Promise<ChangePasswordAfterResetResult> {
  const body: PasswordResetConfirmRequest = {
    email: input.email.trim(),
    identityVerificationSessionId: input.identityVerificationSessionId,
    profileToken: input.profileToken,
    newPassword: input.newPassword,
    newPasswordConfirm: input.newPasswordConfirm,
  }

  try {
    const { data: payload } = await axiosClient.post<unknown>(
      adminAuthPaths.passwordResetConfirm(),
      body
    )
    const result = unwrapPasswordResetConfirm(payload)

    if (result.resetCompleted === false) {
      return { kind: 'api_error', message: '비밀번호 변경에 실패했습니다.' }
    }

    return { kind: 'success' }
  } catch (error) {
    if (error instanceof AdminRegisterApiError) {
      return { kind: 'api_error', message: error.message }
    }
    const axiosErr = error as { response?: { data?: unknown } }
    if (axiosErr.response?.data) {
      const parsed = parseAdminRegisterApiError(axiosErr.response.data)
      return { kind: 'api_error', message: parsed.message }
    }
    return {
      kind: 'api_error',
      message: error instanceof Error ? error.message : '비밀번호 변경 요청에 실패했습니다.',
    }
  }
}

export async function changePasswordAfterReset(
  input: ChangePasswordAfterResetInput
): Promise<ChangePasswordAfterResetResult> {
  if (isFindPasswordRemoteEnabled()) {
    return changePasswordAfterResetRemote(input)
  }

  return changePasswordAfterResetMock(input)
}

export const FIND_PASSWORD_VERIFICATION_TTL_MS = VERIFICATION_TTL_MS
