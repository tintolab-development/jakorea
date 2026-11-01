import { axiosClient } from '@/shared/api/axios-instance'
import { fetchBlobOnce } from '@/shared/lib/download-attachment'
import {
  extractGeneratedFileName,
  isPortraitConsentTemplateJobCompleted,
  isPortraitConsentTemplateJobFailed,
  isPortraitConsentTemplateJobPending,
  parseGeneratedFileJobBlob,
  parseGeneratedFileJobPayload,
  parsePortalFileDownloadResolvePayload,
  type GeneratedFileJobResponse,
} from '../lib/student-documents-template-download'
import { messageForPortalCertificateReasonCode } from '../lib/certificate-reason-messages'
import type {
  MemberCertificateAvailabilityResponse,
  PortalCertificateIssueRequest,
  PortalCertificateIssueResponse,
} from './personal-certificate-types'
import { readPortalCertificateIssueId } from './personal-certificate-types'

const AVAILABILITY_PATH = (programId: number | string) =>
  `/api/portal/me/programs/${encodeURIComponent(String(programId))}/certificates/availability`

const ISSUE_PATH = '/api/portal/me/certificates/issues'

const DOWNLOAD_PATH = (certificateIssueId: number) =>
  `/api/portal/me/certificates/${encodeURIComponent(String(certificateIssueId))}/download`

const GENERATED_FILE_JOB_POLLING_PATH = (jobId: number) =>
  `/api/portal/me/generated-files/jobs/${encodeURIComponent(String(jobId))}`

const JOB_POLL_INTERVAL_MS = 1_000
const JOB_MAX_POLL_ATTEMPTS = 30

const GENERIC_ISSUE_ERROR = '수료증을 발급하지 못했습니다. 잠시 후 다시 시도해 주세요.'
const GENERIC_DOWNLOAD_ERROR = '수료증을 다운로드하지 못했습니다. 잠시 후 다시 시도해 주세요.'

function unwrapEnvelope<T>(payload: unknown): T {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    if (record.success === true && 'data' in record) {
      return unwrapEnvelope<T>(record.data)
    }
  }
  return payload as T
}

function isBlob(value: unknown): value is Blob {
  return typeof Blob !== 'undefined' && value instanceof Blob
}

function validPositiveId(value: unknown): number | null {
  const id = typeof value === 'number' ? value : Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
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

function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => window.setTimeout(resolve, ms))
}

function readApiErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') return fallback
  const record = payload as Record<string, unknown>
  const error =
    record.error && typeof record.error === 'object'
      ? (record.error as Record<string, unknown>)
      : undefined
  const code =
    (typeof error?.code === 'string' && error.code.trim()) ||
    (typeof record.code === 'string' && record.code.trim()) ||
    ''
  const message =
    (typeof error?.message === 'string' && error.message.trim()) ||
    (typeof record.message === 'string' && record.message.trim()) ||
    ''
  const fromCode = messageForPortalCertificateReasonCode(code)
  if (fromCode && (!message || message === code)) return fromCode
  if (message && message !== code) return message
  return fromCode ?? fallback
}

async function readErrorFromUnknown(error: unknown, fallback: string): Promise<string> {
  if (!error || typeof error !== 'object' || !('response' in error)) {
    if (error instanceof Error && error.message.trim()) return error.message
    return fallback
  }
  const response = (error as { response?: { data?: unknown; status?: number } }).response
  const data = response?.data
  if (isBlob(data)) {
    try {
      const text = await data.text()
      if (text.trim()) {
        try {
          return readApiErrorMessage(JSON.parse(text), fallback)
        } catch {
          return fallback
        }
      }
    } catch {
      return fallback
    }
  }
  return readApiErrorMessage(data, fallback)
}

