export const PORTRAIT_CONSENT_TEMPLATE_FILE_NAME = '학생 초상권 동의서.zip'
export const PORTRAIT_CONSENT_TEMPLATE_MIME_TYPE = 'application/zip'
export const PORTRAIT_CONSENT_UPLOAD_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png'] as const
export const PORTRAIT_CONSENT_UPLOAD_ACCEPT =
  'application/pdf,.pdf,image/jpeg,.jpg,.jpeg,image/png,.png'

export const PORTRAIT_CONSENT_TEMPLATE_PENDING_STATUSES = new Set([
  'REQUESTED',
  'QUEUED',
  'PENDING',
  'STARTED',
  'PROCESSING',
  'RUNNING',
  'RENDERING',
  'IN_PROGRESS',
])

export const PORTRAIT_CONSENT_TEMPLATE_COMPLETED_STATUSES = new Set([
  'COMPLETED',
  'SUCCEEDED',
  'SUCCESS',
  'DONE',
])

export const PORTRAIT_CONSENT_TEMPLATE_FAILED_STATUSES = new Set([
  'FAILED',
  'ERROR',
  'CANCELLED',
  'CANCELED',
  'EXPIRED',
])

export type PortraitConsentTemplateDownloadProgress = 'requesting' | 'generating' | 'downloading'

export type GeneratedFileJobResponse = {
  id?: number
  jobType?: string
  sourceDomain?: string
  sourceId?: number
  jobStatus?: string
  fileObjectId?: number
  originalFileName?: string
  fileName?: string
  filename?: string
  requestPayloadJson?: string
  resultSnapshotJson?: string
  failureReason?: string | null
  requestedAt?: string
  completedAt?: string
  /** OpenAPI `FileDownloadJobResponse` */
  generatedFileJobId?: number
  status?: string
  downloadUrl?: string
  downloadExpiresAt?: string
  requiredHeaders?: Record<string, string>
}

export type PortalFileDownloadResolveResponse = {
  fileObjectId?: number
  downloadUrl?: string
  originalFileName?: string
  fileName?: string
  filename?: string
  expiresAt?: string
  requiredHeaders?: Record<string, string>
}

function statusOf(job: GeneratedFileJobResponse | null | undefined): string {
  return job?.jobStatus?.trim().toUpperCase() || job?.status?.trim().toUpperCase() || ''
}

export function isPortraitConsentTemplateJobPending(
  job: GeneratedFileJobResponse | null | undefined
): boolean {
  const status = statusOf(job)
  return status === '' || PORTRAIT_CONSENT_TEMPLATE_PENDING_STATUSES.has(status)
}

export function isPortraitConsentTemplateJobCompleted(
  job: GeneratedFileJobResponse | null | undefined
): boolean {
  return PORTRAIT_CONSENT_TEMPLATE_COMPLETED_STATUSES.has(statusOf(job))
}

export function isPortraitConsentTemplateJobFailed(
  job: GeneratedFileJobResponse | null | undefined
): boolean {
  return PORTRAIT_CONSENT_TEMPLATE_FAILED_STATUSES.has(statusOf(job))
}

export function extractPortraitConsentTemplateFileName(
  ...sources: Array<GeneratedFileJobResponse | PortalFileDownloadResolveResponse | null | undefined>
): string {
  return extractGeneratedFileName(...sources) ?? PORTRAIT_CONSENT_TEMPLATE_FILE_NAME
}

export function extractGeneratedFileName(
  ...sources: Array<GeneratedFileJobResponse | PortalFileDownloadResolveResponse | null | undefined>
): string | undefined {
  for (const source of sources) {
    const fileName = source?.originalFileName ?? source?.fileName ?? source?.filename
    if (typeof fileName === 'string' && fileName.trim()) return fileName.trim()
  }
  return undefined
}

export function normalizeZipBlob(blob: Blob): Blob {
  return new Blob([blob], { type: PORTRAIT_CONSENT_TEMPLATE_MIME_TYPE })
}

export function parseGeneratedFileJobPayload(payload: unknown): GeneratedFileJobResponse | null {
  if (payload == null || typeof payload !== 'object' || payload instanceof Blob) return null
  const record = payload as Record<string, unknown>
  if (record.success === true && 'data' in record) {
    return parseGeneratedFileJobPayload(record.data)
  }
  if ('data' in record && 'status' in record && typeof record.status === 'number') {
    return parseGeneratedFileJobPayload(record.data)
  }
  if (
    'jobStatus' in record ||
    'fileObjectId' in record ||
    'failureReason' in record ||
    'jobType' in record ||
    'generatedFileJobId' in record ||
    'downloadUrl' in record
  ) {
    const generatedFileJobId = readPositiveInt(record.generatedFileJobId)
    const id = readPositiveInt(record.id) ?? generatedFileJobId
    const jobStatus =
      typeof record.jobStatus === 'string' && record.jobStatus.trim()
        ? record.jobStatus
        : typeof record.status === 'string'
          ? record.status
          : undefined
    const downloadUrl =
      typeof record.downloadUrl === 'string' && record.downloadUrl.trim()
        ? record.downloadUrl.trim()
        : undefined
    const requiredHeaders =
      record.requiredHeaders && typeof record.requiredHeaders === 'object'
        ? (record.requiredHeaders as Record<string, string>)
        : undefined
    return {
      ...(record as GeneratedFileJobResponse),
      ...(id != null ? { id } : {}),
      ...(generatedFileJobId != null ? { generatedFileJobId } : {}),
      ...(jobStatus ? { jobStatus, status: jobStatus } : {}),
      ...(downloadUrl ? { downloadUrl } : {}),
      ...(requiredHeaders ? { requiredHeaders } : {}),
    }
  }
  return null
}

function readPositiveInt(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isInteger(parsed) && parsed > 0) return parsed
  }
  return undefined
}

export async function parseGeneratedFileJobBlob(
  blob: Blob
): Promise<GeneratedFileJobResponse | null> {
  if (!/\bjson\b/i.test(blob.type) && blob.size > 16_384) return null
  const text = (await blob.text()).trim()
  if (!text.startsWith('{')) return null
  try {
    return parseGeneratedFileJobPayload(JSON.parse(text))
  } catch {
    return null
  }
}

export function parsePortalFileDownloadResolvePayload(
  payload: unknown
): PortalFileDownloadResolveResponse | null {
  if (payload == null || typeof payload !== 'object' || payload instanceof Blob) return null
  const record = payload as Record<string, unknown>
  if (record.success === true && 'data' in record) {
    return parsePortalFileDownloadResolvePayload(record.data)
  }
  if ('data' in record && 'status' in record && typeof record.status === 'number') {
    return parsePortalFileDownloadResolvePayload(record.data)
  }
  if ('downloadUrl' in record || 'requiredHeaders' in record || 'fileObjectId' in record) {
    return record as PortalFileDownloadResolveResponse
  }
  return null
}
