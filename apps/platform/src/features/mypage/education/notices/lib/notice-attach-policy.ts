import {
  formatMultiFileUploadHint,
  sumUploadFileBytes,
  validateUploadBatch,
  validateUploadFileSize,
} from '@/shared/lib/file-upload-policy'

export const NOTICE_ATTACH_ACCEPT =
  '.jpg,.jpeg,.png,.hwp,.xls,.xlsx,.pdf,.doc,.docx,image/jpeg,image/png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/x-hwp,application/haansofthwp'

export const NOTICE_ATTACH_HINT = formatMultiFileUploadHint('JPG, PNG, HWP, Excel, PDF, Word')

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/x-hwp',
  'application/haansofthwp',
  'application/vnd.hancom.hwp',
])
const ALLOWED_EXT = [
  '.jpg',
  '.jpeg',
  '.png',
  '.hwp',
  '.xls',
  '.xlsx',
  '.pdf',
  '.doc',
  '.docx',
] as const
type SizedNoticeAttachment = { size: number }

/** 이미 첨부한 파일 + 새 파일의 개수·전체 용량 검사 */
export function validateNoticeAttachmentsBatch(
  current: readonly SizedNoticeAttachment[],
  incoming: readonly SizedNoticeAttachment[]
): string | null {
  return validateUploadBatch({
    currentCount: current.length,
    currentTotalBytes: sumUploadFileBytes(current),
    incoming,
  })
}

export function validateNoticeAttachmentFile(file: File): string | null {
  const mime = file.type.trim().toLowerCase()
  const name = file.name.toLowerCase()
  const byExt = ALLOWED_EXT.some(ext => name.endsWith(ext))
  if (!ALLOWED_MIME.has(mime) && !byExt) {
    return 'JPG, PNG, HWP, Excel, PDF, Word 형식의 파일만 등록할 수 있습니다.'
  }
  return validateUploadFileSize(file)
}

export const PORTAL_PROGRAM_POST_ATTACHMENT_FILE_PURPOSE = 'PROGRAM_POST_ATTACHMENT'
export const PORTAL_PROGRAM_POST_INLINE_IMAGE_FILE_PURPOSE = 'PROGRAM_POST_INLINE_IMAGE'
