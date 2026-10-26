import type { User } from '@/types/user'

/** 관리자 상세의 전체 담당 프로그램 수는 과거 이력을 포함하므로 승인 취소 가능 여부에 사용한다. */
export function hasProgramAssignmentHistory(user: Pick<User, 'listMetrics'>): boolean {
  const count = user.listMetrics?.managedProgramCount
  return count != null && Number.isFinite(count) && count > 0
}
