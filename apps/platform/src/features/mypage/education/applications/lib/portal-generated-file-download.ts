import { axiosClient } from '@/shared/api/axios-instance'
import {
  fetchResolvedAttachmentBlob,
  readDownloadUrlFromJsonBlob,
  toProxiedApiPath,
} from '@/shared/lib/download-attachment'
import { fetchPortalSignedDownloadBlob } from '@/shared/lib/portal-signed-download-fetch'
import { assertCertificatePdfBlob } from './assert-certificate-pdf-blob.ts'
import {
  extractGeneratedFileName,
  isPortraitConsentTemplateJobCompleted,
  isPortraitConsentTemplateJobFailed,
  isPortraitConsentTemplateJobPending,
  parseGeneratedFileJobPayload,
  parsePortalFileDownloadResolvePayload,
  type GeneratedFileJobResponse,
  type PortraitConsentTemplateDownloadProgress,
} from './student-documents-template-download.ts'
import { toRuleDownloadFileName } from '@/shared/lib/download-file-name'

/** GET /api/portal/me/generated-files/jobs/{jobId} — operationId getMyGeneratedFileJob. */
const GENERATED_FILE_JOB_POLLING_PATH = (jobId: number) =>
  `/api/portal/me/generated-files/jobs/${encodeURIComponent(String(jobId))}`
const GENERATED_FILE_JOB_POLL_INTERVAL_MS = 1_000
const GENERATED_FILE_JOB_MAX_POLL_ATTEMPTS = 30

export type PortalGeneratedFileDownloadTemplate = {
  purpose: string
  fallbackFileName: string
  label: string
  normalizeBlob?: (blob: Blob) => Blob
  /** true면 `%PDF-` 매직·스텁 텍스트를 검사한다 */
  expectPdf?: boolean
}

export function savePortalBlobFile(fileName: string, blob: Blob) {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = toRuleDownloadFileName(fileName)
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
}

export function headerRecord(headers: Record<string, string> | undefined): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers ?? {}).filter(([, value]) => typeof value === 'string' && value),
  )
}

export async function fetchBlobWithHeaders(
  url: string,
  headers: Record<string, string>,
  label: string,
): Promise<Blob> {
  const response = await fetch(url, {
    method: 'GET',
    headers,
    credentials: /^https?:\/\//i.test(url) ? 'omit' : 'include',
    mode: 'cors',
  })
  if (!response.ok) throw new Error(`${label} 다운로드에 실패했습니다. (${response.status})`)
  return response.blob()
}

