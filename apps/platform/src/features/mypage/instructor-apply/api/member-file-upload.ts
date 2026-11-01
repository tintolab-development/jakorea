import { axiosClient } from '@/shared/api/axios-instance'
import { withFileUploadOverlay } from '@/shared/lib/file-upload-overlay'
import { FILE_UPLOAD_MAX_BYTES } from '@/shared/lib/file-upload-policy'
import { resolvePortalPresignedUploadUrl } from '@/shared/lib/presigned-upload-url'
import { isAxiosError } from 'axios'

const POLL_INTERVAL_MS = 2_000
const POLL_MAX_ATTEMPTS = 30

type MemberFileUploadResponse = {
  fileObjectId: number
  uploadUrl: string
  method?: string
  requiredHeaders?: Record<string, string>
}

/** OpenAPI `MemberPortalFileResponse` 중 FE가 판정에 쓰는 필드 */
export type MemberFileResponse = {
  fileObjectId: number
  filePurpose?: string
  contentType?: string
  scanStatus?: string
  uploadStatus?: string
  downloadable?: boolean
}

/** 폴링 판정. 기본값은 범용 회원 파일 기준(`CLEAN` + `AVAILABLE`/`CONFIRMED`). */
export type MemberFileReadinessClassifier = (
  file: MemberFileResponse,
) => 'ready' | 'pending' | 'invalid'

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

export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

function fileExtension(fileName: string): string {
  const name = fileName.trim().toLowerCase()
  return name.includes('.') ? name.slice(name.lastIndexOf('.') + 1) : ''
}

/**
 * 브라우저가 전달하는 MIME보다 확장자 기반의 백엔드 canonical MIME이 우선하는
 * 회원 파일 형식만 정규화한다. 파일 바이트는 그대로 전달하고, 실제 내용 검증은
 * Storage/백엔드 보안 검사와 파서가 담당한다.
 */
export function resolveMemberPortalUploadContentType(file: File): string {
  const typed = file.type.trim()
  const ext = fileExtension(file.name)
  if (ext === 'xlsx') return XLSX_MIME
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

  constructor(maxBytes = FILE_UPLOAD_MAX_BYTES) {
    const maxMegabytes = maxBytes / (1024 * 1024)
    super(`파일은 ${maxMegabytes}MB 이하만 첨부할 수 있습니다.`)
    this.name = 'MemberFileTooLargeError'
    this.maxBytes = maxBytes
  }
}

export class MemberFileScanTimeoutError extends Error {
  /** 업로드·confirm은 끝났고 검사만 남은 파일. 같은 ID로 상태를 다시 확인할 수 있다. */
  readonly fileObjectId?: number
  /** 시간 초과 직전 GET 응답 — 재확인할지 재업로드할지 판단한다. */
  readonly lastFile?: MemberFileResponse

  constructor(fileObjectId?: number, lastFile?: MemberFileResponse) {
    super('파일 보안 검사가 끝나지 않았습니다.')
    this.name = 'MemberFileScanTimeoutError'
    this.fileObjectId = fileObjectId
    this.lastFile = lastFile
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

const classifyMemberFileDefault: MemberFileReadinessClassifier = file => {
  if (isAvailable(file)) return 'ready'
  if (isTerminalFailureStatus(file.scanStatus) || isTerminalFailureStatus(file.uploadStatus)) {
    return 'invalid'
  }
  return 'pending'
}

function resolvePolicyFileType(file: File, policy: MemberFileUploadPolicy): string {
  const extension = fileExtension(file.name)
  const mimeType = resolveMemberPortalUploadContentType(file).toLowerCase()
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

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) throw new DOMException('Upload aborted', 'AbortError')
}

async function sleep(ms: number, signal?: AbortSignal) {
  throwIfAborted(signal)
  await new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      window.clearTimeout(timer)
      reject(new DOMException('Upload aborted', 'AbortError'))
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}

/** GET /api/portal/me/files/{fileObjectId} — 회원 본인 파일 상태 */
export async function fetchMemberPortalFile(
  fileObjectId: number,
  signal?: AbortSignal,
): Promise<MemberFileResponse> {
  return unwrap<MemberFileResponse>(
    (await axiosClient.get(`/api/portal/me/files/${fileObjectId}`, { signal })).data
  )
}

/** 동의서 원본처럼 서버가 CLEAN + AVAILABLE만 받는 파일의 엄격한 준비 판정 */
export function isMemberPortalFileCleanAvailable(file: MemberFileResponse): boolean {
  return (
    file.scanStatus?.trim().toUpperCase() === 'CLEAN' &&
    file.uploadStatus?.trim().toUpperCase() === 'AVAILABLE'
  )
}

/**
 * confirm 이후 보안 검사 완료까지 폴링한다.
 * 시간 초과면 `MemberFileScanTimeoutError(fileObjectId)` — 같은 ID로 다시 호출해 재확인한다.
 */
export async function waitForMemberPortalFileAvailable(
  fileObjectId: number,
  options?: {
    signal?: AbortSignal
    onStatusChange?: (status: MemberFileUploadStatus) => void
    classify?: MemberFileReadinessClassifier
  },
): Promise<number> {
  const signal = options?.signal
  const classify = options?.classify ?? classifyMemberFileDefault
  options?.onStatusChange?.('SCANNING')
  let lastFile: MemberFileResponse | undefined
  for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt += 1) {
    throwIfAborted(signal)
    try {
      lastFile = await fetchMemberPortalFile(fileObjectId, signal)
    } catch (error) {
      throwIfAborted(signal)
      throw new MemberFileStatusCheckError(error)
    }
    const state = classify(lastFile)
    if (state === 'ready') {
      options?.onStatusChange?.('AVAILABLE')
      return fileObjectId
    }
    if (state === 'invalid') throw new MemberFileRejectedError()
    if (attempt + 1 < POLL_MAX_ATTEMPTS) await sleep(POLL_INTERVAL_MS, signal)
  }
  throw new MemberFileScanTimeoutError(fileObjectId, lastFile)
}