export async function fetchPersonalCertificateAvailability(
  programId: number | string,
  options?: { certificateType?: string; signal?: AbortSignal },
): Promise<MemberCertificateAvailabilityResponse> {
  const certificateType = options?.certificateType?.trim() || 'AUTO'
  const { data } = await axiosClient.get<unknown>(AVAILABILITY_PATH(programId), {
    signal: options?.signal,
    params: { certificateType },
  })
  return unwrapEnvelope<MemberCertificateAvailabilityResponse>(data)
}

export async function issuePersonalCertificate(
  body: PortalCertificateIssueRequest,
): Promise<PortalCertificateIssueResponse> {
  try {
    const { data } = await axiosClient.post<unknown>(ISSUE_PATH, {
      programId: body.programId,
      participantId: body.participantId,
      certificateType: body.certificateType?.trim() || 'AUTO',
      issueReason: body.issueReason ?? 'PERSONAL_ARCHIVE',
    })
    const unwrapped = unwrapEnvelope<PortalCertificateIssueResponse>(data)
    // 이미 발급된 경우 BE가 기존 ISSUED를 반환 — 에러로 취급하지 않는다.
    return unwrapped
  } catch (error) {
    throw new Error(await readErrorFromUnknown(error, GENERIC_ISSUE_ERROR))
  }
}

async function fetchPortalGeneratedFileJob(jobId: number): Promise<GeneratedFileJobResponse> {
  const { data } = await axiosClient.get<unknown>(GENERATED_FILE_JOB_POLLING_PATH(jobId))
  const job = parseGeneratedFileJobPayload(data)
  if (!job) throw new Error('수료증 생성 상태를 확인하지 못했습니다.')
  return job
}

async function waitForGeneratedFileJob(
  initialJob: GeneratedFileJobResponse,
): Promise<GeneratedFileJobResponse> {
  if (isPortraitConsentTemplateJobCompleted(initialJob)) return initialJob
  if (isPortraitConsentTemplateJobFailed(initialJob)) {
    throw new Error(initialJob.failureReason?.trim() || GENERIC_DOWNLOAD_ERROR)
  }
  if (!isPortraitConsentTemplateJobPending(initialJob)) {
    throw new Error('수료증 생성 상태를 확인할 수 없습니다.')
  }
  const jobId = validPositiveId(initialJob.id)
  if (jobId == null) throw new Error('수료증 생성 작업 ID를 받지 못했습니다.')

  let job = initialJob
  for (let attempt = 0; attempt < JOB_MAX_POLL_ATTEMPTS; attempt += 1) {
    await waitFor(JOB_POLL_INTERVAL_MS)
    job = await fetchPortalGeneratedFileJob(jobId)
    if (isPortraitConsentTemplateJobCompleted(job)) return job
    if (isPortraitConsentTemplateJobFailed(job)) {
      throw new Error(job.failureReason?.trim() || GENERIC_DOWNLOAD_ERROR)
    }
  }
  throw new Error('수료증 생성 시간이 초과되었습니다.')
}

async function downloadPortalFileObject(
  fileObjectId: number,
  fallbackFileName: string,
): Promise<void> {
  const { data } = await axiosClient.post<unknown>(
    `/api/portal/me/files/${encodeURIComponent(String(fileObjectId))}/download-requests`,
    { purpose: '수료증 다운로드' },
  )
  const resolved = parsePortalFileDownloadResolvePayload(data)
  const downloadUrl = resolved?.downloadUrl?.trim()
  if (!downloadUrl) throw new Error('수료증 다운로드 주소를 받지 못했습니다.')
  const blob = await fetchBlobOnce(downloadUrl)
  if (blob.size < 1 || /\bjson\b/i.test(blob.type)) {
    throw new Error(GENERIC_DOWNLOAD_ERROR)
  }
  const fileName =
    extractGeneratedFileName(resolved, { originalFileName: fallbackFileName }) ?? fallbackFileName
  saveBlobFile(fileName, blob)
}

/**
 * GET /api/portal/me/certificates/{id}/download
 * — PDF blob · generated-file job · downloadUrl JSON 을 모두 수용한다.
 */
