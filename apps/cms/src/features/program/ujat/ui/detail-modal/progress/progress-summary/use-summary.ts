import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchUjatEducationProgressSummary } from '@/features/program/ujat/api/education-progress-summary-api'
import { queryKeys as ujatQueryKeys } from '@/features/program/ujat/api/query-keys'
import { shouldUseRemoteApi } from '@/features/program/ujat/api/capabilities'
import { useNotifyProgramApiUnavailableOnce } from '@/features/program/shared/lib/program-api-unavailable'
import { adaptUjatEducationProgressSummary } from './summary-adapter'
import { buildRegionRow } from './summary-display'
import type {
  UjatEducationProgressColumnRegion,
  UjatEducationProgressSchoolSummary,
  UjatEducationProgressVolunteerSummary,
} from './types'

function emptySchoolSummary(): UjatEducationProgressSchoolSummary {
  return {
    appliedSchools: buildRegionRow({}),
    semesters: [],
  }
}

function emptyVolunteerSummary(): UjatEducationProgressVolunteerSummary {
  return { rows: [] }
}

export function useUjatEducationProgressSummary(programId?: string | null) {
  const remoteEnabled = shouldUseRemoteApi() && Boolean(programId)
  useNotifyProgramApiUnavailableOnce(
    !remoteEnabled,
    'ujat-progress-summary',
    'UJAT 교육 진행 요약'
  )

  const summaryQuery = useQuery({
    queryKey: ujatQueryKeys.educationProgressSummary(programId ?? ''),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
    queryFn: () => fetchUjatEducationProgressSummary(String(programId)),
  })

  const adapted = useMemo(() => {
    if (!summaryQuery.data) return null
    return adaptUjatEducationProgressSummary(summaryQuery.data)
  }, [summaryQuery.data])

  return {
    columnRegions: (adapted?.columnRegions ?? []) as UjatEducationProgressColumnRegion[],
    schoolSummary: adapted?.schoolSummary ?? emptySchoolSummary(),
    volunteerSummary: adapted?.volunteerSummary ?? emptyVolunteerSummary(),
    loading: remoteEnabled && summaryQuery.isLoading,
    isError: remoteEnabled && summaryQuery.isError,
    isRemote: remoteEnabled,
    isFetching: remoteEnabled && summaryQuery.isFetching,
  }
}
