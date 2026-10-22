import type { InternalAxiosRequestConfig } from 'axios'
import { axiosClient } from '@/shared/api/axios-instance'
import { withFileUploadOverlay } from '@/shared/lib/file-upload-overlay'
import { resolveHomepagePresignedUploadUrl } from '@/shared/lib/presigned-upload-url'
import type {
  PublicTalentApplicationCreateRequest,
  PublicTalentApplicationCreateResponse,
  PublicTalentIntroResponse,
} from './types'

type SkipAuthConfig = InternalAxiosRequestConfig & {
  skipAuth?: boolean
  skipRefresh?: boolean
}

type PrepareResponse = {
  assetId?: number
  version?: number
  uploadToken?: string
  method?: string
  uploadUrl?: string
  requiredHeaders?: Record<string, string>
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

/** GET /api/public/sponsorship/talent — 인증 불필요 */
export async function fetchPublicTalentIntro(
  signal?: AbortSignal,
): Promise<PublicTalentIntroResponse> {
  const { data } = await axiosClient.get<unknown>('/api/public/sponsorship/talent', {
    ...SKIP_AUTH,
    signal,
  })
  return unwrapEnvelope<PublicTalentIntroResponse>(data)
}

async function prepareTalentAttachment(file: File): Promise<PrepareResponse> {
  const { data } = await axiosClient.post<unknown>(
    '/api/public/sponsorship/talent-applications/attachments/upload-requests',
    {
      originalName: file.name,
      contentType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
    },
    SKIP_AUTH,
  )
  return unwrapEnvelope<PrepareResponse>(data)
}

async function confirmTalentAttachment(
  assetId: number,
  version: number,
  uploadToken: string,
): Promise<void> {
  await axiosClient.post(
    `/api/public/sponsorship/talent-applications/attachments/${assetId}/confirm`,
    { version, uploadToken },
    SKIP_AUTH,
  )
}

/** 선택 첨부 — prepare → PUT uploadUrl → confirm → assetId */
export async function uploadTalentApplicationAttachment(file: File): Promise<number> {
  return withFileUploadOverlay(() => uploadPreparedTalentApplicationAttachment(file))
}

async function uploadPreparedTalentApplicationAttachment(file: File): Promise<number> {
  const prepared = await prepareTalentAttachment(file)
  const assetId = prepared.assetId
  const version = prepared.version
  const uploadUrl = prepared.uploadUrl
  if (assetId == null || version == null || !uploadUrl) {
    throw new Error('첨부 업로드 준비에 실패했습니다.')
  }

  const method = (prepared.method ?? 'PUT').toUpperCase()
  const headers: Record<string, string> = { ...(prepared.requiredHeaders ?? {}) }
  if (!headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = file.type || 'application/octet-stream'
  }

  const uploadRes = await fetch(resolveHomepagePresignedUploadUrl(uploadUrl), {
    method,
    headers,
    body: file,
  })
  if (!uploadRes.ok) {
    throw new Error(`첨부 업로드에 실패했습니다. (${uploadRes.status})`)
  }

  await confirmTalentAttachment(assetId, version, prepared.uploadToken ?? '')
  return assetId
}

/** POST /api/public/sponsorship/talent-applications — 인증 불필요 */
export async function createPublicTalentApplication(
  body: PublicTalentApplicationCreateRequest,
): Promise<PublicTalentApplicationCreateResponse> {
  const { data } = await axiosClient.post<unknown>(
    '/api/public/sponsorship/talent-applications',
    body,
    SKIP_AUTH,
  )
  return unwrapEnvelope<PublicTalentApplicationCreateResponse>(data)
}
