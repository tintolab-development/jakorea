import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchGeneralProgramLectureReports } from '@/features/program/general/api/admin-program-progress-service'
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
  const query = useQuery({
    queryKey: generalProgramProgressQueryKeys.lectureReports(programId ?? ''),
    queryFn: () => fetchGeneralProgramLectureReports(programId!),
    enabled: remoteEnabled && Boolean(programId),
    staleTime: 30_000,
    retry: false,
  })

  const remoteRows = useMemo(() => {
    if (!remoteEnabled || query.data == null) return null
    return query.data
      .map((item, index) => mapLectureReportDtoToInstructorRow(item, index))
      .filter((row): row is ParticipatingInstructorLectureReportRow => row != null)
  }, [query.data, remoteEnabled])

  return {
    rows: remoteRows,
    loading: remoteEnabled && query.isFetching && query.data === undefined,
    isRemoteDataSource: remoteEnabled && remoteRows != null && !query.isError,
  }
}
