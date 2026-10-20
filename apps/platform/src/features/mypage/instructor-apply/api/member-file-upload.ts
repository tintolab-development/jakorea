import { axiosClient } from '@/shared/api/axios-instance'
import { isAxiosError } from 'axios'

const POLL_INTERVAL_MS = 2_000
const POLL_MAX_ATTEMPTS = 30

type MemberFileUploadResponse = {
  fileObjectId: number
  uploadUrl: string
  method?: string
  requiredHeaders?: Record<string, string>
}

type MemberFileResponse = {
  fileObjectId: number
  scanStatus?: string
  uploadStatus?: string
}

export type MemberFileUploadStatus =
  | 'PREPARING'
  | 'UPLOADING'
  | 'CONFIRMING'
  | 'SCANNING'
  | 'AVAILABLE'

export type MemberFileUploadPolicy = {
  maxBytes?: number
  allowedFileTypes?: readonly {
    extensions: readonly string[]
    contentType: string
  }[]
}

function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === 'object') {
    const body = payload as Record<string, unknown>
    if (body.success === true && 'data' in body) return unwrap<T>(body.data)
  }
  return payload as T
}

/** CMS `admin-file-upload`와 동일 — 스캔 대기(`PENDING_SCAN` 등)는 계속 폴링 */
const FAILED_UPLOAD_STATUSES = new Set(['FAILED', 'QUARANTINED'])
const FAILED_SCAN_STATUSES = new Set(['INFECTED', 'FAILED'])
const TERMINAL_FILE_STATUSES = new Set(['DELETED', 'EXPIRED', 'REMOVED', 'PURGED'])

const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
const XLSX_MIME_ALIASES = new Set(['application/haansoftxlsx'])
const VOLUNTEER_EVIDENCE_MAX_BYTES = 15 * 1024 * 1024

function fileExtension(fileName: string): string {
  const name = fileName.trim().toLowerCase()
  return name.includes('.') ? name.slice(name.lastIndexOf('.') + 1) : ''
}

function resolveMemberPortalUploadContentType(file: File): string {
  const typed = file.type.trim()
  const ext = fileExtension(file.name)
  if (ext === 'xlsx') {
    if (!typed || XLSX_MIME_ALIASES.has(typed.toLowerCase())) return XLSX_MIME
  }
  if (ext === 'xls') return typed || 'application/vnd.ms-excel'
  if (ext === 'csv') return typed || 'text/csv'
  if (ext === 'pdf') return typed || 'application/pdf'
  if (ext === 'doc') return typed || 'application/msword'
  if (ext === 'docx') {
    return typed || 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }
  if (ext === 'hwp') return typed || 'application/x-hwp'
  if (ext === 'hwpx') return typed || 'application/vnd.hancom.hwpx'
  if (ext === 'ppt') return typed || 'application/vnd.ms-powerpoint'
  if (ext === 'pptx') {
    return typed || 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  }
  if (ext === 'txt') return typed || 'text/plain'
  if (ext === 'zip') return typed || 'application/zip'
  if (ext === 'png') return typed || 'image/png'
  if (ext === 'jpg' || ext === 'jpeg') return typed || 'image/jpeg'
  if (ext === 'webp') return typed || 'image/webp'
  return typed || 'application/octet-stream'
}

/** 보안 검사·내용 정책에서 최종 거부된 파일. 다시 기다려도 사용할 수 없다. */
export class MemberFileRejectedError extends Error {
  constructor() {
    super('파일 보안 검사에 실패했습니다.')
    this.name = 'MemberFileRejectedError'
  }
}

export class MemberFileTypeNotAllowedError extends Error {
  constructor() {
    super('허용되지 않은 파일 형식입니다.')
    this.name = 'MemberFileTypeNotAllowedError'
  }
}

/** 파일이 비어 있어 업로드 요청 자체를 만들 수 없는 경우 */
export class MemberFileEmptyError extends Error {
  constructor() {
    super('빈 파일은 업로드할 수 없습니다. 파일을 다시 선택해 주세요.')
    this.name = 'MemberFileEmptyError'
  }
}

export class MemberFileTooLargeError extends Error {
  readonly maxBytes: number

