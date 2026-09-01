import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  EducationTarget,
  EducationTargetNamePatch,
} from '@/entities/education-target/model/types'
import { shouldUseEducationTargetRemoteApi } from './capabilities'
import { educationTargetQueryKeys } from './query-keys'
import { listEducationTargetsService, saveEducationTargetsService } from './service'

function source(): 'remote' | 'local' {
  return shouldUseEducationTargetRemoteApi() ? 'remote' : 'local'
}

export function useEducationTargetsList(enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: educationTargetQueryKeys.list(dataSource),
    queryFn: () => listEducationTargetsService(),
    enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useSaveEducationTargets() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (patches: EducationTargetNamePatch[]) => {
      const cached = queryClient.getQueryData<EducationTarget[]>(
        educationTargetQueryKeys.list(source()),
      )
      return saveEducationTargetsService(patches, cached)
    },
    retry: false,
    onSuccess: rows => {
      queryClient.setQueryData(educationTargetQueryKeys.list(source()), rows)
    },
  })
}
