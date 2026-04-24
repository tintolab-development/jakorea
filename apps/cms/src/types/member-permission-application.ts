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
  /** 강사 탭: 회원 상세「신청 유형」과 동일 규칙. 관리자 탭: 개인 후보는 관리자 권한 신청, 관리자는 권한 유형 라벨 */
  applicationTypeLabel: string
  approvalStatus: MemberPermissionApplicationStatus
  appliedAt: string
}
