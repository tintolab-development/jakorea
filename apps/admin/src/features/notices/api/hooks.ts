import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  Notice,
  NoticeCreateInput,
  NoticeListFilter,
  NoticeUpdateInput,
} from '@/entities/notices/model/types'
import { shouldUseNoticesRemoteApi } from './capabilities'
import { noticesQueryKeys } from './query-keys'
import {
  createNoticeService,
  getNoticeService,
  listNoticesService,
  removeNoticesService,
  setNoticePublicService,
  updateNoticeService,
} from './service'

function source(): 'remote' | 'local' {
  return shouldUseNoticesRemoteApi() ? 'remote' : 'local'
}

function filterKey(filter: NoticeListFilter): string {
  return JSON.stringify({
    v: filter.visibility ?? '',
    t: filter.title ?? '',
    a: filter.authorName ?? '',
    pf: filter.publishedFrom ?? '',
    pt: filter.publishedTo ?? '',
    cf: filter.createdFrom ?? '',
    ct: filter.createdTo ?? '',
  })
}

/** 필터별 list 캐시 분리 → 단건 패치만으로는 다른 visibility 목록이 갱신되지 않음 */
function invalidateNoticeLists(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: noticesQueryKeys.lists() })
}

export function useNoticesList(filter: NoticeListFilter, enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: noticesQueryKeys.list(dataSource, filterKey(filter)),
    queryFn: () => listNoticesService(filter),
    enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useNoticeDetail(id: string | undefined, enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: noticesQueryKeys.detail(dataSource, id ?? ''),
    queryFn: () => getNoticeService(id!),
    enabled: Boolean(id) && enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useCreateNotice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: NoticeCreateInput) => createNoticeService(input),
    retry: false,
    onSuccess: () => {
      invalidateNoticeLists(queryClient)
    },
  })
}

export function useUpdateNotice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: NoticeUpdateInput) => {
      const cached = queryClient.getQueryData<Notice | null>(
        noticesQueryKeys.detail(source(), input.id),
      )
      return updateNoticeService(input, cached)
    },
    retry: false,
    onSuccess: data => {
      queryClient.setQueryData(noticesQueryKeys.detail(source(), data.id), data)
      invalidateNoticeLists(queryClient)
    },
  })
}

export function useRemoveNotices() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => {
      const cachedLists = queryClient.getQueriesData<Notice[]>({
        queryKey: noticesQueryKeys.lists(),
      })
      const merged = new Map<string, Notice>()
      for (const [, rows] of cachedLists) {
        for (const row of rows ?? []) merged.set(row.id, row)
      }
      return removeNoticesService(ids, [...merged.values()])
    },
    retry: false,
    onSuccess: (_void, ids) => {
      invalidateNoticeLists(queryClient)
      // invalidate(details)는 삭제된 상세를 refetch하며 빈 화면 플래시를 만든다 — 해당 id만 제거
      for (const id of ids) {
        queryClient.removeQueries({ queryKey: noticesQueryKeys.detail(source(), id) })
      }
    },
  })
}

export function useSetNoticePublic() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isPublic }: { id: string; isPublic: boolean }) => {
      const cached = queryClient.getQueryData<Notice | null>(
        noticesQueryKeys.detail(source(), id),
      )
      if (cached) {
        return setNoticePublicService(id, isPublic, cached)
      }
      const lists = queryClient.getQueriesData<Notice[]>({
        queryKey: noticesQueryKeys.lists(),
      })
      for (const [, rows] of lists) {
        const hit = rows?.find(row => row.id === id)
        if (hit) return setNoticePublicService(id, isPublic, hit)
      }
      return setNoticePublicService(id, isPublic)
    },
    retry: false,
    onSuccess: data => {
      queryClient.setQueryData(noticesQueryKeys.detail(source(), data.id), data)
      invalidateNoticeLists(queryClient)
    },
  })
}
