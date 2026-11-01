import { axiosClient } from '@/shared/api/axios-instance'
import {
  assertCertificatePdfBlob,
  CertificateLegacyRenderStubError,
} from './assert-certificate-pdf-blob'
import { messageForPortalCertificateRenderErrorCode } from './certificate-reason-messages'
import {
  fetchPortalGeneratedDownloadBlob,
  savePortalBlobFile,
} from './portal-generated-file-download'
import {
  isPortraitConsentTemplateJobCompleted,
  isPortraitConsentTemplateJobFailed,
  isPortraitConsentTemplateJobPending,
  parseGeneratedFileJobPayload,
  type GeneratedFileJobResponse,
} from './student-documents-template-download'

const CERTIFICATE_DOWNLOAD_PATH = (certificateIssueId: number) =>
  `/api/portal/me/certificates/${encodeURIComponent(String(certificateIssueId))}/download`

const POLL_INTERVAL_MS = 1_000
const MAX_POLL_ATTEMPTS = 30
const LEGACY_STUB_RETRY_ATTEMPTS = 2

const GENERIC_RENDER_FAILURE = '수료증 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.'
const GENERIC_DOWNLOAD_FAILURE = '수료증을 다운로드하지 못했습니다. 잠시 후 다시 시도해 주세요.'

export type PortalCertificateDownloadJob = GeneratedFileJobResponse

function unwrapEnvelope(payload: unknown): unknown {
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    if (record.success === true && 'data' in record) {
      return unwrapEnvelope(record.data)
    }
  }
  return payload
}

export function parsePortalCertificateDownloadJob(payload: unknown): PortalCertificateDownloadJob | null {
  return parseGeneratedFileJobPayload(unwrapEnvelope(payload))
}

export function isPortalCertificateDownloadJobCompleted(job: PortalCertificateDownloadJob): boolean {
  return isCompleted(job)
}

function jobStatus(job: PortalCertificateDownloadJob): string {
  return (
    job.jobStatus?.trim().toUpperCase() ||
    job.status?.trim().toUpperCase() ||
    ''
  )
}

function isCompleted(job: PortalCertificateDownloadJob): boolean {
  return isPortraitConsentTemplateJobCompleted(job) || jobStatus(job) === 'COMPLETED'
}

function isFailed(job: PortalCertificateDownloadJob): boolean {
  return isPortraitConsentTemplateJobFailed(job) || jobStatus(job) === 'FAILED'
}

function isPending(job: PortalCertificateDownloadJob): boolean {
  if (isCompleted(job) || isFailed(job)) return false
  const status = jobStatus(job)
  return status === '' || isPortraitConsentTemplateJobPending(job)
}

function mapRenderFailureMessage(job: PortalCertificateDownloadJob): string {
  const failure = job.failureReason?.trim()
  if (failure) {
    const fromCode = messageForPortalCertificateRenderErrorCode(failure)
    if (fromCode) return fromCode
    const fromUpper = messageForPortalCertificateRenderErrorCode(failure.toUpperCase())
    if (fromUpper) return fromUpper
    if (!/^[A-Z0-9_]+$/.test(failure)) return failure
  }
  return GENERIC_RENDER_FAILURE
}

export async function fetchPortalCertificateDownloadJob(
  certificateIssueId: number,
  signal?: AbortSignal,
): Promise<PortalCertificateDownloadJob> {
  const { data } = await axiosClient.get<unknown>(CERTIFICATE_DOWNLOAD_PATH(certificateIssueId), {
    signal,
    headers: { Accept: 'application/json' },
  })
  const job = parsePortalCertificateDownloadJob(data)
  if (!job) throw new Error(GENERIC_DOWNLOAD_FAILURE)
  return job
}

function waitFor(ms: number): Promise<void> {
  return new Promise(resolve => window.setTimeout(resolve, ms))
}

/**
 * SSOT: certificateIssueId 기준으로 GET .../download 을 poll.
 * PDF bytes는 fileObjectId/download-requests가 아니라 job.downloadUrl 만 사용한다.
 */
export async function waitForPortalCertificateDownloadJob(
  certificateIssueId: number,
  signal?: AbortSignal,
): Promise<PortalCertificateDownloadJob> {
  let job = await fetchPortalCertificateDownloadJob(certificateIssueId, signal)
  if (isCompleted(job) || isFailed(job)) return job

  if (!isPending(job)) {
    throw new Error('수료증 생성 상태를 확인할 수 없습니다.')
  }

  for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt += 1) {
    await waitFor(POLL_INTERVAL_MS)
    job = await fetchPortalCertificateDownloadJob(certificateIssueId, signal)
    if (isCompleted(job) || isFailed(job)) return job
    if (!isPending(job)) {
      throw new Error('수료증 생성 상태를 확인할 수 없습니다.')
    }
  }
  throw new Error('수료증 생성 시간이 초과되었습니다.')
}

async function fetchPdfBytesFromDownloadUrl(job: PortalCertificateDownloadJob): Promise<Blob> {
  const downloadUrl = job.downloadUrl?.trim()
  if (!downloadUrl) throw new Error(GENERIC_DOWNLOAD_FAILURE)
  const blob = await fetchPortalGeneratedDownloadBlob(
    downloadUrl,
    job.requiredHeaders,
    '수료증',
  )
  return assertCertificatePdfBlob(blob, '수료증')
}

/**
 * legacy stub 수신 시 certificate download GET 재호출(BE official re-render).
 */
export async function downloadPortalCertificatePdfBlob(
  certificateIssueId: number,
  options?: { signal?: AbortSignal },
): Promise<Blob> {
  let stubRetries = 0

  for (;;) {
    const job = await waitForPortalCertificateDownloadJob(certificateIssueId, options?.signal)
    if (isFailed(job)) {
      throw new Error(mapRenderFailureMessage(job))
    }
    if (!isCompleted(job)) {
      throw new Error(GENERIC_DOWNLOAD_FAILURE)
    }
    const downloadUrl = job.downloadUrl?.trim()
    if (!downloadUrl) {
      throw new Error(GENERIC_DOWNLOAD_FAILURE)
    }
    try {
      return await fetchPdfBytesFromDownloadUrl(job)
    } catch (error) {
      if (
        error instanceof CertificateLegacyRenderStubError &&
        stubRetries < LEGACY_STUB_RETRY_ATTEMPTS
      ) {
        stubRetries += 1
        continue
      }
      throw error
    }
  }
}

export async function savePortalCertificatePdfDownload(
  certificateIssueId: number,
  options?: { signal?: AbortSignal; fileName?: string },
): Promise<void> {
  const blob = await downloadPortalCertificatePdfBlob(certificateIssueId, options)
  const fileName = options?.fileName?.trim() || `수료증_${certificateIssueId}.pdf`
  savePortalBlobFile(fileName, blob)
}
