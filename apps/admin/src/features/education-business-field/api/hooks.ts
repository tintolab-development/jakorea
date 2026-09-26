import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  EducationBusinessFieldDocument,
  EducationBusinessFieldTextPatch,
} from '@/entities/education-business-field/model/types'
import { educationBusinessFieldQueryKeys } from './query-keys'
import {
  getEducationBusinessFieldDocumentService,
  listEducationBusinessFieldsService,
  reorderEducationBusinessFieldsService,
  saveEducationBusinessFieldDocumentService,
  setEducationBusinessFieldActiveService,
} from './service'

function cachedDocument(
  queryClient: ReturnType<typeof useQueryClient>,
): EducationBusinessFieldDocument | undefined {
  return queryClient.getQueryData<EducationBusinessFieldDocument>(
    educationBusinessFieldQueryKeys.document(),
  )
}

function setDocumentCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  doc: EducationBusinessFieldDocument,
) {
  queryClient.setQueryData(educationBusinessFieldQueryKeys.document(), doc)
  queryClient.setQueryData(educationBusinessFieldQueryKeys.list(), doc.fields)
}

export function useEducationBusinessFieldsList(enabled = true) {
  return useQuery({
    queryKey: educationBusinessFieldQueryKeys.list(),
    queryFn: () => listEducationBusinessFieldsService(),
    enabled,
    staleTime: 30_000,
    retry: 1,
  })
}

export function useEducationBusinessFieldDocument(enabled = true) {
  return useQuery({
    queryKey: educationBusinessFieldQueryKeys.document(),
    queryFn: () => getEducationBusinessFieldDocumentService(),
    enabled,
    staleTime: 30_000,
    retry: 1,
  })
}

export function useReorderEducationBusinessFields() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderedIds: string[]) =>
      reorderEducationBusinessFieldsService(orderedIds, cachedDocument(queryClient)),
    retry: false,
    onSuccess: doc => {
      setDocumentCaches(queryClient, doc)
    },
  })
}

export function useSetEducationBusinessFieldActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setEducationBusinessFieldActiveService(id, isActive, cachedDocument(queryClient)),
    retry: false,
    onSuccess: doc => {
      setDocumentCaches(queryClient, doc)
    },
  })
}

export function useSaveEducationBusinessFieldDocument() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { mainText: string; patches: EducationBusinessFieldTextPatch[] }) =>
      saveEducationBusinessFieldDocumentService(input, cachedDocument(queryClient)),
    retry: false,
    onSuccess: doc => {
      setDocumentCaches(queryClient, doc)
    },
  })
}
