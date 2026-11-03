/** DISPLAY_DATE_TIMEZONE (`Asia/Seoul`) — 파일명 스탬프 달력일 */
const FILE_STAMP_TIMEZONE = 'Asia/Seoul'
const UNSAFE_FILE_NAME_CHARS = /[\\/:*?"<>|]+/g
const STAMP_FORMAT = new Intl.DateTimeFormat('en-US', {
  timeZone: FILE_STAMP_TIMEZONE,
  year: '2-digit',
  month: '2-digit',
  day: '2-digit',
})

export type CertificateDownloadFileNameInput = {
  documentLabel?: string
  memberName?: string | null
  downloadedAt?: Date
  extension?: 'pdf' | 'zip'
}

function partValue(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  return parts.find(part => part.type === type)?.value ?? ''
}

export function formatCertificateDownloadStamp(downloadedAt = new Date()): string {
  const parts = STAMP_FORMAT.formatToParts(downloadedAt)
  const year = partValue(parts, 'year').padStart(2, '0')
  const month = partValue(parts, 'month').padStart(2, '0')
  const day = partValue(parts, 'day').padStart(2, '0')
  return `${year}${month}${day}`
}

export function sanitizeCertificateFileNamePart(value: string, fallback: string): string {
  const cleaned = value.replace(UNSAFE_FILE_NAME_CHARS, ' ').replace(/\s+/g, ' ').trim()
  return cleaned || fallback
}

/** 수료증_강하은_261103.pdf */
export function buildCertificateDownloadFileName(
  input: CertificateDownloadFileNameInput = {},
): string {
  const documentLabel = sanitizeCertificateFileNamePart(input.documentLabel ?? '수료증', '수료증')
  const memberName = sanitizeCertificateFileNamePart(input.memberName ?? '', '회원')
  const stamp = formatCertificateDownloadStamp(input.downloadedAt)
  const extension = input.extension ?? 'pdf'
  return `${documentLabel}_${memberName}_${stamp}.${extension}`
}
