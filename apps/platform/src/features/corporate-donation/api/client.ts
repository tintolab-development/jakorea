import type { InternalAxiosRequestConfig } from 'axios'
import { axiosClient } from '@/shared/api/axios-instance'
import type {
  PublicCorporateConsultationCreateRequest,
  PublicCorporateConsultationCreateResponse,
  PublicCorporateSponsorResponse,
  PublicCorporateSponsorshipResponse,
} from './types'

type SkipAuthConfig = InternalAxiosRequestConfig & {
  skipAuth?: boolean
  skipRefresh?: boolean
}

function unwrapEnvelope<T>(payload: unknown): T {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    if (record.success === true && 'data' in record) {
      return unwrapEnvelope<T>(record.data)
    }
  }
  return payload as T
}

const SKIP_AUTH: SkipAuthConfig = {
  timeout: 8_000,
  skipAuth: true,
  skipRefresh: true,
} as SkipAuthConfig

/** GET /api/public/sponsorship/corporate — 인증 불필요 */
export async function fetchPublicCorporateSponsorship(
  signal?: AbortSignal,
): Promise<PublicCorporateSponsorshipResponse> {
  const { data } = await axiosClient.get<unknown>('/api/public/sponsorship/corporate', {
    ...SKIP_AUTH,
    signal,
  })
  return unwrapEnvelope<PublicCorporateSponsorshipResponse>(data)
}

/** GET /api/public/sponsorship/corporate/sponsors — 인증 불필요 */
export async function fetchPublicCorporateSponsors(
  signal?: AbortSignal,
): Promise<PublicCorporateSponsorResponse[]> {
  const { data } = await axiosClient.get<unknown>('/api/public/sponsorship/corporate/sponsors', {
    ...SKIP_AUTH,
    signal,
  })
  const unwrapped = unwrapEnvelope<unknown>(data)
  if (Array.isArray(unwrapped)) return unwrapped as PublicCorporateSponsorResponse[]
  if (unwrapped && typeof unwrapped === 'object') {
    const items = (unwrapped as { items?: unknown }).items
    if (Array.isArray(items)) return items as PublicCorporateSponsorResponse[]
  }
  return []
}

/** POST /api/public/sponsorship/corporate-consultations — 인증 불필요 */
export async function createPublicCorporateConsultation(
  body: PublicCorporateConsultationCreateRequest,
): Promise<PublicCorporateConsultationCreateResponse> {
  const { data } = await axiosClient.post<unknown>(
    '/api/public/sponsorship/corporate-consultations',
    body,
    SKIP_AUTH,
  )
  return unwrapEnvelope<PublicCorporateConsultationCreateResponse>(data)
}
