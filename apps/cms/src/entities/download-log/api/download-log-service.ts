/**
 * 파일 다운로드 이력 서비스 (mock-memory)
 */

import type {
  DownloadLog,
  DownloadLogFilters,
  RecordDownloadPayload,
} from '@/types/download-log'
import { mockDownloadLogs } from '@/data/mock/download-logs'

function normalizeText(value: string | undefined): string {
  return (value ?? '').trim().toLowerCase()
}

function applyFilters(logs: DownloadLog[], filters?: DownloadLogFilters): DownloadLog[] {
  if (!filters) return logs

  const no = normalizeText(filters.no)
  const fileName = normalizeText(filters.fileName)
  const userName = normalizeText(filters.userName)
  const ipAddress = normalizeText(filters.ipAddress)
  const startDate = filters.startDate ? new Date(filters.startDate).getTime() : null
  const endDate = filters.endDate ? new Date(filters.endDate).getTime() : null

  return logs.filter((log, index) => {
    const orderNo = String(logs.length - index)
    if (no && !orderNo.includes(no)) return false
    if (fileName && !log.fileName.toLowerCase().includes(fileName)) return false
    if (userName && !log.userName.toLowerCase().includes(userName)) return false
    if (ipAddress && !log.ipAddress.toLowerCase().includes(ipAddress)) return false

    const downloadedAt = new Date(log.downloadedAt).getTime()
    if (startDate != null && downloadedAt < startDate) return false
    if (endDate != null && downloadedAt > endDate) return false
    return true
  })
}

export async function getDownloadLogs(filters?: DownloadLogFilters): Promise<DownloadLog[]> {
  await new Promise(resolve => setTimeout(resolve, 120))

  const logs = [...mockDownloadLogs]
  logs.sort((a, b) => new Date(b.downloadedAt).getTime() - new Date(a.downloadedAt).getTime())
  return applyFilters(logs, filters)
}

export async function logDownload(log: Omit<DownloadLog, 'id'>): Promise<DownloadLog> {
  await new Promise(resolve => setTimeout(resolve, 80))

  const newLog: DownloadLog = {
    ...log,
    id: `log-${Math.random().toString(36).slice(2, 11)}-${Date.now()}`,
  }

  mockDownloadLogs.unshift(newLog)
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
