import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  ProgramIntroFieldCode,
  ProgramIntroSaveInput,
} from '@/entities/education-program-intro/model/types'
import { shouldUseEducationProgramIntroRemoteApi } from './capabilities'
import { educationProgramIntroQueryKeys } from './query-keys'
import {
  getProgramIntroCategoryService,
  saveProgramIntroCategoryService,
} from './service'

function source(): 'remote' | 'local' {
  return shouldUseEducationProgramIntroRemoteApi() ? 'remote' : 'local'
}

export function useProgramIntroCategory(fieldCode: ProgramIntroFieldCode, enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: educationProgramIntroQueryKeys.detail(fieldCode, dataSource),
    queryFn: () => getProgramIntroCategoryService(fieldCode),
    enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useSaveProgramIntroCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ProgramIntroSaveInput) => saveProgramIntroCategoryService(input),
    retry: false,
    onSuccess: doc => {
      queryClient.setQueryData(
        educationProgramIntroQueryKeys.detail(doc.fieldCode, source()),
        doc,
      )
      void queryClient.invalidateQueries({ queryKey: educationProgramIntroQueryKeys.all })
    },
  })
}
