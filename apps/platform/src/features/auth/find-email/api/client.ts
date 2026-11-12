import type { InternalAxiosRequestConfig } from 'axios'
import { axiosClient } from '@/shared/api/axios-instance'
import { portalAuthPaths } from '@/features/auth/sign-in'
import { isRemoteApiConfigured } from '@/shared/lib'
import { MOCK_FIND_EMAIL, MOCK_FIND_EMAIL_NOT_FOUND_NAME_HINT } from '../lib/constants'
import { parseEmailRecoveryLookupResponse } from './parse'
import type {
  EmailRecoveryLookupRequest,
  EmailRecoveryLookupResponse,
  FindEmailLookupResult,
} from './types'

type SkipAuthConfig = InternalAxiosRequestConfig & {
  skipAuth?: boolean
  skipRefresh?: boolean
}

export type LookupFindEmailInput = EmailRecoveryLookupRequest & {
  /** mock 전용 — 실 API에서는 무시 */
  mockNotFoundHint?: string
}

/**
 * 완료 화면에 보여 줄 이메일. 본인인증 후 결과라 서버 `accounts[].email` 원문을 쓴다(정책 10/26 사용자 플랫폼 3).
 * 원문이 없는 응답(이전 계약)일 때만 `maskedEmail`로 대신한다.
 */
function resolveFoundEmail(result: EmailRecoveryLookupResponse): string | undefined {
  const rawEmail = result.accounts?.find(account => account.email?.trim())?.email?.trim()
  if (rawEmail) return rawEmail

  if (result.maskedEmail?.trim()) {
    return result.maskedEmail.trim()
  }
  return result.accounts?.find(account => account.maskedEmail?.trim())?.maskedEmail?.trim()
}

async function lookupFindEmailMock(input: LookupFindEmailInput): Promise<FindEmailLookupResult> {
  await new Promise(resolve => {
    window.setTimeout(resolve, 300)
  })

  if (input.mockNotFoundHint?.includes(MOCK_FIND_EMAIL_NOT_FOUND_NAME_HINT)) {
    return { kind: 'not_found' }
  }

  return { kind: 'found', email: MOCK_FIND_EMAIL }
}

async function lookupFindEmailRemote(input: LookupFindEmailInput): Promise<FindEmailLookupResult> {
  const { data } = await axiosClient.post<unknown>(
    portalAuthPaths.emailRecoveryLookup(),
    {
      identityVerificationSessionId: input.identityVerificationSessionId,
      profileToken: input.profileToken.trim(),
    },
    {
      skipAuth: true,
      skipRefresh: true,
    } as SkipAuthConfig,
  )

  const parsed = parseEmailRecoveryLookupResponse(data)
  const email = resolveFoundEmail(parsed)

  if (!parsed.matched || !email) {
    return { kind: 'not_found' }
  }

  return { kind: 'found', email }
}

/** POST /api/portal/auth/email-recovery/lookup — PUBLIC */
export async function lookupFindEmail(input: LookupFindEmailInput): Promise<FindEmailLookupResult> {
  if (isRemoteApiConfigured()) {
    return lookupFindEmailRemote(input)
  }

  return lookupFindEmailMock(input)
}
