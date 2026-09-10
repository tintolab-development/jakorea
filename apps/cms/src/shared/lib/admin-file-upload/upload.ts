import type { FileObjectResponse } from '@/shared/api/generated/members/schemas/fileObjectResponse'
import type { FileUploadConfirmRequest } from '@/shared/api/generated/members/schemas/fileUploadConfirmRequest'
import type { FileUploadPrepareRequest } from '@/shared/api/generated/members/schemas/fileUploadPrepareRequest'
import { customInstance } from '@/shared/api/orval-mutator'
import { getApiErrorHttpStatus } from '@/shared/lib/extract-api-error-message'
import { createSha256 } from '@/shared/lib/admin-file-upload/create-sha256'
import { resolveUploadContentType } from '@/shared/lib/admin-file-upload/purposes'
import type {
  ConfirmUploadInput,
  CreateUploadRequestInput,
  PreparedUpload,
  UploadAdminFileInput,
  UploadAdminFileResult,
  WaitUntilFileAvailableOptions,
} from '@/shared/lib/admin-file-upload/types'

const DEFAULT_POLL_MAX_ATTEMPTS = 30
const DEFAULT_POLL_INTERVAL_MS = 2_000

const FAILED_SCAN_STATUSES = new Set(['INFECTED', 'FAILED'])
const FAILED_UPLOAD_STATUSES = new Set(['QUARANTINED'])

function unwrapApiBody<T>(payload: unknown): T {
  if (payload != null && typeof payload === 'object') {
    const body = payload as Record<string, unknown>
    if (body.success === true && 'data' in body) {
      return unwrapApiBody<T>(body.data)
    }
    if ('data' in body && 'status' in body && typeof body.status === 'number') {
      return body.data as T
    }
  }
  return payload as T
}

function parseFileObjectId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value >= 1) return value
  if (typeof value === 'string' && /^\d+$/.test(value.trim())) {
    const parsed = Number(value.trim())
    return parsed >= 1 ? parsed : null
  }
  return null
}

function rethrowAdminFileUploadError(
  error: unknown,
  context: 'prepare' | 'confirm' | 'status'
): never {
  const status = getApiErrorHttpStatus(error)
  if (context === 'prepare') {
    if (status === 401) {
      throw new Error(
        '관리자 파일 업로드 인증에 실패했습니다. 로그인 상태를 확인하거나 백엔드 파일 API 권한을 확인해 주세요.'
      )
    }
    if (status === 403) {
      throw new Error('파일 업로드 권한이 없습니다. 관리자 계정 권한을 확인해 주세요.')
    }
    throw error instanceof Error ? error : new Error('업로드 URL 발급 실패')
  }
  if (context === 'confirm') {
    if (status === 401) {
      throw new Error('파일 업로드 확인(confirm) 인증에 실패했습니다. 다시 시도해 주세요.')
    }
    throw error instanceof Error ? error : new Error('파일 업로드 Confirm 실패')
  }
  throw error instanceof Error ? error : new Error('파일 상태 조회 실패')
}

