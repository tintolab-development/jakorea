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
  /** 증명서에 적힌 발급일(재발급이면 재발급일). 있으면 downloadedAt보다 우선한다. */
  issuedAt?: Date | string | null
  /** issuedAt을 알 수 없을 때만 쓰는 내려받은 날짜 */
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

function resolveStampDate(input: CertificateDownloadFileNameInput): Date {
  if (input.issuedAt) {
    const issued = input.issuedAt instanceof Date ? input.issuedAt : new Date(input.issuedAt)
    if (!Number.isNaN(issued.getTime())) return issued
  }
  return input.downloadedAt ?? new Date()
}

/** [JA Korea] 수료증_강하은_261103.pdf — 날짜는 증명서 발급일(재발급 시 재발급일) */
export function buildCertificateDownloadFileName(
  input: CertificateDownloadFileNameInput = {},
): string {
  const documentLabel = sanitizeCertificateFileNamePart(input.documentLabel ?? '수료증', '수료증')
  const memberName = sanitizeCertificateFileNamePart(input.memberName ?? '', '회원')
  const stamp = formatCertificateDownloadStamp(resolveStampDate(input))
  const extension = input.extension ?? 'pdf'
  return `[JA Korea] ${documentLabel}_${memberName}_${stamp}.${extension}`
}
