import { axiosClient } from '@/shared/api/axios-instance'
import {
  fetchBlobOnce,
  readDownloadUrlFromJsonBlob,
} from '@/shared/lib/download-attachment'
import {
  extractPortraitConsentTemplateFileName,
  isPortraitConsentTemplateJobCompleted,
  isPortraitConsentTemplateJobFailed,
  isPortraitConsentTemplateJobPending,
  normalizeZipBlob,
  parseGeneratedFileJobBlob,
  parseGeneratedFileJobPayload,
  parsePortalFileDownloadResolvePayload,
  type GeneratedFileJobResponse,
  type PortraitConsentTemplateDownloadProgress,
} from '../lib/student-documents-template-download'
import type {
  PortalOrganizationPortraitConsent,
  PortalStudentRosterCommitRequest,
  PortalStudentDocumentPolicy,
  PortalStudentRosterResponse,
} from './student-documents-types'

const ORGANIZATION_APPLICATIONS_PATH = '/api/portal/me/organization-applications'

function unwrapEnvelope<T>(payload: unknown): T {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    if (record.success === true && 'data' in record) {
      return unwrapEnvelope<T>(record.data)
    }
  }
  return payload as T
}

function organizationApplicationPath(applicationId: string): string {
  return `${ORGANIZATION_APPLICATIONS_PATH}/${encodeURIComponent(applicationId)}`
}

function saveBlobFile(fileName: string, blob: Blob) {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
}

async function postOrganizationApplicationDownload(
  applicationId: string,
  pathSuffix: string,
  fileName: string,
): Promise<void> {
  const { data } = await axiosClient.post<Blob>(
    `${organizationApplicationPath(applicationId)}${pathSuffix}`,
    {},
    { responseType: 'blob' },
  )
  const signedUrl = await readDownloadUrlFromJsonBlob(data)
  if (signedUrl) {
    const fileBlob = await fetchBlobOnce(signedUrl)
    saveBlobFile(fileName, fileBlob)
    return
  }
  if (/\bjson\b/i.test(data.type) && data.size < 16_384) {
    throw new Error('양식 파일을 받지 못했습니다.')
  }
  saveBlobFile(fileName, data)
}

const PORTRAIT_CONSENT_TEMPLATE_PURPOSE = '학생 초상권 동의서 양식 다운로드'
const PORTRAIT_CONSENT_TEMPLATE_POLLING_PATH = (jobId: number) =>
  `/api/portal/me/generated-files/jobs/${encodeURIComponent(String(jobId))}`
const PORTRAIT_CONSENT_TEMPLATE_POLL_INTERVAL_MS = 1_000
const PORTRAIT_CONSENT_TEMPLATE_MAX_POLL_ATTEMPTS = 30

