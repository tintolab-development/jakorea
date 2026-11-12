import type { QueryClient } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'

/** 신청 목록·나의 홈 통계 카드·대시보드 집계를 함께 갱신한다. */
export async function invalidateMypageApplicationSurfaces(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: platformQueryKeys.mypage.programApplications.all() }),
    queryClient.invalidateQueries({ queryKey: platformQueryKeys.mypage.programApplicationStats() }),
    queryClient.invalidateQueries({ queryKey: platformQueryKeys.mypage.dashboard() }),
  ])
}
