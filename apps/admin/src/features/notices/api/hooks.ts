import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
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
      void queryClient.invalidateQueries({ queryKey: noticesQueryKeys.all })
    },
  })
}

export function useUpdateNotice() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: NoticeUpdateInput) => updateNoticeService(input),
    retry: false,
    onSuccess: data => {
      void queryClient.invalidateQueries({ queryKey: noticesQueryKeys.all })
      queryClient.setQueryData(noticesQueryKeys.detail(source(), data.id), data)
    },
  })
}

export function useRemoveNotices() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => removeNoticesService(ids),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: noticesQueryKeys.all })
    },
  })
}

export function useSetNoticePublic() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isPublic }: { id: string; isPublic: boolean }) =>
      setNoticePublicService(id, isPublic),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: noticesQueryKeys.all })
    },
  })
}
