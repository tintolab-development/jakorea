export const NOTICE_ATTACH_MAX_BYTES = 15 * 1024 * 1024

export const NOTICE_ATTACH_ACCEPT = '.jpg,.jpeg,.png'

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png'])

export function validateNoticeAttachmentsTotalSize(files: readonly File[]): string | null {
  const total = files.reduce((sum, file) => sum + file.size, 0)
  if (total > NOTICE_ATTACH_MAX_BYTES) {
    return '첨부 파일 총 용량은 15MB 이하만 등록할 수 있습니다.'
  }
  return null
}

export function validateNoticeAttachmentFile(file: File): string | null {
  const mime = file.type.trim().toLowerCase()
  const name = file.name.toLowerCase()
  const byExt = name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png')
  if (!ALLOWED_MIME.has(mime) && !byExt) {
    return 'JPG, PNG 형식의 파일만 등록할 수 있습니다.'
  }
  if (file.size > NOTICE_ATTACH_MAX_BYTES) {
    return '파일 용량은 15MB 이하만 등록할 수 있습니다.'
  }
  return null
}

export const PORTAL_PROGRAM_POST_ATTACHMENT_FILE_PURPOSE = 'PROGRAM_POST_ATTACHMENT'