function isBlob(value: unknown): value is Blob {
  return typeof Blob !== 'undefined' && value instanceof Blob
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

function withSnapshotFileName(
  job: GeneratedFileJobResponse,
): GeneratedFileJobResponse {
  const fileName = resultSnapshotFileName(job)
  return fileName && !job.originalFileName ? { ...job, originalFileName: fileName } : job
}

function resolveJobFromResponse(payload: unknown): GeneratedFileJobResponse | null {
  return parseGeneratedFileJobPayload(payload)
}

async function createPortraitConsentTemplateJob(
  applicationId: string,
  onProgress?: (progress: PortraitConsentTemplateDownloadProgress) => void,
): Promise<{ job: GeneratedFileJobResponse | null; blob: Blob | null }> {
  onProgress?.('requesting')
  const { data } = await axiosClient.post<unknown>(
    `${organizationApplicationPath(applicationId)}/portrait-consent/template`,
    undefined,
    { responseType: 'blob' },
  )

  if (isBlob(data)) {
    const job = await parseGeneratedFileJobBlob(data)
    if (job) return { job: withSnapshotFileName(job), blob: null }
    if (data.size > 0 && !/\bjson\b/i.test(data.type)) {
      return { job: null, blob: data }
    }
    throw new Error('초상권 동의서 양식 생성 결과를 받지 못했습니다.')
  }

  const job = resolveJobFromResponse(data)
  if (!job) throw new Error('초상권 동의서 양식 생성 결과를 받지 못했습니다.')
  return { job: withSnapshotFileName(job), blob: null }
}

async function fetchPortalGeneratedFileJob(jobId: number): Promise<GeneratedFileJobResponse> {
  const { data } = await axiosClient.get<unknown>(PORTRAIT_CONSENT_TEMPLATE_POLLING_PATH(jobId))
  const job = resolveJobFromResponse(data)
  if (!job) throw new Error('초상권 동의서 양식 생성 상태를 확인하지 못했습니다.')
  return withSnapshotFileName(job)
}

function waitFor(milliseconds: number): Promise<void> {
  return new Promise(resolve => window.setTimeout(resolve, milliseconds))
}

async function waitForPortraitConsentTemplateJob(
  initialJob: GeneratedFileJobResponse,
  onProgress?: (progress: PortraitConsentTemplateDownloadProgress) => void,
): Promise<GeneratedFileJobResponse> {
  if (isPortraitConsentTemplateJobCompleted(initialJob)) return initialJob
  if (isPortraitConsentTemplateJobFailed(initialJob)) {
    throw new Error(initialJob.failureReason?.trim() || '초상권 동의서 양식 생성에 실패했습니다.')
  }
  if (!isPortraitConsentTemplateJobPending(initialJob)) {
    throw new Error('초상권 동의서 양식 생성 상태를 확인할 수 없습니다.')
  }

  const jobId = validFileObjectId(initialJob.id)
  if (jobId == null) throw new Error('초상권 동의서 양식 생성 작업 ID를 받지 못했습니다.')
  onProgress?.('generating')

  let job = initialJob
  for (let attempt = 0; attempt < PORTRAIT_CONSENT_TEMPLATE_MAX_POLL_ATTEMPTS; attempt += 1) {
    await waitFor(PORTRAIT_CONSENT_TEMPLATE_POLL_INTERVAL_MS)
    job = await fetchPortalGeneratedFileJob(jobId)
    if (isPortraitConsentTemplateJobCompleted(job)) return job
    if (isPortraitConsentTemplateJobFailed(job)) {
      throw new Error(job.failureReason?.trim() || '초상권 동의서 양식 생성에 실패했습니다.')
    }
  }
  throw new Error('초상권 동의서 양식 생성 시간이 초과되었습니다.')
}

function headerRecord(headers: Record<string, string> | undefined): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers ?? {}).filter(([, value]) => typeof value === 'string' && value),
  )
}

async function fetchBlobWithHeaders(
  url: string,
  headers: Record<string, string>,
): Promise<Blob> {
  const response = await fetch(url, {
    method: 'GET',
    headers,
    credentials: /^https?:\/\//i.test(url) ? 'omit' : 'include',
    mode: 'cors',
  })
  if (!response.ok) throw new Error(`초상권 동의서 양식 다운로드에 실패했습니다. (${response.status})`)
  return response.blob()
}

async function downloadPortalFileObject(
  fileObjectId: number,
  fallbackFileName: string,
  job: GeneratedFileJobResponse,
  onProgress?: (progress: PortraitConsentTemplateDownloadProgress) => void,
): Promise<void> {
  onProgress?.('downloading')
  const { data } = await axiosClient.post<unknown>(
    `/api/portal/me/files/${encodeURIComponent(String(fileObjectId))}/download-requests`,
    { purpose: PORTRAIT_CONSENT_TEMPLATE_PURPOSE },
  )
  const resolved = parsePortalFileDownloadResolvePayload(data)
  const downloadUrl = resolved?.downloadUrl?.trim()
  if (!downloadUrl) throw new Error('초상권 동의서 양식 다운로드 주소를 받지 못했습니다.')

  const headers = headerRecord(resolved?.requiredHeaders)
  const blob =
    Object.keys(headers).length === 0
      ? await fetchBlobOnce(downloadUrl)
      : await fetchBlobWithHeaders(downloadUrl, headers)
  if (blob.size < 1 || /\bjson\b/i.test(blob.type)) {
    throw new Error('초상권 동의서 양식 파일을 받지 못했습니다.')
  }
  const fileName = extractPortraitConsentTemplateFileName(job, resolved)
  saveBlobFile(fileName || fallbackFileName, normalizeZipBlob(blob))
}

