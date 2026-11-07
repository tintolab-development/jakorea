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

function fileNameFromContentDisposition(header: string | undefined, fallback: string): string {
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

async function hydrateAxiosBlobError(error: unknown): Promise<unknown> {
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

async function throwIfJsonErrorBlob(payload: Blob, status: number): Promise<void> {
  const type = payload.type.toLowerCase()
  if (type.includes('pdf') || type.includes('zip') || type.includes('spreadsheet') || type.includes('excel')) {
    return
  }
  if (!type.includes('json')) {
    const head = (await payload.slice(0, 1).text()).trim()
    if (head !== '{' && head !== '[') return
  }
  const error = new AxiosError('첨부파일 다운로드에 실패했습니다.')
  error.response = {
    data: payload,
    status,
    statusText: 'Error',
    headers: {},
    config: error.config ?? ({ headers: {} } as InternalAxiosRequestConfig),
  }
  throw await hydrateAxiosBlobError(error)
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
        Accept:
          'application/pdf, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/zip, application/octet-stream, application/json, */*',
      },
      data: { password: input.password },
      responseType: 'blob',
    })
    const blob = response.data
    if (!(blob instanceof Blob) || blob.size < 1) {
      throw new Error('암호화된 파일을 받지 못했습니다.')
    }
    await throwIfJsonErrorBlob(blob, response.status)
    const header = response.headers['content-disposition']
    saveBlob(
      blob,
      fileNameFromContentDisposition(
        typeof header === 'string' ? header : undefined,
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
