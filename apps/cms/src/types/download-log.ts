/**
 * 다운로드 이력 타입 정의
 * Phase 4.1: 조회/다운로드 이력 기록 (FR-F00)
 */

import type { UUID, DateValue } from './index'

// 다운로드 액션 타입
export type DownloadAction = 'VIEW' | 'DOWNLOAD'

// 다운로드 대상 타입
export type DownloadTargetType = 'PARTICIPANTS' | 'INSTRUCTORS'

// 다운로드 이력
export interface DownloadLog {
  id: UUID
  userId: UUID // 다운로드한 사용자 ID
  action: DownloadAction
  targetType: DownloadTargetType
  filters: Record<string, unknown> // 필터 조건
  rowCount: number // 다운로드된 행 수
  programId?: UUID // 프로그램 ID (참여자 다운로드 시)
  pillar?: string // 필라 (강사 다운로드 시)
  createdAt: DateValue
}

// 다운로드 이력 필터
export interface DownloadLogFilters {
  userId?: UUID
  targetType?: DownloadTargetType
  programId?: UUID
  startDate?: DateValue
  endDate?: DateValue
}
