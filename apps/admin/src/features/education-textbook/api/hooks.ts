import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAdminInfiniteList } from '@/shared/hooks/use-admin-infinite-list'
import { collectInfiniteCachedRows } from '@/shared/lib/admin-infinite-list'
import type {
  EducationTextbook,
  EducationTextbookCreateInput,
  EducationTextbookListFilter,
  EducationTextbookUpdateInput,
} from '@/entities/education-textbook/model/types'
import { educationTextbookQueryKeys } from './query-keys'
import {
  createEducationTextbookService,
  getEducationTextbookService,
  listEducationTextbooksPageService,
  removeEducationTextbooksService,
  setEducationTextbookActiveService,
  updateEducationTextbookService,
} from './service'

/**
 * 필터별 list queryKey가 분리되어 있으므로 단건 패치만 하면
 * 다른 usage/필터 캐시가 갱신되지 않음 → lists invalidate로 통일.
 */
function invalidateTextbookLists(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: educationTextbookQueryKeys.lists() })
}

export function useEducationTextbooksList(
  filter: EducationTextbookListFilter = {},
  enabled = true,
) {
  return useAdminInfiniteList({
    queryKey: educationTextbookQueryKeys.list(filter),
    enabled,
    isRemote: true,
    fetchPage: page => listEducationTextbooksPageService(filter, page),
  })
}

export function useEducationTextbookDetail(id: string | null, enabled = true) {
  return useQuery({
    queryKey: educationTextbookQueryKeys.detail(id ?? ''),
    queryFn: () => getEducationTextbookService(id!),
    enabled: Boolean(id) && enabled,
    staleTime: 30_000,
    retry: 1,
  })
}

export function useCreateEducationTextbook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: EducationTextbookCreateInput) => createEducationTextbookService(input),
    retry: false,
    onSuccess: () => {
      invalidateTextbookLists(queryClient)
    },
  })
}

export function useUpdateEducationTextbook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: EducationTextbookUpdateInput) => {
      const cached = queryClient.getQueryData<EducationTextbook | null>(
        educationTextbookQueryKeys.detail(input.id),
      )
      return updateEducationTextbookService(input, cached)
    },
    retry: false,
    onSuccess: data => {
      queryClient.setQueryData(educationTextbookQueryKeys.detail(data.id), data)
      invalidateTextbookLists(queryClient)
    },
  })
}

export function useRemoveEducationTextbooks() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => {
      const cached = collectInfiniteCachedRows<EducationTextbook>(
        queryClient,
        educationTextbookQueryKeys.lists(),
      )
      return removeEducationTextbooksService(ids, cached)
    },
    retry: false,
    onSuccess: (_void, ids) => {
      invalidateTextbookLists(queryClient)
      for (const id of ids) {
        queryClient.removeQueries({
          queryKey: educationTextbookQueryKeys.detail(id),
        })
      }
    },
  })
}

export function useSetEducationTextbookActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => {
      const cached = queryClient.getQueryData<EducationTextbook | null>(
        educationTextbookQueryKeys.detail(id),
      )
      if (cached) {
        return setEducationTextbookActiveService(id, isActive, cached)
      }
      const cachedRows = collectInfiniteCachedRows<EducationTextbook>(
        queryClient,
        educationTextbookQueryKeys.lists(),
      )
      const hit = cachedRows?.find(row => row.id === id)
      if (hit) return setEducationTextbookActiveService(id, isActive, hit)
      return setEducationTextbookActiveService(id, isActive)
    },
    retry: false,
    onSuccess: data => {
      queryClient.setQueryData(educationTextbookQueryKeys.detail(data.id), data)
      invalidateTextbookLists(queryClient)
    },
  })
}
