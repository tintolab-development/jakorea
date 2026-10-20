import type {
  PortalStudentRosterItem,
  PortalStudentRosterResponse,
} from '../api/student-documents-types'

/** OpenAPI `PortalCertificateBulkDownloadRequest.rosterIds.maxItems` */
export const CERTIFICATE_BULK_DOWNLOAD_MAX_ROSTERS = 100
export const CERTIFICATE_BULK_DOWNLOAD_FILE_NAME = '학생 수료증.zip'

const ZIP_CONTENT_TYPE = /^application\/zip\b/i

const GENERIC_DOWNLOAD_ERROR_MESSAGE = '수료증을 다운로드하지 못했습니다. 잠시 후 다시 시도해 주세요.'
const GENERIC_SERVER_ERROR_MESSAGE =
  '수료증 다운로드 중 서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
const EMPTY_FILE_MESSAGE = '수료증 파일을 받지 못했습니다. 잠시 후 다시 시도해 주세요.'

const CERTIFICATE_BULK_DOWNLOAD_ERROR_MESSAGES: Record<string, string> = {
  PORTAL_STUDENT_ROSTER_NOT_FOUND: '선택한 학생이 현재 기관 신청에 속하지 않습니다.',
  ORGANIZATION_APPLICATION_NOT_FOUND: '기관 신청 정보를 찾을 수 없습니다.',
  PERMISSION_DENIED: '해당 기관 신청에 접근할 권한이 없습니다.',
  PORTAL_CERTIFICATE_BULK_REQUEST_INVALID: '요청값이 올바르지 않습니다.',
  PORTAL_CERTIFICATE_ROSTER_IDS_INVALID: 'roster 선택값이 중복되었거나 올바르지 않습니다.',
  PORTAL_CERTIFICATE_ISSUANCE_NOT_READY: '수료 조건 또는 발급 상태를 충족하지 못했습니다.',
  CERTIFICATE_ISSUE_REQUIRED: '발급 완료된 수료증이 없습니다.',
  CERTIFICATE_OFFICIAL_TEMPLATE_UNAVAILABLE: '수료증 PDF 공급자를 사용할 수 없습니다.',
}

export class CertificateBulkDownloadError extends Error {
  readonly status?: number
  readonly code?: string
  readonly traceId?: string

  constructor(message: string, options?: { status?: number; code?: string; traceId?: string }) {
    super(message)
    this.name = 'CertificateBulkDownloadError'
    this.status = options?.status
    this.code = options?.code
    this.traceId = options?.traceId
  }
}

export function isValidRosterId(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
}

/** API 호출 전 차단 사유. 통과하면 null */
export function validateCertificateRosterIds(rosterIds: readonly unknown[]): string | null {
  if (rosterIds.length === 0) return '수료증을 발급할 학생을 선택해 주세요.'
  if (rosterIds.length > CERTIFICATE_BULK_DOWNLOAD_MAX_ROSTERS) {
    return `수료증은 한 번에 ${CERTIFICATE_BULK_DOWNLOAD_MAX_ROSTERS}명까지 다운로드할 수 있습니다.`
  }
  if (!rosterIds.every(isValidRosterId)) {
    return '선택한 학생의 명단 정보를 확인할 수 없습니다. 최신 명단을 다시 조회해 주세요.'
  }
  if (new Set(rosterIds).size !== rosterIds.length) {
    return '중복으로 선택된 학생이 있습니다. 선택한 학생을 다시 확인해 주세요.'
  }
  return null
}

/** 다른 기관 신청의 roster 응답이면 선택 대상에서 제외합니다. */
export function certificateRowsForApplication(
  roster: PortalStudentRosterResponse | undefined,
  applicationId: string
): PortalStudentRosterItem[] {
  if (!roster?.rows) return []
  const ownerId = roster.organizationApplicationId
  if (ownerId != null && String(ownerId) !== applicationId) return []
  return roster.rows
}

export type CertificateRosterEntry = {
  row: PortalStudentRosterItem
  index: number
  /** rosterId가 없는 행은 선택할 수 없습니다. */
  selectionKey: string | null
  rosterId: number | null
}

export function toCertificateRosterEntries(
  rows: readonly PortalStudentRosterItem[]
): CertificateRosterEntry[] {
  return rows.map((row, index) => {
    const rosterId = isValidRosterId(row.rosterId) ? row.rosterId : null
    return {
      row,
      index,
      rosterId,
      selectionKey: rosterId == null ? null : `roster-${rosterId}`,
    }
  })
}

export type CertificateSelection = {
  applicationId: string
  keys: ReadonlySet<string>
}

const EMPTY_KEYS: ReadonlySet<string> = new Set()

/** 신청이 바뀌면 이전 신청에서 고른 선택을 쓰지 않습니다. */
export function currentCertificateSelectionKeys(
  selection: CertificateSelection,
  applicationId: string
): ReadonlySet<string> {
  return selection.applicationId === applicationId ? selection.keys : EMPTY_KEYS
}

