import type { AxiosResponse } from 'axios'
import { axiosClient } from '@/shared/api/axios-instance'
import { fetchBlobOnce } from '@/shared/lib/download-attachment'
import {
  assertCertificateZipBlob,
  CERTIFICATE_BULK_DOWNLOAD_ACCEPT,
  CERTIFICATE_BULK_DOWNLOAD_FILE_NAME,
  CertificateBulkDownloadError,
  readResponseHeader,
  toCertificateBulkDownloadError,
  validateCertificateRosterIds,
} from '../lib/certificate-bulk-download'
import { readStudentDocumentsErrorCode } from '../lib/student-documents-errors'
import {
  extractGeneratedFileName,
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
  PortalCertificateBulkDownloadRequest,
  PortalOrganizationPortraitConsent,
  PortalStudentRosterCommitRequest,
  PortalStudentDocumentPolicy,
  PortalStudentRosterResponse,
} from './student-documents-types'

const ORGANIZATION_APPLICATIONS_PATH = '/api/portal/me/organization-applications'

/** GET /api/portal/me/generated-files/jobs/{jobId} — operationId getMyGeneratedFileJob. admin 경로는 쓰지 않는다. */
const GENERATED_FILE_JOB_POLLING_PATH = (jobId: number) =>
  `/api/portal/me/generated-files/jobs/${encodeURIComponent(String(jobId))}`
const GENERATED_FILE_JOB_POLL_INTERVAL_MS = 1_000
const GENERATED_FILE_JOB_MAX_POLL_ATTEMPTS = 30

type GeneratedTemplateDefinition = {
  pathSuffix: string
  purpose: string
  fallbackFileName: string
  label: string
  normalizeBlob?: boolean
}

const STUDENT_ROSTER_TEMPLATE: GeneratedTemplateDefinition = {
  pathSuffix: '/student-roster/template',
  purpose: '학생명단 양식 다운로드',
  fallbackFileName: '학생명단_양식.xlsx',
  label: '학생명단 양식',
}

const PORTRAIT_CONSENT_TEMPLATE: GeneratedTemplateDefinition = {
  pathSuffix: '/portrait-consent/template',
  purpose: '학생 초상권 동의서 양식 다운로드',
  fallbackFileName: '학생 초상권 동의서.zip',
  label: '초상권 동의서 양식',
  normalizeBlob: true,
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

function withSnapshotFileName(job: GeneratedFileJobResponse): GeneratedFileJobResponse {
  const fileName = resultSnapshotFileName(job)
  return fileName && !job.originalFileName ? { ...job, originalFileName: fileName } : job
}

function resolveJobFromResponse(payload: unknown): GeneratedFileJobResponse | null {
  return parseGeneratedFileJobPayload(payload)
}

async function createGeneratedTemplateJob(
  applicationId: string,
  template: GeneratedTemplateDefinition,
  onProgress?: (progress: PortraitConsentTemplateDownloadProgress) => void
): Promise<{ job: GeneratedFileJobResponse | null; blob: Blob | null }> {
  onProgress?.('requesting')
  const { data } = await axiosClient.post<unknown>(
    `${organizationApplicationPath(applicationId)}${template.pathSuffix}`,
    undefined,
    { responseType: 'blob' }
  )

  if (isBlob(data)) {
    const job = await parseGeneratedFileJobBlob(data)
    if (job) return { job: withSnapshotFileName(job), blob: null }
    if (data.size > 0 && !/\bjson\b/i.test(data.type)) {
      return { job: null, blob: data }
    }
    throw new Error(`${template.label} 생성 결과를 받지 못했습니다.`)
  }

  const job = resolveJobFromResponse(data)
  if (!job) throw new Error(`${template.label} 생성 결과를 받지 못했습니다.`)
  return { job: withSnapshotFileName(job), blob: null }
}

async function fetchPortalGeneratedFileJob(jobId: number): Promise<GeneratedFileJobResponse> {
  const { data } = await axiosClient.get<unknown>(GENERATED_FILE_JOB_POLLING_PATH(jobId))
  const job = resolveJobFromResponse(data)
  if (!job) throw new Error('양식 생성 상태를 확인하지 못했습니다.')
  return withSnapshotFileName(job)
}

function waitFor(milliseconds: number): Promise<void> {
  return new Promise(resolve => window.setTimeout(resolve, milliseconds))
}

async function waitForGeneratedTemplateJob(
  initialJob: GeneratedFileJobResponse,
  template: GeneratedTemplateDefinition,
  onProgress?: (progress: PortraitConsentTemplateDownloadProgress) => void
): Promise<GeneratedFileJobResponse> {
  if (isPortraitConsentTemplateJobCompleted(initialJob)) return initialJob
  if (isPortraitConsentTemplateJobFailed(initialJob)) {
    throw new Error(initialJob.failureReason?.trim() || `${template.label} 생성에 실패했습니다.`)
  }
  if (!isPortraitConsentTemplateJobPending(initialJob)) {
    throw new Error(`${template.label} 생성 상태를 확인할 수 없습니다.`)
  }

  const jobId = validFileObjectId(initialJob.id)
  if (jobId == null) throw new Error(`${template.label} 생성 작업 ID를 받지 못했습니다.`)
  onProgress?.('generating')

  let job = initialJob
  for (let attempt = 0; attempt < GENERATED_FILE_JOB_MAX_POLL_ATTEMPTS; attempt += 1) {
    await waitFor(GENERATED_FILE_JOB_POLL_INTERVAL_MS)
    job = await fetchPortalGeneratedFileJob(jobId)
    if (isPortraitConsentTemplateJobCompleted(job)) return job
    if (isPortraitConsentTemplateJobFailed(job)) {
      throw new Error(job.failureReason?.trim() || `${template.label} 생성에 실패했습니다.`)
    }
  }
  throw new Error(`${template.label} 생성 시간이 초과되었습니다.`)
}

function headerRecord(headers: Record<string, string> | undefined): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers ?? {}).filter(([, value]) => typeof value === 'string' && value)
  )
}

