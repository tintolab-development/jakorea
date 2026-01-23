/**
 * 감사 로그 이벤트 상수
 * Phase 0.5.4: 감사 로그 UI
 */

import type { AuditEventType } from '@/types/audit-log'

/**
 * 감사 로그 이벤트 유형 옵션
 */
export const AUDIT_EVENT_OPTIONS: { value: AuditEventType; label: string }[] = [
  { value: 'LOGIN', label: '로그인' },
  { value: 'LOGIN_FAILED', label: '로그인 실패' },
  { value: 'MFA_SENT', label: 'MFA 발송' },
  { value: 'MFA_SUCCESS', label: 'MFA 성공' },
  { value: 'MFA_FAILED', label: 'MFA 실패' },
  { value: 'MFA_LOCKED', label: 'MFA 잠금' },
  { value: 'PERMISSION_CHANGED', label: '권한 변경' },
  { value: 'PERMISSION_REQUESTED', label: '권한 요청' },
  { value: 'PERMISSION_APPROVED', label: '권한 승인' },
  { value: 'PERMISSION_REJECTED', label: '권한 거부' },
  { value: 'DOWNLOAD', label: '다운로드' },
  { value: 'SETTLEMENT_CONFIRMED', label: '정산 확정' },
  { value: 'OWNER_TRANSFERRED', label: '소유권 이전' },
  { value: 'APPLICATION_EDIT', label: '신청서 오기재 수정' },
]

/**
 * 감사 로그 이벤트 유형별 색상
 */
export const AUDIT_EVENT_COLORS: Record<AuditEventType, string> = {
  LOGIN: 'green',
  LOGIN_FAILED: 'red',
  MFA_SENT: 'blue',
  MFA_SUCCESS: 'green',
  MFA_FAILED: 'orange',
  MFA_LOCKED: 'red',
  PERMISSION_CHANGED: 'purple',
  PERMISSION_REQUESTED: 'blue',
  PERMISSION_APPROVED: 'green',
  PERMISSION_REJECTED: 'red',
  DOWNLOAD: 'cyan',
  SETTLEMENT_CONFIRMED: 'green',
  OWNER_TRANSFERRED: 'purple',
  APPLICATION_EDIT: 'gold',
}
