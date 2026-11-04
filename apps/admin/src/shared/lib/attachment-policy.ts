/**
 * 홈페이지 어드민 첨부 형식·용량 — JA Korea 첨부 기준(2026-11-04) SSOT
 */

export const ATTACHMENT_PER_FILE_MAX_BYTES = 20 * 1024 * 1024
export const ATTACHMENT_MULTI_TOTAL_MAX_BYTES = 100 * 1024 * 1024
export const ATTACHMENT_MULTI_MAX_COUNT = 10

export const ATTACHMENT_FORMATS = {
  jpgPng: 'JPG, PNG',
  png: 'PNG',
  pdf: 'PDF',
  sponsorLogo: 'JPG, PNG, AI, EPS, SVG',
  general: 'JPG, PNG, HWP, Excel, PDF, Word',
} as const

export const ATTACHMENT_ACCEPT = {
  jpgPng: '.jpg,.jpeg,.png,image/jpeg,image/png',
  png: '.png,image/png',
  pdf: '.pdf,application/pdf',
  sponsorLogo:
    '.jpg,.jpeg,.png,.ai,.eps,.svg,image/jpeg,image/png,image/svg+xml,application/postscript,application/illustrator',
  general:
    '.jpg,.jpeg,.png,.hwp,.hwpx,.xls,.xlsx,.pdf,.doc,.docx,image/jpeg,image/png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/x-hwp,application/haansofthwp,application/vnd.hancom.hwp',
} as const

export const ATTACHMENT_ERROR = {
  format: '등록할 수 없는 파일 형식입니다.',
  perFileSize: '20MB를 초과한 파일은 등록할 수 없습니다.',
  count: '첨부파일은 최대 10개까지 등록할 수 있습니다.',
  totalSize: '첨부파일은 총 100MB까지 등록할 수 있습니다.',
} as const

export type GeneralAttachmentMime =
  | 'image/jpeg'
  | 'image/png'
  | 'application/pdf'
  | 'application/msword'
  | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  | 'application/vnd.ms-excel'
  | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  | 'application/x-hwp'
  | 'application/octet-stream'

export function attachmentSingleGuide(formats: string, maxLabel = '20MB'): string {
  return `파일은 ${formats} 형식만 등록 가능하며, 최대 ${maxLabel}까지 첨부할 수 있습니다.`
}

export function attachmentMultiGuide(formats: string): string {
  return `파일은 ${formats} 형식만 등록 가능하며, 최대 10개(파일당 20MB, 총 100MB)까지 첨부할 수 있습니다.`
}

export function attachmentGuideLine(text: string): string {
  return `- ${text}`
}

/** 첨부파일 필드 전용 안내 — 이미지·썸네일·로고에는 쓰지 않는다. */
export const ATTACHMENT_FILENAME_SPECIAL_CHAR_GUIDE_LINE = attachmentGuideLine(
  '첨부 파일명에 특수문자 포함된 경우, 등록 시 오류가 발생할 수 있습니다.'
)

export function withAttachmentFilenameGuide(lines: readonly string[]): readonly string[] {
  if (lines.some(line => line.includes('특수문자 포함된'))) return lines
  return [...lines, ATTACHMENT_FILENAME_SPECIAL_CHAR_GUIDE_LINE]
}

export const ATTACHMENT_SINGLE_JPG_PNG_GUIDE_LINE = attachmentGuideLine(
  attachmentSingleGuide(ATTACHMENT_FORMATS.jpgPng)
)
export const ATTACHMENT_SINGLE_PNG_GUIDE_LINE = attachmentGuideLine(
  attachmentSingleGuide(ATTACHMENT_FORMATS.png)
)
export const ATTACHMENT_SINGLE_PDF_GUIDE_LINE = attachmentGuideLine(
  attachmentSingleGuide(ATTACHMENT_FORMATS.pdf)
)
export const ATTACHMENT_SINGLE_SPONSOR_LOGO_GUIDE_LINE = attachmentGuideLine(
  attachmentSingleGuide(ATTACHMENT_FORMATS.sponsorLogo)
)
export const ATTACHMENT_MULTI_GENERAL_GUIDE_LINE = attachmentGuideLine(
  attachmentMultiGuide(ATTACHMENT_FORMATS.general)
)

function fileName(file: File): string {
  return file.name.toLowerCase()
}

function extOf(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot < 0 ? '' : name.slice(dot)
}

export function isJpgPngFile(file: File): boolean {
  const type = file.type.toLowerCase()
  if (type === 'image/jpeg' || type === 'image/png') return true
  const name = fileName(file)
  return name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.png')
}

export function isPngFile(file: File): boolean {
  if (file.type.toLowerCase() === 'image/png') return true
  return fileName(file).endsWith('.png')
}

export function isPdfFile(file: File): boolean {
  if (file.type.toLowerCase() === 'application/pdf') return true
  return fileName(file).endsWith('.pdf')
}

