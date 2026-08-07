import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { EducationBusinessFieldTextPatch } from '@/entities/education-business-field/model/types'
import { shouldUseEducationBusinessFieldRemoteApi } from './capabilities'
import { educationBusinessFieldQueryKeys } from './query-keys'
import {
  getEducationBusinessFieldDocumentService,
  listEducationBusinessFieldsService,
  reorderEducationBusinessFieldsService,
  saveEducationBusinessFieldDocumentService,
  setEducationBusinessFieldActiveService,
} from './service'

function source(): 'remote' | 'local' {
  return shouldUseEducationBusinessFieldRemoteApi() ? 'remote' : 'local'
}

export function useEducationBusinessFieldsList(enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: educationBusinessFieldQueryKeys.list(dataSource),
    queryFn: () => listEducationBusinessFieldsService(),
    enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useEducationBusinessFieldDocument(enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: educationBusinessFieldQueryKeys.document(dataSource),
    queryFn: () => getEducationBusinessFieldDocumentService(),
    enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useReorderEducationBusinessFields() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderEducationBusinessFieldsService(orderedIds),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: educationBusinessFieldQueryKeys.all })
    },
  })
}

export function useSetEducationBusinessFieldActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setEducationBusinessFieldActiveService(id, isActive),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: educationBusinessFieldQueryKeys.all })
    },
  })
}

export function useSaveEducationBusinessFieldDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { mainText: string; patches: EducationBusinessFieldTextPatch[] }) =>
      saveEducationBusinessFieldDocumentService(input),
    retry: false,
    onSuccess: doc => {
      queryClient.setQueryData(educationBusinessFieldQueryKeys.document(source()), doc)
      queryClient.setQueryData(educationBusinessFieldQueryKeys.list(source()), doc.fields)
      void queryClient.invalidateQueries({ queryKey: educationBusinessFieldQueryKeys.all })
    },
  })
}
