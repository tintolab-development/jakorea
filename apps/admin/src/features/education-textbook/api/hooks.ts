import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  EducationTextbook,
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

function filterKey(filter: EducationTextbookListFilter): EducationTextbookListFilter {
  return filter
}

/**
 * 필터별 list queryKey가 분리되어 있으므로 단건 패치만 하면
 * 다른 usage/필터 캐시가 갱신되지 않음 → lists invalidate로 통일.
 * (팝업 setPopupActive와 동일. 단건 응답 후 list invalidate 1회는 허용)
 */
function invalidateTextbookLists(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: educationTextbookQueryKeys.lists() })
}

export function useEducationTextbooksList(
  filter: EducationTextbookListFilter = {},
  enabled = true,
) {
  const dataSource = source()
  return useQuery({
    queryKey: educationTextbookQueryKeys.list(dataSource, filterKey(filter)),
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
      invalidateTextbookLists(queryClient)
    },
  })
}

export function useUpdateEducationTextbook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: EducationTextbookUpdateInput) => {
      const cached = queryClient.getQueryData<EducationTextbook | null>(
        educationTextbookQueryKeys.detail(source(), input.id),
      )
      return updateEducationTextbookService(input, cached)
    },
    retry: false,
    onSuccess: data => {
      queryClient.setQueryData(
        educationTextbookQueryKeys.detail(source(), data.id),
        data,
      )
      // 사용여부·사업분야·교육대상 등 필터 조건이 바뀔 수 있음
      invalidateTextbookLists(queryClient)
    },
  })
}

export function useRemoveEducationTextbooks() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => {
      const cachedLists = queryClient.getQueriesData<EducationTextbook[]>({
        queryKey: educationTextbookQueryKeys.lists(),
      })
      const merged = new Map<string, EducationTextbook>()
      for (const [, rows] of cachedLists) {
        for (const row of rows ?? []) merged.set(row.id, row)
      }
      return removeEducationTextbooksService(ids, [...merged.values()])
    },
    retry: false,
    onSuccess: (_void, ids) => {
      invalidateTextbookLists(queryClient)
      for (const id of ids) {
        queryClient.removeQueries({
          queryKey: educationTextbookQueryKeys.detail(source(), id),
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
        educationTextbookQueryKeys.detail(source(), id),
      )
      if (cached) {
        return setEducationTextbookActiveService(id, isActive, cached)
      }
      const lists = queryClient.getQueriesData<EducationTextbook[]>({
        queryKey: educationTextbookQueryKeys.lists(),
      })
      for (const [, rows] of lists) {
        const hit = rows?.find(row => row.id === id)
        if (hit) return setEducationTextbookActiveService(id, isActive, hit)
      }
      return setEducationTextbookActiveService(id, isActive)
    },
    retry: false,
    onSuccess: data => {
      queryClient.setQueryData(
        educationTextbookQueryKeys.detail(source(), data.id),
        data,
      )
      invalidateTextbookLists(queryClient)
    },
  })
}
