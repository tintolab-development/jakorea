import type { AxiosResponse } from 'axios'
import { axiosClient } from '@/shared/api/axios-instance'
import {
  assertCertificateZipBlob,
  CERTIFICATE_BULK_DOWNLOAD_ACCEPT,
  CertificateBulkDownloadError,
  readResponseHeader,
  toCertificateBulkDownloadError,
  validateCertificateRosterIds,
} from '../lib/certificate-bulk-download'
import { buildCertificateDownloadFileName } from '../lib/certificate-download-file-name'
import { readStudentDocumentsErrorCode } from '../lib/student-documents-errors'
import {
  downloadFromGeneratedFileJob,
  savePortalBlobFile,
  withSnapshotFileName,
  type PortalGeneratedFileDownloadTemplate,
} from '../lib/portal-generated-file-download'
import {
  normalizeZipBlob,
  parseGeneratedFileJobBlob,
  parseGeneratedFileJobPayload,
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

type GeneratedTemplateDefinition = PortalGeneratedFileDownloadTemplate & {
  pathSuffix: string
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
  normalizeBlob: normalizeZipBlob,
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

function isBlob(value: unknown): value is Blob {
  return typeof Blob !== 'undefined' && value instanceof Blob
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

export async function fetchOrganizationStudentRoster(
  applicationId: string,
  signal?: AbortSignal
): Promise<PortalStudentRosterResponse> {
  const { data } = await axiosClient.get<unknown>(
    `${organizationApplicationPath(applicationId)}/student-roster`,
    { signal }
  )
  const unwrapped = unwrapEnvelope<unknown>(data)
  if (Array.isArray(unwrapped)) {
    return { rows: unwrapped, totalCount: unwrapped.length }
  }
  if (!unwrapped || typeof unwrapped !== 'object') {
    return { rows: [], totalCount: 0 }
  }
  const record = unwrapped as PortalStudentRosterResponse & { items?: unknown }
  const rows = Array.isArray(record.rows)
    ? record.rows
    : Array.isArray(record.items)
      ? (record.items as PortalStudentRosterResponse['rows'])
      : []
  const normalizedRows = rows ?? []
  return {
    ...record,
    rows: normalizedRows,
    totalCount:
      typeof record.totalCount === 'number' ? record.totalCount : normalizedRows.length,
  }
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
  await downloadFromGeneratedFileJob(initialJob, STUDENT_ROSTER_TEMPLATE)
}

/**
 * POST .../organization-applications/{applicationId}/certificates/bulk-download
 * operationId `downloadPortalStudentCertificateZip` — 200 `application/zip` binary만 성공으로 처리합니다.
 * 409여도 발급 API로 넘기지 않습니다. 이 호출은 기존 발급분 ZIP만 받습니다.
 */
export async function downloadOrganizationStudentCertificates(
  applicationId: string,
  rosterIds: readonly number[],
  options?: { fileName?: string },
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
  const fileName =
    options?.fileName?.trim() ||
    buildCertificateDownloadFileName({ memberName: '', extension: 'zip' })
  savePortalBlobFile(fileName, zipBlob)
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
    savePortalBlobFile(PORTRAIT_CONSENT_TEMPLATE.fallbackFileName, normalizeZipBlob(created.blob))
    return
  }

  const initialJob = created.job
  if (!initialJob)
    throw new Error(`${PORTRAIT_CONSENT_TEMPLATE.label} 생성 결과를 받지 못했습니다.`)
  await downloadFromGeneratedFileJob(initialJob, PORTRAIT_CONSENT_TEMPLATE, onProgress)
}
