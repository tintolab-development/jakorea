import type { User } from '@/types/user'
import { getMemberPermissionInstructorApplicationTypeLabel } from '@/features/user/permission-management/lib/member-permission-instructor-application-type'

type UserRow = Omit<User, 'password'>

/** `user-list`의 강사 유형 표시와 동일 — 강사비 등급이 아닌 신청·소속 구분 기준 */
export function getInstructorTypeDisplayLabel(user: UserRow): string {
  const label = getMemberPermissionInstructorApplicationTypeLabel(user)
  return label === '-' ? '' : label
}

export function matchesInstructorTypeFilter(user: UserRow, selected: string): boolean {
  const token = selected.trim()
  if (!token) return true
  if (user.role !== 'INSTRUCTOR') return false
  return getInstructorTypeDisplayLabel(user) === token
}

export function getInstructorSettlementDisplayLabel(user: UserRow): string {
  return user.listMetrics?.settlementStatusLabel?.trim() ?? ''
}

export function matchesInstructorSettlementFilter(user: UserRow, selected: string): boolean {
  const token = selected.trim()
  if (!token) return true
  if (user.role !== 'INSTRUCTOR') return false
  const label = getInstructorSettlementDisplayLabel(user)
  if (token === '해당 없음') {
    return label === '' || label === '-' || label === '해당 없음'
  }
  return label === token
}
