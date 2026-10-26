import type { User } from '@/types/user'

/** BE `hasProgramAssignmentHistory`(현재·과거 담당 배정 이력) 기준으로 승인 취소 가능 여부를 판단한다. */
export function hasProgramAssignmentHistory(user: Pick<User, 'listMetrics'>): boolean {
  return user.listMetrics?.hasProgramAssignmentHistory === true
}
