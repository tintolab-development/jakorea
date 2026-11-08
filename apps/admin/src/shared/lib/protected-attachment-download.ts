import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { axiosInstance } from '@/shared/instance/axios-instance'
import { readApiErrorMessage } from '@/shared/lib/api-error-message'

function resolveAttachmentUrl(assetId: number | null | undefined, byAsset: string, fallback: string) {
  return assetId != null && assetId > 0 ? byAsset : fallback
}

export function homepageRecruitAttachmentUrl(id: number, assetId?: number | null): string {
  return resolveAttachmentUrl(
    assetId,
    `/api/admin/careers/talent-applications/${id}/attachments/${assetId}/download`,
    `/api/admin/careers/talent-applications/${id}/attachment-download`
  )
}

export function homepageTalentDonationAttachmentUrl(id: number, assetId?: number | null): string {
  return resolveAttachmentUrl(
    assetId,
    `/api/admin/sponsorship/talent-applications/${id}/attachments/${assetId}/download`,
    `/api/admin/sponsorship/talent-applications/${id}/attachment-download`
  )
}

export function homepageCorporateConsultationAttachmentUrl(
  id: number,
  assetId?: number | null
): string {
  return resolveAttachmentUrl(
    assetId,
    `/api/admin/sponsorship/corporate-consultations/${id}/attachments/${assetId}/download`,
    `/api/admin/sponsorship/corporate-consultations/${id}/attachment-download`
  )
}

export const HOMEPAGE_PROTECTED_ATTACHMENT_ACCEPT =
  'application/pdf, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/zip, application/octet-stream, application/json, */*'

export function fileNameFromContentDisposition(header: string | undefined, fallback: string): string {
  if (!header) return fallback
  const star = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(header)?.[1]?.trim().replace(/^"|"$/g, '')
  if (star) {
    try {
      const decoded = decodeURIComponent(star).trim()
      if (decoded) return decoded
    } catch {
      /* ASCII filename */
    }
  }
  const quoted = /filename\s*=\s*"([^"]+)"/i.exec(header)?.[1]?.trim()
  if (quoted) return quoted
  const plain = /filename\s*=\s*([^";]+)/i.exec(header)?.[1]?.trim()
  return plain || fallback
}

function contentDispositionHeader(headers: unknown): string | undefined {
  if (headers == null || typeof headers !== 'object') return undefined
  const record = headers as Record<string, unknown> & { get?: (name: string) => unknown }
  const raw =
    (typeof record.get === 'function' ? record.get('content-disposition') : undefined) ??
    record['content-disposition'] ??
    record['Content-Disposition']
  if (typeof raw === 'string' && raw.trim()) return raw
  if (Array.isArray(raw) && typeof raw[0] === 'string' && raw[0].trim()) return raw[0]
  return undefined
}

function isBlobLike(data: unknown): data is Blob {
  if (typeof Blob !== 'undefined' && data instanceof Blob) return true
  return (
    typeof data === 'object' &&
    data != null &&
    typeof (data as Blob).size === 'number' &&
    (typeof (data as Blob).text === 'function' || typeof (data as Blob).arrayBuffer === 'function')
  )
}

async function blobToText(data: Blob): Promise<string> {
  if (typeof data.text === 'function') {
    const text = await data.text()
    if (text) return text
  }
  if (typeof data.arrayBuffer === 'function') {
    const buffer = await data.arrayBuffer()
    if (buffer.byteLength > 0) return new TextDecoder().decode(buffer)
  }
  return ''
}

function redactPasswordFromAxiosError(error: unknown): unknown {
  if (!axios.isAxiosError(error) || error.config == null) return error
  const data = error.config.data as unknown
  if (data && typeof data === 'object' && !Array.isArray(data) && 'password' in (data as object)) {
    error.config.data = { ...(data as Record<string, unknown>), password: '[REDACTED]' }
  } else if (typeof data === 'string' && /"password"\s*:/.test(data)) {
    error.config.data = '[REDACTED]'
  }
  return error
}

async function hydrateAxiosBlobError(error: unknown): Promise<unknown> {
  redactPasswordFromAxiosError(error)
  if (!axios.isAxiosError(error) || error.response == null) return error
  const data = error.response.data
  if (!isBlobLike(data)) return error
  try {
    const text = await blobToText(data)
    if (!text.trim()) return error
    error.response.data = JSON.parse(text) as unknown
  } catch {
    return error
  }
  return error
}

function saveBlob(blob: Blob, fileName: string): void {
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = fileName
  a.rel = 'noopener noreferrer'
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
}

function looksLikeDownloadUrlJson(payload: unknown): boolean {
  if (payload == null || typeof payload !== 'object' || Array.isArray(payload)) return false
  const downloadUrl = (payload as { downloadUrl?: unknown }).downloadUrl
  return typeof downloadUrl === 'string' && downloadUrl.trim().length > 0
}

async function throwIfJsonErrorBlob(payload: Blob, status: number): Promise<void> {
  const type = payload.type.toLowerCase()
  if (type.includes('pdf') || type.includes('zip') || type.includes('spreadsheet') || type.includes('excel')) {
    return
  }
  const text = await blobToText(payload)
  const trimmed = text.trim()
  if (!type.includes('json') && !trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed) as unknown
  } catch {
    return
  }
  if (looksLikeDownloadUrlJson(parsed)) {
    throw new Error('암호화된 파일을 받지 못했습니다.')
  }
  const error = new AxiosError('첨부파일 다운로드에 실패했습니다.')
  error.response = {
    data: parsed,
    status,
    statusText: 'Error',
    headers: {},
    config: error.config ?? ({ headers: {} } as InternalAxiosRequestConfig),
  }
  throw error
}

/** POST { password } 암호화 blob 저장. GET/downloadUrl 새 탭 없음. */
export async function downloadHomepageProtectedAttachment(input: {
  url: string
  password: string
  fallbackFileName: string
}): Promise<void> {
  try {
    const response = await axiosInstance.request<Blob>({
      url: input.url,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: HOMEPAGE_PROTECTED_ATTACHMENT_ACCEPT,
      },
      data: { password: input.password },
      responseType: 'blob',
      transformResponse: [data => data],
    })
    const blob = response.data
    if (!isBlobLike(blob) || blob.size < 1) {
      throw new Error('암호화된 파일을 받지 못했습니다.')
    }
    await throwIfJsonErrorBlob(blob, response.status)
    saveBlob(
      blob,
      fileNameFromContentDisposition(
        contentDispositionHeader(response.headers),
        input.fallbackFileName.trim() || 'download'
      )
    )
  } catch (error) {
    throw await hydrateAxiosBlobError(error)
  }
}

export function homepageAttachmentDownloadErrorMessage(error: unknown, fallback: string): string {
  return readApiErrorMessage(error)?.trim() || fallback
}
