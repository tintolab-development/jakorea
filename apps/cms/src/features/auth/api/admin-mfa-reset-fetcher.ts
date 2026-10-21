/**
 * MASTER 관리자 MFA 초기화.
 * stepUpProof는 호출 측 메모리에만 두고, 이 모듈은 로그에 남기지 않는다.
 */

import { isAxiosError, type InternalAxiosRequestConfig } from 'axios'
import { axiosClient } from '@/shared/api'
import { adminAuthPaths } from '@/shared/config/api-paths'
import { AdminMfaApiError } from '@/features/auth/api/admin-auth-fetcher'
import {
  buildMfaResetRequest,
  parseStepUpProof,
  type AdminMfaResetRequestBody,
} from '@/features/auth/lib/admin-mfa-contract'

const resetConfig = {
  skipGlobalErrorAlert: true,
} as InternalAxiosRequestConfig & { skipGlobalErrorAlert?: boolean }

function readErrorCode(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return 'UNKNOWN'
  const record = payload as Record<string, unknown>
  const wrapped = record.error as { code?: string } | undefined
  if (typeof wrapped?.code === 'string' && wrapped.code.trim()) return wrapped.code
  if (typeof record.code === 'string' && record.code.trim()) return record.code
  return 'UNKNOWN'
}

function throwResetError(err: unknown, fallback: string, timeoutCode: string): never {
  if (err instanceof AdminMfaApiError) throw err
  if (isAxiosError(err)) {
    if (err.code === 'ECONNABORTED' || !err.response) {
      throw new AdminMfaApiError(timeoutCode, fallback)
    }
    const status = err.response.status
    const code = readErrorCode(err.response.data)
    throw new AdminMfaApiError(code === 'UNKNOWN' && status === 400 ? 'VALIDATION_ERROR' : code, fallback, status)
  }
  throw new AdminMfaApiError('NETWORK', fallback)
}

export async function fetchAdminMfaResetStepUp(
  adminAccountId: number,
  totpCode: string
): Promise<string> {
  try {
    const { data } = await axiosClient.post<unknown>(
      adminAuthPaths.mfaResetStepUp(adminAccountId),
      { totpCode },
      resetConfig
    )
    const proof = parseStepUpProof(data)
    if (!proof) {
      throw new AdminMfaApiError('MFA_RESET_STEP_UP_FAILED', 'Step-up 인증에 실패했습니다.')
    }
    return proof
  } catch (err) {
    throwResetError(err, 'Step-up 인증에 실패했습니다.', 'MFA_RESET_STEP_UP_FAILED')
  }
}

export async function fetchAdminMfaReset(
  adminAccountId: number,
  body: AdminMfaResetRequestBody
): Promise<void> {
  try {
    await axiosClient.post<unknown>(adminAuthPaths.mfaReset(adminAccountId), body, {
      ...resetConfig,
      validateStatus: (status: number) => status === 204 || status === 200,
    } as InternalAxiosRequestConfig & { skipGlobalErrorAlert?: boolean })
  } catch (err) {
    throwResetError(
      err,
      'MFA 초기화 결과를 확인하지 못했습니다.',
      'MFA_RESET_OUTCOME_UNKNOWN'
    )
  }
}

export function prepareAdminMfaResetRequest(input: {
  reason: string
  recoveryType: string
  verificationReference: string
  stepUpProof: string
}) {
  return buildMfaResetRequest(input)
}
