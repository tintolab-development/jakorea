export const SMS_MMS_ATTACHMENT_MAX_COUNT = 3
export const SMS_MMS_ATTACHMENT_MAX_FILE_BYTES = 300 * 1024
export const SMS_MMS_ATTACHMENT_MAX_TOTAL_BYTES = 600 * 1024
export const SMS_MMS_ATTACHMENT_MAX_NAME_LENGTH = 45
export const SMS_MMS_ATTACHMENT_ALLOWED_EXTENSIONS = ['jpg', 'jpeg'] as const

export const SMS_MMS_ATTACHMENT_GUIDE_LINES = [
  '- 파일은 최대 3개까지 첨부 가능하며, .jpg, .jpeg 파일만 지원합니다.',
  '- 파일 크기는 개당 최대 300kB, 여러 개 첨부 시 합계 최대 600kB까지 가능합니다.',
  '- 해상도는 가로·세로 각 1000px까지 지원합니다.',
  '- 파일명의 최대 길이는 45자입니다.',
] as const

export type SmsMmsAttachmentRejectReason =
  | 'count'
  | 'file-size'
  | 'total-size'
  | 'extension'
  | 'name-length'

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf('.')
  if (dot < 0 || dot === fileName.length - 1) return ''
  return fileName.slice(dot + 1).toLowerCase()
}

function baseName(fileName: string): string {
  const slash = Math.max(fileName.lastIndexOf('/'), fileName.lastIndexOf('\\'))
  return slash >= 0 ? fileName.slice(slash + 1) : fileName
}

export function rejectSmsMmsAttachments(params: {
  incoming: File[]
  currentCount: number
  currentTotalBytes: number
}): { accepted: File[]; reason: SmsMmsAttachmentRejectReason | null } {
  const accepted: File[] = []
  let count = params.currentCount
  let totalBytes = params.currentTotalBytes

  for (const file of params.incoming) {
    const name = baseName(file.name)
    if (count >= SMS_MMS_ATTACHMENT_MAX_COUNT) {
      return { accepted, reason: 'count' }
    }
    if (name.length > SMS_MMS_ATTACHMENT_MAX_NAME_LENGTH) {
      return { accepted, reason: 'name-length' }
    }
    const extension = extensionOf(name)
    if (
      !extension ||
      !(SMS_MMS_ATTACHMENT_ALLOWED_EXTENSIONS as readonly string[]).includes(extension)
    ) {
      return { accepted, reason: 'extension' }
    }
    if (file.size > SMS_MMS_ATTACHMENT_MAX_FILE_BYTES) {
      return { accepted, reason: 'file-size' }
    }
    if (totalBytes + file.size > SMS_MMS_ATTACHMENT_MAX_TOTAL_BYTES) {
      return { accepted, reason: 'total-size' }
    }
    accepted.push(file)
    count += 1
    totalBytes += file.size
  }

  return { accepted, reason: null }
}

export function smsMmsAttachmentRejectMessage(reason: SmsMmsAttachmentRejectReason): string {
  if (reason === 'count') return '파일은 최대 3개까지 첨부할 수 있습니다.'
  if (reason === 'file-size') return '파일 크기는 개당 최대 300kB까지 가능합니다.'
  if (reason === 'total-size') return '첨부 파일 합계는 최대 600kB까지 가능합니다.'
  if (reason === 'extension') return '.jpg, .jpeg 파일만 첨부할 수 있습니다.'
  return '파일명은 최대 45자까지 가능합니다.'
}
