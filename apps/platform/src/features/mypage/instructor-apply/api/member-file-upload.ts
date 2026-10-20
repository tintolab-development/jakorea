import { axiosClient } from '@/shared/api/axios-instance'
import { withFileUploadOverlay } from '@/shared/lib/file-upload-overlay'
import { isAxiosError } from 'axios'

const POLL_INTERVAL_MS = 2_000
const POLL_MAX_ATTEMPTS = 30

type MemberFileUploadResponse = {
  fileObjectId: number
  uploadUrl: string
  method?: string
  requiredHeaders?: Record<string, string>
  confirmPath?: string
}

type MemberFileResponse = {
  fileObjectId: number
  scanStatus?: string
  uploadStatus?: string
}

function unwrap<T>(payload: unknown): T {
  if (payload && typeof payload === 'object') {
    const body = payload as Record<string, unknown>
    if (body.success === true && 'data' in body) return unwrap<T>(body.data)
  }
  return payload as T
}

/** CMS `admin-file-upload`와 동일 — 스캔 대기(`PENDING_SCAN` 등)는 계속 폴링 */
const FAILED_UPLOAD_STATUSES = new Set(['QUARANTINED'])
const FAILED_SCAN_STATUSES = new Set(['INFECTED', 'FAILED'])

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
    return (
      typed ||
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
  }
  if (ext === 'hwp') return typed || 'application/x-hwp'
  if (ext === 'hwpx') return typed || 'application/vnd.hancom.hwpx'
  if (ext === 'ppt') return typed || 'application/vnd.ms-powerpoint'
  if (ext === 'pptx') {
    return (
      typed ||
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    )
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

/** 파일이 비어 있어 업로드 요청 자체를 만들 수 없는 경우 */
export class MemberFileEmptyError extends Error {
  constructor() {
    super('빈 파일은 업로드할 수 없습니다. 파일을 다시 선택해 주세요.')
    this.name = 'MemberFileEmptyError'
  }
}

export class MemberFileTooLargeError extends Error {
  constructor() {
    super('파일은 15MB 이하만 첨부할 수 있습니다.')
    this.name = 'MemberFileTooLargeError'
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
  return (
    file.scanStatus?.trim().toUpperCase() === 'CLEAN' &&
    file.uploadStatus?.trim().toUpperCase() === 'AVAILABLE'
  )
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
}): Promise<number> {
  // 일부 브라우저/로컬 파일 provider는 선택 직후 File.size를 0으로
  // 노출할 수 있다. 실제 바이트를 확인해 정상 파일을 빈 파일로 오판하지
  // 않도록 하고, fallback으로 읽은 바이트를 PUT body에도 사용한다.
  const declaredFileSize = input.file.size
  const fileBytes = declaredFileSize > 0 ? null : await input.file.arrayBuffer()
  const fileSize = fileBytes?.byteLength ?? declaredFileSize
  if (!Number.isFinite(fileSize) || fileSize <= 0) {
    throw new MemberFileEmptyError()
  }
  if (
    input.filePurpose === 'VOLUNTEER_APPLICATION_EVIDENCE' &&
    fileSize > VOLUNTEER_EVIDENCE_MAX_BYTES
  ) {
    throw new MemberFileTooLargeError()
  }
  return withFileUploadOverlay(() =>
    uploadPreparedMemberPortalFile({
      file: input.file,
      filePurpose: input.filePurpose,
      fileBytes,
      fileSize,
    }),
  )
}

async function uploadPreparedMemberPortalFile(input: {
  file: File
  filePurpose: string
  fileBytes: ArrayBuffer | null
  fileSize: number
}): Promise<number> {
  const contentType = resolveMemberPortalUploadContentType(input.file)
  const prepared = unwrap<MemberFileUploadResponse>(
    (
      await axiosClient.post(
        '/api/portal/me/files/upload-requests',
        {
          filePurpose: input.filePurpose,
          originalFileName: input.file.name,
          contentType,
          fileSize: input.fileSize,
        },
        { headers: { 'Idempotency-Key': crypto.randomUUID() } }
      )
    ).data
  )
  const headers: Record<string, string> = { ...(prepared.requiredHeaders ?? {}) }
  if (!headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = contentType
  }
  const uploadResponse = await fetch(prepared.uploadUrl, {
    method: prepared.method?.trim() || 'PUT',
    headers,
    body: input.fileBytes ?? input.file,
  })
  if (!uploadResponse.ok) {
    const detail = await uploadResponse.text().catch(() => '')
    const snippet = detail.trim().slice(0, 200)
    throw new Error(
      snippet
        ? `파일 저장소 업로드에 실패했습니다. (${uploadResponse.status}) ${snippet}`
        : `파일 저장소 업로드에 실패했습니다. (${uploadResponse.status})`,
    )
  }
  const confirmPath =
    prepared.confirmPath?.trim() || `/api/portal/me/files/${prepared.fileObjectId}/confirm`
  unwrap(
    (
      await axiosClient.post(confirmPath, {
        fileSize: input.fileSize,
        contentType,
      })
    ).data
  )
  for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt += 1) {
    const status = unwrap<MemberFileResponse>(
      (await axiosClient.get(`/api/portal/me/files/${prepared.fileObjectId}`)).data
    )
    if (isAvailable(status)) return prepared.fileObjectId
    const scan = status.scanStatus?.trim().toUpperCase() ?? ''
    const upload = status.uploadStatus?.trim().toUpperCase() ?? ''
    if (FAILED_SCAN_STATUSES.has(scan) || FAILED_UPLOAD_STATUSES.has(upload)) {
      throw new MemberFileRejectedError()
    }
    await sleep(POLL_INTERVAL_MS)
  }
  throw new Error('파일 보안 검사가 끝나지 않았습니다.')
}