async function fetchBlobWithHeaders(
  url: string,
  headers: Record<string, string>,
  label: string
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

async function downloadPortalFileObject(
  fileObjectId: number,
  template: GeneratedTemplateDefinition,
  job: GeneratedFileJobResponse,
  onProgress?: (progress: PortraitConsentTemplateDownloadProgress) => void
): Promise<void> {
  onProgress?.('downloading')
  const { data } = await axiosClient.post<unknown>(
    `/api/portal/me/files/${encodeURIComponent(String(fileObjectId))}/download-requests`,
    { purpose: template.purpose }
  )
  const resolved = parsePortalFileDownloadResolvePayload(data)
  const downloadUrl = resolved?.downloadUrl?.trim()
  if (!downloadUrl) throw new Error(`${template.label} 다운로드 주소를 받지 못했습니다.`)

  const headers = headerRecord(resolved?.requiredHeaders)
  const blob =
    Object.keys(headers).length === 0
      ? await fetchBlobOnce(downloadUrl)
      : await fetchBlobWithHeaders(downloadUrl, headers, template.label)
  if (blob.size < 1 || /\bjson\b/i.test(blob.type)) {
    throw new Error(`${template.label} 파일을 받지 못했습니다.`)
  }
  const fileName = extractGeneratedFileName(job, resolved) ?? template.fallbackFileName
  saveBlobFile(fileName, template.normalizeBlob ? normalizeZipBlob(blob) : blob)
}

export async function fetchOrganizationStudentRoster(
  applicationId: string,
  signal?: AbortSignal
): Promise<PortalStudentRosterResponse> {
  const { data } = await axiosClient.get<unknown>(
    `${organizationApplicationPath(applicationId)}/student-roster`,
    { signal }
  )
  return unwrapEnvelope<PortalStudentRosterResponse>(data)
}

export async function importOrganizationStudentRoster(
  applicationId: string,
  sourceFileObjectId: number
): Promise<PortalStudentRosterResponse> {
  const { data } = await axiosClient.post<unknown>(
    `${organizationApplicationPath(applicationId)}/student-roster/import`,
    { sourceFileObjectId }
  )
  return unwrapEnvelope<PortalStudentRosterResponse>(data)
}

/** PUT /api/portal/me/organization-applications/{applicationId}/student-roster */
export async function commitOrganizationStudentRoster(
  applicationId: string,
  request: PortalStudentRosterCommitRequest
): Promise<PortalStudentRosterResponse> {
  const { data } = await axiosClient.put<unknown>(
    `${organizationApplicationPath(applicationId)}/student-roster`,
    request
  )
  return unwrapEnvelope<PortalStudentRosterResponse>(data)
}

export async function downloadOrganizationStudentRosterTemplate(
  applicationId: string
): Promise<void> {
  const created = await createGeneratedTemplateJob(applicationId, STUDENT_ROSTER_TEMPLATE)
  const initialJob = created.job
  if (!initialJob) throw new Error(`${STUDENT_ROSTER_TEMPLATE.label} 생성 결과를 받지 못했습니다.`)
  const completedJob = await waitForGeneratedTemplateJob(initialJob, STUDENT_ROSTER_TEMPLATE)
  const fileObjectId = validFileObjectId(completedJob.fileObjectId)
  if (fileObjectId == null) {
    throw new Error(`${STUDENT_ROSTER_TEMPLATE.label} 파일을 찾을 수 없습니다.`)
  }
  await downloadPortalFileObject(fileObjectId, STUDENT_ROSTER_TEMPLATE, completedJob)
}

/**
 * POST .../organization-applications/{applicationId}/certificates/bulk-download
 * operationId `downloadPortalStudentCertificateZip` — 200 `application/zip` binary만 성공으로 처리합니다.
 * 409여도 발급 API로 넘기지 않습니다. 이 호출은 기존 발급분 ZIP만 받습니다.
 */
export async function downloadOrganizationStudentCertificates(
  applicationId: string,
  rosterIds: readonly number[]
): Promise<void> {
  const validationMessage = validateCertificateRosterIds(rosterIds)
  if (validationMessage) throw new CertificateBulkDownloadError(validationMessage)

  const request: PortalCertificateBulkDownloadRequest = {
    rosterIds: [...rosterIds],
    certificateType: 'COMPLETION',
  }
  let response: AxiosResponse<Blob>
  try {
    response = await axiosClient.post<Blob>(
      `${organizationApplicationPath(applicationId)}/certificates/bulk-download`,
      request,
      {
        responseType: 'blob',
        headers: { Accept: CERTIFICATE_BULK_DOWNLOAD_ACCEPT },
        transformResponse: [(data: unknown) => data],
      }
    )
  } catch (error) {
    throw await toCertificateBulkDownloadError(error)
  }
  if (response.status < 200 || response.status >= 300) {
    throw await toCertificateBulkDownloadError({ response })
  }

  const contentType = readResponseHeader(response.headers, 'content-type')
  const zipBlob = assertCertificateZipBlob(response.data, contentType)
  saveBlobFile(CERTIFICATE_BULK_DOWNLOAD_FILE_NAME, zipBlob)
}

export async function fetchOrganizationStudentDocumentPolicy(
  applicationId: string,
  signal?: AbortSignal
): Promise<PortalStudentDocumentPolicy> {
  try {
    const { data } = await axiosClient.get<unknown>(
      `${organizationApplicationPath(applicationId)}/student-documents/policy`,
      { signal }
    )
    return unwrapEnvelope<PortalStudentDocumentPolicy>(data)
  } catch (error) {
    if (readStudentDocumentsErrorCode(error) === 'PROGRAM_STUDENT_DOCUMENTS_NOT_SUPPORTED') {
      return { studentDocumentsSupported: false }
    }
    throw error
  }
}

export async function fetchOrganizationPortraitConsent(
  applicationId: string,
  signal?: AbortSignal
): Promise<PortalOrganizationPortraitConsent | null> {
  const { data } = await axiosClient.get<unknown>(
    `${organizationApplicationPath(applicationId)}/portrait-consent`,
    { signal }
  )
  const unwrapped = unwrapEnvelope<unknown>(data)
  if (!unwrapped || typeof unwrapped !== 'object') return null
  if (Object.keys(unwrapped).length === 0) return null
  return unwrapped as PortalOrganizationPortraitConsent
}

/**
 * DELETE .../portrait-consent?expectedRevisionNo= — operationId `cancelPortraitConsent`
 * 성공은 204 본문 없음이므로 응답 본문을 읽지 않습니다.
 */
export async function cancelOrganizationPortraitConsent(
  applicationId: string,
  params: { expectedRevisionNo?: number | null }
): Promise<void> {
  const { expectedRevisionNo } = params
  await axiosClient.delete(`${organizationApplicationPath(applicationId)}/portrait-consent`, {
    params:
      typeof expectedRevisionNo === 'number' && Number.isSafeInteger(expectedRevisionNo)
        ? { expectedRevisionNo }
        : undefined,
  })
}

export async function submitOrganizationPortraitConsent(
  applicationId: string,
  fileObjectId: number
): Promise<PortalOrganizationPortraitConsent> {
  const { data } = await axiosClient.put<unknown>(
    `${organizationApplicationPath(applicationId)}/portrait-consent`,
    { fileObjectId }
  )
  return unwrapEnvelope<PortalOrganizationPortraitConsent>(data)
}

export async function downloadOrganizationPortraitConsentTemplate(
  applicationId: string,
  onProgress?: (progress: PortraitConsentTemplateDownloadProgress) => void
): Promise<void> {
  const created = await createGeneratedTemplateJob(
    applicationId,
    PORTRAIT_CONSENT_TEMPLATE,
    onProgress
  )
  if (created.blob) {
    onProgress?.('downloading')
    saveBlobFile(PORTRAIT_CONSENT_TEMPLATE.fallbackFileName, normalizeZipBlob(created.blob))
    return
  }

  const initialJob = created.job
  if (!initialJob)
    throw new Error(`${PORTRAIT_CONSENT_TEMPLATE.label} 생성 결과를 받지 못했습니다.`)
  const completedJob = await waitForGeneratedTemplateJob(
    initialJob,
    PORTRAIT_CONSENT_TEMPLATE,
    onProgress
  )
  const fileObjectId = validFileObjectId(completedJob.fileObjectId)
  if (fileObjectId == null) {
    throw new Error(`${PORTRAIT_CONSENT_TEMPLATE.label} 파일을 찾을 수 없습니다.`)
  }
  await downloadPortalFileObject(fileObjectId, PORTRAIT_CONSENT_TEMPLATE, completedJob, onProgress)
}
