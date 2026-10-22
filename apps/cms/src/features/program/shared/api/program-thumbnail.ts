import { loadAdminFileBlob } from '@/shared/lib/admin-file-upload/attachments'
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

function isPreviewableImageBlob(blob: Blob): boolean {
  return blob.size > 0 && blob.type !== 'application/json'
}

/** 등록 위저드 단계 이동 시 같은 세션에서 다시 받지 않도록 File/Blob을 기억한다. */
const thumbnailPreviewBlobs = new Map<number, Blob>()

export function rememberProgramThumbnailPreviewBlob(fileObjectId: number, blob: Blob): void {
  if (fileObjectId < 1 || blob.size < 1) return
  thumbnailPreviewBlobs.set(fileObjectId, blob)
}

export function forgetProgramThumbnailPreviewBlob(fileObjectId: number | null | undefined): void {
  if (fileObjectId == null || fileObjectId < 1) return
  thumbnailPreviewBlobs.delete(fileObjectId)
}

export function resetProgramThumbnailPreviewBlobsForTests(): void {
  thumbnailPreviewBlobs.clear()
}

/** img에 넣을 주소. `/content` fallback은 이 purpose에서 404라 쓰지 않는다. */
export async function loadProgramThumbnailPreviewUrl(fileObjectId: number): Promise<string> {
  const cached = thumbnailPreviewBlobs.get(fileObjectId)
  if (cached && isPreviewableImageBlob(cached)) {
    return URL.createObjectURL(cached)
  }
  const blob = await loadAdminFileBlob(fileObjectId, { skipGlobalErrorAlert: true })
  if (!isPreviewableImageBlob(blob)) {
    throw new Error('대표 이미지를 불러오지 못했습니다.')
  }
  thumbnailPreviewBlobs.set(fileObjectId, blob)
  return URL.createObjectURL(blob)
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
