import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  EducationTextbookCreateInput,
  EducationTextbookListFilter,
  EducationTextbookUpdateInput,
} from '@/entities/education-textbook/model/types'
import { shouldUseEducationTextbookRemoteApi } from './capabilities'
import { educationTextbookQueryKeys } from './query-keys'
import {
  createEducationTextbookService,
  getEducationTextbookService,
  listEducationTextbooksService,
  removeEducationTextbooksService,
  setEducationTextbookActiveService,
  updateEducationTextbookService,
} from './service'

function source(): 'remote' | 'local' {
  return shouldUseEducationTextbookRemoteApi() ? 'remote' : 'local'
}

export function useEducationTextbooksList(
  filter: EducationTextbookListFilter = {},
  enabled = true
) {
  const dataSource = source()
  return useQuery({
    queryKey: educationTextbookQueryKeys.list(dataSource, filter),
    queryFn: () => listEducationTextbooksService(filter),
    enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useEducationTextbookDetail(id: string | null, enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: educationTextbookQueryKeys.detail(dataSource, id ?? ''),
    queryFn: () => getEducationTextbookService(id!),
    enabled: Boolean(id) && enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useCreateEducationTextbook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: EducationTextbookCreateInput) => createEducationTextbookService(input),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: educationTextbookQueryKeys.lists() })
    },
  })
}

export function useUpdateEducationTextbook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: EducationTextbookUpdateInput) => updateEducationTextbookService(input),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: educationTextbookQueryKeys.all })
    },
  })
}

export function useRemoveEducationTextbooks() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => removeEducationTextbooksService(ids),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: educationTextbookQueryKeys.all })
    },
  })
}

export function useSetEducationTextbookActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setEducationTextbookActiveService(id, isActive),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: educationTextbookQueryKeys.lists() })
    },
  })
}
