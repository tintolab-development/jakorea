import { useQuery } from '@tanstack/react-query'
import { shouldUseTrainedTeacherProgramsRemoteApi } from './capabilities'
import { trainedTeacherQueryKeys } from './query-keys'
import { getTrainedTeacherPerformanceSummary } from './performance-summary-service'

export function useTrainedTeacherPerformanceSummary(
  programId: string | undefined,
  enabled = true
) {
  const remoteEnabled = shouldUseTrainedTeacherProgramsRemoteApi()
  return useQuery({
    queryKey: trainedTeacherQueryKeys.performanceSummary(programId ?? ''),
    queryFn: () => getTrainedTeacherPerformanceSummary(programId!),
    enabled: enabled && remoteEnabled && Boolean(programId),
    staleTime: remoteEnabled ? 30_000 : Number.POSITIVE_INFINITY,
    retry: false,
  })
}
