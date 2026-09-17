import type { QueryClient } from '@tanstack/react-query'
import { memberQueryKeys } from '@/features/user/api/member-query-keys'

/** 예전 mock 목록 키 잔여 캐시 정리용 (`useInfiniteUserList`는 실 API 키만 사용) */
const LEGACY_MOCK_MEMBER_LIST_QUERY_KEY = ['users', 'list'] as const

/** 활성 회원 목록 무한쿼리를 다시 친다 (LNB 동일 유형 재클릭 등 remount가 없을 때). */
export function invalidateMemberListQueries(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: memberQueryKeys.listAll() })
  void queryClient.invalidateQueries({ queryKey: memberQueryKeys.schoolsListAll() })
  void queryClient.invalidateQueries({ queryKey: LEGACY_MOCK_MEMBER_LIST_QUERY_KEY })
}
