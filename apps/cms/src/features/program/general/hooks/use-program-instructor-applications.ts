import { useEffect, useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchGeneralInstructorApplicationsPage } from '@/features/program/general/api/admin-applications-service'
import { shouldUseGeneralApplicationsRemoteApi } from '@/features/program/general/api/applications-remote-capabilities'
import { generalApplicationsQueryKeys } from '@/features/program/general/api/general-applications-query-keys'

/**
 * 프로그램 강사 신청 목록.
 * 신청 목록 infinite query와 같은 키를 써서 캐시를 공유한다.
 * Class C: staleTime 30초, 포커스 refetch 없음.
 */
export function useProgramInstructorApplications(
  programId: string | undefined,
  enabled = true
) {
  const trimmedProgramId = programId?.trim() ?? ''
  const remoteEnabled =
    enabled && shouldUseGeneralApplicationsRemoteApi() && trimmedProgramId.length > 0

  const query = useInfiniteQuery({
    queryKey: generalApplicationsQueryKeys.instructorList(trimmedProgramId),
    queryFn: ({ pageParam }) =>
      fetchGeneralInstructorApplicationsPage(trimmedProgramId, { page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled: remoteEnabled,
    staleTime: 30_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    retry: false,
  })

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query
  useEffect(() => {
    if (!remoteEnabled || !hasNextPage || isFetchingNextPage) return
    void fetchNextPage()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, remoteEnabled])

  const rows = useMemo(() => query.data?.pages.flatMap(page => page.rows) ?? [], [query.data])

  return {
    rows,
    isLoading: remoteEnabled && query.isLoading,
  }
}
