/**
 * 다운로드 보호 관련 타입 정의
 * Phase 0.5.3: 다운로드 보호 UX (NFR-DATA-01, NFR-DATA-02)
 */

import type { UUID, DateValue } from './index'

/**
 * 다운로드 타겟 유형
 */
export type DownloadTargetType = 'PARTICIPANTS' | 'INSTRUCTORS' | 'SETTLEMENTS' | 'APPLICATIONS' | 'OTHER'

/**
 * 다운로드 옵션
 */
export interface DownloadOptions {
  maskingEnabled: boolean
  reason?: string // 원본 다운로드 시 사유
  approvalId?: UUID // 권한요청 승인 ID (있는 경우)
}

/**
 * 다운로드 쿼터 정보
 */
export interface DownloadQuota {
  todayDownloads: number
  dailyQuota: number
  remainingQuota: number
  lastDownloadAt: DateValue | null
  canDownload: boolean
  reason?: string
}

/**
 * 다운로드 감사 로그
 */
export interface DownloadAuditLog {
  id: UUID
  userId: UUID
  userName: string
  programId?: UUID
  programName?: string
  targetType: DownloadTargetType
  filters: Record<string, unknown>
  rowCount: number
  maskingEnabled: boolean
  reason?: string
  approvalId?: UUID
  downloadedAt: DateValue
}

/**
 * 다운로드 가능 여부 결과
 */
export interface DownloadCheckResult {
  allowed: boolean
  reason?: string
  quota?: DownloadQuota
}
