import type { FileAttachmentCreateRequest } from '@/shared/api/generated/posts/schemas/fileAttachmentCreateRequest'
import type { FileAttachmentResponse } from '@/shared/api/generated/posts/schemas/fileAttachmentResponse'
import type { FileDownloadResolveResponse } from '@/shared/api/generated/posts/schemas/fileDownloadResolveResponse'
import type { FilePageResponseFileAttachmentResponse } from '@/shared/api/generated/posts/schemas/filePageResponseFileAttachmentResponse'
import { customInstance } from '@/shared/api/orval-mutator'
import { downloadBlob } from '@/shared/utils/file-download'
import { guardAdminDownload } from '@/shared/lib/session-admin-role'
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
  attachmentType: string
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

function headerRecord(
  requiredHeaders: FileDownloadResolveResponse['requiredHeaders']
): Record<string, string> {
  const headers: Record<string, string> = {}
  for (const [key, value] of Object.entries(requiredHeaders ?? {})) {
    if (typeof value === 'string' && value) headers[key] = value
  }
  return headers
}

async function readDownloadBlob(downloadUrl: string, headers: Record<string, string>): Promise<Blob> {
  if (/^https?:\/\//i.test(downloadUrl)) {
    const response = await fetch(downloadUrl, {
      method: 'GET',
      headers,
      credentials: 'omit',
      mode: 'cors',
    })
    if (!response.ok) {
      throw new Error(`첨부파일 다운로드에 실패했습니다. (${response.status})`)
    }
    return response.blob()
  }
  return customInstance<Blob>({
    url: downloadUrl,
    method: 'GET',
    responseType: 'blob',
    headers,
  })
}

function openDownloadUrl(downloadUrl: string): void {
  const anchor = document.createElement('a')
  anchor.href = downloadUrl
  anchor.target = '_blank'
  anchor.rel = 'noopener noreferrer'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

/** 파일 다운로드 API가 준 주소로 원본 파일을 저장한다. */
export async function downloadAdminFile(input: {
  fileObjectId: number
  fileName: string
}): Promise<void> {
  const resolved = await getFileDownload(input.fileObjectId)
  const downloadUrl = resolved.downloadUrl?.trim()
  if (!downloadUrl) {
    throw new Error('첨부파일 다운로드 URL을 받지 못했습니다.')
  }
  const fileName = input.fileName.trim() || `첨부파일-${input.fileObjectId}`
  const headers = headerRecord(resolved.requiredHeaders)
  let blob: Blob
  try {
    blob = await readDownloadBlob(downloadUrl, headers)
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('첨부파일 다운로드에 실패했습니다.')) {
      throw error
    }
    if (!guardAdminDownload()) return
    openDownloadUrl(downloadUrl)
    return
  }
  await downloadBlob(blob, fileName)
}

export function getFileContentPath(fileObjectId: number): string {
  return `/api/admin/files/${fileObjectId}/content`
}

export async function fetchFileContentBlob(fileObjectId: number): Promise<Blob> {
  return customInstance<Blob>({
    url: getFileContentPath(fileObjectId),
    method: 'GET',
    responseType: 'blob',
  })
}

export function parseOwnerResourceId(value: unknown): number | null {
  return parseFileObjectId(value)
}
