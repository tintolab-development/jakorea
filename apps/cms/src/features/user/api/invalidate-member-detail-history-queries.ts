import type { QueryClient } from '@tanstack/react-query'
import { memberQueryKeys } from '@/features/user/api/member-query-keys'

/**
 * 회원 상세 — 프로그램 수강/참여/담당 이력 CRUD 후 캐시 무효화.
 * `ensureQueryData`만 호출하면 staleTime(30s) 동안 UI가 갱신되지 않으므로
 * mutation 직후에는 반드시 이 helper로 invalidate 한다.
 */
export async function invalidateMemberDetailHistoryQueries(
  queryClient: QueryClient,
  params: {
    memberId?: number | null
    organizationId?: number | null
  }
): Promise<void> {
  const tasks: Promise<unknown>[] = []

  if (params.memberId != null) {
    tasks.push(
      queryClient.invalidateQueries({
        queryKey: memberQueryKeys.applications(params.memberId),
      })
    )
    tasks.push(
      queryClient.invalidateQueries({
        queryKey: memberQueryKeys.programHistory(params.memberId),
      })
    )
    // enrollment-summary는 applications 재조회 시 다시 채운다 — 구 캐시 제거 (동기)
    queryClient.removeQueries({
      queryKey: [...memberQueryKeys.all, 'enrollmentSummary', params.memberId],
    })
  }

  if (params.organizationId != null) {
    tasks.push(
      queryClient.invalidateQueries({
        queryKey: [
          ...memberQueryKeys.all,
          'schoolProgramEnrollmentHistory',
          params.organizationId,
        ],
      })
    )
  }

  await Promise.all(tasks)
}
