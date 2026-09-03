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
  if (!downloadEndpoint?.trim()) {
    throw new Error('다운로드 URL이 없습니다.')
  }
  const blob = await fetchBulkDownloadBlob(downloadEndpoint.trim())
  await downloadBlob(blob, generateFilename(filenamePrefix, extension))
}