export async function downloadPersonalCertificate(
  certificateIssueId: number,
): Promise<void> {
  const fallbackFileName = `수료증_${certificateIssueId}.pdf`
  try {
    const response = await axiosClient.get<unknown>(DOWNLOAD_PATH(certificateIssueId), {
      responseType: 'blob',
      headers: { Accept: 'application/pdf,application/json,*/*' },
    })
    const data = response.data
    if (isBlob(data)) {
      const jobFromBlob = await parseGeneratedFileJobBlob(data)
      if (jobFromBlob) {
        const completed = await waitForGeneratedFileJob(jobFromBlob)
        const fileObjectId = validPositiveId(completed.fileObjectId)
        if (fileObjectId == null) throw new Error(GENERIC_DOWNLOAD_ERROR)
        await downloadPortalFileObject(
          fileObjectId,
          extractGeneratedFileName(completed) ?? fallbackFileName,
        )
        return
      }
      if (data.size > 0 && !/\bjson\b/i.test(data.type)) {
        const disposition = String(response.headers?.['content-disposition'] ?? '')
        const matched = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(disposition)
        const headerName = matched?.[1] ? decodeURIComponent(matched[1].replace(/"/g, '')) : null
        saveBlobFile(headerName?.trim() || fallbackFileName, data)
        return
      }
      // JSON blob
      try {
        const text = await data.text()
        const parsed = text.trim() ? JSON.parse(text) : null
        const job = parseGeneratedFileJobPayload(parsed)
        if (job) {
          const completed = await waitForGeneratedFileJob(job)
          const fileObjectId = validPositiveId(completed.fileObjectId)
          if (fileObjectId == null) throw new Error(GENERIC_DOWNLOAD_ERROR)
          await downloadPortalFileObject(
            fileObjectId,
            extractGeneratedFileName(completed) ?? fallbackFileName,
          )
          return
        }
        const resolved = parsePortalFileDownloadResolvePayload(parsed)
        if (resolved?.downloadUrl?.trim()) {
          const blob = await fetchBlobOnce(resolved.downloadUrl)
          saveBlobFile(extractGeneratedFileName(resolved) ?? fallbackFileName, blob)
          return
        }
        const issue = unwrapEnvelope<PortalCertificateIssueResponse>(parsed)
        const nestedId = readPortalCertificateIssueId(issue)
        if (nestedId != null && nestedId !== certificateIssueId) {
          await downloadPersonalCertificate(nestedId)
          return
        }
      } catch (inner) {
        if (inner instanceof Error) throw inner
      }
      throw new Error(GENERIC_DOWNLOAD_ERROR)
    }

    const job = parseGeneratedFileJobPayload(data)
    if (job) {
      const completed = await waitForGeneratedFileJob(job)
      const fileObjectId = validPositiveId(completed.fileObjectId)
      if (fileObjectId == null) throw new Error(GENERIC_DOWNLOAD_ERROR)
      await downloadPortalFileObject(
        fileObjectId,
        extractGeneratedFileName(completed) ?? fallbackFileName,
      )
      return
    }
    const resolved = parsePortalFileDownloadResolvePayload(data)
    if (resolved?.downloadUrl?.trim()) {
      const blob = await fetchBlobOnce(resolved.downloadUrl)
      saveBlobFile(extractGeneratedFileName(resolved) ?? fallbackFileName, blob)
      return
    }
    throw new Error(GENERIC_DOWNLOAD_ERROR)
  } catch (error) {
    if (error instanceof Error && error.message.trim()) throw error
    throw new Error(await readErrorFromUnknown(error, GENERIC_DOWNLOAD_ERROR))
  }
}

export function availabilityReasonMessage(
  availability: MemberCertificateAvailabilityResponse | null | undefined,
): string | null {
  if (!availability) return null
  const message = availability.reasonMessage?.trim() || availability.reason?.trim() || ''
  if (message) return message
  return messageForPortalCertificateReasonCode(availability.reasonCode)
}
