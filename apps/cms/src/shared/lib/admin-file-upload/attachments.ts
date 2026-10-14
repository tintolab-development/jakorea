import type { FileAttachmentCreateRequest } from '@/shared/api/generated/posts/schemas/fileAttachmentCreateRequest'
import type { FileAttachmentResponse } from '@/shared/api/generated/posts/schemas/fileAttachmentResponse'
import type { FileDownloadResolveResponse } from '@/shared/api/generated/posts/schemas/fileDownloadResolveResponse'
import type { FilePageResponseFileAttachmentResponse } from '@/shared/api/generated/posts/schemas/filePageResponseFileAttachmentResponse'
import { customInstance } from '@/shared/api/orval-mutator'
import { downloadBlob } from '@/shared/utils/file-download'
import { getApiBaseUrl } from '@/shared/lib/api-remote-env'
import { parseFileObjectId } from '@/shared/lib/admin-file-upload/upload'
import type { AdminFileUploadOwner } from '@/shared/lib/admin-file-upload/types'
import { fetchAllApiPages } from '@/shared/lib/fetch-all-api-pages'

function unwrapApiBody<T>(payload: unknown): T {
  if (payload != null && typeof payload === 'object') {
    const body = payload as Record<string, unknown>
    if (body.success === true && 'data' in body) {
      return unwrapApiBody<T>(body.data)
    }
    if ('data' in body && 'status' in body && typeof body.status === 'number') {
      return body.data as T
    }
  }
  return payload as T
}

export type CreateFileAttachmentInput = {
  fileObjectId: number
  owner: AdminFileUploadOwner
  attachmentType: string
  displayOrder?: number
}

function attachmentItems(
  dto: FilePageResponseFileAttachmentResponse | FileAttachmentResponse[] | null | undefined
): FileAttachmentResponse[] {
  if (Array.isArray(dto)) return dto
  if (dto == null || typeof dto !== 'object') return []
  if (Array.isArray(dto.items)) return dto.items
  const record = dto as { content?: FileAttachmentResponse[] }
  if (Array.isArray(record.content)) return record.content
  return []
}

export async function createFileAttachment(
  input: CreateFileAttachmentInput
): Promise<FileAttachmentResponse> {
  if (input.owner.ownerId == null) {
    throw new Error('파일 연결에 필요한 소유 대상이 없습니다.')
  }
  const body: FileAttachmentCreateRequest = {
    fileObjectId: input.fileObjectId,
    ownerDomain: input.owner.ownerDomain,
    ownerType: input.owner.ownerType,
    ownerId: input.owner.ownerId,
    attachmentType: input.attachmentType?.trim() || 'DEFAULT',
    displayOrder: input.displayOrder,
  }
  return unwrapApiBody<FileAttachmentResponse>(
    await customInstance<FileAttachmentResponse>({
      url: '/api/admin/files/attachments',
      method: 'POST',
      data: body,
    })
  )
}

export async function listFileAttachments(
  owner: Pick<AdminFileUploadOwner, 'ownerDomain' | 'ownerType' | 'ownerId'>
): Promise<FileAttachmentResponse[]> {
  if (owner.ownerId == null) {
    throw new Error('파일 목록 조회에 필요한 소유 대상이 없습니다.')
  }
  const items = await fetchAllApiPages(async (page, size) => {
    const dto = unwrapApiBody<FilePageResponseFileAttachmentResponse>(
      await customInstance<FilePageResponseFileAttachmentResponse>({
        url: '/api/admin/files/attachments',
        method: 'GET',
        params: {
          ownerDomain: owner.ownerDomain,
          ownerType: owner.ownerType,
          ownerId: owner.ownerId,
          page,
          size,
        },
      })
    )
    return {
      items: attachmentItems(dto),
      totalPages: (dto as { totalPages?: number }).totalPages,
    }
  })
  return items
}

export async function deleteFileObject(fileObjectId: number): Promise<void> {
  await customInstance({
    url: `/api/admin/files/${fileObjectId}`,
    method: 'DELETE',
  })
}

export async function getFileDownload(fileObjectId: number): Promise<FileDownloadResolveResponse> {
  return unwrapApiBody<FileDownloadResolveResponse>(
    await customInstance<FileDownloadResolveResponse>({
      url: `/api/admin/files/${fileObjectId}/download`,
      method: 'GET',
    })
  )
}

function headerRecord(
  requiredHeaders: FileDownloadResolveResponse['requiredHeaders']
): Record<string, string> {
  const headers: Record<string, string> = {}
  for (const [key, value] of Object.entries(requiredHeaders ?? {})) {
    if (typeof value === 'string' && value) headers[key] = value
  }
  return headers
}

/**
 * 로컬 서명 URL은 백엔드가 `http://localhost:8080/...`처럼 절대 주소로 준다.
 * CMS는 Vite 프록시라 API는 페이지와 같은 출처인데, 이 주소만 다른 출처라
 * CORS에 없는 포트·IP에서는 blob 요청이 실패하고 새 창이 이미지를 그대로 연다.
 * 같은 출처 `/api` 경로로 바꾸면 프록시를 타고 저장된다. S3 등 외부 주소는 그대로 둔다.
 */
export function sameOriginRawDownloadPath(downloadUrl: string, apiBaseUrl: string): string | null {
  if (apiBaseUrl.trim()) return null
  try {
    const url = new URL(downloadUrl, 'http://localhost')
    if (!url.pathname.startsWith('/api/') || !url.pathname.includes('/downloads/raw/')) return null
    return `${url.pathname}${url.search}`
  } catch {
    return null
  }
}

