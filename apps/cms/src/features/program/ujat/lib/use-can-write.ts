import { useAuthStore } from '@/features/auth/model/auth-store'
import { canPerformWriteAction } from '@/shared/utils/permissions'

/** UJAT 쓰기 버튼 — GENERAL(조회) 관리자는 false. 프로그램 배정 역할 분기는 하지 않는다. */
export function useUjatCanWrite(): boolean {
  const user = useAuthStore(state => state.user)
  return canPerformWriteAction(user)
}
