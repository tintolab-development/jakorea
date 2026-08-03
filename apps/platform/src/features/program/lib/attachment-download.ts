/**
 * 프로그램 상세 첨부 다운로드.
 * mock 등 실파일이 없을 때도 파일명의 확장자와 MIME 을 유지한 빈 파일로 저장한다.
 */

const EXT_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  hwp: 'application/x-hwp',
  hwpx: 'application/hwp+zip',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  zip: 'application/zip',
  rar: 'application/vnd.rar',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  txt: 'text/plain;charset=utf-8',
}

export function getAttachmentFileExtension(fileName: string): string {
  const base = fileName.trim().split(/[/\\]/).pop() ?? fileName
  const dot = base.lastIndexOf('.')
  if (dot <= 0 || dot === base.length - 1) return ''
  return base.slice(dot + 1).toLowerCase()
}

export function getEmptyAttachmentMimeType(fileName: string): string {
  const ext = getAttachmentFileExtension(fileName)
  return EXT_MIME[ext] ?? 'application/octet-stream'
}

/** `#` / 빈 값이면 빈 파일 폴백이 필요 */
export function needsEmptyAttachmentFallback(url: string | undefined): boolean {
  const value = url?.trim() ?? ''
  return !value || value === '#' || value.startsWith('#')
}

/**
 * 첨부 다운로드. 실 URL 이 있으면 해당 리소스를 파일명으로 저장하고,
 * 없으면 확장자에 맞는 MIME 의 빈 Blob 을 같은 파일명으로 저장한다.
 */
export function downloadProgramAttachment(fileName: string, url?: string): void {
  const name = fileName.trim() || 'attachment'
  if (typeof document === 'undefined') return

  if (!needsEmptyAttachmentFallback(url)) {
    const anchor = document.createElement('a')
    anchor.href = url!.trim()
    anchor.download = name
    anchor.rel = 'noopener'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    return
  }

  const blob = new Blob([], { type: getEmptyAttachmentMimeType(name) })
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = objectUrl
  anchor.download = name
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
}
