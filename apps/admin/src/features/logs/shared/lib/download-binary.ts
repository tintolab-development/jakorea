/**
 * Blob / ArrayBuffer 파일 다운로드 (xlsx export 등)
 */

function sanitizeFilenameBase(name: string): string {
  return name.replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, '_').slice(0, 80)
}

function parseFilenameFromContentDisposition(header: string | undefined): string | null {
  if (!header) return null
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(header)
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1].trim())
    } catch {
      return utf8[1].trim()
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(header)
  return plain?.[1]?.trim() ?? null
}

export function defaultXlsxFilename(base: string): string {
  const stamp = new Date()
  const y = stamp.getFullYear()
  const m = String(stamp.getMonth() + 1).padStart(2, '0')
  const d = String(stamp.getDate()).padStart(2, '0')
  const h = String(stamp.getHours()).padStart(2, '0')
  const min = String(stamp.getMinutes()).padStart(2, '0')
  const s = String(stamp.getSeconds()).padStart(2, '0')
  return `${sanitizeFilenameBase(base)}_${y}${m}${d}_${h}${min}${s}.xlsx`
}

export function downloadBinaryFile(options: {
  data: BlobPart
  contentType?: string
  filenameFallback: string
  contentDisposition?: string
}): void {
  const filename =
    parseFilenameFromContentDisposition(options.contentDisposition) ||
    options.filenameFallback
  const blob =
    options.data instanceof Blob
      ? options.data
      : new Blob([options.data], {
          type: options.contentType || 'application/octet-stream',
        })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
