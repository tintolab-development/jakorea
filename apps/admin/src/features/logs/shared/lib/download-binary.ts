/**
 * Blob / ArrayBuffer 파일 다운로드 (xlsx export 등)
 */

import { axiosInstance } from '@/shared/instance/axios-instance'
import { resolveLogExcelBytes } from './parse-arraybuffer-json'
import { sanitizeDownloadFileName } from '@/shared/lib/sanitize-download-file-name'

/** 로그 엑셀 내보내기 — 인스턴스 기본 Accept: application/json 이면 Spring이 xlsx를 406으로 거절한다 */
export const LOG_EXPORT_ACCEPT =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/octet-stream, */*'

export const LOG_EXPORT_XLSX_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

function sanitizeFilenameBase(name: string): string {
  return sanitizeDownloadFileName(name).replace(/[:*?"<>|]+/g, '_').replace(/\s+/g, ' ').trim().slice(0, 80)
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

/** 공통 규칙: `[JA Korea] 홈페이지 어드민_{파일 이름}_YYMMDD.xlsx` (YYMMDD = 내려받은 날짜) */
export function defaultXlsxFilename(base: string, now: Date = new Date()): string {
  const yy = String(now.getFullYear()).slice(-2)
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `[JA Korea] 홈페이지 어드민_${sanitizeFilenameBase(base)}_${yy}${mm}${dd}.xlsx`
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
    // 서버 헤더(영문) 대신 한글 파일명을 항상 사용한다.
    filenameFallback: options.filenameFallback,
  })
}

export function downloadBinaryFile(options: {
  data: BlobPart
  contentType?: string
  filenameFallback: string
  contentDisposition?: string
}): void {
  const filename = sanitizeDownloadFileName(
    parseFilenameFromContentDisposition(options.contentDisposition) ||
      options.filenameFallback
  )
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
