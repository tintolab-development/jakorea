/**
 * 감사 로그 관련 타입 정의
 * Phase 0.5.4: 감사 로그 UI (NFR-SEC-LOG-01)
 */

import type { UUID, DateValue } from './index'

/**
 * 감사 로그 이벤트 유형
 */
export type AuditEventType =
  | 'LOGIN'                     // 로그인
  | 'LOGIN_FAILED'              // 로그인 실패
  | 'MFA_SENT'                  // MFA 발송
  | 'MFA_SUCCESS'               // MFA 성공
  | 'MFA_FAILED'                // MFA 실패
  | 'MFA_LOCKED'                // MFA 잠금
  | 'PERMISSION_CHANGED'        // 권한 변경 (Owner/Partner/Viewer)
  | 'PERMISSION_REQUESTED'      // 권한 요청
  | 'PERMISSION_APPROVED'       // 권한 승인
  | 'PERMISSION_REJECTED'       // 권한 거부
  | 'DOWNLOAD'                  // 다운로드/내보내기
  | 'SETTLEMENT_CONFIRMED'      // 정산 확정
  | 'OWNER_TRANSFERRED'         // Owner 소유권 이전

/**
 * 감사 로그
 */
export interface AuditLog {
  id: UUID
  eventType: AuditEventType
  userId: UUID
  userName: string
  userRole: string
  targetId?: UUID               // 대상 ID (프로그램, 사용자 등)
  targetType?: string            // 대상 타입 (program, user 등)
  targetName?: string            // 대상 이름
  details: Record<string, unknown>
  ipAddress: string
  userAgent: string
  createdAt: DateValue
}

/**
 * 감사 로그 필터
 */
export interface AuditLogFilters {
  eventType?: AuditEventType
  userId?: UUID
  userName?: string
  targetId?: UUID
  targetType?: string
  startDate?: DateValue
  endDate?: DateValue
  page?: number
  pageSize?: number
}

/**
 * 감사 로그 조회 결과
 */
export interface AuditLogQueryResult {
  logs: AuditLog[]
  total: number
  page: number
  pageSize: number
}

/**
 * 감사 로그 이벤트 생성 입력
 */
export interface CreateAuditLogInput {
  eventType: AuditEventType
  userId?: UUID                 // 없으면 현재 사용자
  targetId?: UUID
  targetType?: string
  targetName?: string
  details?: Record<string, unknown>
}
