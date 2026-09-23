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
    if (scan === 'INFECTED' || scan === 'FAILED') {
      throw new Error('파일 보안 검사에 실패했습니다.')
    }
    await sleep(POLL_INTERVAL_MS)
  }
  throw new Error('파일 보안 검사가 끝나지 않았습니다.')
}
