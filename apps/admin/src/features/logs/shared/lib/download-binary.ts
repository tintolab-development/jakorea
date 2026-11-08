/**
 * Blob / ArrayBuffer 파일 다운로드 (xlsx export 등)
 */

import { axiosInstance } from '@/shared/instance/axios-instance'
import { resolveLogExcelBytes } from './parse-arraybuffer-json'

/** 로그 엑셀 내보내기 — 인스턴스 기본 Accept: application/json 이면 Spring이 xlsx를 406으로 거절한다 */
export const LOG_EXPORT_ACCEPT =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/octet-stream, */*'

export const LOG_EXPORT_XLSX_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

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

function headerValue(headers: unknown, name: string): string | undefined {
  if (headers == null || typeof headers !== 'object') return undefined
  const record = headers as Record<string, unknown> & { get?: (key: string) => unknown }
  const raw =
    (typeof record.get === 'function' ? record.get(name) : undefined) ??
    record[name] ??
    record[name.toLowerCase()]
  if (typeof raw === 'string' && raw.trim()) return raw
  if (Array.isArray(raw) && typeof raw[0] === 'string' && raw[0].trim()) return raw[0]
  return undefined
}

export async function downloadRemoteLogExcel(options: {
  url: string
  params?: object
  filenameFallback: string
}): Promise<void> {
  const response = await axiosInstance.get<ArrayBuffer>(options.url, {
    params: options.params,
    responseType: 'arraybuffer',
    timeout: 120_000,
    transformResponse: [data => data],
    transformRequest: [
      (data, headers) => {
        if (headers && typeof headers.delete === 'function') {
          headers.delete('Content-Type')
        }
        return data
      },
    ],
    headers: { Accept: LOG_EXPORT_ACCEPT },
  })
  const bytes = resolveLogExcelBytes(response.data)
  downloadBinaryFile({
    data: bytes,
    contentType: LOG_EXPORT_XLSX_TYPE,
    contentDisposition: headerValue(response.headers, 'content-disposition'),
    filenameFallback: options.filenameFallback,
  })
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
