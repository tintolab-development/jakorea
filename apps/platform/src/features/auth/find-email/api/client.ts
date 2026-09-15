import type { InternalAxiosRequestConfig } from 'axios'
import { axiosClient } from '@/shared/api/axios-instance'
import { portalAuthPaths } from '@/features/auth/sign-in'
import { isRemoteApiConfigured } from '@/shared/lib'
import { MOCK_FIND_EMAIL_MASKED, MOCK_FIND_EMAIL_NOT_FOUND_NAME_HINT } from '../lib/constants'
import { parseEmailRecoveryLookupResponse } from './parse'
import type { EmailRecoveryLookupRequest, FindEmailLookupResult } from './types'

type SkipAuthConfig = InternalAxiosRequestConfig & {
  skipAuth?: boolean
  skipRefresh?: boolean
}

export type LookupFindEmailInput = EmailRecoveryLookupRequest & {
  /** mock 전용 — 실 API에서는 무시 */
  mockNotFoundHint?: string
}

function resolveMaskedEmail(result: { maskedEmail?: string; accounts?: Array<{ maskedEmail?: string }> }) {
  if (result.maskedEmail?.trim()) {
    return result.maskedEmail.trim()
  }

  const firstAccount = result.accounts?.find(account => account.maskedEmail?.trim())
  return firstAccount?.maskedEmail?.trim()
}

async function lookupFindEmailMock(input: LookupFindEmailInput): Promise<FindEmailLookupResult> {
  await new Promise(resolve => {
    window.setTimeout(resolve, 300)
  })

  if (input.mockNotFoundHint?.includes(MOCK_FIND_EMAIL_NOT_FOUND_NAME_HINT)) {
    return { kind: 'not_found' }
  }

  return { kind: 'found', maskedEmail: MOCK_FIND_EMAIL_MASKED }
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
  const maskedEmail = resolveMaskedEmail(parsed)

  if (!parsed.matched || !maskedEmail) {
    return { kind: 'not_found' }
  }

  return { kind: 'found', maskedEmail }
}

/** POST /api/portal/auth/email-recovery/lookup — PUBLIC */
export async function lookupFindEmail(input: LookupFindEmailInput): Promise<FindEmailLookupResult> {
  if (isRemoteApiConfigured()) {
    return lookupFindEmailRemote(input)
  }

  return lookupFindEmailMock(input)
}
