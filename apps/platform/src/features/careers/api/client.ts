import type { InternalAxiosRequestConfig } from 'axios'
import { axiosClient } from '@/shared/api/axios-instance'
import type {
  PublicCareerGuideResponse,
  PublicCareerPostingDetail,
  PublicCareerPostingListResponse,
  PublicCareerTalentApplicationCreateRequest,
  PublicCareerTalentApplicationCreateResponse,
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

const ALLOWED_ATTACHMENT_TYPES = new Set(['application/pdf', 'image/jpeg', 'image/png'])
const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024

function resolveAttachmentContentType(file: File): string {
  const type = (file.type || '').toLowerCase().trim()
  if (ALLOWED_ATTACHMENT_TYPES.has(type)) return type
  const name = file.name.toLowerCase()
  if (name.endsWith('.pdf')) return 'application/pdf'
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg'
  if (name.endsWith('.png')) return 'image/png'
  throw new Error('증빙서류는 PDF, JPG, PNG만 첨부할 수 있습니다.')
}

function assertAttachmentAllowed(file: File): string {
  if (file.size <= 0) {
    throw new Error('첨부 파일이 비어 있습니다.')
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    throw new Error('증빙서류는 15MB 이하만 첨부할 수 있습니다.')
  }
  return resolveAttachmentContentType(file)
}

/** GET /api/public/careers/guide — 인증 불필요 */
export async function fetchPublicCareerGuide(
  signal?: AbortSignal,
): Promise<PublicCareerGuideResponse> {
  const { data } = await axiosClient.get<unknown>('/api/public/careers/guide', {
    ...SKIP_AUTH,
    signal,
  })
  return unwrapEnvelope<PublicCareerGuideResponse>(data)
}

/** GET /api/public/careers/postings — 인증 불필요. RECRUITING·RESULT만. */
export async function fetchPublicCareerPostings(
  signal?: AbortSignal,
): Promise<PublicCareerPostingListResponse> {
  const { data } = await axiosClient.get<unknown>('/api/public/careers/postings', {
    ...SKIP_AUTH,
    signal,
  })
  return unwrapEnvelope<PublicCareerPostingListResponse>(data)
}

/**
 * GET /api/public/careers/postings/{key} — 인증 불필요.
 * key는 목록 id와 같다 (externalKey 우선, 없으면 숫자 id).
 */
export async function fetchPublicCareerPostingDetail(
  key: string,
  signal?: AbortSignal,
): Promise<PublicCareerPostingDetail> {
  const { data } = await axiosClient.get<unknown>(
    `/api/public/careers/postings/${encodeURIComponent(key)}`,
    {
      ...SKIP_AUTH,
      signal,
    },
  )
  return unwrapEnvelope<PublicCareerPostingDetail>(data)
}

async function prepareCareerTalentAttachment(file: File): Promise<PrepareResponse> {
  const contentType = assertAttachmentAllowed(file)
  const { data } = await axiosClient.post<unknown>(
    '/api/public/careers/talent-applications/attachments/upload-requests',
    {
      originalName: file.name,
      contentType,
      sizeBytes: file.size,
    },
    SKIP_AUTH,
  )
  return unwrapEnvelope<PrepareResponse>(data)
}

async function confirmCareerTalentAttachment(
  assetId: number,
  version: number,
  uploadToken: string,
): Promise<void> {
  await axiosClient.post(
    `/api/public/careers/talent-applications/attachments/${assetId}/confirm`,
    { version, uploadToken },
    SKIP_AUTH,
  )
}

/**
 * 선택 증빙 — careers 전용 prepare → PUT → confirm → assetId.
 * sponsorship / corporate attachment path 재사용 금지.
 */
export async function uploadCareerTalentApplicationAttachment(file: File): Promise<number> {
  const contentType = assertAttachmentAllowed(file)
  const prepared = await prepareCareerTalentAttachment(file)
  const assetId = prepared.assetId
  const version = prepared.version
  const uploadUrl = prepared.uploadUrl
  if (assetId == null || version == null || !uploadUrl) {
    throw new Error('첨부 업로드 준비에 실패했습니다.')
  }

  const method = (prepared.method ?? 'PUT').toUpperCase()
  const headers: Record<string, string> = { ...(prepared.requiredHeaders ?? {}) }
  if (!headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = contentType
  }

  const uploadRes = await fetch(uploadUrl, { method, headers, body: file })
  if (!uploadRes.ok) {
    throw new Error(`첨부 업로드에 실패했습니다. (${uploadRes.status})`)
  }

  await confirmCareerTalentAttachment(assetId, version, prepared.uploadToken ?? '')
  return assetId
}

/** POST /api/public/careers/talent-applications — 인증 불필요 */
export async function createPublicCareerTalentApplication(
  body: PublicCareerTalentApplicationCreateRequest,
): Promise<PublicCareerTalentApplicationCreateResponse> {
  const { data } = await axiosClient.post<unknown>(
    '/api/public/careers/talent-applications',
    body,
    SKIP_AUTH,
  )
  return unwrapEnvelope<PublicCareerTalentApplicationCreateResponse>(data)
}
