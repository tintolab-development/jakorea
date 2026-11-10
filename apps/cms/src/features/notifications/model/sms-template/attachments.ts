/**
 * MMS 이미지 첨부 제약 (BE MmsAttachmentPolicy = NHN Notification Hub 공식 값, 2026-11-10 정정). 최종 검증은 BE.
 * - jpg/jpeg + image/jpeg, 최대 3개, 파일당 300KiB, 합계 800KiB
 * - 파일명 45자 이하(시안 값, NHN 문서 근거 없음)·공백 불가, 가로·세로 1000px 이하
 */
export const SMS_MMS_ATTACHMENT_MAX_COUNT = 3
export const SMS_MMS_ATTACHMENT_MAX_FILE_BYTES = 300 * 1024
export const SMS_MMS_ATTACHMENT_MAX_TOTAL_BYTES = 800 * 1024
export const SMS_MMS_ATTACHMENT_MAX_NAME_LENGTH = 45
export const SMS_MMS_ATTACHMENT_MAX_WIDTH_PX = 1000
export const SMS_MMS_ATTACHMENT_MAX_HEIGHT_PX = 1000
export const SMS_MMS_ATTACHMENT_ALLOWED_EXTENSIONS = ['jpg', 'jpeg'] as const
export const SMS_MMS_ATTACHMENT_CONTENT_TYPE = 'image/jpeg'

export const SMS_MMS_ATTACHMENT_GUIDE_LINES = [
  '- 첨부 가능 파일 수는 최대 3개이며, .jpg, .jpeg 파일 형식만 지원합니다.',
  '- 파일 용량은 1개당 300KB 이하, 1개 이상인 경우 합산 800KB 이하까지만 가능합니다.',
  '- 해상도는 가로 1000px, 세로 1000px 이하까지 지원합니다.',
  '- 파일명의 최대 글자 수는 45자이며, 공백은 사용할 수 없습니다.',
] as const

export type SmsMmsAttachmentRejectReason =
  | 'count'
  | 'file-size'
  | 'total-size'
  | 'extension'
  | 'name-length'
  | 'name-space'
  | 'resolution'

function extensionOf(fileName: string): string {
  const dot = fileName.lastIndexOf('.')
  if (dot < 0 || dot === fileName.length - 1) return ''
  return fileName.slice(dot + 1).toLowerCase()
}

function baseName(fileName: string): string {
  const slash = Math.max(fileName.lastIndexOf('/'), fileName.lastIndexOf('\\'))
  return slash >= 0 ? fileName.slice(slash + 1) : fileName
}

export function rejectSmsMmsAttachmentsSync(params: {
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
    if (/\s/.test(name)) {
      return { accepted, reason: 'name-space' }
    }
    const extension = extensionOf(name)
    const mime = file.type.trim().toLowerCase()
    if (
      !extension ||
      !(SMS_MMS_ATTACHMENT_ALLOWED_EXTENSIONS as readonly string[]).includes(extension) ||
      // 브라우저가 MIME을 비워 주면 확장자로 image/jpeg 판정(업로드 contentType도 같은 규칙)
      (mime !== '' && mime !== SMS_MMS_ATTACHMENT_CONTENT_TYPE)
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

export async function readSmsMmsImageSize(
  file: File
): Promise<{ width: number; height: number } | null> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file)
      const size = { width: bitmap.width, height: bitmap.height }
      bitmap.close()
      return size
    } catch {
      return null
    }
  }
  if (typeof Image === 'undefined' || typeof URL === 'undefined') return null
  return new Promise(resolve => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      const size = { width: image.naturalWidth, height: image.naturalHeight }
      URL.revokeObjectURL(url)
      resolve(size)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(null)
    }
    image.src = url
  })
}

export async function rejectSmsMmsAttachments(params: {
  incoming: File[]
  currentCount: number
  currentTotalBytes: number
}): Promise<{ accepted: File[]; reason: SmsMmsAttachmentRejectReason | null }> {
  const sync = rejectSmsMmsAttachmentsSync(params)
  if (sync.reason || sync.accepted.length === 0) return sync
  for (const file of sync.accepted) {
    const size = await readSmsMmsImageSize(file)
    if (
      !size ||
      size.width > SMS_MMS_ATTACHMENT_MAX_WIDTH_PX ||
      size.height > SMS_MMS_ATTACHMENT_MAX_HEIGHT_PX
    ) {
      return { accepted: [], reason: 'resolution' }
    }
  }
  return sync
}

export function smsMmsAttachmentRejectMessage(reason: SmsMmsAttachmentRejectReason): string {
  if (reason === 'count')
    return `파일은 최대 ${SMS_MMS_ATTACHMENT_MAX_COUNT}개까지 첨부할 수 있습니다.`
  if (reason === 'file-size')
    return `파일 크기는 개당 최대 ${SMS_MMS_ATTACHMENT_MAX_FILE_BYTES / 1024}KB까지 가능합니다.`
  if (reason === 'total-size')
    return `첨부 파일 합계는 최대 ${SMS_MMS_ATTACHMENT_MAX_TOTAL_BYTES / 1024}KB까지 가능합니다.`
  if (reason === 'extension') return '.jpg, .jpeg 파일만 첨부할 수 있습니다.'
  if (reason === 'resolution')
    return `해상도는 가로 ${SMS_MMS_ATTACHMENT_MAX_WIDTH_PX}px, 세로 ${SMS_MMS_ATTACHMENT_MAX_HEIGHT_PX}px 이하여야 합니다.`
  if (reason === 'name-space') return '파일명에는 공백을 사용할 수 없습니다.'
  return `파일명은 최대 ${SMS_MMS_ATTACHMENT_MAX_NAME_LENGTH}자까지 가능합니다.`
}
