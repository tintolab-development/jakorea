/**
 * 권한 신청 목록 Mock — 강사/관리자 탭별 분리
 */

import type { User } from '@/types/user'
import type {
  MemberPermissionApplicationRow,
  MemberPermissionApplicationStatus,
} from '@/types/member-permission-application'
import { mockUsers } from './users'
import { resolveInstructorMemberProfile } from '@/entities/user/lib/resolve-instructor-member-profile'

function categoryForUser(u: User): MemberPermissionApplicationRow['memberCategory'] {
  return u.role
}

function rotateStatus(i: number): MemberPermissionApplicationStatus {
  const s: MemberPermissionApplicationStatus[] = ['PENDING', 'APPROVED', 'REJECTED']
  return s[i % s.length]
}

function appliedAtIso(seed: number): string {
  const d = new Date()
  d.setDate(d.getDate() - (seed % 60))
  return d.toISOString()
}

function rowFromUser(
  u: User,
  index: number,
  prefix: string
): MemberPermissionApplicationRow {
  const approvalStatus = u.permissionApprovalStatus ?? rotateStatus(index)
  return {
    id: `${prefix}-${u.id}`,
    userId: u.id,
    name: u.name,
    phone: u.phone ?? '',
    email: u.email,
    memberCategory: categoryForUser(u),
    approvalStatus,
    appliedAt: appliedAtIso(index + 3),
  }
}

/** 강사 권한 신청: 순수 강사(`instructor_only`)만 노출 (교사/겸직 강사 제외) */
const instructorSourceUsers: User[] = mockUsers.filter(
  u => u.role === 'INSTRUCTOR' && resolveInstructorMemberProfile(u) === 'instructor_only'
)

/** 관리자 권한 신청: 관리자 + 일부 개인(승급 후보) */
const adminSourceUsers: User[] = [
  ...mockUsers.filter(u => u.role === 'ADMIN'),
  ...mockUsers.filter(u => u.role === 'INDIVIDUAL').slice(16, 40),
]

export const mockMemberPermissionApplicationsInstructor: MemberPermissionApplicationRow[] =
  instructorSourceUsers.map((u, i) => rowFromUser(u, i, 'mpa-inst'))

export const mockMemberPermissionApplicationsAdmin: MemberPermissionApplicationRow[] =
  adminSourceUsers.map((u, i) => rowFromUser(u, i, 'mpa-adm'))
