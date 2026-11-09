import { createContext, useContext } from 'react'

/**
 * 하위 트리의 버튼 권한 판정을 상위 가드에 맡겼는지 여부.
 * 프로그램 상세처럼 프로그램 역할(my-assignment)로 버튼별 판정을 하는 영역에서는
 * 툴바·상세 헤더의 전역 역할 일괄 write 가드를 끈다. 그렇지 않으면 「캘린더 뷰로 보기」 같은 조회 버튼까지 막힌다.
 */
export const AdminActionGuardDelegationContext = createContext(false)

export function useAdminActionGuardDelegated(): boolean {
  return useContext(AdminActionGuardDelegationContext)
}
