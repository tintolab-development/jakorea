/**
 * 파일 다운로드 유틸리티
 */

import { saveAs } from 'file-saver'
import { recordFileDownload } from '@/entities/download-log/api/download-log-service'
import { guardAdminDownload } from '@/shared/lib/session-admin-role'
import type { DownloadAccessLogMeta } from '@/shared/lib/download-access-log-meta'

type RuntimeAuthUser = {
  id?: string
  name?: string
}

export type DownloadBlobOptions = {
  /** true면 서버/stub 다운로드 이력 기록 생략 (인증서 download-logs 등 이미 기록한 경우) */
  skipAccessLog?: boolean
  /** client 이력에 함께 남길 파일 종류·포함 개인정보 */
  accessLog?: DownloadAccessLogMeta
}

function readRuntimeAuthUser(): RuntimeAuthUser | null {
  if (typeof window === 'undefined' || !window.localStorage) return null
  const raw = window.localStorage.getItem('auth_user')
  if (!raw) return null
  try {
    return JSON.parse(raw) as RuntimeAuthUser
  } catch {
    return null
  }
}

export async function recordDownloadAccessLog(
  filename: string,
  accessLog?: DownloadAccessLogMeta
): Promise<void> {
  const user = readRuntimeAuthUser()
  // ipAddress 생략 — 서버가 요청 IP를 기록 (가짜 IP 전송 시 검증 실패 가능)
  await recordFileDownload({
    fileName: filename,
    userId: user?.id ?? 'unknown-user',
    userName: user?.name ?? '알 수 없음',
    ...(accessLog ? { accessLog } : {}),
  })
}

/**
 * Blob 파일 다운로드 — 이력 기록 성공 후 저장 (skipAccessLog 제외)
 */
export async function downloadBlob(
  blob: Blob,
  filename: string,
  options?: DownloadBlobOptions
): Promise<void> {
  if (!guardAdminDownload()) return
  if (!options?.skipAccessLog) {
    if (options?.accessLog) {
      await recordDownloadAccessLog(filename, options.accessLog)
    } else {
      await recordDownloadAccessLog(filename)
    }
  }
  saveAs(blob, filename)
}

/**
 * Excel 파일 다운로드
 */
export async function downloadExcel(
  buffer: ArrayBuffer,
  filename: string,
  options?: Pick<DownloadBlobOptions, 'accessLog'>
): Promise<void> {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  if (options?.accessLog) {
    await downloadBlob(blob, filename, { accessLog: options.accessLog })
    return
  }
  await downloadBlob(blob, filename)
}

/**
 * PDF 파일 다운로드
 */
export async function downloadPDF(buffer: ArrayBuffer, filename: string): Promise<void> {
  const blob = new Blob([buffer], {
    type: 'application/pdf',
  })
  await downloadBlob(blob, filename)
}

/**
 * `Content-Disposition`에서 저장 파일명을 읽는다.
 * RFC 5987 `filename*=UTF-8''…`를 우선하고, 없거나 디코딩에 실패하면 `filename`, 둘 다 없으면 fallback.
 */
export function fileNameFromContentDisposition(
  header: string | null | undefined,
  fallback: string
): string {
  if (!header) return fallback
  const star = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(header)?.[1]?.trim().replace(/^"|"$/g, '')
  if (star) {
    try {
      const decoded = decodeURIComponent(star).trim()
      if (decoded) return decoded
    } catch {
      /* ASCII filename으로 넘어간다 */
    }
  }
  const quoted = /filename\s*=\s*"([^"]+)"/i.exec(header)?.[1]?.trim()
  if (quoted) return quoted
  const plain = /filename\s*=\s*([^";]+)/i.exec(header)?.[1]?.trim()
  return plain || fallback
}

/**
 * 파일명 생성 헬퍼
 */
export function generateFilename(prefix: string, extension: string, date?: Date): string {
  const now = date || new Date()
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '')
  return `${prefix}_${dateStr}.${extension}`
}
