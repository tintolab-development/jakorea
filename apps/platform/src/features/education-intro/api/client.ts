import type { InternalAxiosRequestConfig } from 'axios'
import { axiosClient } from '@/shared/api/axios-instance'
import type { PublicProgramIntroFieldCode, PublicProgramIntroResponse } from './types'

type SkipAuthConfig = InternalAxiosRequestConfig & {
  skipAuth?: boolean
  skipRefresh?: boolean
}

function unwrapEnvelope<T>(payload: unknown): T {
  if (payload && typeof payload === 'object') {
    const o = payload as Record<string, unknown>
    if (o.success === true && 'data' in o) {
      return unwrapEnvelope<T>(o.data)
    }
  }
  return payload as T
}

const SKIP_AUTH: SkipAuthConfig = {
  timeout: 8_000,
  skipAuth: true,
  skipRefresh: true,
} as SkipAuthConfig

/** GET /api/public/education/program-intros/{fieldCode} — 인증 불필요 */
export async function fetchPublicProgramIntro(
  fieldCode: PublicProgramIntroFieldCode,
  signal?: AbortSignal,
): Promise<PublicProgramIntroResponse> {
  const { data } = await axiosClient.get<unknown>(
    `/api/public/education/program-intros/${fieldCode}`,
    { ...SKIP_AUTH, signal },
  )
  return unwrapEnvelope<PublicProgramIntroResponse>(data)
}
