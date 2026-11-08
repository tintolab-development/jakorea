import type { Notice, NoticeAttachment } from '@/features/posts/model/notice'
import { dedupeFileObjectIds } from '@/features/posts/api/notices/notice-file-ids'
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
import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import { beginFileUploadOverlay } from '@/shared/ui/file-upload-overlay-store'
import { customInstance } from '@/shared/api/orval-mutator'
import {
  ADMIN_FILE_OWNER,
  ADMIN_FILE_PURPOSE,
  buildAdminFileOwner,
  confirmUpload,
  createSha256,
  isFileAvailable,
  parseFileObjectId,
  resolveUploadContentType,
  uploadAdminFile,
  uploadToS3,
  waitUntilFileAvailable,
} from '@/shared/lib/admin-file-upload'
import type { AdminFileUploadOwner, PreparedUpload } from '@/shared/lib/admin-file-upload/types'

/** CMS 공지 첨부의 files-domain owner. OpenAPI example은 PROGRAM/APPLICATION이라 공지 전용 값을 둔다. */
export const NOTICE_FILE_OWNER_DOMAIN = 'CONTENT'
export const NOTICE_FILE_OWNER_TYPE = 'NOTICE'
export const NOTICE_FILE_PURPOSE = ADMIN_FILE_PURPOSE.NOTICE_ATTACHMENT
export const NOTICE_FILE_ATTACHMENT_TYPE = 'NOTICE_ATTACHMENT'

export function noticeFileOwner(noticeId: number): AdminFileUploadOwner {
  return buildAdminFileOwner(ADMIN_FILE_OWNER.NOTICE, noticeId, NOTICE_FILE_PURPOSE)
}

export { noticeInlineImageOwner } from '@/shared/lib/admin-file-upload/inline-image'

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
    fileSize: typeof row.fileSize === 'number' ? row.fileSize : undefined,
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

/** 시안 정책: 파일당 최대 20MB · 최대 10개 · 총 100MB */
export const NOTICE_ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024
export const NOTICE_ATTACHMENT_MAX_COUNT = 10
export const NOTICE_ATTACHMENT_MAX_TOTAL_BYTES = 100 * 1024 * 1024
export const NOTICE_ATTACHMENT_ACCEPT = '.jpg,.jpeg,.png,.hwp,.hwpx,.pdf,.doc,.docx,.xls,.xlsx'

/** 첨부 영역 안내 (시안 문구) */
export const NOTICE_ATTACHMENT_GUIDE_LINES = [
  '- 파일은 JPG, PNG, HWP, Excel, PDF, Word 형식만 등록 가능하며, 최대 10개(파일당 20MB, 총 100MB)까지 첨부할 수 있습니다.',
  '- 첨부 파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.',
]

const NOTICE_ATTACHMENT_EXTENSIONS = new Set([
  'jpg',
  'jpeg',
  'png',
  'hwp',
  'hwpx',
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
])

export function isAllowedNoticeAttachment(file: File): boolean {
  if (file.size < 1 || file.size > NOTICE_ATTACHMENT_MAX_BYTES) return false
  const ext = file.name.trim().toLowerCase().split('.').pop() ?? ''
  return NOTICE_ATTACHMENT_EXTENSIONS.has(ext)
}

/**
 * 신규 공지 첨부 prepare. 공지 ID가 없으므로 ownerId는 null이다.
 * 0이나 임시 notice id를 넣지 않는다.
 */
async function prepareUnboundNoticeAttachment(input: {
  originalFileName: string
  contentType: string
  fileSize: number
  checksumSha256: string
}): Promise<PreparedUpload> {
  return unwrapApiBody<PreparedUpload>(
    await customInstance<PreparedUpload>({
      url: '/api/admin/files/upload-requests',
      method: 'POST',
      data: {
        ownerDomain: NOTICE_FILE_OWNER_DOMAIN,
        ownerType: NOTICE_FILE_OWNER_TYPE,
        ownerId: null,
        filePurpose: NOTICE_FILE_PURPOSE,
        originalFileName: input.originalFileName,
        contentType: input.contentType,
        fileSize: input.fileSize,
        checksumSha256: input.checksumSha256,
      },
      headers: {
        'Idempotency-Key': crypto.randomUUID(),
      },
    })
  )
}

/** 신규 공지 첨부 1건. AVAILABLE + CLEAN 이후에만 fileObjectId를 반환한다. */
export async function uploadUnboundNoticeAttachment(file: File): Promise<number> {
  if (file.size < 1) {
    throw new Error('업로드할 파일이 비어 있습니다.')
  }
  const endOverlay = beginFileUploadOverlay()
  try {
  const originalFileName = file.name.trim() || 'upload.bin'
  const contentType = resolveUploadContentType(file)
  const checksumSha256 = await createSha256(file)
  const prepared = await prepareUnboundNoticeAttachment({
    originalFileName,
    contentType,
    fileSize: file.size,
    checksumSha256,
  })
  const fileObjectId = parseFileObjectId(prepared.fileObjectId)
  if (fileObjectId == null) {
    throw new Error('파일 객체 ID를 받지 못했습니다.')
  }
  const uploadUrl = prepared.uploadUrl?.trim()
  if (!uploadUrl) {
    throw new Error('파일 업로드 URL을 받지 못했습니다.')
  }
  await uploadToS3(uploadUrl, file, prepared.requiredHeaders, prepared.method)
  const confirmed = await confirmUpload({
    fileObjectId,
    confirmPath: prepared.confirmPath,
    fileSize: file.size,
    checksumSha256,
    contentType,
  })
  const confirmedId = parseFileObjectId(confirmed.fileObjectId) ?? fileObjectId
  if (isFileAvailable(confirmed)) return confirmedId
  const available = await waitUntilFileAvailable(confirmedId)
  return parseFileObjectId(available.fileObjectId) ?? confirmedId
  } finally {
    endOverlay()
  }
}

export async function uploadUnboundNoticeAttachments(files: File[]): Promise<number[]> {
  const ids: number[] = []
  for (const file of files) {
    if (!file || file.size < 1) continue
    ids.push(await uploadUnboundNoticeAttachment(file))
  }
  return dedupeFileObjectIds(ids)
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
