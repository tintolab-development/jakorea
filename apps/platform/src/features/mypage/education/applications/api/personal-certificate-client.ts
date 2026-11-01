import { axiosClient } from '@/shared/api/axios-instance'
import { messageForPortalCertificateReasonCode } from '../lib/certificate-reason-messages'
import { savePortalCertificatePdfDownload } from '../lib/personal-certificate-render-download'
import type {
  MemberCertificateAvailabilityResponse,
  PortalCertificateIssueRequest,
  PortalCertificateIssueResponse,
} from './personal-certificate-types'

const AVAILABILITY_PATH = (programId: number | string) =>
  `/api/portal/me/programs/${encodeURIComponent(String(programId))}/certificates/availability`

const ISSUE_PATH = '/api/portal/me/certificates/issues'

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
    return unwrapped
  } catch (error) {
    throw new Error(await readErrorFromUnknown(error, GENERIC_ISSUE_ERROR))
  }
}

/**
 * GET /api/portal/me/certificates/{id}/download → downloadUrl signed raw PDF only.
 * Poll은 동일 certificate download GET (generatedFileJobId 캐시 키 사용 금지).
 */
export async function downloadPersonalCertificate(certificateIssueId: number): Promise<void> {
  try {
    await savePortalCertificatePdfDownload(certificateIssueId)
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
