import { isAxiosError } from 'axios'
import { axiosClient } from '@/shared/api/axios-instance'
import {
  MemberGuardianVerificationApiError,
  parseMemberGuardianVerificationApiError,
} from './guardian-verification-api-error'
import type {
  CreateMemberGuardianVerificationRequest,
  CreateMemberGuardianVerificationResponse,
  GetMemberGuardianVerificationResponse,
  StartMemberGuardianVerificationNiceRequest,
  StartMemberGuardianVerificationNiceResponse,
} from './guardian-verifications.types'

export { MemberGuardianVerificationApiError, parseMemberGuardianVerificationApiError }

const STATUS_TOKEN_HEADER = 'X-Verification-Status-Token'
const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' } as const

function unwrapApiData<T>(payload: unknown): T {
  if (!payload || typeof payload !== 'object') {
    throw new MemberGuardianVerificationApiError('UNKNOWN', '응답을 해석할 수 없습니다.')
  }
  const o = payload as Record<string, unknown>
  if (o.success === false) {
    throw parseMemberGuardianVerificationApiError(payload)
  }
  if (o.data && typeof o.data === 'object') {
    return o.data as T
  }
  return o as T
}

export function rethrowMemberGuardianVerificationApiError(
  error: unknown,
  fallbackMessage: string,
): never {
  if (error instanceof MemberGuardianVerificationApiError) {
    throw error
  }
  if (isAxiosError(error) && error.response?.data) {
    throw parseMemberGuardianVerificationApiError(error.response.data, error.response.status)
  }
  if (error instanceof Error && error.message.trim()) {
    throw new MemberGuardianVerificationApiError('UNKNOWN', error.message.trim())
  }
  throw new MemberGuardianVerificationApiError('UNKNOWN', fallbackMessage)
}

function guardianVerificationsPath(sessionId?: number): string {
  const base = '/api/portal/me/guardian-verifications'
  if (sessionId == null) return base
  return `${base}/${encodeURIComponent(String(sessionId))}`
}

function statusTokenHeaders(statusToken: string, extra?: Record<string, string>) {
  return {
    ...NO_STORE_HEADERS,
    [STATUS_TOKEN_HEADER]: statusToken,
    ...extra,
  }
}

export function isGuardianNiceAlreadyStartedError(error: unknown): boolean {
  return (
    error instanceof MemberGuardianVerificationApiError &&
    error.code === 'GUARDIAN_NICE_ALREADY_STARTED'
  )
}

export async function createMemberGuardianVerification(
  body: CreateMemberGuardianVerificationRequest,
  idempotencyKey?: string,
): Promise<CreateMemberGuardianVerificationResponse> {
  const headers: Record<string, string> = { ...NO_STORE_HEADERS }
  if (idempotencyKey?.trim()) {
    headers['Idempotency-Key'] = idempotencyKey.trim()
  }
  try {
    const { data } = await axiosClient.post<unknown>(guardianVerificationsPath(), body, { headers })
    const created = unwrapApiData<CreateMemberGuardianVerificationResponse>(data)
    if (created.sessionId == null || !created.statusToken?.trim()) {
      throw new MemberGuardianVerificationApiError(
        'INVALID_RESPONSE',
        '보호자 본인인증 세션을 만들지 못했습니다.',
      )
    }
    return created
  } catch (error) {
    rethrowMemberGuardianVerificationApiError(error, '보호자 본인인증을 시작할 수 없습니다.')
  }
}

export async function startMemberGuardianVerificationNice(input: {
  sessionId: number
  statusToken: string
  body?: StartMemberGuardianVerificationNiceRequest
}): Promise<StartMemberGuardianVerificationNiceResponse> {
  try {
    const { data } = await axiosClient.post<unknown>(
      `${guardianVerificationsPath(input.sessionId)}/nice/start`,
      input.body ?? {},
      { headers: statusTokenHeaders(input.statusToken) },
    )
    return unwrapApiData<StartMemberGuardianVerificationNiceResponse>(data)
  } catch (error) {
    rethrowMemberGuardianVerificationApiError(error, '보호자 본인인증을 시작할 수 없습니다.')
  }
}

export async function getMemberGuardianVerification(input: {
  sessionId: number
  statusToken: string
}): Promise<GetMemberGuardianVerificationResponse> {
  try {
    const { data } = await axiosClient.get<unknown>(guardianVerificationsPath(input.sessionId), {
      headers: statusTokenHeaders(input.statusToken),
    })
    return unwrapApiData<GetMemberGuardianVerificationResponse>(data)
  } catch (error) {
    rethrowMemberGuardianVerificationApiError(error, '보호자 본인인증 상태를 확인할 수 없습니다.')
  }
}
