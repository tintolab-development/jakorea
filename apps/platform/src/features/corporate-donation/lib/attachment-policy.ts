import { formatMultiFileUploadHint } from '@/shared/lib/file-upload-policy'

/**
 * 기업후원 상담 첨부 — 시안 13025-85817: JPG, PNG, HWP, Excel, PDF, Word.
 * 크기·개수는 플랫폼 공통 정책(최대 10개 · 파일당 20MB · 총 100MB)을 따른다.
 */
export const CORPORATE_CONSULTATION_ATTACHMENT_FORMATS_LABEL = 'JPG, PNG, HWP, Excel, PDF, Word'

export const CORPORATE_CONSULTATION_ATTACHMENT_HINT = formatMultiFileUploadHint(
  CORPORATE_CONSULTATION_ATTACHMENT_FORMATS_LABEL,
)

export const CORPORATE_CONSULTATION_ATTACHMENT_ACCEPT =
  '.jpg,.jpeg,.png,.hwp,.xls,.xlsx,.pdf,.doc,.docx,image/jpeg,image/png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/x-hwp,application/haansofthwp'

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

const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'hwp', 'xls', 'xlsx', 'pdf', 'doc', 'docx'])

/** 허용 형식이 아니면 안내 문구, 맞으면 null */
export function validateCorporateConsultationAttachmentType(file: File): string | null {
  const mime = file.type.trim().toLowerCase()
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!ALLOWED_MIME.has(mime) && !ALLOWED_EXTENSIONS.has(extension)) {
    return `${CORPORATE_CONSULTATION_ATTACHMENT_FORMATS_LABEL} 형식의 파일만 첨부할 수 있습니다.`
  }
  return null
}

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  pdf: 'application/pdf',
  hwp: 'application/x-hwp',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
}

/**
 * 업로드 요청 contentType — 브라우저가 형식을 비워 주는 파일(HWP 등)은 확장자로 채운다.
 * 서버는 contentType 목록으로 허용 여부를 판단한다.
 */
export function resolveCorporateConsultationAttachmentContentType(file: File): string {
  const mime = file.type.trim().toLowerCase()
  if (mime && mime !== 'application/octet-stream') return mime
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  return MIME_BY_EXTENSION[extension] ?? 'application/octet-stream'
}