function defaultSleep(ms: number): Promise<void> {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

export function resolveConfirmPath(fileObjectId: number, confirmPath?: string): string {
  const trimmed = confirmPath?.trim()
  if (!trimmed) return `/api/admin/files/${fileObjectId}/confirm`
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

export function copyRequiredHeaders(
  requiredHeaders: Record<string, string> | undefined
): Record<string, string> {
  const headers: Record<string, string> = {}
  for (const [key, value] of Object.entries(requiredHeaders ?? {})) {
    if (typeof value !== 'string') continue
    headers[key] = value
  }
  return headers
}

function signedContentType(headers: Record<string, string>): string | undefined {
  return headers['Content-Type'] ?? headers['content-type']
}

function bodyMatchingSignedContentType(file: Blob, headers: Record<string, string>): Blob {
  const contentType = signedContentType(headers)
  if (!contentType || file.type === contentType) return file
  return new Blob([file], { type: contentType })
}

/**
 * Presigned URL로 스토리지에 직접 PUT합니다.
 * - Backend API가 아님. 관리자 Authorization / cookie를 붙이지 않습니다.
 * - `requiredHeaders`를 그대로 사용합니다. 임의 헤더를 추가하지 않습니다.
 */
export async function uploadToS3(
  uploadUrl: string,
  file: Blob,
  requiredHeaders: Record<string, string> | undefined,
  method?: string
): Promise<void> {
  const trimmedUrl = uploadUrl.trim()
  if (!trimmedUrl) {
    throw new Error('파일 업로드 URL을 받지 못했습니다.')
  }
  if (!/^https?:\/\//i.test(trimmedUrl)) {
    throw new Error('Presigned upload URL이 올바르지 않습니다.')
  }

  const headers = copyRequiredHeaders(requiredHeaders)
  const body = bodyMatchingSignedContentType(file, headers)

  let response: Response
  try {
    response = await fetch(trimmedUrl, {
      method: (method?.trim() || 'PUT').toUpperCase(),
      headers,
      body,
      credentials: 'omit',
      mode: 'cors',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
    })
  } catch {
    throw new Error(
      'S3 파일 업로드 요청이 실패했습니다. Presigned URL CORS 또는 네트워크를 확인해 주세요.'
    )
  }
  if (!response.ok) {
    throw new Error(`S3 파일 업로드 실패: ${response.status}`)
  }
}

export async function createUploadRequest(
  input: CreateUploadRequestInput
): Promise<PreparedUpload> {
  const body: FileUploadPrepareRequest = {
    ownerDomain: input.owner.ownerDomain,
    ownerType: input.owner.ownerType,
    ownerId: input.owner.ownerId,
    filePurpose: input.owner.filePurpose,
    originalFileName: input.originalFileName,
    contentType: input.contentType,
    fileSize: input.fileSize,
    checksumSha256: input.checksumSha256,
  }

  const idempotencyKey = input.idempotencyKey?.trim() || crypto.randomUUID()

  try {
    return unwrapApiBody<PreparedUpload>(
      await customInstance<PreparedUpload>({
        url: '/api/admin/files/upload-requests',
        method: 'POST',
        data: body,
        headers: {
          'Idempotency-Key': idempotencyKey,
        },
      })
    )
  } catch (error) {
    rethrowAdminFileUploadError(error, 'prepare')
  }
}

export async function confirmUpload(input: ConfirmUploadInput): Promise<FileObjectResponse> {
  const body: FileUploadConfirmRequest = {
    fileSize: input.fileSize,
    checksumSha256: input.checksumSha256,
    contentType: input.contentType,
  }

  try {
    return unwrapApiBody<FileObjectResponse>(
      await customInstance<FileObjectResponse>({
        url: resolveConfirmPath(input.fileObjectId, input.confirmPath),
        method: 'POST',
        data: body,
      })
    )
  } catch (error) {
    rethrowAdminFileUploadError(error, 'confirm')
  }
}

export async function getFileStatus(fileObjectId: number): Promise<FileObjectResponse> {
  try {
    return unwrapApiBody<FileObjectResponse>(
      await customInstance<FileObjectResponse>({
        url: `/api/admin/files/${fileObjectId}`,
        method: 'GET',
      })
    )
  } catch (error) {
    rethrowAdminFileUploadError(error, 'status')
  }
}

export function isFileAvailable(file: Pick<FileObjectResponse, 'scanStatus' | 'uploadStatus'>): boolean {
  const scanStatus = file.scanStatus?.trim().toUpperCase() ?? ''
  const uploadStatus = file.uploadStatus?.trim().toUpperCase() ?? ''
  return scanStatus === 'CLEAN' && uploadStatus === 'AVAILABLE'
}

export function isFileScanFailed(
  file: Pick<FileObjectResponse, 'scanStatus' | 'uploadStatus'>
): boolean {
  const scanStatus = file.scanStatus?.trim().toUpperCase() ?? ''
  const uploadStatus = file.uploadStatus?.trim().toUpperCase() ?? ''
  return FAILED_SCAN_STATUSES.has(scanStatus) || FAILED_UPLOAD_STATUSES.has(uploadStatus)
}

export async function waitUntilFileAvailable(
  fileObjectId: number,
  options?: WaitUntilFileAvailableOptions
): Promise<FileObjectResponse> {
  const maxAttempts = options?.maxAttempts ?? DEFAULT_POLL_MAX_ATTEMPTS
  const intervalMs = options?.intervalMs ?? DEFAULT_POLL_INTERVAL_MS
  const sleep = options?.sleep ?? defaultSleep

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const file = await getFileStatus(fileObjectId)
    if (isFileAvailable(file)) return file
    if (isFileScanFailed(file)) {
      throw new Error('파일 검사 실패')
    }
    if (attempt < maxAttempts - 1) {
      await sleep(intervalMs)
    }
  }

  throw new Error(
    '파일 보안 검사가 완료되지 않았습니다. 검사가 끝날 때까지 기다린 뒤 다시 시도해 주세요.'
  )
}

/**
 * 관리자 파일 업로드 전체 flow:
 * SHA-256 → upload-requests → S3 PUT → confirm → (선택) CLEAN+AVAILABLE 대기
 */
export async function uploadAdminFile(input: UploadAdminFileInput): Promise<UploadAdminFileResult> {
  const notify = input.onPhaseChange
  const originalFileName = input.originalFileName?.trim() || input.file.name.trim() || 'upload.bin'
  const contentType = resolveUploadContentType(input.file)
  const fileSize = input.file.size
  if (fileSize < 1) {
    notify?.('ERROR')
    throw new Error('업로드할 파일이 비어 있습니다.')
  }

  try {
    notify?.('HASHING')
    const checksumSha256 = await createSha256(input.file)

    notify?.('UPLOADING')
    const prepared = await createUploadRequest({
      owner: input.owner,
      originalFileName,
      contentType,
      fileSize,
      checksumSha256,
    })

    const fileObjectId = parseFileObjectId(prepared.fileObjectId)
    if (fileObjectId == null) {
      throw new Error('파일 객체 ID를 받지 못했습니다.')
    }

    const uploadUrl = prepared.uploadUrl?.trim()
    if (!uploadUrl) {
      throw new Error('파일 업로드 URL을 받지 못했습니다.')
    }

    await uploadToS3(uploadUrl, input.file, prepared.requiredHeaders, prepared.method)

    notify?.('CONFIRMING')
    const confirmed = await confirmUpload({
      fileObjectId,
      confirmPath: prepared.confirmPath,
      fileSize,
      checksumSha256,
      contentType,
    })

    const confirmedId = parseFileObjectId(confirmed.fileObjectId) ?? fileObjectId
    const waitUntilAvailable = input.waitUntilAvailable !== false

    if (!waitUntilAvailable) {
      notify?.('SUCCESS')
      return {
        fileObjectId: confirmedId,
        checksumSha256,
        file: confirmed,
      }
    }

    // confirm 응답이 이미 CLEAN+AVAILABLE이면 추가 GET 폴링 생략
    if (isFileAvailable(confirmed)) {
      notify?.('SUCCESS')
      return {
        fileObjectId: confirmedId,
        checksumSha256,
        file: confirmed,
      }
    }

    notify?.('SCANNING')
    const available = await waitUntilFileAvailable(confirmedId, input.poll)
    notify?.('SUCCESS')
    return {
      fileObjectId: parseFileObjectId(available.fileObjectId) ?? confirmedId,
      checksumSha256,
      file: available,
    }
  } catch (error) {
    notify?.('ERROR')
    throw error
  }
}

export { parseFileObjectId }
