import {
  formatMultiFileUploadHint,
  sumUploadFileBytes,
  validateUploadBatch,
  validateUploadFileSize,
} from '@/shared/lib/file-upload-policy'

export const NOTICE_ATTACH_ACCEPT =
  '.jpg,.jpeg,.png,.hwp,.xls,.xlsx,.pdf,.doc,.docx,image/jpeg,image/png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/x-hwp,application/haansofthwp'

/** 안내사항 첨부 허용 형식 — 첨부 안내 문구·「파일 형식」 팝업 설명에 같이 쓴다 */
export const NOTICE_ATTACH_FORMATS_LABEL = 'JPG, PNG, HWP, Excel, PDF, Word'

export const NOTICE_ATTACH_HINT = formatMultiFileUploadHint(NOTICE_ATTACH_FORMATS_LABEL)

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

/** 허용 형식인지 (MIME 또는 확장자) — 아니면 시안 「파일 형식이 맞지 않는 경우」 팝업 */
export function isNoticeAttachmentTypeAllowed(file: File): boolean {
  const mime = file.type.trim().toLowerCase()
  const name = file.name.toLowerCase()
  return ALLOWED_MIME.has(mime) || ALLOWED_EXT.some(ext => name.endsWith(ext))
}

/** 파일당 용량 검사 (형식은 `isNoticeAttachmentTypeAllowed`) */
export function validateNoticeAttachmentFile(file: File): string | null {
  return validateUploadFileSize(file)
}

export const PORTAL_PROGRAM_POST_ATTACHMENT_FILE_PURPOSE = 'PROGRAM_POST_ATTACHMENT'
export const PORTAL_PROGRAM_POST_INLINE_IMAGE_FILE_PURPOSE = 'PROGRAM_POST_INLINE_IMAGE'
