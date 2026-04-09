import type { User } from '@/types/user'

type UserRow = Omit<User, 'password'>

/** `user-list`의 강사 유형 표시와 동일 — API `listMetrics.instructorTypeLabel` 기준 */
export function getInstructorTypeDisplayLabel(user: UserRow): string {
  return user.listMetrics?.instructorTypeLabel?.trim() ?? ''
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
    return label === '' || label === '-'
  }
  return label === token
}
