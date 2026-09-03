/**
 * 파일 다운로드 기록
 * - BE `POST /api/admin/logs/file-access/client` 배포 전: 메모리 stub
 * - 배포 후: shouldRecordFileAccessRemotely() → postFileAccessLog
 *
 * @see apps/cms/docs/api/client-file-access-log-backend-handoff.md
 */

import type { DownloadLog, RecordDownloadPayload } from '@/types/download-log'
import { postFileAccessLog } from '@/shared/lib/post-file-access-log'
import { shouldRecordFileAccessRemotely } from '@/shared/lib/should-record-file-access-remotely'

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

/** 테스트·mock 이력 조회용 */
export function listDownloadLogMemory(): readonly DownloadLog[] {
  return downloadLogMemory
}

export function clearDownloadLogMemoryForTests(): void {
  downloadLogMemory.length = 0
}

export async function recordFileDownload(payload: RecordDownloadPayload): Promise<DownloadLog> {
  const fileName = payload.fileName.trim()
  if (!fileName) {
    throw new Error('다운로드 파일명이 없습니다.')
  }

  const userId = payload.userId ?? 'unknown-user'
  const userName = payload.userName ?? '알 수 없음'
  const ipAddress = payload.ipAddress ?? '0.0.0.0'
  const downloadedAt = new Date().toISOString()

  if (shouldRecordFileAccessRemotely()) {
    await postFileAccessLog({
      fileName,
      ...(typeof navigator !== 'undefined' && navigator.userAgent
        ? { userAgent: navigator.userAgent }
        : {}),
      ...(payload.ipAddress ? { ipAddress: payload.ipAddress } : {}),
    })
    return {
      id: `remote-${Date.now()}`,
      fileName,
      userId,
      userName,
      ipAddress,
      downloadedAt,
    }
  }

  return logDownload({
    fileName,
    userId,
    userName,
    ipAddress,
    downloadedAt,
  })
}
