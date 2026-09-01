import type { QueryClient } from '@tanstack/react-query'
import { memberQueryKeys } from '@/features/user/api/member-query-keys'

/** mock 경로 레거시 키 — `useInfiniteUserList` mock observer와 동일 prefix */
const MOCK_MEMBER_LIST_QUERY_KEY = ['users', 'list'] as const

/** 활성 회원 목록 무한쿼리를 다시 친다 (LNB 동일 유형 재클릭 등 remount가 없을 때). */
export function invalidateMemberListQueries(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: memberQueryKeys.listAll() })
  void queryClient.invalidateQueries({ queryKey: memberQueryKeys.schoolsListAll() })
  void queryClient.invalidateQueries({ queryKey: MOCK_MEMBER_LIST_QUERY_KEY })
}
