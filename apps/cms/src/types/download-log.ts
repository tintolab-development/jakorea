/**
 * 파일 다운로드 이력 타입 정의
 * 화면 스펙: No. / 다운로드 파일명 / 사용자 / 다운로드 일시 / IP
 */

import type { UUID, DateValue } from './index'

export interface DownloadLog {
  id: UUID
  fileName: string
  userId: UUID
  userName: string
  ipAddress: string
  downloadedAt: DateValue
}

export interface DownloadLogFilters {
  no?: string
  fileName?: string
  userName?: string
  ipAddress?: string
  startDate?: DateValue
  endDate?: DateValue
}

export interface RecordDownloadPayload {
  fileName: string
  userId?: UUID
  userName?: string
  ipAddress?: string
}
