import { toSameOriginApiPath } from '@/shared/lib/admin-file-upload/attachments'
import { getApiBaseUrl } from '@/shared/lib/api-remote-env'
import customInstance from '@/shared/api/orval-mutator'
import { downloadBlob, generateFilename } from '@/shared/utils/file-download'

export interface BulkDownloadEndpointResponse {
  downloadEndpoint?: string
  requestedCount?: number
  successCount?: number
  failureCount?: number
}

/** downloadEndpoint(Bearer blob 또는 절대 URL)로 ZIP 등 파일 수신 */
export async function fetchBulkDownloadBlob(downloadEndpoint: string): Promise<Blob> {
  return customInstance<Blob>({
    url: downloadEndpoint,
    method: 'GET',
    responseType: 'blob',
  })
}

export async function downloadFromBulkEndpoint(
  downloadEndpoint: string | undefined,
  filenamePrefix: string,
  extension = 'zip'
): Promise<void> {
  const trimmed = downloadEndpoint?.trim()
  if (!trimmed) {
    throw new Error('다운로드 URL이 없습니다.')
  }
  const blob = await fetchBulkDownloadBlob(toSameOriginApiPath(trimmed, getApiBaseUrl()) ?? trimmed)
  await downloadBlob(blob, generateFilename(filenamePrefix, extension))
}