/** OpenAPI `MemberPortalFileUploadRequest.filePurpose` — 서버가 수락하는 값. */
export type MemberPortalFilePurpose =
  | 'ASSIGNMENT_ATTACHMENT'
  | 'SURVEY_ATTACHMENT'
  | 'ABSENCE_EVIDENCE'
  | 'PORTRAIT_CONSENT'
  | 'EXPENSE_RECEIPT'
  | 'INSTRUCTOR_APPLICATION'
  | 'VOLUNTEER_APPLICATION_EVIDENCE'
  | 'PROGRAM_POST_ATTACHMENT'
  | 'PROGRAM_POST_INLINE_IMAGE'
  | 'STUDENT_ROSTER'
  | 'CRIMINAL_HISTORY_EVIDENCE'
  | 'CRIMINAL_HISTORY_CONSENT_ORIGINAL'
  | 'EDUCATION_JOURNAL'
  | 'MEMBER_ELECTRONIC_SIGNATURE'
  | 'ELECTRONIC_SIGNATURE'

export function isPortalElectronicSignaturePurpose(purpose: string): boolean {
  return purpose === 'MEMBER_ELECTRONIC_SIGNATURE' || purpose === 'ELECTRONIC_SIGNATURE'
}

/**
 * POST /api/portal/me/files/upload-requests → PUT → confirm → CLEAN+AVAILABLE.
 * 회원 본인 파일만. multipart 가 아니다.
 */
export async function uploadMemberPortalFile(input: {
  file: File
  filePurpose: MemberPortalFilePurpose | string
  checksumSha256?: string
  policy?: MemberFileUploadPolicy
  onStatusChange?: (status: MemberFileUploadStatus) => void
  /** 파일 교체·화면 이탈 시 진행 중 요청과 스캔 폴링을 멈춘다. */
  signal?: AbortSignal
  classify?: MemberFileReadinessClassifier
}): Promise<number> {
  const notifyStatus = (status: MemberFileUploadStatus) => input.onStatusChange?.(status)
  if (input.policy) validateMemberPortalFile(input.file, input.policy)

  const declaredFileSize = input.file.size
  const fileSize = declaredFileSize
  if (!Number.isFinite(fileSize) || fileSize <= 0) {
    throw new MemberFileEmptyError()
  }
  const maxBytes = input.policy?.maxBytes ?? FILE_UPLOAD_MAX_BYTES
  if (fileSize > maxBytes) {
    throw new MemberFileTooLargeError(maxBytes)
  }
  const contentType = input.policy
    ? resolvePolicyFileType(input.file, input.policy)
    : resolveMemberPortalUploadContentType(input.file)
  const checksumSha256 = input.checksumSha256?.trim() || undefined
  return withFileUploadOverlay(() =>
    uploadPreparedMemberPortalFile({
      file: input.file,
      filePurpose: input.filePurpose,
      fileSize,
      contentType,
      checksumSha256,
      notifyStatus,
      signal: input.signal,
      classify: input.classify,
    })
  )
}

async function uploadPreparedMemberPortalFile(input: {
  file: File
  filePurpose: string
  fileSize: number
  contentType: string
  checksumSha256: string | undefined
  notifyStatus: (status: MemberFileUploadStatus) => void
  signal?: AbortSignal
  classify?: MemberFileReadinessClassifier
}): Promise<number> {
  const { fileSize, contentType, checksumSha256, notifyStatus, signal } = input
  throwIfAborted(signal)
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
          { headers: { 'Idempotency-Key': crypto.randomUUID() }, signal }
        )
      ).data
    )
  } catch (error) {
    throwIfAborted(signal)
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
    uploadResponse = await fetch(resolvePortalPresignedUploadUrl(prepared.uploadUrl), {
      method: uploadMethod,
      headers,
      body: input.file,
      signal,
    })
  } catch (error) {
    throwIfAborted(signal)
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
        await axiosClient.post(
          confirmPath,
          {
            fileSize,
            contentType,
            ...(checksumSha256 ? { checksumSha256 } : {}),
          },
          { signal }
        )
      ).data
    )
  } catch (error) {
    throwIfAborted(signal)
    throw new MemberFileConfirmError(error)
  }
  return waitForMemberPortalFileAvailable(prepared.fileObjectId, {
    signal,
    onStatusChange: notifyStatus,
    classify: input.classify,
  })
}