const SPONSOR_EXT = new Set(['.jpg', '.jpeg', '.png', '.ai', '.eps', '.svg'])

export function isSponsorLogoFile(file: File): boolean {
  const type = file.type.toLowerCase()
  if (
    type === 'image/jpeg' ||
    type === 'image/png' ||
    type === 'image/svg+xml' ||
    type === 'application/postscript' ||
    type === 'application/illustrator'
  ) {
    return true
  }
  return SPONSOR_EXT.has(extOf(fileName(file)))
}

const GENERAL_EXT = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.hwp',
  '.hwpx',
  '.xls',
  '.xlsx',
  '.pdf',
  '.doc',
  '.docx',
])

export function isGeneralAttachmentFile(file: File): boolean {
  return GENERAL_EXT.has(extOf(fileName(file)))
}

export function generalAttachmentMimeFromFile(file: File): GeneralAttachmentMime {
  const name = fileName(file)
  if (file.type === 'image/png' || name.endsWith('.png')) return 'image/png'
  if (file.type === 'image/jpeg' || name.endsWith('.jpg') || name.endsWith('.jpeg')) {
    return 'image/jpeg'
  }
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) return 'application/pdf'
  if (name.endsWith('.doc')) return 'application/msword'
  if (name.endsWith('.docx')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }
  if (name.endsWith('.xls')) return 'application/vnd.ms-excel'
  if (name.endsWith('.xlsx')) {
    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  }
  if (name.endsWith('.hwp') || name.endsWith('.hwpx')) return 'application/x-hwp'
  if (file.type && file.type !== 'application/octet-stream') {
    return file.type as GeneralAttachmentMime
  }
  return 'application/octet-stream'
}

export function generalAttachmentMimeFromContentType(
  contentType: string | undefined
): GeneralAttachmentMime {
  const type = contentType?.toLowerCase() ?? ''
  if (type.includes('png')) return 'image/png'
  if (type.includes('jpeg') || type.includes('jpg')) return 'image/jpeg'
  if (type.includes('pdf')) return 'application/pdf'
  if (type.includes('openxmlformats-officedocument.wordprocessingml')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  }
  if (type === 'application/msword' || type.includes('msword')) return 'application/msword'
  if (type.includes('spreadsheetml')) {
    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  }
  if (type === 'application/vnd.ms-excel' || type.includes('ms-excel')) {
    return 'application/vnd.ms-excel'
  }
  if (type.includes('hwp') || type.includes('haansoft') || type.includes('hancom')) {
    return 'application/x-hwp'
  }
  if (type) return type as GeneralAttachmentMime
  return 'application/octet-stream'
}

export function contentTypeForAttachmentUpload(file: File): string {
  if (file.type && file.type !== 'application/octet-stream') return file.type
  return generalAttachmentMimeFromFile(file)
}

export function sumAttachmentBytes(files: Iterable<{ size: number }>): number {
  let total = 0
  for (const file of files) total += file.size
  return total
}

export function validateSingleJpgPngFile(file: File): string | null {
  if (!isJpgPngFile(file)) return ATTACHMENT_ERROR.format
  if (file.size > ATTACHMENT_PER_FILE_MAX_BYTES) return ATTACHMENT_ERROR.perFileSize
  return null
}

export function validateSinglePngFile(file: File): string | null {
  if (!isPngFile(file)) return ATTACHMENT_ERROR.format
  if (file.size > ATTACHMENT_PER_FILE_MAX_BYTES) return ATTACHMENT_ERROR.perFileSize
  return null
}

export function validateSinglePdfFile(file: File): string | null {
  if (!isPdfFile(file)) return ATTACHMENT_ERROR.format
  if (file.size > ATTACHMENT_PER_FILE_MAX_BYTES) return ATTACHMENT_ERROR.perFileSize
  return null
}

export function validateSingleSponsorLogoFile(file: File): string | null {
  if (!isSponsorLogoFile(file)) return ATTACHMENT_ERROR.format
  if (file.size > ATTACHMENT_PER_FILE_MAX_BYTES) return ATTACHMENT_ERROR.perFileSize
  return null
}

export function validateGeneralAttachmentBatch(params: {
  incoming: File[]
  existingCount: number
  existingBytes: number
}): string | null {
  const { incoming, existingCount, existingBytes } = params
  if (existingCount + incoming.length > ATTACHMENT_MULTI_MAX_COUNT) {
    return ATTACHMENT_ERROR.count
  }
  for (const file of incoming) {
    if (!isGeneralAttachmentFile(file)) return ATTACHMENT_ERROR.format
    if (file.size > ATTACHMENT_PER_FILE_MAX_BYTES) return ATTACHMENT_ERROR.perFileSize
  }
  if (existingBytes + sumAttachmentBytes(incoming) > ATTACHMENT_MULTI_TOTAL_MAX_BYTES) {
    return ATTACHMENT_ERROR.totalSize
  }
  return null
}
