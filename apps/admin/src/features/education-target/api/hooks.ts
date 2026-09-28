import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  EducationTarget,
  EducationTargetNamePatch,
} from '@/entities/education-target/model/types'
import { educationTargetQueryKeys } from './query-keys'
import { listEducationTargetsService, saveEducationTargetsService } from './service'

export function useEducationTargetsList(enabled = true) {
  return useQuery({
    queryKey: educationTargetQueryKeys.list(),
    queryFn: () => listEducationTargetsService(),
    enabled,
    staleTime: 30_000,
    retry: 1,
  })
}

export function useSaveEducationTargets() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (patches: EducationTargetNamePatch[]) => {
      const cached = queryClient.getQueryData<EducationTarget[]>(educationTargetQueryKeys.list())
      return saveEducationTargetsService(patches, cached)
    },
    retry: false,
    onSuccess: rows => {
      queryClient.setQueryData(educationTargetQueryKeys.list(), rows)
    },
  })
}
