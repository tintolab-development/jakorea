import { axiosClient } from '@/shared/api'
import { adminAuthPaths } from '@/shared/config/api-paths'
import { isRealApiModuleEnabled } from '@/shared/config/real-api-modules'
import type {
  EmailRecoveryLookupRequest,
  EmailRecoveryLookupResponse,
} from '@/shared/api/generated/members/schemas'

/**
 * 이메일 찾기 결과. 본인인증을 마친 본인 화면이라 이메일 전체를 보여 준다(정책 CMS-02).
 * 원문은 호출 화면의 컴포넌트 상태에만 두고 Query 캐시·로그·스토리지에 남기지 않는다.
 */
export type FindEmailLookupResult =
  | { kind: 'found'; email: string }
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

/** 계정 원문 이메일(`accounts[].email`) 우선. 없으면 서버 `maskedEmail` 값을 그대로 쓴다. */
export function resolveFoundEmail(result: EmailRecoveryLookupResponse): string | undefined {
  const accountEmail = result.accounts?.find(account => account.email?.trim())?.email?.trim()
  if (accountEmail) return accountEmail

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

  return { kind: 'found', email: 'mock-user@example.com' }
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
    const email = resolveFoundEmail(result)

    if (!result.matched || !email) {
      return { kind: 'not_found' }
    }

    return { kind: 'found', email }
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
  // 이메일 찾기는 Admin Auth 계열 — findPassword와 동일하게 adminAuth만 켜도 실 API
  if (isRealApiModuleEnabled('findEmail') || isRealApiModuleEnabled('adminAuth')) {
    return lookupFindEmailRemote(input)
  }

  return lookupFindEmailMock(input)
}
