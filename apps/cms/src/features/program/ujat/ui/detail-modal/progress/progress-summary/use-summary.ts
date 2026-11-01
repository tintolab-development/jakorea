import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { shouldUseUjatApplicationsRemoteApi } from '@/features/program/ujat/api/applications-remote-capabilities'
import { fetchUjatEducationProgressSummary } from '@/features/program/ujat/api/education-progress-summary-api'
import { queryKeys as ujatQueryKeys } from '@/features/program/ujat/api/query-keys'
import { useNotifyProgramApiUnavailableOnce } from '@/features/program/shared/lib/program-api-unavailable'
import { adaptUjatEducationProgressSummary } from './summary-adapter'
import type {
  UjatEducationProgressSchoolSummary,
  UjatEducationProgressVolunteerSummary,
} from './types'

function emptySchoolSummary(): UjatEducationProgressSchoolSummary {
  return {
    appliedSchools: { regions: {}, total: null },
    semesters: [],
  }
}

function emptyVolunteerSummary(): UjatEducationProgressVolunteerSummary {
  return { rows: [] }
}

export function useUjatEducationProgressSummary(programId?: string | null) {
  const remoteEnabled = shouldUseUjatApplicationsRemoteApi() && Boolean(programId)
  useNotifyProgramApiUnavailableOnce(!remoteEnabled, 'ujat-progress-summary', 'UJAT 교육 진행 요약')

  const summaryQuery = useQuery({
    queryKey: ujatQueryKeys.educationProgressSummary(programId ?? ''),
    enabled: remoteEnabled,
    staleTime: 30_000,
    retry: false,
    queryFn: () => fetchUjatEducationProgressSummary(String(programId)),
  })

  const adapted = useMemo(
    () => (summaryQuery.data != null ? adaptUjatEducationProgressSummary(summaryQuery.data) : null),
    [summaryQuery.data]
  )

  return {
    schoolSummary: adapted?.schoolSummary ?? emptySchoolSummary(),
    volunteerSummary: adapted?.volunteerSummary ?? emptyVolunteerSummary(),
    loading: remoteEnabled && summaryQuery.isLoading,
    isError: remoteEnabled && summaryQuery.isError,
    isRemote: remoteEnabled,
  }
}