/** 화면에서 체크된 행 순서대로 rosterId만 추출합니다. (participantId·memberId 미사용) */
export function resolveSelectedRosterIds(
  entries: readonly CertificateRosterEntry[],
  selectedKeys: ReadonlySet<string>
): number[] {
  const rosterIds: number[] = []
  for (const entry of entries) {
    if (entry.rosterId == null || entry.selectionKey == null) continue
    if (selectedKeys.has(entry.selectionKey)) rosterIds.push(entry.rosterId)
  }
  return rosterIds
}

type HeaderSource = Record<string, unknown> | { get?: (name: string) => unknown } | undefined

export function readResponseHeader(headers: HeaderSource, name: string): string | undefined {
  if (!headers) return undefined
  const getter = (headers as { get?: (name: string) => unknown }).get
  const viaGetter = typeof getter === 'function' ? getter.call(headers, name) : undefined
  if (typeof viaGetter === 'string' && viaGetter.trim()) return viaGetter.trim()
  const lower = name.toLowerCase()
  for (const [key, value] of Object.entries(headers as Record<string, unknown>)) {
    if (key.toLowerCase() === lower && typeof value === 'string' && value.trim()) {
      return value.trim()
    }
  }
  return undefined
}

export function isZipContentType(contentType: string | undefined): boolean {
  return Boolean(contentType && ZIP_CONTENT_TYPE.test(contentType))
}

/** 성공 응답 검증: 2xx + application/zip + 비어 있지 않은 Blob */
export function assertCertificateZipBlob(blob: unknown, contentType: string | undefined): Blob {
  const isBlob = typeof Blob !== 'undefined' && blob instanceof Blob
  if (!isBlob || blob.size < 1) throw new CertificateBulkDownloadError(EMPTY_FILE_MESSAGE)
  if (!isZipContentType(contentType || blob.type)) {
    throw new CertificateBulkDownloadError(EMPTY_FILE_MESSAGE)
  }
  return blob
}

export type CertificateBulkDownloadErrorPayload = {
  code?: string
  message?: string
  traceId?: string
}

function trimmed(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function readErrorPayload(payload: unknown): CertificateBulkDownloadErrorPayload | null {
  if (!payload || typeof payload !== 'object') return null
  const record = payload as Record<string, unknown>
  const error =
    record.error && typeof record.error === 'object'
      ? (record.error as Record<string, unknown>)
      : undefined
  return {
    code: trimmed(error?.code) ?? trimmed(record.code),
    message: trimmed(error?.message) ?? trimmed(record.message),
    traceId:
      trimmed(error?.traceId) ??
      trimmed(record.traceId) ??
      trimmed(error?.requestId) ??
      trimmed(record.requestId),
  }
}

/** 오류 응답 Blob(`responseType: 'blob'`)을 JSON으로 해석합니다. 파싱 실패 시 null */
export async function parseCertificateBulkDownloadErrorBody(
  data: unknown
): Promise<CertificateBulkDownloadErrorPayload | null> {
  let text: string
  if (typeof Blob !== 'undefined' && data instanceof Blob) {
    try {
      text = await data.text()
    } catch {
      return null
    }
  } else if (typeof data === 'string') {
    text = data
  } else {
    return readErrorPayload(data)
  }
  try {
    return readErrorPayload(JSON.parse(text))
  } catch {
    return null
  }
}

function withTraceId(message: string, traceId: string | undefined): string {
  return traceId ? `${message} (오류 추적 ID: ${traceId})` : message
}

export function resolveCertificateBulkDownloadErrorMessage(
  payload: CertificateBulkDownloadErrorPayload | null,
  requestId?: string
): string {
  if (!payload) return withTraceId(GENERIC_DOWNLOAD_ERROR_MESSAGE, requestId)
  const mapped = payload.code ? CERTIFICATE_BULK_DOWNLOAD_ERROR_MESSAGES[payload.code] : undefined
  if (mapped) return mapped
  return withTraceId(GENERIC_SERVER_ERROR_MESSAGE, payload.traceId ?? requestId)
}

type ErrorWithResponse = {
  response?: { status?: number; data?: unknown; headers?: HeaderSource }
}

export async function toCertificateBulkDownloadError(
  error: unknown
): Promise<CertificateBulkDownloadError> {
  if (error instanceof CertificateBulkDownloadError) return error
  const response = (error as ErrorWithResponse | null)?.response
  if (!response) return new CertificateBulkDownloadError(GENERIC_DOWNLOAD_ERROR_MESSAGE)

  const payload = await parseCertificateBulkDownloadErrorBody(response.data)
  const requestId =
    readResponseHeader(response.headers, 'x-request-id') ??
    readResponseHeader(response.headers, 'x-trace-id')
  return new CertificateBulkDownloadError(
    resolveCertificateBulkDownloadErrorMessage(payload, requestId),
    {
      status: response.status,
      code: payload?.code,
      traceId: payload?.traceId ?? requestId,
    }
  )
}