  constructor(maxBytes = VOLUNTEER_EVIDENCE_MAX_BYTES) {
    const maxMegabytes = maxBytes / (1024 * 1024)
    super(`파일은 ${maxMegabytes}MB 이하만 첨부할 수 있습니다.`)
    this.name = 'MemberFileTooLargeError'
    this.maxBytes = maxBytes
  }
}

export class MemberFileScanTimeoutError extends Error {
  constructor() {
    super('파일 보안 검사가 끝나지 않았습니다.')
    this.name = 'MemberFileScanTimeoutError'
  }
}

/** 회원 파일 API의 단계별 오류를 UI에서 구분할 수 있도록 원본 오류를 보존한다. */
export class MemberFileUploadRequestError extends Error {
  readonly originalError: unknown

  constructor(originalError: unknown) {
    super('파일 업로드 URL 발급에 실패했습니다.')
    this.name = 'MemberFileUploadRequestError'
    this.originalError = originalError
  }
}

export class MemberFileStorageUploadError extends Error {
  readonly originalError: unknown

  constructor(originalError: unknown) {
    super('파일 저장소 업로드에 실패했습니다.')
    this.name = 'MemberFileStorageUploadError'
    this.originalError = originalError
  }
}

export class MemberFileConfirmError extends Error {
  readonly originalError: unknown

  constructor(originalError: unknown) {
    super('파일 업로드 확정에 실패했습니다.')
    this.name = 'MemberFileConfirmError'
    this.originalError = originalError
  }
}

export class MemberFileStatusCheckError extends Error {
  readonly originalError: unknown

  constructor(originalError: unknown) {
    super('파일 상태 확인에 실패했습니다.')
    this.name = 'MemberFileStatusCheckError'
    this.originalError = originalError
  }
}

function responseHasFileSizeField(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  const body = value as Record<string, unknown>
  if (body.field === 'fileSize') return true
  if (body.error && responseHasFileSizeField(body.error)) return true
  if (body.data && responseHasFileSizeField(body.data)) return true
  if (body.details && responseHasFileSizeField(body.details)) return true
  return false
}

/** upload-request/confirm 응답이 fileSize 검증 오류인지 판별 */
export function isMemberFileSizeUploadError(error: unknown): boolean {
  return (
    error instanceof MemberFileEmptyError ||
    (isAxiosError(error) && responseHasFileSizeField(error.response?.data))
  )
}

function isAvailable(file: MemberFileResponse): boolean {
  const uploadStatus = file.uploadStatus?.trim().toUpperCase()
  return (
    file.scanStatus?.trim().toUpperCase() === 'CLEAN' &&
    (uploadStatus === 'AVAILABLE' || uploadStatus === 'CONFIRMED')
  )
}

function isTerminalFailureStatus(value: string | undefined): boolean {
  const status = value?.trim().toUpperCase() ?? ''
  return (
    FAILED_SCAN_STATUSES.has(status) ||
    FAILED_UPLOAD_STATUSES.has(status) ||
    TERMINAL_FILE_STATUSES.has(status)
  )
}

function resolvePolicyFileType(file: File, policy: MemberFileUploadPolicy): string {
  const extension = fileExtension(file.name)
  const mimeType = file.type.trim().toLowerCase()
  const match = policy.allowedFileTypes?.find(
    fileType =>
      fileType.extensions.some(allowedExtension => allowedExtension.toLowerCase() === extension) &&
      fileType.contentType.toLowerCase() === mimeType
  )
  if (!match) throw new MemberFileTypeNotAllowedError()
  return match.contentType
}

export function validateMemberPortalFile(file: File, policy: MemberFileUploadPolicy): void {
  if (policy.maxBytes != null && file.size > policy.maxBytes) {
    throw new MemberFileTooLargeError(policy.maxBytes)
  }
  if (policy.allowedFileTypes) resolvePolicyFileType(file, policy)
}

async function sleep(ms: number) {
  await new Promise(resolve => window.setTimeout(resolve, ms))
}

/**
 * POST /api/portal/me/files/upload-requests → PUT → confirm → CLEAN+AVAILABLE.
 * 회원 본인 파일만. multipart 가 아니다.
 */
