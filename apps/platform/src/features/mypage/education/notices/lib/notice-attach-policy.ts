import {
  formatMultiFileUploadHint,
  sumUploadFileBytes,
  validateUploadBatch,
  validateUploadFileSize,
} from '@/shared/lib/file-upload-policy'

export const NOTICE_ATTACH_ACCEPT = '.jpg,.jpeg,.png'

export const NOTICE_ATTACH_HINT = formatMultiFileUploadHint('JPG, PNG')

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png'])

/** 이미 첨부한 파일 + 새 파일의 개수·전체 용량 검사 */
export function validateNoticeAttachmentsBatch(
  current: readonly File[],
  incoming: readonly File[]
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
  const byExt = name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png')
  if (!ALLOWED_MIME.has(mime) && !byExt) {
    return 'JPG, PNG 형식의 파일만 등록할 수 있습니다.'
  }
  return validateUploadFileSize(file)
}

export const PORTAL_PROGRAM_POST_ATTACHMENT_FILE_PURPOSE = 'PROGRAM_POST_ATTACHMENT'
export const PORTAL_PROGRAM_POST_INLINE_IMAGE_FILE_PURPOSE = 'PROGRAM_POST_INLINE_IMAGE'
