import { axiosClient } from '@/shared/api/axios-instance'
import { fetchPortalSignedDownloadBlob } from '@/shared/lib/portal-signed-download-fetch'

const DOWNLOAD_PURPOSE = '회원 마이페이지 성범죄 경력 조회 동의서 다운로드'
const FALLBACK_FILE_NAME = '성범죄 경력 조회 동의서'

type ConsentDocumentDownload = {
  downloadUrl?: string
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

function extensionForBlob(blob: Blob): string {
  if (blob.type.includes('pdf')) return '.pdf'
  if (blob.type.includes('png')) return '.png'
  if (blob.type.includes('jpeg')) return '.jpg'
  if (blob.type.includes('webp')) return '.webp'
  return ''
}

function ensureFileName(name: string, blob: Blob): string {
  const trimmed = name.trim() || FALLBACK_FILE_NAME
  if (/\.[a-z0-9]{2,5}$/i.test(trimmed)) return trimmed
  return `${trimmed}${extensionForBlob(blob)}`
}

function saveBlobFile(fileName: string, blob: Blob): void {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = fileName
  anchor.rel = 'noopener'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
}

function isUsableFileBlob(data: unknown): data is Blob {
  return data instanceof Blob && data.size > 0 && !data.type.toLowerCase().includes('application/json')
}

/**
 * 제출한 성범죄 동의서 원본 다운로드.
 * 1) GET .../content — 소유자 원본 PDF relay (OpenAPI streamOriginal)
 * 2) POST .../download-requests — 서명 보관본 Signed URL 폴백
 * `signedFileObjectId` + `/me/files/{id}/download-requests`는 403.
 */
export async function downloadSubmittedCrimeConsent(documentId: number): Promise<void> {
  const documentPath = `/api/portal/me/consents/documents/${encodeURIComponent(String(documentId))}`
  try {
    const res = await axiosClient.get(documentPath + '/content', {
      responseType: 'blob',
    })
    if (isUsableFileBlob(res.data)) {
      saveBlobFile(ensureFileName(FALLBACK_FILE_NAME, res.data), res.data)
      return
    }
  } catch {
    /* download-requests 폴백 */
  }

  const res = await axiosClient.post(documentPath + '/download-requests', {
    purpose: DOWNLOAD_PURPOSE,
  })
  const body = unwrapEnvelope<ConsentDocumentDownload>(res.data)
  const url = body.downloadUrl?.trim()
  if (!url) throw new Error('download url missing')

  const blob = await fetchPortalSignedDownloadBlob(url, body.requiredHeaders)
  if (blob.size === 0) throw new Error('empty download')
  saveBlobFile(ensureFileName(FALLBACK_FILE_NAME, blob), blob)
}
