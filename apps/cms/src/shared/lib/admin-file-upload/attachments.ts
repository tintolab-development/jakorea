import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import type { FileAttachmentCreateRequest } from '@/shared/api/generated/posts/schemas/fileAttachmentCreateRequest'
import type { FileAttachmentResponse } from '@/shared/api/generated/posts/schemas/fileAttachmentResponse'
import type { FileDownloadResolveResponse } from '@/shared/api/generated/posts/schemas/fileDownloadResolveResponse'
import type { FilePageResponseFileAttachmentResponse } from '@/shared/api/generated/posts/schemas/filePageResponseFileAttachmentResponse'
import { customInstance } from '@/shared/api/orval-mutator'
import { axiosClient } from '@/shared/instance/axios-instance'
import { downloadBlob, ruleFileNameFromContentDisposition } from '@/shared/utils/file-download'
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

export async function getFileDownload(
  fileObjectId: number,
  options?: { skipGlobalErrorAlert?: boolean }
): Promise<FileDownloadResolveResponse> {
  return unwrapApiBody<FileDownloadResolveResponse>(
    await customInstance<FileDownloadResolveResponse>(
      {
        url: `/api/admin/files/${fileObjectId}/download`,
        method: 'GET',
      },
      options?.skipGlobalErrorAlert === true ? { skipGlobalErrorAlert: true } : undefined
    )
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
  containedPiiTypes?: string[] | null
}

/** responseType blob 오류 본문(JSON Blob)을 error.response.data 객체로 복원한다. */
export async function hydrateAxiosBlobError(error: unknown): Promise<unknown> {
  if (!axios.isAxiosError(error) || error.response == null) return error
  const data = error.response.data
  if (!(data instanceof Blob)) return error
  try {
    const text = await data.text()
    if (!text.trim()) return error
    error.response.data = JSON.parse(text) as unknown
  } catch {
    return error
  }
  return error
}

async function throwIfSensitiveStreamJsonError(payload: Blob): Promise<void> {
  if (!payload.type.includes('json')) return
  const error = new AxiosError('민감 파일을 불러오지 못했습니다.')
  error.response = {
    data: payload,
    status: 409,
    statusText: 'Conflict',
    headers: {},
    config: error.config ?? ({ headers: {} } as InternalAxiosRequestConfig),
  }
  throw await hydrateAxiosBlobError(error)
}

/**
 * 민감 파일은 claim(`POST .../sensitive-downloads`)으로 relayToken을 받은 뒤
 * stream에 reason과 토큰을 함께 실어야 바이트가 온다.
 */
export async function loadSensitiveAdminFileBlob(input: {
  fileObjectId: number
  reason: string
  claimPath?: string | null
  password?: string
}): Promise<Blob> {
  const password = input.password?.trim()
  const claimPath =
    input.claimPath?.trim() || `/api/admin/files/${input.fileObjectId}/sensitive-downloads`
  const claim = unwrapApiBody<SensitiveRelayClaim>(
    await customInstance(
      {
        url: claimPath,
        method: 'POST',
        data: { reason: input.reason, ...(password ? { password } : {}) },
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
  let payload: Blob
  try {
    payload = await customInstance<Blob>(
      {
        url: streamUrl,
        method: 'POST',
        headers: {
          Accept:
            'application/pdf, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/zip, application/octet-stream, application/json, */*',
        },
        data: { reason: input.reason, relayToken, ...(password ? { password } : {}) },
        responseType: 'blob',
      },
      { skipGlobalErrorAlert: true }
    )
  } catch (error) {
    throw await hydrateAxiosBlobError(error)
  }
  if (!(payload instanceof Blob) || payload.size < 1) {
    throw new Error('민감 파일을 불러오지 못했습니다.')
  }
  await throwIfSensitiveStreamJsonError(payload)
  return payload
}

/** 인증이 필요한 파일을 img에 넣지 않고 blob으로 미리본다. */
export async function loadAdminFileBlob(
  fileObjectId: number,
  options?: { skipGlobalErrorAlert?: boolean }
): Promise<Blob> {
  const resolved = await getFileDownload(fileObjectId, options)
  const downloadUrl = resolved.downloadUrl?.trim()
  if (!downloadUrl) {
    throw new Error('첨부파일 다운로드 URL을 받지 못했습니다.')
  }
  return readDownloadBlob(downloadUrl, headerRecord(resolved.requiredHeaders))
}

/**
 * 서버 relay가 받는 시점에 file-access 이력(DOWNLOAD_COMPLETED)을 남기는 주소인지.
 * 현재는 포털 제출 지출 증빙 `/api/admin/files/expense-receipts/{id}/relay/{token}` 만 해당한다.
 */
export function isServerRecordedRelayDownloadUrl(downloadUrl: string): boolean {
  try {
    const { pathname } = new URL(downloadUrl, 'http://localhost')
    return /^\/api\/admin\/files\/expense-receipts\/\d+\/relay\/[^/]+\/?$/.test(pathname)
  } catch {
    return false
  }
}

/** 영수증 relay: 성공은 바이너리, 실패(403/409)는 ApiResponse JSON. */
const RECEIPT_RELAY_ACCEPT = 'application/octet-stream, application/json'

function readContentDisposition(headers: unknown): string | null {
  if (!headers || typeof headers !== 'object') return null
  for (const [key, value] of Object.entries(headers as Record<string, unknown>)) {
    if (key.toLowerCase() !== 'content-disposition') continue
    return typeof value === 'string' && value.trim() ? value : null
  }
  return null
}

/**
 * 지출 증빙 relay 주소를 받는다. 토큰이 인증이라 Bearer 없이 보낸다.
 * 실패 응답은 JSON 본문을 복원한 axios 오류로 던져 화면이 서버 안내(error.message)를 보여 주게 한다.
 */
async function readReceiptRelayDownload(
  downloadUrl: string,
  headers: Record<string, string>
): Promise<{ blob: Blob; contentDisposition: string | null }> {
  const url = toSameOriginApiPath(downloadUrl, getApiBaseUrl()) ?? downloadUrl
  let response: AxiosResponse<unknown>
  try {
    response = await axiosClient.request<unknown>({
      url,
      method: 'GET',
      responseType: 'blob',
      headers: { ...headers, Accept: RECEIPT_RELAY_ACCEPT },
      skipGlobalErrorAlert: true,
      skipAuth: true,
    } as AxiosRequestConfig & { skipGlobalErrorAlert: boolean; skipAuth: boolean })
  } catch (error) {
    throw await hydrateAxiosBlobError(error)
  }
  const blob = response.data
  if (!(blob instanceof Blob) || blob.size < 1 || blob.type.includes('json')) {
    throw new Error('첨부파일 다운로드에 실패했습니다.')
  }
  return { blob, contentDisposition: readContentDisposition(response.headers) }
}

const DOWNLOAD_EXTENSION_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'application/pdf': 'pdf',
}

/** 이름에 확장자가 없을 때만 파일 형식(MIME)으로 확장자를 붙인다. 모르는 형식이면 그대로 둔다. */
export function withDownloadExtension(fileName: string, mimeType: string | undefined): string {
  if (/\.[A-Za-z0-9]{1,5}$/.test(fileName)) return fileName
  const extension = DOWNLOAD_EXTENSION_BY_MIME[(mimeType ?? '').split(';')[0].trim().toLowerCase()]
  return extension ? `${fileName}.${extension}` : fileName
}

/**
 * 파일 다운로드 API가 준 주소로 원본 파일을 저장한다.
 * 일반 파일은 서버가 URL 발급만 기록하므로 client 이력을 남기고,
 * 서버 relay가 기록하는 주소(지출 증빙)는 client 이력을 생략한다.
 */
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
  if (isServerRecordedRelayDownloadUrl(downloadUrl)) {
    // 서버가 DOWNLOAD_COMPLETED 이력을 남기고 헤더에 규칙 이름을 준다. 헤더가 없을 때만 원본 이름에 규칙을 적용한다.
    const relay = await readReceiptRelayDownload(downloadUrl, headers)
    const saveName = ruleFileNameFromContentDisposition(
      relay.contentDisposition,
      withDownloadExtension(fileName, relay.blob.type)
    )
    await downloadBlob(relay.blob, saveName, { skipAccessLog: true })
    return
  }
  let blob: Blob
  try {
    blob = await readDownloadBlob(downloadUrl, headers)
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('첨부파일 다운로드에 실패했습니다.')) {
      throw error
    }
    throw new Error('첨부파일 다운로드에 실패했습니다.')
  }
  await downloadBlob(blob, withDownloadExtension(fileName, blob.type), {
    skipAccessLog: isServerRecordedRelayDownloadUrl(downloadUrl),
  })
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