export async function fetchOrganizationStudentRoster(
  applicationId: string,
  signal?: AbortSignal,
): Promise<PortalStudentRosterResponse> {
  const { data } = await axiosClient.get<unknown>(
    `${organizationApplicationPath(applicationId)}/student-roster`,
    { signal },
  )
  return unwrapEnvelope<PortalStudentRosterResponse>(data)
}

export async function importOrganizationStudentRoster(
  applicationId: string,
  sourceFileObjectId: number,
): Promise<PortalStudentRosterResponse> {
  const { data } = await axiosClient.post<unknown>(
    `${organizationApplicationPath(applicationId)}/student-roster/import`,
    { sourceFileObjectId },
  )
  return unwrapEnvelope<PortalStudentRosterResponse>(data)
}

/** PUT /api/portal/me/organization-applications/{applicationId}/student-roster */
export async function commitOrganizationStudentRoster(
  applicationId: string,
  request: PortalStudentRosterCommitRequest,
): Promise<PortalStudentRosterResponse> {
  const { data } = await axiosClient.put<unknown>(
    `${organizationApplicationPath(applicationId)}/student-roster`,
    request,
  )
  return unwrapEnvelope<PortalStudentRosterResponse>(data)
}

export async function downloadOrganizationStudentRosterTemplate(
  applicationId: string,
): Promise<void> {
  await postOrganizationApplicationDownload(
    applicationId,
    '/student-roster/template',
    '학생명단_양식.xlsx',
  )
}

export async function fetchOrganizationStudentDocumentPolicy(
  applicationId: string,
  signal?: AbortSignal,
): Promise<PortalStudentDocumentPolicy> {
  const { data } = await axiosClient.get<unknown>(
    `${organizationApplicationPath(applicationId)}/student-documents/policy`,
    { signal },
  )
  return unwrapEnvelope<PortalStudentDocumentPolicy>(data)
}

export async function fetchOrganizationPortraitConsent(
  applicationId: string,
  signal?: AbortSignal,
): Promise<PortalOrganizationPortraitConsent | null> {
  const { data } = await axiosClient.get<unknown>(
    `${organizationApplicationPath(applicationId)}/portrait-consent`,
    { signal },
  )
  const unwrapped = unwrapEnvelope<PortalOrganizationPortraitConsent | null>(data)
  if (unwrapped == null) return null
  if (typeof unwrapped === 'object' && Object.keys(unwrapped).length === 0) return null
  return unwrapped
}

export async function submitOrganizationPortraitConsent(
  applicationId: string,
  fileObjectId: number,
): Promise<PortalOrganizationPortraitConsent> {
  const { data } = await axiosClient.put<unknown>(
    `${organizationApplicationPath(applicationId)}/portrait-consent`,
    { fileObjectId },
  )
  return unwrapEnvelope<PortalOrganizationPortraitConsent>(data)
}

export async function downloadOrganizationPortraitConsentTemplate(
  applicationId: string,
  onProgress?: (progress: PortraitConsentTemplateDownloadProgress) => void,
): Promise<void> {
  const created = await createPortraitConsentTemplateJob(applicationId, onProgress)
  if (created.blob) {
    onProgress?.('downloading')
    saveBlobFile('학생 초상권 동의서.zip', normalizeZipBlob(created.blob))
    return
  }

  const initialJob = created.job
  if (!initialJob) throw new Error('초상권 동의서 양식 생성 결과를 받지 못했습니다.')
  const completedJob = await waitForPortraitConsentTemplateJob(initialJob, onProgress)
  const fileObjectId = validFileObjectId(completedJob.fileObjectId)
  if (fileObjectId == null) {
    throw new Error('초상권 동의서 양식 파일을 찾을 수 없습니다.')
  }
  await downloadPortalFileObject(
    fileObjectId,
    '학생 초상권 동의서.zip',
    completedJob,
    onProgress,
  )
}
