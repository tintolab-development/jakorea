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
