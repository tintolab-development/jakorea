import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  RecruitPosting,
  RecruitPostingCreateInput,
  RecruitPostingListFilter,
  RecruitPostingUpdateInput,
} from '@/entities/recruit-posting/model/types'
import { shouldUseRecruitPostingRemoteApi } from './capabilities'
import { canToggleRecruitPostingVisibility } from './permissions'
import { recruitPostingQueryKeys } from './query-keys'
import {
  createRecruitPostingService,
  getRecruitPostingService,
  listRecruitPostingsService,
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

export function useRecruitPostingsList(filter: RecruitPostingListFilter) {
  const dataSource = source()
  return useQuery({
    queryKey: recruitPostingQueryKeys.list(dataSource, filterKey(filter)),
    queryFn: () => listRecruitPostingsService(filter),
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    gcTime: 15 * 60_000,
    retry: dataSource === 'remote' ? 1 : false,
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

export function useCanToggleRecruitPostingPublic() {
  const remote = shouldUseRecruitPostingRemoteApi()
  const query = useQuery({
    queryKey: [...recruitPostingQueryKeys.all, 'publish-permission'] as const,
    queryFn: () => canToggleRecruitPostingVisibility(),
    enabled: remote,
    staleTime: 30_000,
    gcTime: 15 * 60_000,
    retry: false,
  })
  if (!remote) return true
  return query.data === true
}

export function useSetRecruitPostingPublic() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isPublic, version }: { id: string; isPublic: boolean; version: number }) =>
      setRecruitPostingPublicService(id, isPublic, version),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: recruitPostingQueryKeys.lists() })
    },
  })
}

export function useCreateRecruitPosting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: RecruitPostingCreateInput) => createRecruitPostingService(input),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: recruitPostingQueryKeys.lists() })
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
      void queryClient.invalidateQueries({ queryKey: recruitPostingQueryKeys.lists() })
    },
  })
}

export function useRemoveRecruitPostings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => removeRecruitPostingsService(ids),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: recruitPostingQueryKeys.lists() })
    },
  })
}
