import { useQuery } from '@tanstack/react-query'
import { shouldUseTrainedTeacherProgramsRemoteApi } from './capabilities'
import { listTrainedTeacherEducationCompletions } from './education-completions-service'
import { trainedTeacherQueryKeys } from './query-keys'

export function useTrainedTeacherEducationCompletions(
  programId: string | undefined,
  organizationApplicationId?: string,
  enabled = true
) {
  const remoteEnabled = shouldUseTrainedTeacherProgramsRemoteApi()
  return useQuery({
    queryKey: trainedTeacherQueryKeys.educationCompletions(
      programId ?? '',
      organizationApplicationId ?? ''
    ),
    queryFn: () =>
      listTrainedTeacherEducationCompletions(programId!, organizationApplicationId),
    enabled: enabled && remoteEnabled && Boolean(programId),
  })
}
