import { fetchFileContentBlob } from '@/shared/lib/admin-file-upload/attachments'
import customInstance from '@/shared/api/orval-mutator'
import {
  captureProgramThumbnailPreviewSession,
  clearProgramThumbnailPreviewCache,
  createProgramThumbnailPreviewUrl,
  forgetProgramThumbnailPreviewBlob,
  isPreviewableImageBlob,
  isProgramThumbnailPreviewSessionCurrent,
  readLocalProgramThumbnailPreviewBlob,
} from './program-thumbnail-preview-cache'
export {
  captureProgramThumbnailPreviewSession,
  createProgramThumbnailPreviewUrl,
  forgetProgramThumbnailPreviewBlob,
  isProgramThumbnailPreviewSessionCurrent,
  releaseProgramThumbnailPreviewUrl,
  rememberProgramThumbnailPreviewBlob,
} from './program-thumbnail-preview-cache'

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

export function resetProgramThumbnailPreviewBlobsForTests(): void {
  clearProgramThumbnailPreviewCache()
}

/** Persisted thumbnails must pass scoped inline authorization every time. No download fallback. */
export async function loadProgramThumbnailPreviewUrl(
  fileObjectId: number,
  options: { allowLocalUpload?: boolean } = {}
): Promise<string> {
  const session = captureProgramThumbnailPreviewSession()
  // Only a caller displaying an unsaved upload may opt in to local bytes.
  const cached = options.allowLocalUpload ? readLocalProgramThumbnailPreviewBlob(fileObjectId) : undefined
  if (cached) return createProgramThumbnailPreviewUrl(cached, session)
  const blob = await fetchFileContentBlob(fileObjectId, { skipGlobalErrorAlert: true })
  if (!isProgramThumbnailPreviewSessionCurrent(session)) {
    throw new Error('미리보기 인증 세션이 변경되었습니다.')
  }
  if (!isPreviewableImageBlob(blob)) {
    throw new Error('대표 이미지를 불러오지 못했습니다.')
  }
  return createProgramThumbnailPreviewUrl(blob, session)
}

/** PUT /api/admin/programs/{programId}/thumbnail — null 이면 대표 이미지를 지운다 */
export async function putProgramThumbnail(
  programId: number,
  fileObjectId: number | null
): Promise<void> {
  const session = captureProgramThumbnailPreviewSession()
  await customInstance({
    url: `/api/admin/programs/${programId}/thumbnail`,
    method: 'PUT',
    data: { fileObjectId },
  })
  if (isProgramThumbnailPreviewSessionCurrent(session)) forgetProgramThumbnailPreviewBlob(fileObjectId)
}
