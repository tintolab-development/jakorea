import type { FileAttachmentCreateRequest } from '@/shared/api/generated/posts/schemas/fileAttachmentCreateRequest'
import type { FileAttachmentResponse } from '@/shared/api/generated/posts/schemas/fileAttachmentResponse'
import type { FileDownloadResolveResponse } from '@/shared/api/generated/posts/schemas/fileDownloadResolveResponse'
import type { FilePageResponseFileAttachmentResponse } from '@/shared/api/generated/posts/schemas/filePageResponseFileAttachmentResponse'
import { customInstance } from '@/shared/api/orval-mutator'
import { parseFileObjectId } from '@/shared/lib/admin-file-upload/upload'
import type { AdminFileUploadOwner } from '@/shared/lib/admin-file-upload/types'

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

export type CreateFileAttachmentInput = {
  fileObjectId: number
  owner: AdminFileUploadOwner
  attachmentType?: string
  displayOrder?: number
}

function attachmentItems(
  dto: FilePageResponseFileAttachmentResponse | FileAttachmentResponse[] | null | undefined
): FileAttachmentResponse[] {
  if (Array.isArray(dto)) return dto
  if (dto == null || typeof dto !== 'object') return []
  if (Array.isArray(dto.items)) return dto.items
  const record = dto as { content?: FileAttachmentResponse[] }
  if (Array.isArray(record.content)) return record.content
  return []
}

export async function createFileAttachment(
  input: CreateFileAttachmentInput
): Promise<FileAttachmentResponse> {
  const body: FileAttachmentCreateRequest = {
    fileObjectId: input.fileObjectId,
    ownerDomain: input.owner.ownerDomain,
    ownerType: input.owner.ownerType,
    ownerId: input.owner.ownerId,
    attachmentType: input.attachmentType?.trim() || 'DEFAULT',
    displayOrder: input.displayOrder,
  }
  return unwrapApiBody<FileAttachmentResponse>(
    await customInstance<FileAttachmentResponse>({
      url: '/api/admin/files/attachments',
      method: 'POST',
      data: body,
    })
  )
}

export async function listFileAttachments(
  owner: Pick<AdminFileUploadOwner, 'ownerDomain' | 'ownerType' | 'ownerId'>
): Promise<FileAttachmentResponse[]> {
  const dto = unwrapApiBody<FilePageResponseFileAttachmentResponse>(
    await customInstance<FilePageResponseFileAttachmentResponse>({
      url: '/api/admin/files/attachments',
      method: 'GET',
      params: {
        ownerDomain: owner.ownerDomain,
        ownerType: owner.ownerType,
        ownerId: owner.ownerId,
        page: 0,
        size: 100,
      },
    })
  )
  return attachmentItems(dto)
}

export async function deleteFileObject(fileObjectId: number): Promise<void> {
  await customInstance({
    url: `/api/admin/files/${fileObjectId}`,
    method: 'DELETE',
  })
}

export async function getFileDownload(fileObjectId: number): Promise<FileDownloadResolveResponse> {
  return unwrapApiBody<FileDownloadResolveResponse>(
    await customInstance<FileDownloadResolveResponse>({
      url: `/api/admin/files/${fileObjectId}/download`,
      method: 'GET',
    })
  )
}

export function parseOwnerResourceId(value: unknown): number | null {
  return parseFileObjectId(value)
}