function validFileObjectId(value: unknown): number | null {
  const id = typeof value === 'number' ? value : Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

function resultSnapshotFileName(job: GeneratedFileJobResponse): string | undefined {
  if (!job.resultSnapshotJson?.trim()) return undefined
  try {
    const snapshot = JSON.parse(job.resultSnapshotJson) as Record<string, unknown>
    for (const key of ['originalFileName', 'fileName', 'filename']) {
      const value = snapshot[key]
      if (typeof value === 'string' && value.trim()) return value.trim()
    }
  } catch {
    // 파일명 메타데이터가 없거나 잘못된 JSON이어도 fileObjectId 다운로드는 계속합니다.
  }
  return undefined
}

export function withSnapshotFileName(job: GeneratedFileJobResponse): GeneratedFileJobResponse {
  const fileName = resultSnapshotFileName(job)
  return fileName && !job.originalFileName ? { ...job, originalFileName: fileName } : job
}

export async function fetchPortalGeneratedFileJob(jobId: number): Promise<GeneratedFileJobResponse> {
  const { data } = await axiosClient.get<unknown>(GENERATED_FILE_JOB_POLLING_PATH(jobId))
  const job = parseGeneratedFileJobPayload(data)
  if (!job) throw new Error('양식 생성 상태를 확인하지 못했습니다.')
  return withSnapshotFileName(job)
}

function waitFor(milliseconds: number): Promise<void> {
  return new Promise(resolve => window.setTimeout(resolve, milliseconds))
}

async function finalizeGeneratedDownloadBlob(
  blob: Blob,
  template: PortalGeneratedFileDownloadTemplate,
): Promise<Blob> {
  if (template.expectPdf) {
    return assertCertificatePdfBlob(blob, template.label)
  }
  if (blob.size < 1 || /\bjson\b/i.test(blob.type)) {
    throw new Error(`${template.label} 파일을 받지 못했습니다.`)
  }
  return blob
}

/** signed raw URL + optional JSON downloadUrl 2-hop (수료증 SSOT 경로) */
export async function fetchPortalGeneratedDownloadBlob(
  downloadUrl: string,
  requiredHeaders: Record<string, string> | undefined,
  label: string,
): Promise<Blob> {
  const headers = headerRecord(requiredHeaders)
  const trimmed = downloadUrl.trim()
  const proxied = toProxiedApiPath(trimmed)
  const isExternalSigned = /^https?:\/\//i.test(trimmed) && !proxied

  async function fetchOnce(url: string): Promise<Blob> {
    if (isExternalSigned && url === trimmed) {
      return fetchPortalSignedDownloadBlob(url, requiredHeaders, { acceptAnyContent: true })
    }
    if (Object.keys(headers).length === 0) {
      return fetchResolvedAttachmentBlob(url)
    }
    return fetchBlobWithHeaders(url, headers, label)
  }

  let blob = await fetchOnce(trimmed)
  const nested = await readDownloadUrlFromJsonBlob(blob)
  if (nested) {
    blob = await fetchOnce(nested)
  }
  return blob
}

export async function waitForGeneratedFileJob(
  initialJob: GeneratedFileJobResponse,
  template: PortalGeneratedFileDownloadTemplate,
  onProgress?: (progress: PortraitConsentTemplateDownloadProgress) => void,
): Promise<GeneratedFileJobResponse> {
  if (isPortraitConsentTemplateJobCompleted(initialJob) || initialJob.downloadUrl?.trim()) {
    return initialJob
  }
  if (isPortraitConsentTemplateJobFailed(initialJob)) {
    throw new Error(initialJob.failureReason?.trim() || `${template.label} 생성에 실패했습니다.`)
  }
  if (!isPortraitConsentTemplateJobPending(initialJob)) {
    throw new Error(`${template.label} 생성 상태를 확인할 수 없습니다.`)
  }

  const jobId = validFileObjectId(initialJob.id ?? initialJob.generatedFileJobId)
  if (jobId == null) throw new Error(`${template.label} 생성 작업 ID를 받지 못했습니다.`)
  onProgress?.('generating')

  let job = initialJob
  for (let attempt = 0; attempt < GENERATED_FILE_JOB_MAX_POLL_ATTEMPTS; attempt += 1) {
    await waitFor(GENERATED_FILE_JOB_POLL_INTERVAL_MS)
    job = await fetchPortalGeneratedFileJob(jobId)
    if (isPortraitConsentTemplateJobCompleted(job) || job.downloadUrl?.trim()) return job
    if (isPortraitConsentTemplateJobFailed(job)) {
      throw new Error(job.failureReason?.trim() || `${template.label} 생성에 실패했습니다.`)
    }
  }
  throw new Error(`${template.label} 생성 시간이 초과되었습니다.`)
}

export async function downloadPortalFileObject(
  fileObjectId: number,
  template: PortalGeneratedFileDownloadTemplate,
  job: GeneratedFileJobResponse,
  onProgress?: (progress: PortraitConsentTemplateDownloadProgress) => void,
): Promise<void> {
  onProgress?.('downloading')
  const { data } = await axiosClient.post<unknown>(
    `/api/portal/me/files/${encodeURIComponent(String(fileObjectId))}/download-requests`,
    { purpose: template.purpose },
  )
  const resolved = parsePortalFileDownloadResolvePayload(data)
  const downloadUrl = resolved?.downloadUrl?.trim()
  if (!downloadUrl) throw new Error(`${template.label} 다운로드 주소를 받지 못했습니다.`)

  const blob = await fetchPortalGeneratedDownloadBlob(
    downloadUrl,
    resolved?.requiredHeaders,
    template.label,
  )
  const validated = await finalizeGeneratedDownloadBlob(blob, template)
  const fileName = extractGeneratedFileName(job, resolved) ?? template.fallbackFileName
  savePortalBlobFile(
    fileName,
    template.normalizeBlob ? template.normalizeBlob(validated) : validated,
  )
}

export async function downloadFromGeneratedFileJob(
  initialJob: GeneratedFileJobResponse,
  template: PortalGeneratedFileDownloadTemplate,
  onProgress?: (progress: PortraitConsentTemplateDownloadProgress) => void,
): Promise<void> {
  const completedJob = await waitForGeneratedFileJob(initialJob, template, onProgress)
  const directUrl = completedJob.downloadUrl?.trim()
  if (directUrl) {
    onProgress?.('downloading')
    const blob = await fetchPortalGeneratedDownloadBlob(
      directUrl,
      completedJob.requiredHeaders,
      template.label,
    )
    const validated = await finalizeGeneratedDownloadBlob(blob, template)
    const fileName = extractGeneratedFileName(completedJob) ?? template.fallbackFileName
    savePortalBlobFile(
      fileName,
      template.normalizeBlob ? template.normalizeBlob(validated) : validated,
    )
    return
  }
  if (template.expectPdf) {
    throw new Error(`${template.label} 다운로드 주소를 받지 못했습니다.`)
  }
  const fileObjectId = validFileObjectId(completedJob.fileObjectId)
  if (fileObjectId == null) {
    throw new Error(`${template.label} 파일을 찾을 수 없습니다.`)
  }
  await downloadPortalFileObject(fileObjectId, template, completedJob, onProgress)
}
