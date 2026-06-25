import { axiosClient } from '@/shared/api'
import { adminAuthPaths } from '@/shared/config/api-paths'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import type {
  EmailRecoveryLookupRequest,
  EmailRecoveryLookupResponse,
} from '@/shared/api/generated/members/schemas'

export type FindEmailLookupResult =
  | { kind: 'found'; maskedEmail: string }
  | { kind: 'not_found' }

export interface FindEmailLookupInput {
  identityVerificationSessionId: number
  profileToken: string
  /** mock 전용 — 실 API에서는 무시 */
  mockNotFoundHint?: string
}

export class FindEmailApiError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'FindEmailApiError'
    this.code = code
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    window.setTimeout(resolve, ms)
  })
}

function unwrapEmailRecoveryLookup(payload: unknown): EmailRecoveryLookupResponse {
  if (!payload || typeof payload !== 'object') {
    throw new FindEmailApiError('INVALID_RESPONSE', '이메일 찾기 응답을 확인할 수 없습니다.')
  }

  const o = payload as Record<string, unknown>
  if (o.success === false) {
    throw parseFindEmailApiError(payload)
  }
  if (o.data && typeof o.data === 'object') {
    return o.data as EmailRecoveryLookupResponse
  }
  return o as EmailRecoveryLookupResponse
}

function parseFindEmailApiError(payload: unknown): FindEmailApiError {
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>
    const wrapped = o.error as { code?: string; message?: string } | undefined
    const code = wrapped?.code ?? (typeof o.code === 'string' ? o.code : 'UNKNOWN')
    const message =
      wrapped?.message ??
      (typeof o.message === 'string' ? o.message : undefined) ??
      '이메일 찾기에 실패했습니다.'
    return new FindEmailApiError(String(code), message)
  }

  return new FindEmailApiError('UNKNOWN', '이메일 찾기에 실패했습니다.')
}

function resolveMaskedEmail(result: EmailRecoveryLookupResponse): string | undefined {
  if (result.maskedEmail?.trim()) {
    return result.maskedEmail.trim()
  }

  const firstAccount = result.accounts?.find(account => account.maskedEmail?.trim())
  return firstAccount?.maskedEmail?.trim()
}

async function lookupFindEmailMock(input: FindEmailLookupInput): Promise<FindEmailLookupResult> {
  await delay(300)

  if (input.mockNotFoundHint?.includes('없음')) {
    return { kind: 'not_found' }
  }

  return { kind: 'found', maskedEmail: 'Ja****@gmail.com' }
}

async function lookupFindEmailRemote(input: FindEmailLookupInput): Promise<FindEmailLookupResult> {
  const body: EmailRecoveryLookupRequest = {
    identityVerificationSessionId: input.identityVerificationSessionId,
    profileToken: input.profileToken.trim(),
  }

  try {
    const { data: payload } = await axiosClient.post<unknown>(
      adminAuthPaths.emailRecoveryLookup(),
      body
    )
    const result = unwrapEmailRecoveryLookup(payload)
    const maskedEmail = resolveMaskedEmail(result)

    if (!result.matched || !maskedEmail) {
      return { kind: 'not_found' }
    }

    return { kind: 'found', maskedEmail }
  } catch (error) {
    if (error instanceof FindEmailApiError) {
      throw error
    }

    const axiosErr = error as { response?: { status?: number; data?: unknown } }
    if (axiosErr.response?.data) {
      throw parseFindEmailApiError(axiosErr.response.data)
    }

    if (axiosErr.response?.status === 403) {
      throw new FindEmailApiError('FORBIDDEN', '이메일 찾기 요청이 거부되었습니다. 잠시 후 다시 시도해 주세요.')
    }

    throw error instanceof Error
      ? new FindEmailApiError('NETWORK', error.message)
      : new FindEmailApiError('NETWORK', '이메일 찾기 요청에 실패했습니다.')
  }
}

export async function lookupFindEmail(input: FindEmailLookupInput): Promise<FindEmailLookupResult> {
  if (isRealApiModuleEnabled('findEmail')) {
    return lookupFindEmailRemote(input)
  }

  return lookupFindEmailMock(input)
}
