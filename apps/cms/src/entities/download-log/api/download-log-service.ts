/**
 * 다운로드 이력 서비스
 * Phase 4.1: 조회/다운로드 이력 기록 (FR-F00)
 */

import type { DownloadLog, DownloadLogFilters } from '@/types/download-log'
import { mockDownloadLogs } from '@/data/mock/download-logs'

/**
 * 다운로드 이력 목록 조회
 */
export async function getDownloadLogs(
  filters?: DownloadLogFilters
): Promise<DownloadLog[]> {
  // Mock: 실제로는 API 호출
  await new Promise(resolve => setTimeout(resolve, 300))

  let logs = [...mockDownloadLogs]

  if (filters) {
    if (filters.userId) {
      logs = logs.filter(log => log.userId === filters.userId)
    }
    if (filters.targetType) {
      logs = logs.filter(log => log.targetType === filters.targetType)
    }
    if (filters.programId) {
      logs = logs.filter(log => log.programId === filters.programId)
    }
    if (filters.startDate) {
      logs = logs.filter(log => log.createdAt >= filters.startDate!)
    }
    if (filters.endDate) {
      logs = logs.filter(log => log.createdAt <= filters.endDate!)
    }
  }

  // 최신순 정렬
  return logs.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

/**
 * 다운로드 이력 기록
 */
export async function logDownload(
  log: Omit<DownloadLog, 'id' | 'createdAt'>
): Promise<DownloadLog> {
  // Mock: 실제로는 API 호출
  await new Promise(resolve => setTimeout(resolve, 200))

  const newLog: DownloadLog = {
    ...log,
    id: `log-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`,
    createdAt: new Date().toISOString(),
  }

  // Mock 데이터에 추가 (실제로는 서버에 저장)
  mockDownloadLogs.unshift(newLog)

  return newLog
}
