import {
  getFileDownload,
  loadAdminFileBlob,
  toSameOriginApiPath,
} from '@/shared/lib/admin-file-upload/attachments'
import { getApiBaseUrl } from '@/shared/lib/api-remote-env'
import customInstance from '@/shared/api/orval-mutator'

export type ProgramThumbnailResponse = {
  fileObjectId: number | null
  originalFileName: string | null
  contentType: string | null
  fileSize: number | null
  downloadPath: string | null
}

function unwrapApiBody<T>(payload: unknown): T {
  if (payload != null && typeof payload === 'object') {
    const body = payload as Record<string, unknown>
    if (body.success === true && 'data' in body) {
      return unwrapApiBody<T>(body.data)
    }
  }
  return payload as T
}

/** GET /api/admin/programs/{programId}/thumbnail — 없으면 fileObjectId=null */
export async function fetchProgramThumbnail(programId: number): Promise<ProgramThumbnailResponse> {
  return unwrapApiBody(
    await customInstance({
      url: `/api/admin/programs/${programId}/thumbnail`,
      method: 'GET',
    })
  )
}

/** img에 넣을 주소. 바이트를 받으면 blob, 아니면 서명된 downloadUrl. `/content`는 쓰지 않는다. */
export async function loadProgramThumbnailPreviewUrl(fileObjectId: number): Promise<string> {
  try {
    const blob = await loadAdminFileBlob(fileObjectId)
    if (blob.size > 0 && blob.type !== 'application/json') {
      return URL.createObjectURL(blob)
    }
  } catch {
    /* 서명 주소로 표시 */
  }
  const resolved = await getFileDownload(fileObjectId)
  const downloadUrl = resolved.downloadUrl?.trim()
  if (!downloadUrl) {
    throw new Error('대표 이미지 주소를 받지 못했습니다.')
  }
  return toSameOriginApiPath(downloadUrl, getApiBaseUrl()) ?? downloadUrl
}

/** PUT /api/admin/programs/{programId}/thumbnail — null 이면 대표 이미지를 지운다 */
export async function putProgramThumbnail(
  programId: number,
  fileObjectId: number | null
): Promise<void> {
  await customInstance({
    url: `/api/admin/programs/${programId}/thumbnail`,
    method: 'PUT',
    data: { fileObjectId },
  })
}
