import { formatMultiFileUploadHint } from './file-upload-policy'
import { buildFileTypeInvalidAlertCopy, type PlatformAlertCopy } from './platform-alert-copy'

/**
 * 공개 신청 문서 첨부(기업후원 상담·재능기부 신청) — 시안 안내: JPG, PNG, HWP, Excel, PDF, Word.
 * 서버 허용 목록(홈페이지 Admin BE `GeneralAdminAttachmentPolicy.CONTENT_TYPES`)과 맞춘다(HWPX 포함).
 * 크기·개수는 플랫폼 공통 정책(최대 10개 · 파일당 20MB · 총 100MB)을 따른다.
 */
export const DOCUMENT_ATTACHMENT_FORMATS_LABEL = 'JPG, PNG, HWP, Excel, PDF, Word'

export const DOCUMENT_ATTACHMENT_HINT = formatMultiFileUploadHint(
  DOCUMENT_ATTACHMENT_FORMATS_LABEL,
)

export const DOCUMENT_ATTACHMENT_ACCEPT =
  '.jpg,.jpeg,.png,.hwp,.hwpx,.xls,.xlsx,.pdf,.doc,.docx,image/jpeg,image/png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/x-hwp,application/haansofthwp,application/x-hwpx'

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
  'application/x-hwpx',
  'application/vnd.hancom.hwpx',
  'application/hwp+zip',
])

const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'hwp', 'hwpx', 'xls', 'xlsx', 'pdf', 'doc', 'docx'])

/**
 * 허용 형식이 아니면 「파일 형식이 맞지 않는 경우」 팝업 문구(Figma 14504-51207), 맞으면 null
 */
export function validateDocumentAttachmentType(file: File): PlatformAlertCopy | null {
  const mime = file.type.trim().toLowerCase()
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!ALLOWED_MIME.has(mime) && !ALLOWED_EXTENSIONS.has(extension)) {
    return buildFileTypeInvalidAlertCopy(DOCUMENT_ATTACHMENT_FORMATS_LABEL)
  }
  return null
}

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  pdf: 'application/pdf',
  hwp: 'application/x-hwp',
  hwpx: 'application/x-hwpx',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}

/**
 * 업로드 요청 contentType — 브라우저가 형식을 비워 주는 파일(HWP 등)은 확장자로 채운다.
 * 서버는 contentType 목록으로 허용 여부를 판단한다.
 */
export function resolveDocumentAttachmentContentType(file: File): string {
  const mime = file.type.trim().toLowerCase()
  if (mime && mime !== 'application/octet-stream') return mime
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  return MIME_BY_EXTENSION[extension] ?? 'application/octet-stream'
}
