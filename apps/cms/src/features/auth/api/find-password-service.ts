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
  PasswordResetEligibilityRequest,
  PasswordResetEligibilityResponse,
} from '@/shared/api/generated/members/schemas'
import { adminAuthPaths } from '@/shared/config/api-paths'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
// 화면이 직접 안내하는 재설정 오류 코드 — 전역 오류 알럿 제외 목록과 같은 상수
import {
  IDENTITY_VERIFICATION_SESSION_REQUIRED_CODE,
  PASSWORD_RESET_ACCOUNT_MISMATCH_CODE,
  PASSWORD_RESET_CONFIRM_MISMATCH_CODE,
} from '@/shared/lib/screen-owned-api-errors'

const VERIFICATION_TTL_MS = 10 * 60 * 1000

export type FindPasswordEmailVerifyResult = { kind: 'found' } | { kind: 'not_found' }

/** 화면이 직접 처리하는 재설정 오류 — 분기는 error.code로만 한다 */
export type PasswordResetScreenError =
  /** 401 PASSWORD_RESET_ACCOUNT_MISMATCH(field email) — 이메일 입력 단계로, 이메일 칸에 서버 message */
  | { kind: 'account_mismatch'; message: string }
  /** 401 IDENTITY_VERIFICATION_SESSION_REQUIRED — 본인인증부터 다시 */
  | { kind: 'identity_required' }

function classifyPasswordResetScreenError(error: unknown): PasswordResetScreenError | null {
  const data = (error as { response?: { data?: unknown } } | null)?.response?.data
  if (!data) return null
  const parsed = parseAdminRegisterApiError(data)
  if (parsed.code === PASSWORD_RESET_ACCOUNT_MISMATCH_CODE) {
    return { kind: 'account_mismatch', message: parsed.message }
  }
  if (parsed.code === IDENTITY_VERIFICATION_SESSION_REQUIRED_CODE) {
    return { kind: 'identity_required' }
  }
  return null
}

/** 본인인증 후 계정 확인 — `not_eligible`이면 「일치하는 가입 정보 없음」 */
export type PasswordResetEligibilityResult =
  | { kind: 'eligible' }
  | { kind: 'not_eligible' }
  | PasswordResetScreenError

export type ChangePasswordAfterResetResult =
  | { kind: 'success' }
  | { kind: 'invalid_new_password' }
  | { kind: 'api_error'; message: string }
  /** 401 PASSWORD_RESET_CONFIRM_MISMATCH(field newPasswordConfirm) — 확인값 칸 오류 */
  | { kind: 'confirm_mismatch' }
  | PasswordResetScreenError

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

function unwrapPasswordResetEligibility(payload: unknown): PasswordResetEligibilityResponse {
  if (!payload || typeof payload !== 'object') {
    throw parseAdminRegisterApiError(payload)
  }

  const o = payload as Record<string, unknown>
  if (o.success === false) {
    throw parseAdminRegisterApiError(payload)
  }
  if (o.data && typeof o.data === 'object') {
    return o.data as PasswordResetEligibilityResponse
  }
  return o as PasswordResetEligibilityResponse
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

/**
 * `POST /api/admin/auth/password-reset/eligibility` — 본인인증 성공 직후 호출.
 * eligible=false(nextAction `REENTER_EMAIL`)면 새 비밀번호 단계로 가지 않는다.
 * 요청 실패는 호출부로 던진다(공통 오류 알럿).
 */
export async function verifyPasswordResetEligibility(
  input: PasswordResetEligibilityRequest
): Promise<PasswordResetEligibilityResult> {
  if (!isFindPasswordRemoteEnabled()) {
    await delay(200)
    return { kind: 'eligible' }
  }

  const body: PasswordResetEligibilityRequest = {
    email: input.email.trim(),
    identityVerificationSessionId: input.identityVerificationSessionId,
    profileToken: input.profileToken,
  }
  try {
    const { data: payload } = await axiosClient.post<unknown>(
      adminAuthPaths.passwordResetEligibility(),
      body
    )
    const result = unwrapPasswordResetEligibility(payload)
    return result.eligible === true ? { kind: 'eligible' } : { kind: 'not_eligible' }
  } catch (error) {
    const screenError = classifyPasswordResetScreenError(error)
    if (screenError) return screenError
    throw error
  }
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
    const screenError = classifyPasswordResetScreenError(error)
    if (screenError) return screenError
    const axiosErr = error as { response?: { data?: unknown } }
    if (
      axiosErr.response?.data &&
      parseAdminRegisterApiError(axiosErr.response.data).code === PASSWORD_RESET_CONFIRM_MISMATCH_CODE
    ) {
      return { kind: 'confirm_mismatch' }
    }
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
