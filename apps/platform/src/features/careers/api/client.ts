import type { InternalAxiosRequestConfig } from 'axios'
import { axiosClient } from '@/shared/api/axios-instance'
import { withFileUploadOverlay } from '@/shared/lib/file-upload-overlay'
import { validateUploadFileSize } from '@/shared/lib/file-upload-policy'
import { resolveHomepagePresignedUploadUrl } from '@/shared/lib/presigned-upload-url'
import type {
  PublicCareerGuideResponse,
  PublicCareerPostingDetail,
  PublicCareerPostingListQuery,
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
  const sizeError = validateUploadFileSize(file)
  if (sizeError) throw new Error(sizeError)
  return resolveAttachmentContentType(file)
}

/** GET /api/public/careers/guide — 인증 불필요 */
export async function fetchPublicCareerGuide(
  signal?: AbortSignal
): Promise<PublicCareerGuideResponse> {
  const { data } = await axiosClient.get<unknown>('/api/public/careers/guide', {
    ...SKIP_AUTH,
    signal,
  })
  return unwrapEnvelope<PublicCareerGuideResponse>(data)
}

const CAREER_POSTINGS_PATH = '/api/public/careers/postings'
const ADJACENT_POSTINGS_PAGE_SIZE = 100

function emptyCareerPostingPage(
  query: PublicCareerPostingListQuery
): PublicCareerPostingListResponse {
  return {
    items: [],
    totalCount: 0,
    page: query.page,
    size: query.size,
    totalPages: 0,
  }
}

/** GET /api/public/careers/postings — 인증 불필요. RECRUITING·RESULT만. 탭 쿼리 없음. */
export async function fetchPublicCareerPostings(
  query: PublicCareerPostingListQuery,
  signal?: AbortSignal
): Promise<PublicCareerPostingListResponse> {
  const q = query.q?.trim()
  const { data } = await axiosClient.get<unknown>(CAREER_POSTINGS_PATH, {
    ...SKIP_AUTH,
    signal,
    params: {
      ...(q ? { q } : {}),
      page: query.page,
      size: query.size,
    },
  })
  const unwrapped = unwrapEnvelope<PublicCareerPostingListResponse>(data)
  if (!unwrapped || typeof unwrapped !== 'object') {
    return emptyCareerPostingPage(query)
  }
  return {
    items: Array.isArray(unwrapped.items) ? unwrapped.items : [],
    totalCount: unwrapped.totalCount ?? 0,
    page: unwrapped.page ?? query.page,
    size: unwrapped.size ?? query.size,
    totalPages: unwrapped.totalPages ?? 0,
  }
}

/**
 * 상세 인접글용. q 없이 page=0&size=100부터 totalCount까지 이어 받는다.
 * 목록 화면 쿼리(size=10)와 공유하지 않는다.
 */
export async function fetchPublicCareerPostingsForAdjacent(
  signal?: AbortSignal
): Promise<PublicCareerPostingListResponse> {
  const first = await fetchPublicCareerPostings(
    { page: 0, size: ADJACENT_POSTINGS_PAGE_SIZE },
    signal
  )
  const items = [...(first.items ?? [])]
  const totalCount = first.totalCount ?? items.length
  let page = 1
  while (items.length < totalCount) {
    const next = await fetchPublicCareerPostings(
      { page, size: ADJACENT_POSTINGS_PAGE_SIZE },
      signal
    )
    const batch = next.items ?? []
    if (batch.length === 0) break
    items.push(...batch)
    page += 1
  }
  return {
    items,
    totalCount,
    page: 0,
    size: ADJACENT_POSTINGS_PAGE_SIZE,
    totalPages: first.totalPages,
  }
}

/**
 * GET /api/public/careers/postings/{key} — 인증 불필요.
 * key는 목록 id와 같다 (externalKey 우선, 없으면 숫자 id).
 */
export async function fetchPublicCareerPostingDetail(
  key: string,
  signal?: AbortSignal
): Promise<PublicCareerPostingDetail> {
  const { data } = await axiosClient.get<unknown>(
    `/api/public/careers/postings/${encodeURIComponent(key)}`,
    {
      ...SKIP_AUTH,
      signal,
    }
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
    SKIP_AUTH
  )
  return unwrapEnvelope<PrepareResponse>(data)
}

async function confirmCareerTalentAttachment(
  assetId: number,
  version: number,
  uploadToken: string
): Promise<void> {
  await axiosClient.post(
    `/api/public/careers/talent-applications/attachments/${assetId}/confirm`,
    { version, uploadToken },
    SKIP_AUTH
  )
}

/**
 * 선택 증빙 — careers 전용 prepare → PUT → confirm → assetId.
 * sponsorship / corporate attachment path 재사용 금지.
 */
export async function uploadCareerTalentApplicationAttachment(file: File): Promise<number> {
  const contentType = assertAttachmentAllowed(file)
  return withFileUploadOverlay(() => uploadPreparedCareerTalentAttachment(file, contentType))
}

async function uploadPreparedCareerTalentAttachment(
  file: File,
  contentType: string,
): Promise<number> {
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

  const uploadRes = await fetch(resolveHomepagePresignedUploadUrl(uploadUrl), {
    method,
    headers,
    body: file,
  })
  if (!uploadRes.ok) {
    throw new Error(`첨부 업로드에 실패했습니다. (${uploadRes.status})`)
  }

  await confirmCareerTalentAttachment(assetId, version, prepared.uploadToken ?? '')
  return assetId
}

/** POST /api/public/careers/talent-applications — 인증 불필요 */
export async function createPublicCareerTalentApplication(
  body: PublicCareerTalentApplicationCreateRequest
): Promise<PublicCareerTalentApplicationCreateResponse> {
  const { data } = await axiosClient.post<unknown>(
    '/api/public/careers/talent-applications',
    body,
    SKIP_AUTH
  )
  return unwrapEnvelope<PublicCareerTalentApplicationCreateResponse>(data)
}
