/**
 * 권한 요청 관련 타입 정의
 * Phase 0.5.2: 권한 요청 UX (NFR-SEC-ACC-01)
 */

import type { UUID, DateValue } from './index'
import type { ProgramRole } from './user'

// ProgramRole을 재export하여 다른 파일에서 사용 가능하게 함
export type { ProgramRole } from './user'

/**
 * 권한 요청 액션 타입
 */
export type PermissionAction = 'VIEW' | 'DOWNLOAD' | 'EDIT'

/**
 * 권한 요청 상태
 */
export type PermissionRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

/**
 * 권한 요청
 */
export interface PermissionRequest {
  id: UUID
  requesterId: UUID
  requesterName: string
  programId: UUID
  programName: string
  requestedRole: ProgramRole
  requestedAction: PermissionAction
  reason: string
  requestedPeriod?: {
    startDate: DateValue
    endDate: DateValue
  }
  status: PermissionRequestStatus
  reviewedBy?: UUID
  reviewedByName?: string
  reviewedAt?: DateValue
  reviewComment?: string
  createdAt: DateValue
  updatedAt: DateValue
}

/**
 * 권한 요청 생성 요청
 */
export interface CreatePermissionRequestInput {
  programId: UUID
  requestedRole: ProgramRole
  requestedAction: PermissionAction
  reason: string
  requestedPeriod?: {
    startDate: DateValue
    endDate: DateValue
  }
}

/**
 * 권한 요청 검토 요청
 */
export interface ReviewPermissionRequestInput {
  requestId: UUID
  approved: boolean
  reviewComment?: string
  grantedPeriod?: {
    startDate: DateValue
    endDate: DateValue
  }
}

/**
 * 임시 권한
 */
export interface TemporaryPermission {
  id: UUID
  userId: UUID
  userName: string
  programId: UUID
  programName: string
  grantedRole: ProgramRole
  grantedActions: PermissionAction[]
  expiresAt: DateValue
  grantedBy: UUID
  grantedByName: string
  grantedAt: DateValue
  createdAt: DateValue
  updatedAt: DateValue
}
