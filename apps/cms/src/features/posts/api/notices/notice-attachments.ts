import type { Notice, NoticeAttachment } from '@/data/mock/notices'
import {
  createFileAttachment,
  deleteFileObject,
  getFileDownload,
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
import { downloadFile } from '@/shared/lib/file-download'

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

export async function listNoticeAttachments(noticeId: number): Promise<NoticeAttachment[]> {
  const rows = await listFileAttachments(noticeFileOwner(noticeId))
  return rows
    .map(row => {
      const fileObjectId = parseOwnerResourceId(row.fileObjectId)
      if (fileObjectId == null) return null
      // FileAttachmentResponse에 originalFileName이 없음 — 파일별 GET status N+1 금지
      return toNoticeAttachment(fileObjectId, `첨부파일-${fileObjectId}`, {
        attachmentId: row.attachmentId,
      })
    })
    .filter((row): row is NoticeAttachment => row != null)
}

export async function hydrateNoticeAttachments(notice: Notice): Promise<Notice> {
  const ownerId = parseNoticeOwnerId(notice.id)
  if (ownerId == null) return notice
  // hasAttachment=false면 attachments API/상태 조회를 생략
  if (!notice.hasAttachment && !(notice.attachments && notice.attachments.length > 0)) {
    return notice
  }
  const attachments = await listNoticeAttachments(ownerId)
  return {
    ...notice,
    attachments,
    hasAttachment: attachments.length > 0 || notice.hasAttachment,
  }
}

export async function uploadAndAttachNoticeFiles(
  noticeId: number,
  files: File[],
  displayOrderStart = 1
): Promise<NoticeAttachment[]> {
  const owner = noticeFileOwner(noticeId)
  const uploaded: NoticeAttachment[] = []
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index]
    if (!file) continue
    // 공지 저장은 confirm + attachment 연결까지. CLEAN 폴링은 저장을 막고 files/{id} 과호출을 만든다.
    const result = await uploadAdminFile({ file, owner, waitUntilAvailable: false })
    const attached = await createFileAttachment({
      fileObjectId: result.fileObjectId,
      owner,
      attachmentType: NOTICE_FILE_ATTACHMENT_TYPE,
      displayOrder: displayOrderStart + index,
    })
    uploaded.push(
      toNoticeAttachment(result.fileObjectId, file.name, {
        attachmentId: attached.attachmentId,
      })
    )
  }
  return uploaded
}

export async function removeNoticeFileObjects(fileObjectIds: number[]): Promise<void> {
  for (const fileObjectId of fileObjectIds) {
    await deleteFileObject(fileObjectId)
  }
}

export async function downloadNoticeAttachment(attachment: NoticeAttachment): Promise<void> {
  const fileObjectId = attachment.fileObjectId
  if (fileObjectId == null) {
    await downloadFile(attachment.name, attachment.fileUrl)
    return
  }
  const resolved = await getFileDownload(fileObjectId)
  const downloadUrl = resolved.downloadUrl?.trim()
  if (!downloadUrl) {
    throw new Error('첨부파일 다운로드 URL을 받지 못했습니다.')
  }
  const requiredHeaders = resolved.requiredHeaders ?? {}
  const extraHeaders = Object.entries(requiredHeaders).filter(([, value]) => Boolean(value))
  if (extraHeaders.length === 0) {
    await downloadFile(attachment.name, downloadUrl)
    return
  }
  const headers = new Headers()
  for (const [key, value] of extraHeaders) {
    headers.set(key, value)
  }
  const response = await fetch(downloadUrl, {
    method: 'GET',
    headers,
    credentials: 'omit',
    mode: 'cors',
  })
  if (!response.ok) {
    throw new Error(`첨부파일 다운로드에 실패했습니다. (${response.status})`)
  }
  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  await downloadFile(attachment.name, objectUrl)
  URL.revokeObjectURL(objectUrl)
}
