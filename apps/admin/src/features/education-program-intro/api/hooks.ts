import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  ProgramIntroFieldCode,
  ProgramIntroSaveInput,
} from '@/entities/education-program-intro/model/types'
import { educationProgramIntroQueryKeys } from './query-keys'
import {
  getProgramIntroCategoryService,
  saveProgramIntroCategoryService,
} from './service'

export function useProgramIntroCategory(fieldCode: ProgramIntroFieldCode, enabled = true) {
  return useQuery({
    queryKey: educationProgramIntroQueryKeys.detail(fieldCode),
    queryFn: () => getProgramIntroCategoryService(fieldCode),
    enabled,
    staleTime: 30_000,
    retry: 1,
  })
}

export function useSaveProgramIntroCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ProgramIntroSaveInput) => saveProgramIntroCategoryService(input),
    retry: false,
    onSuccess: doc => {
      queryClient.setQueryData(educationProgramIntroQueryKeys.detail(doc.fieldCode), doc)
      void queryClient.invalidateQueries({ queryKey: educationProgramIntroQueryKeys.all })
    },
  })
}
