import { useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchGeneralProgramLectureReportsPage } from '@/features/program/general/api/admin-program-progress-service'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { useProgramProgressRemoteEnabledForSurface } from '@/features/program/1c-1s/lib/use-company-school-surface-remote'
import { mapLectureReportDtoToInstructorRow } from '@/features/program/general/api/adapters/lecture-reports-adapters'
import type { ParticipatingInstructorLectureReportRow } from '@/features/program/general/api/adapters/lecture-reports-adapters'

export type { ParticipatingInstructorLectureReportRow }

/**
 * 강사 중첩 상세 — 강의보고서 목록.
 * remote ON + 성공: API rows. 실패/OFF: null → 호출부 mock.
 */
export function useProgramLectureReports(programId: string | undefined) {
  const remoteEnabled = useProgramProgressRemoteEnabledForSurface(programId)
  const query = useInfiniteQuery({
    queryKey: generalProgramProgressQueryKeys.lectureReports(programId ?? ''),
    queryFn: ({ pageParam }) =>
      fetchGeneralProgramLectureReportsPage(programId!, pageParam),
    initialPageParam: 0,
    getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled: remoteEnabled && Boolean(programId),
    staleTime: 30_000,
    retry: false,
  })

  const remoteRows = useMemo(() => {
    if (!remoteEnabled || query.data == null) return null
    return query.data.pages
      .flatMap(page => page.rows.map((item, index) => ({ item, index: page.page * page.size + index })))
      .map(({ item, index }) => mapLectureReportDtoToInstructorRow(item, index))
      .filter((row): row is ParticipatingInstructorLectureReportRow => row != null)
  }, [query.data, remoteEnabled])

  return {
    rows: remoteRows,
    loading: remoteEnabled && query.isFetching && query.data === undefined,
    isRemoteDataSource: remoteEnabled && remoteRows != null && !query.isError,
    hasNextPage: query.hasNextPage ?? false,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
  }
}