export async function uploadMemberPortalFile(input: {
  file: File
  filePurpose: string
  checksumSha256?: string
  policy?: MemberFileUploadPolicy
  onStatusChange?: (status: MemberFileUploadStatus) => void
}): Promise<number> {
  const notifyStatus = (status: MemberFileUploadStatus) => input.onStatusChange?.(status)
  if (input.policy) validateMemberPortalFile(input.file, input.policy)

  const declaredFileSize = input.file.size
  const fileSize = declaredFileSize
  if (!Number.isFinite(fileSize) || fileSize <= 0) {
    throw new MemberFileEmptyError()
  }
  if (
    input.filePurpose === 'VOLUNTEER_APPLICATION_EVIDENCE' &&
    fileSize > VOLUNTEER_EVIDENCE_MAX_BYTES
  ) {
    throw new MemberFileTooLargeError()
  }
  if (input.policy?.maxBytes != null && fileSize > input.policy.maxBytes) {
    throw new MemberFileTooLargeError(input.policy.maxBytes)
  }
  const contentType = input.policy
    ? resolvePolicyFileType(input.file, input.policy)
    : resolveMemberPortalUploadContentType(input.file)
  const checksumSha256 = input.checksumSha256?.trim() || undefined
  notifyStatus('PREPARING')
  let prepared: MemberFileUploadResponse
  try {
    prepared = unwrap<MemberFileUploadResponse>(
      (
        await axiosClient.post(
          '/api/portal/me/files/upload-requests',
          {
            filePurpose: input.filePurpose,
            originalFileName: input.file.name,
            contentType,
            fileSize,
            ...(checksumSha256 ? { checksumSha256 } : {}),
          },
          { headers: { 'Idempotency-Key': crypto.randomUUID() } }
        )
      ).data
    )
  } catch (error) {
    throw new MemberFileUploadRequestError(error)
  }
  const headers: Record<string, string> = { ...(prepared.requiredHeaders ?? {}) }
  notifyStatus('UPLOADING')
  // 회원 파일 Storage 업로드 계약은 PUT이다. 백엔드가 method를 누락하거나
  // 잘못된 GET 값으로 내려도 uploadUrl을 GET으로 호출하지 않고 PUT으로 보정한다.
  const responseMethod = prepared.method?.trim().toUpperCase()
  const uploadMethod = !responseMethod || responseMethod === 'GET' ? 'PUT' : responseMethod
  let uploadResponse: Response
  try {
    uploadResponse = await fetch(prepared.uploadUrl, {
      method: uploadMethod,
      headers,
      body: input.file,
    })
  } catch (error) {
    throw new MemberFileStorageUploadError(error)
  }
  if (!uploadResponse.ok) {
    const detail = await uploadResponse.text().catch(() => '')
    const snippet = detail.trim().slice(0, 200)
    throw new MemberFileStorageUploadError(
      new Error(
        snippet
          ? `파일 저장소 업로드에 실패했습니다. (${uploadResponse.status}) ${snippet}`
          : `파일 저장소 업로드에 실패했습니다. (${uploadResponse.status})`
      )
    )
  }
  const confirmPath = `/api/portal/me/files/${prepared.fileObjectId}/confirm`
  notifyStatus('CONFIRMING')
  try {
    unwrap(
      (
        await axiosClient.post(confirmPath, {
          fileSize,
          contentType,
          ...(checksumSha256 ? { checksumSha256 } : {}),
        })
      ).data
    )
  } catch (error) {
    throw new MemberFileConfirmError(error)
  }
  notifyStatus('SCANNING')
  for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt += 1) {
    let status: MemberFileResponse
    try {
      status = unwrap<MemberFileResponse>(
        (await axiosClient.get(`/api/portal/me/files/${prepared.fileObjectId}`)).data
      )
    } catch (error) {
      throw new MemberFileStatusCheckError(error)
    }
    if (isAvailable(status)) {
      notifyStatus('AVAILABLE')
      return prepared.fileObjectId
    }
    if (
      isTerminalFailureStatus(status.scanStatus) ||
      isTerminalFailureStatus(status.uploadStatus)
    ) {
      throw new MemberFileRejectedError()
    }
    if (attempt + 1 < POLL_MAX_ATTEMPTS) await sleep(POLL_INTERVAL_MS)
  }
  throw new MemberFileScanTimeoutError()
}