/** 로컬 백엔드가 준 절대 `/api` 주소를 페이지 출처 경로로 되돌린다. */
export function toSameOriginApiPath(downloadUrl: string, apiBaseUrl: string): string | null {
  if (apiBaseUrl.trim() || !/^https?:\/\//i.test(downloadUrl)) return null
  try {
    const url = new URL(downloadUrl)
    if (!url.pathname.startsWith('/api/')) return null
    return `${url.pathname}${url.search}`
  } catch {
    return null
  }
}

/** `/api/admin/files/{id}/content|download` 에서 파일 id를 읽는다. */
export function fileObjectIdFromAdminFileUrl(fileUrl: string): number | null {
  const match = fileUrl.match(/\/api\/admin\/files\/(\d+)\/(?:content|download)(?:[/?#]|$)/)
  if (!match) return null
  const id = Number(match[1])
  return Number.isFinite(id) && id > 0 ? id : null
}

async function readDownloadBlob(downloadUrl: string, headers: Record<string, string>): Promise<Blob> {
  const proxiedPath = sameOriginRawDownloadPath(downloadUrl, getApiBaseUrl())
  if (proxiedPath) {
    return customInstance<Blob>(
      {
        url: proxiedPath,
        method: 'GET',
        responseType: 'blob',
        headers,
      },
      { skipGlobalErrorAlert: true, skipAuth: true }
    )
  }
  if (/^https?:\/\//i.test(downloadUrl)) {
    const response = await fetch(downloadUrl, {
      method: 'GET',
      headers,
      credentials: 'omit',
      mode: 'cors',
    })
    if (!response.ok) {
      throw new Error(`첨부파일 다운로드에 실패했습니다. (${response.status})`)
    }
    return response.blob()
  }
  return customInstance<Blob>(
    {
      url: downloadUrl,
      method: 'GET',
      responseType: 'blob',
      headers,
    },
    { skipGlobalErrorAlert: true, skipAuth: true }
  )
}

type SensitiveRelayClaim = {
  relayToken?: string | null
  streamUrl?: string | null
}

/**
 * 민감 파일은 claim(`POST .../sensitive-downloads`)으로 relayToken을 받은 뒤
 * stream에 reason과 토큰을 함께 실어야 바이트가 온다.
 */
export async function loadSensitiveAdminFileBlob(input: {
  fileObjectId: number
  reason: string
  claimPath?: string | null
}): Promise<Blob> {
  const claimPath =
    input.claimPath?.trim() || `/api/admin/files/${input.fileObjectId}/sensitive-downloads`
  const claim = unwrapApiBody<SensitiveRelayClaim>(
    await customInstance(
      {
        url: claimPath,
        method: 'POST',
        data: { reason: input.reason },
      },
      { skipGlobalErrorAlert: true }
    )
  )
  const relayToken = claim.relayToken?.trim()
  if (!relayToken) {
    throw new Error('민감 파일 다운로드 토큰을 받지 못했습니다.')
  }
  const rawStreamUrl =
    claim.streamUrl?.trim() ||
    `/api/admin/files/${input.fileObjectId}/sensitive-downloads/stream`
  const streamUrl = toSameOriginApiPath(rawStreamUrl, getApiBaseUrl()) ?? rawStreamUrl
  const payload = await customInstance<Blob>(
    {
      url: streamUrl,
      method: 'POST',
      data: { reason: input.reason, relayToken },
      responseType: 'blob',
    },
    { skipGlobalErrorAlert: true }
  )
  if (!(payload instanceof Blob) || payload.size < 1 || payload.type === 'application/json') {
    throw new Error('민감 파일을 불러오지 못했습니다.')
  }
  return payload
}

/** 인증이 필요한 파일을 img에 넣지 않고 blob으로 미리본다. */
export async function loadAdminFileBlob(fileObjectId: number): Promise<Blob> {
  const resolved = await getFileDownload(fileObjectId)
  const downloadUrl = resolved.downloadUrl?.trim()
  if (!downloadUrl) {
    throw new Error('첨부파일 다운로드 URL을 받지 못했습니다.')
  }
  return readDownloadBlob(downloadUrl, headerRecord(resolved.requiredHeaders))
}

/** 파일 다운로드 API가 준 주소로 원본 파일을 저장한다. */
export async function downloadAdminFile(input: {
  fileObjectId: number
  fileName: string
}): Promise<void> {
  const resolved = await getFileDownload(input.fileObjectId)
  const downloadUrl = resolved.downloadUrl?.trim()
  if (!downloadUrl) {
    throw new Error('첨부파일 다운로드 URL을 받지 못했습니다.')
  }
  const fileName = input.fileName.trim() || `첨부파일-${input.fileObjectId}`
  const headers = headerRecord(resolved.requiredHeaders)
  let blob: Blob
  try {
    blob = await readDownloadBlob(downloadUrl, headers)
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('첨부파일 다운로드에 실패했습니다.')) {
      throw error
    }
    throw new Error('첨부파일 다운로드에 실패했습니다.')
  }
  await downloadBlob(blob, fileName)
}

export function getFileContentPath(fileObjectId: number): string {
  return `/api/admin/files/${fileObjectId}/content`
}

export async function fetchFileContentBlob(fileObjectId: number): Promise<Blob> {
  return customInstance<Blob>({
    url: getFileContentPath(fileObjectId),
    method: 'GET',
    responseType: 'blob',
  })
}

export function parseOwnerResourceId(value: unknown): number | null {
  return parseFileObjectId(value)
}
