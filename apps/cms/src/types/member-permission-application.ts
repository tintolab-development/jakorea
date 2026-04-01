/**
 * 회원 권한 신청 목록 (강사·관리자 승인 화면)
 */

export type MemberPermissionApplicationKind = 'instructor' | 'admin'

export type MemberPermissionApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

/** 필터: 회원 유형 */
export type MemberPermissionMemberCategoryFilter =
  | 'ALL'
  | 'SCHOOL'
  | 'INDIVIDUAL'
  | 'INSTRUCTOR'

export interface MemberPermissionApplicationRow {
  id: string
  userId: string
  name: string
  phone: string
  email: string
  memberCategory: 'SCHOOL' | 'INDIVIDUAL' | 'INSTRUCTOR' | 'ADMIN'
  approvalStatus: MemberPermissionApplicationStatus
  appliedAt: string
}
