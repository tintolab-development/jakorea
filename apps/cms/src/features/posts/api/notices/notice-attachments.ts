import type { Notice, NoticeAttachment } from '@/data/mock/notices'
import {
  fetchNoticeAttachmentsRemote,
  replaceNoticeAttachmentsRemote,
} from '@/features/posts/api/notices/notices-api-client'
import type { NoticeAttachmentResponse } from '@/shared/api/generated/posts/schemas'
import {
  deleteFileObject,
  downloadAdminFile,
  listFileAttachments,
  parseOwnerResourceId,
} from '@/shared/lib/admin-file-upload/attachments'
import {
  ADMIN_FILE_OWNER,
  ADMIN_FILE_PURPOSE,
  buildAdminFileOwner,
  uploadAdminFile,
} from '@/shared/lib/admin-file-upload'
import type { AdminFileUploadOwner } from '@/shared/lib/admin-file-upload/types'

/** CMS 공지 첨부의 files-domain owner. OpenAPI example은 PROGRAM/APPLICATION이라 공지 전용 값을 둔다. */
export const NOTICE_FILE_OWNER_DOMAIN = 'CONTENT'
export const NOTICE_FILE_OWNER_TYPE = 'NOTICE'
export const NOTICE_FILE_PURPOSE = ADMIN_FILE_PURPOSE.NOTICE_ATTACHMENT
export const NOTICE_FILE_ATTACHMENT_TYPE = 'NOTICE_ATTACHMENT'

export function noticeFileOwner(noticeId: number): AdminFileUploadOwner {
  return buildAdminFileOwner(ADMIN_FILE_OWNER.NOTICE, noticeId, NOTICE_FILE_PURPOSE)
}

export function noticeInlineImageOwner(noticeId: number): AdminFileUploadOwner {
  return buildAdminFileOwner(
    ADMIN_FILE_OWNER.NOTICE_INLINE,
    noticeId,
    ADMIN_FILE_PURPOSE.NOTICE_INLINE_IMAGE
  )
}

export function parseNoticeOwnerId(noticeId: string | undefined): number | null {
  return parseOwnerResourceId(noticeId)
}

function toNoticeAttachment(
  fileObjectId: number,
  name: string,
  extra?: Partial<NoticeAttachment>
): NoticeAttachment {
  return {
    name,
    fileObjectId,
    ...extra,
  }
}

function mapNoticeAttachmentResponse(row: NoticeAttachmentResponse): NoticeAttachment | null {
  const fileObjectId = parseOwnerResourceId(row.fileObjectId)
  const name = row.originalFileName?.trim() || (fileObjectId != null ? `첨부파일-${fileObjectId}` : '')
  if (!name) return null
  if (fileObjectId == null) {
    return {
      name,
      attachmentId: row.attachmentId,
      fileUrl: row.downloadPath,
    }
  }
  return toNoticeAttachment(fileObjectId, name, {
    attachmentId: row.attachmentId,
    fileUrl: row.downloadPath,
  })
}

export async function listNoticeAttachments(noticeId: string): Promise<NoticeAttachment[]> {
  const rows = await fetchNoticeAttachmentsRemote(noticeId)
  return rows
    .map(mapNoticeAttachmentResponse)
    .filter((row): row is NoticeAttachment => row != null)
}

export async function linkNoticeAttachments(
  noticeId: string,
  fileObjectIds: number[]
): Promise<NoticeAttachment[]> {
  const rows = await replaceNoticeAttachmentsRemote(noticeId, fileObjectIds)
  return rows
    .map(mapNoticeAttachmentResponse)
    .filter((row): row is NoticeAttachment => row != null)
}

async function listLegacyFileAttachments(noticeId: number): Promise<NoticeAttachment[]> {
  const rows = await listFileAttachments(noticeFileOwner(noticeId))
  return rows
    .map(row => {
      const fileObjectId = parseOwnerResourceId(row.fileObjectId)
      if (fileObjectId == null) return null
      return toNoticeAttachment(fileObjectId, `첨부파일-${fileObjectId}`, {
        attachmentId: row.attachmentId,
      })
    })
    .filter((row): row is NoticeAttachment => row != null)
}

export function noticeUploadOwnerId(notice: Pick<Notice, 'id' | 'resourceId'>): number | null {
  if (notice.resourceId != null && notice.resourceId >= 1) return notice.resourceId
  return parseNoticeOwnerId(notice.id)
}

export async function hydrateNoticeAttachments(notice: Notice): Promise<Notice> {
  if (!notice.id) return notice
  try {
    const linked = await listNoticeAttachments(notice.id)
    if (linked.length > 0) {
      return {
        ...notice,
        attachments: linked,
        hasAttachment: true,
      }
    }
    const ownerId = noticeUploadOwnerId(notice)
    if (ownerId == null) return { ...notice, attachments: [], hasAttachment: false }
    const legacy = await listLegacyFileAttachments(ownerId)
    if (legacy.length === 0) return { ...notice, attachments: [], hasAttachment: false }
    return {
      ...notice,
      attachments: legacy,
      hasAttachment: true,
    }
  } catch {
    return { ...notice, attachments: notice.attachments ?? [], hasAttachment: false }
  }
}

export async function uploadAndAttachNoticeFiles(
  noticeId: number,
  files: File[]
): Promise<NoticeAttachment[]> {
  const owner = noticeFileOwner(noticeId)
  const uploaded: NoticeAttachment[] = []
  for (const file of files) {
    if (!file) continue
    // notice_attachment 연결은 CLEAN + AVAILABLE 이후만 가능하다.
    const result = await uploadAdminFile({ file, owner, waitUntilAvailable: true })
    uploaded.push(toNoticeAttachment(result.fileObjectId, file.name))
  }
  return uploaded
}

export async function removeNoticeFileObjects(fileObjectIds: number[]): Promise<void> {
  for (const fileObjectId of fileObjectIds) {
    await deleteFileObject(fileObjectId)
  }
}

function fileObjectIdFromDownloadPath(path?: string): number | null {
  const match = /\/files\/(\d+)\/download(?:\?|$)/.exec(path?.trim() ?? '')
  if (!match) return null
  return parseOwnerResourceId(match[1])
}

export async function downloadNoticeAttachment(attachment: NoticeAttachment): Promise<void> {
  const fileObjectId = attachment.fileObjectId ?? fileObjectIdFromDownloadPath(attachment.fileUrl)
  if (fileObjectId == null) {
    throw new Error('다운로드할 첨부파일 정보가 없습니다.')
  }
  await downloadAdminFile({
    fileObjectId,
    fileName: attachment.name,
  })
}
