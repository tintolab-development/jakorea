import customInstance from '@/shared/api/orval-mutator'
import type { AdminFilePurpose } from '@/shared/lib/admin-file-upload/purposes'
import type { AdminFileUploadOwner } from '@/shared/lib/admin-file-upload/types'
import { ADMIN_FILE_PURPOSE } from '@/shared/lib/admin-file-upload'

export type ProgramAttachmentItem = {
  attachmentId?: number
  fileObjectId?: number
  originalFileName?: string | null
  contentType?: string | null
  fileSize?: number | null
  displayOrder?: number | null
  downloadPath?: string | null
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

/**
 * 프로그램 상세 첨부·썸네일 업로드 owner (BE: PROGRAM_CONTENT / PROGRAM / {programId}).
 * 등록 전은 OpenAPI upload-first draft — `ownerId: null`. 임시 프로그램 id를 넣지 않는다.
 */
export function programContentFileOwner(
  programId: number | null,
  filePurpose: AdminFilePurpose
): AdminFileUploadOwner {
  return {
    ownerDomain: 'PROGRAM_CONTENT',
    ownerType: 'PROGRAM',
    ownerId: programId,
    filePurpose,
  }
}

export function programDetailAttachmentOwner(programId: number | null): AdminFileUploadOwner {
  return programContentFileOwner(programId, ADMIN_FILE_PURPOSE.PROGRAM_DETAIL_ATTACHMENT)
}

export function programThumbnailOwner(programId: number | null): AdminFileUploadOwner {
  return programContentFileOwner(programId, ADMIN_FILE_PURPOSE.PROGRAM_THUMBNAIL)
}

/** GET /api/admin/programs/{programId}/attachments — GENERAL 상세 첨부만 */
export async function fetchProgramAttachments(
  programId: number
): Promise<ProgramAttachmentItem[]> {
  const data = unwrapApiBody<ProgramAttachmentItem[] | { items?: ProgramAttachmentItem[] }>(
    await customInstance({
      url: `/api/admin/programs/${programId}/attachments`,
      method: 'GET',
    })
  )
  if (Array.isArray(data)) return data
  return Array.isArray(data?.items) ? data.items : []
}

/**
 * PUT /api/admin/programs/{programId}/attachments — GENERAL 첨부 전체 교체.
 * 요청에 없는 GENERAL 행은 삭제된다. THUMBNAIL 행은 건드리지 않아야 한다(BE 계약).
 */
export async function putProgramAttachments(
  programId: number,
  fileObjectIds: number[]
): Promise<ProgramAttachmentItem[]> {
  const data = unwrapApiBody<ProgramAttachmentItem[] | { items?: ProgramAttachmentItem[] }>(
    await customInstance({
      url: `/api/admin/programs/${programId}/attachments`,
      method: 'PUT',
      data: { fileObjectIds },
    })
  )
  if (Array.isArray(data)) return data
  return Array.isArray(data?.items) ? data.items : []
}
