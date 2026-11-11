import { useMemo } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchGeneralProgramLectureReportsPage } from '@/features/program/general/api/admin-program-progress-service'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { useProgramProgressRemoteEnabledForSurface } from '@/features/program/1c-1s/lib/use-company-school-surface-remote'
import { mapLectureReportDtoToInstructorRow } from '@/features/program/general/api/adapters/lecture-reports-adapters'
import type { ParticipatingInstructorLectureReportRow } from '@/features/program/general/api/adapters/lecture-reports-adapters'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import { useNotifyProgramApiUnavailableOnce } from '@/features/program/shared/lib/program-api-unavailable'
import type { Program } from '@/types/domain'

export type { ParticipatingInstructorLectureReportRow }

export type UseProgramLectureReportsOptions = {
  /** 참여 강사 상세 — 해당 강사 행만 (서버 미지원 시 FE 필터) */
  instructorMemberId?: number | null
  instructor?: ParticipatingInstructorRow | null
  /** 일정 라벨 교육 구조 분기(일정형=세부 일정명, 단일 회차=차시 수) */
  program?: Program | null
}

/**
 * 강사 중첩 상세 — 강의보고서 목록.
 * remote ON + 성공: API rows. 실패/OFF: null → 호출부 empty (mock 금지).
 */
export function useProgramLectureReports(
  programId: string | undefined,
  options?: UseProgramLectureReportsOptions
) {
  const remoteEnabled = useProgramProgressRemoteEnabledForSurface(programId)
  useNotifyProgramApiUnavailableOnce(
    Boolean(programId) && !remoteEnabled,
    'general-participating-instructor-lecture-reports',
    '참여 강사 · 강의보고서'
  )
  const instructorMemberId =
    options?.instructorMemberId != null && Number.isFinite(options.instructorMemberId)
      ? options.instructorMemberId
      : undefined
  const program = options?.program ?? null

  const query = useInfiniteQuery({
    queryKey: generalProgramProgressQueryKeys.lectureReports(
      programId ?? '',
      instructorMemberId ?? null
    ),
    queryFn: ({ pageParam }) =>
      fetchGeneralProgramLectureReportsPage(programId!, pageParam, {
        instructorMemberId,
      }),
    initialPageParam: 0,
    getNextPageParam: lastPage => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    enabled: remoteEnabled && Boolean(programId),
    staleTime: 30_000,
    retry: false,
  })

  const remoteRows = useMemo(() => {
    if (!remoteEnabled || query.data == null) return null
    const mapped = query.data.pages
      .flatMap(page =>
        page.rows.map((item, index) => ({ item, index: page.page * page.size + index }))
      )
      .map(({ item, index }) => mapLectureReportDtoToInstructorRow(item, index, program))
      .filter((row): row is ParticipatingInstructorLectureReportRow => row != null)

    // OpenAPI list에 instructorMemberId 쿼리가 보장되지 않음 → 필드가 있으면 FE 필터
    const filtered =
      instructorMemberId != null
        ? (() => {
            const hasScopedField = mapped.some(row => row.instructorMemberId != null)
            if (!hasScopedField) return mapped
            return mapped.filter(row => row.instructorMemberId === instructorMemberId)
          })()
        : mapped

    return filtered.map((row, index) => ({ ...row, no: index + 1 }))
  }, [instructorMemberId, program, query.data, remoteEnabled])

  const rows = remoteRows

  return {
    rows,
    loading: remoteEnabled && query.isFetching && query.data === undefined,
    isRemoteDataSource: remoteEnabled && remoteRows != null && !query.isError,
    hasNextPage: query.hasNextPage ?? false,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: query.fetchNextPage,
  }
}
