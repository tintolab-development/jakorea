import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  RecruitPosting,
  RecruitPostingCreateInput,
  RecruitPostingListFilter,
  RecruitPostingUpdateInput,
} from '@/entities/recruit-posting/model/types'
import { useAdminInfiniteList } from '@/shared/hooks/use-admin-infinite-list'
import { shouldUseRecruitPostingRemoteApi } from './capabilities'
import { recruitPostingQueryKeys } from './query-keys'
import {
  createRecruitPostingService,
  getRecruitPostingService,
  listRecruitPostingsPageService,
  removeRecruitPostingsService,
  setRecruitPostingPublicService,
  updateRecruitPostingService,
} from './service'

function source(): 'remote' | 'local' {
  return shouldUseRecruitPostingRemoteApi() ? 'remote' : 'local'
}

function filterKey(filter: RecruitPostingListFilter): string {
  return JSON.stringify({
    v: filter.visibility ?? '',
    s: filter.status ?? '',
    t: filter.title ?? '',
    a: filter.authorName ?? '',
    rf: filter.recruitFrom ?? '',
    rt: filter.recruitTo ?? '',
    pf: filter.publishedFrom ?? '',
    pt: filter.publishedTo ?? '',
  })
}

function invalidatePostingLists(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: recruitPostingQueryKeys.lists() })
}

export function useRecruitPostingsList(filter: RecruitPostingListFilter, enabled = true) {
  return useAdminInfiniteList({
    queryKey: recruitPostingQueryKeys.list(source(), filterKey(filter)),
    enabled,
    isRemote: shouldUseRecruitPostingRemoteApi(),
    fetchPage: page => listRecruitPostingsPageService(filter, page),
  })
}

export function useRecruitPostingDetail(id: string | undefined, enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: recruitPostingQueryKeys.detail(dataSource, id ?? ''),
    queryFn: () => getRecruitPostingService(id!),
    enabled: Boolean(id) && enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    gcTime: 15 * 60_000,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useSetRecruitPostingPublic() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isPublic, version }: { id: string; isPublic: boolean; version: number }) =>
      setRecruitPostingPublicService(id, isPublic, version),
    retry: false,
    onSuccess: () => {
      invalidatePostingLists(queryClient)
    },
  })
}

export function useCreateRecruitPosting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: RecruitPostingCreateInput) => createRecruitPostingService(input),
    retry: false,
    onSuccess: () => {
      invalidatePostingLists(queryClient)
    },
  })
}

export function useUpdateRecruitPosting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: RecruitPostingUpdateInput) => {
      const cached = queryClient.getQueryData<RecruitPosting | null>(
        recruitPostingQueryKeys.detail(source(), input.id),
      )
      return updateRecruitPostingService(input, cached ?? null)
    },
    retry: false,
    onSuccess: data => {
      queryClient.setQueryData(recruitPostingQueryKeys.detail(source(), data.id), data)
      void queryClient.invalidateQueries({
        queryKey: recruitPostingQueryKeys.detail(source(), data.id),
      })
      invalidatePostingLists(queryClient)
    },
  })
}

export function useRemoveRecruitPostings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => removeRecruitPostingsService(ids),
    retry: false,
    onSuccess: (_void, ids) => {
      invalidatePostingLists(queryClient)
      for (const id of ids) {
        queryClient.removeQueries({
          queryKey: recruitPostingQueryKeys.detail(source(), id),
        })
      }
    },
  })
}
