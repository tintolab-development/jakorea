import { axiosClient } from '@/shared/api/axios-instance'

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

/**
 * 서명 완료 동의서 다운로드.
 * `signedFileObjectId`는 회원 소유 파일이 아니므로 `/me/files/{id}/download-requests`는 403이다.
 */
export async function downloadSubmittedCrimeConsent(documentId: number): Promise<void> {
  const res = await axiosClient.post(
    `/api/portal/me/consents/documents/${encodeURIComponent(String(documentId))}/download-requests`,
    { purpose: DOWNLOAD_PURPOSE },
  )
  const body = unwrapEnvelope<ConsentDocumentDownload>(res.data)
  const url = body.downloadUrl?.trim()
  if (!url) throw new Error('download url missing')

  const headers = body.requiredHeaders ?? {}
  const response = await fetch(url, {
    headers: Object.keys(headers).length > 0 ? headers : undefined,
  })
  if (!response.ok) throw new Error('fetch failed')
  const blob = await response.blob()
  if (blob.size === 0) throw new Error('empty download')
  saveBlobFile(ensureFileName(FALLBACK_FILE_NAME, blob), blob)
}
