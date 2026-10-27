import type { InternalAxiosRequestConfig } from 'axios'
import { axiosClient } from '@/shared/api/axios-instance'
import { withFileUploadOverlay } from '@/shared/lib/file-upload-overlay'
import { resolveHomepagePresignedUploadUrl } from '@/shared/lib/presigned-upload-url'
import type {
  PublicCorporateConsultationCreateRequest,
  PublicCorporateConsultationCreateResponse,
  PublicCorporateSponsorResponse,
  PublicCorporateSponsorshipResponse,
} from './types'

type PrepareResponse = {
  assetId?: number
  version?: number
  uploadToken?: string
  method?: string
  uploadUrl?: string
  requiredHeaders?: Record<string, string>
}

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

async function prepareCorporateConsultationAttachment(file: File): Promise<PrepareResponse> {
  const { data } = await axiosClient.post<unknown>(
    '/api/public/sponsorship/corporate-consultations/attachments/upload-requests',
    {
      originalName: file.name,
      contentType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
    },
    SKIP_AUTH,
  )
  return unwrapEnvelope<PrepareResponse>(data)
}

async function confirmCorporateConsultationAttachment(
  assetId: number,
  version: number,
  uploadToken: string,
): Promise<void> {
  await axiosClient.post(
    `/api/public/sponsorship/corporate-consultations/attachments/${assetId}/confirm`,
    { version, uploadToken },
    SKIP_AUTH,
  )
}

async function uploadPreparedCorporateConsultationAttachment(
  file: File,
): Promise<{ assetId: number; uploadToken: string }> {
  const prepared = await prepareCorporateConsultationAttachment(file)
  const assetId = prepared.assetId
  const version = prepared.version
  const uploadToken = prepared.uploadToken?.trim()
  const uploadUrl = prepared.uploadUrl

  if (assetId == null || version == null || !uploadToken || !uploadUrl) {
    throw new Error('첨부 업로드 준비에 실패했습니다.')
  }

  const method = (prepared.method ?? 'PUT').toUpperCase()
  const headers: Record<string, string> = { ...(prepared.requiredHeaders ?? {}) }
  if (!headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = file.type || 'application/octet-stream'
  }

  const uploadResponse = await fetch(resolveHomepagePresignedUploadUrl(uploadUrl), {
    method,
    headers,
    body: file,
  })
  if (!uploadResponse.ok) {
    throw new Error(`첨부 업로드에 실패했습니다. (${uploadResponse.status})`)
  }

  await confirmCorporateConsultationAttachment(assetId, version, uploadToken)
  return { assetId, uploadToken }
}

/** 선택 첨부 — prepare → presigned upload → confirm → capability pair */
export async function uploadPublicCorporateConsultationAttachment(
  file: File,
): Promise<{ assetId: number; uploadToken: string }> {
  return withFileUploadOverlay(() => uploadPreparedCorporateConsultationAttachment(file))
}
