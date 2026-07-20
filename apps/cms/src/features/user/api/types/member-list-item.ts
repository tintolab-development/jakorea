import type { UserListRowMetrics } from '@/shared/api/generated/members/schemas/userListRowMetrics'
import type { InstructorInfo } from '@/shared/api/generated/members/schemas/instructorInfo'
import type { SchoolInfo } from '@/shared/api/generated/members/schemas/schoolInfo'

/** OpenAPI `PageResponse.items` 미정의 — 런타임 수동 타입 (`UserResponse` 호환) */
export interface MemberListItemResponse {
  memberId?: number
  /** 상세 API */
  uuid?: string
  /** 목록 API (`UserResponse.id`) */
  id?: string
  email?: string
  name?: string
  phone?: string
  role?: string
  roles?: string[]
  memberStatus?: string
  status?: string
  instructorStatus?: string
  organizationName?: string
  organizationText?: string
  loginEnabled?: boolean
  preRegistered?: boolean
  registeredByAdmin?: boolean
  identitySelfSignupCompletedAfterAdminRegistration?: boolean
  identityVerified?: boolean
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
  external1365Id?: string
  affiliatedSchoolUserId?: string
  affiliatedSchoolName?: string
  instructorMemberProfile?: string
  participationHistory?: number
  affiliation?: string
  programRoles?: Record<string, string>
  schoolInfo?: SchoolInfo
  instructorInfo?: InstructorInfo
  listMetrics?: UserListRowMetrics
  [key: string]: unknown
}

export function isMemberListItemResponse(value: unknown): value is MemberListItemResponse {
  return value != null && typeof value === 'object'
}
