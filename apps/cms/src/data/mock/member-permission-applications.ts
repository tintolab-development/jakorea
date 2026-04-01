/**
 * 권한 신청 목록 Mock — 강사/관리자 탭별 분리
 */

import type { User } from '@/types/user'
import type {
  MemberPermissionApplicationRow,
  MemberPermissionApplicationStatus,
} from '@/types/member-permission-application'
import { mockUsers } from './users'

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
  return {
    id: `${prefix}-${u.id}`,
    userId: u.id,
    name: u.name,
    phone: u.phone ?? '',
    email: u.email,
    memberCategory: categoryForUser(u),
    approvalStatus: rotateStatus(index),
    appliedAt: appliedAtIso(index + 3),
  }
}

/** 강사 권한 신청: 강사·개인·학교(교사) 혼합 (실제 userId로 상세 모달 연동) */
const instructorSourceUsers: User[] = [
  ...mockUsers.filter(u => u.role === 'INSTRUCTOR'),
  ...mockUsers.filter(u => u.role === 'INDIVIDUAL').slice(0, 24),
  ...mockUsers.filter(u => u.role === 'SCHOOL').slice(0, 16),
]

/** 관리자 권한 신청: 관리자 + 일부 개인(승급 후보) */
const adminSourceUsers: User[] = [
  ...mockUsers.filter(u => u.role === 'ADMIN'),
  ...mockUsers.filter(u => u.role === 'INDIVIDUAL').slice(16, 40),
]

export const mockMemberPermissionApplicationsInstructor: MemberPermissionApplicationRow[] =
  instructorSourceUsers.map((u, i) => rowFromUser(u, i, 'mpa-inst'))

export const mockMemberPermissionApplicationsAdmin: MemberPermissionApplicationRow[] =
  adminSourceUsers.map((u, i) => rowFromUser(u, i, 'mpa-adm'))
