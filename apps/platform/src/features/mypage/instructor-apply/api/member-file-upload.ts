import { axiosClient } from '@/shared/api/axios-instance'

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

const REJECTED_UPLOAD_STATUSES = new Set(['QUARANTINED', 'DELETED', 'DESTROYED', 'EXPIRED'])
const REJECTED_SCAN_STATUSES = new Set(['INFECTED', 'FAILED', 'DESTROYED'])

/** 보안 검사·내용 정책에서 최종 거부된 파일. 다시 기다려도 사용할 수 없다. */
export class MemberFileRejectedError extends Error {
  constructor() {
    super('파일 보안 검사에 실패했습니다.')
    this.name = 'MemberFileRejectedError'
  }
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
  const contentType = input.file.type.trim() || 'application/octet-stream'
  const prepared = unwrap<MemberFileUploadResponse>(
    (
      await axiosClient.post(
        '/api/portal/me/files/upload-requests',
        {
          filePurpose: input.filePurpose,
          originalFileName: input.file.name,
          contentType,
          fileSize: input.file.size,
        },
        { headers: { 'Idempotency-Key': crypto.randomUUID() } }
      )
    ).data
  )
  const headers = prepared.requiredHeaders ?? {}
  const uploadResponse = await fetch(prepared.uploadUrl, {
    method: prepared.method?.trim() || 'PUT',
    headers,
    body: input.file,
  })
  if (!uploadResponse.ok) {
    throw new Error('파일 업로드에 실패했습니다.')
  }
  const confirmPath =
    prepared.confirmPath?.trim() || `/api/portal/me/files/${prepared.fileObjectId}/confirm`
  unwrap(
    (
      await axiosClient.post(confirmPath, {
        fileSize: input.file.size,
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
    if (REJECTED_SCAN_STATUSES.has(scan) || REJECTED_UPLOAD_STATUSES.has(upload)) {
      throw new MemberFileRejectedError()
    }
    await sleep(POLL_INTERVAL_MS)
  }
  throw new Error('파일 보안 검사가 끝나지 않았습니다.')
}
