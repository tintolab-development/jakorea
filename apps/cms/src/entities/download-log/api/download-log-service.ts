/**
 * 파일 다운로드 기록 (write-only stub — 목록은 GET /api/logs/file-access)
 */

import type { DownloadLog, RecordDownloadPayload } from '@/types/download-log'

const downloadLogMemory: DownloadLog[] = []

export async function logDownload(log: Omit<DownloadLog, 'id'>): Promise<DownloadLog> {
  await new Promise(resolve => setTimeout(resolve, 80))

  const newLog: DownloadLog = {
    ...log,
    id: `log-${Math.random().toString(36).slice(2, 11)}-${Date.now()}`,
  }

  downloadLogMemory.unshift(newLog)
  return newLog
}

export async function recordFileDownload(payload: RecordDownloadPayload): Promise<DownloadLog> {
  return logDownload({
    fileName: payload.fileName,
    userId: payload.userId ?? 'unknown-user',
    userName: payload.userName ?? '알 수 없음',
    ipAddress: payload.ipAddress ?? '0.0.0.0',
    downloadedAt: new Date().toISOString(),
  })
}
