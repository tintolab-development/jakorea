export const MAIL_ATTACHMENT_MAX_COUNT = 10
export const MAIL_ATTACHMENT_MAX_TOTAL_BYTES = 30 * 1024 * 1024
export const MAIL_ATTACHMENT_MAX_NAME_LENGTH = 45
export const MAIL_ATTACHMENT_BLOCKED_EXTENSIONS = [
  'js',
  'exe',
  'bat',
  'cmd',
  'com',
  'cpl',
  'msi',
  'scr',
  'vbs',
  'wsr',
  'sh',
  'dll',
]

export const MAIL_ATTACHMENT_GUIDE_LINES = [
  '- 파일은 최대 10개, 총 30MB까지 업로드할 수 있습니다.',
  '- js, exe, bat 등 실행 파일은 첨부할 수 없습니다.',
  '- 파일명은 최대 45자까지 가능합니다.',
]

export type MailAttachmentRejectReason =
  | 'count'
  | 'size'
  | 'extension'
  | 'name-length'

export function mailAttachmentExtension(fileName: string): string {
  const dot = fileName.lastIndexOf('.')
  if (dot < 0 || dot === fileName.length - 1) return ''
  return fileName.slice(dot + 1).toLowerCase()
}

export function mailAttachmentBaseName(fileName: string): string {
  const slash = Math.max(fileName.lastIndexOf('/'), fileName.lastIndexOf('\\'))
  return slash >= 0 ? fileName.slice(slash + 1) : fileName
}

export function rejectMailAttachments(params: {
  incoming: File[]
  currentCount: number
  currentTotalBytes: number
}): { accepted: File[]; reason: MailAttachmentRejectReason | null } {
  const accepted: File[] = []
  let count = params.currentCount
  let totalBytes = params.currentTotalBytes

  for (const file of params.incoming) {
    const name = mailAttachmentBaseName(file.name)
    if (count >= MAIL_ATTACHMENT_MAX_COUNT) {
      return { accepted, reason: 'count' }
    }
    if (name.length > MAIL_ATTACHMENT_MAX_NAME_LENGTH) {
      return { accepted, reason: 'name-length' }
    }
    const extension = mailAttachmentExtension(name)
    if (extension && MAIL_ATTACHMENT_BLOCKED_EXTENSIONS.includes(extension)) {
      return { accepted, reason: 'extension' }
    }
    if (totalBytes + file.size > MAIL_ATTACHMENT_MAX_TOTAL_BYTES) {
      return { accepted, reason: 'size' }
    }
    accepted.push(file)
    count += 1
    totalBytes += file.size
  }

  return { accepted, reason: null }
}

export function mailAttachmentRejectMessage(reason: MailAttachmentRejectReason): string {
  if (reason === 'count') return '파일은 최대 10개까지 첨부할 수 있습니다.'
  if (reason === 'size') return '파일은 총 최대 30MB까지 업로드할 수 있습니다.'
  if (reason === 'extension') return 'js, exe, bat 등 실행 파일은 첨부할 수 없습니다.'
  return '파일명은 최대 45자까지 가능합니다.'
}
