import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { SocialLink, SocialLinkUrlPatch } from '@/entities/social-link/model/types'
import { shouldUseSocialLinkRemoteApi } from './capabilities'
import { socialLinkQueryKeys } from './query-keys'
import {
  listSocialLinksService,
  reorderSocialLinksService,
  saveSocialLinksService,
  setSocialLinkActiveService,
} from './service'

function source(): 'remote' | 'local' {
  return shouldUseSocialLinkRemoteApi() ? 'remote' : 'local'
}

function cachedList(queryClient: ReturnType<typeof useQueryClient>): SocialLink[] | undefined {
  return queryClient.getQueryData<SocialLink[]>(socialLinkQueryKeys.list(source()))
}

export function useSocialLinksList(enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: socialLinkQueryKeys.list(dataSource),
    queryFn: () => listSocialLinksService(),
    enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useReorderSocialLinks() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderedIds: string[]) =>
      reorderSocialLinksService(orderedIds, cachedList(queryClient)),
    retry: false,
    onSuccess: rows => {
      // PUT 응답이 전체 목록(+version) — 추가 GET 없이 캐시 반영
      queryClient.setQueryData(socialLinkQueryKeys.list(source()), rows)
    },
  })
}

export function useSetSocialLinkActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setSocialLinkActiveService(id, isActive, cachedList(queryClient)),
    retry: false,
    onSuccess: rows => {
      queryClient.setQueryData(socialLinkQueryKeys.list(source()), rows)
    },
  })
}

export function useSaveSocialLinks() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (patches: SocialLinkUrlPatch[]) =>
      saveSocialLinksService(patches, cachedList(queryClient)),
    retry: false,
    onSuccess: rows => {
      queryClient.setQueryData(socialLinkQueryKeys.list(source()), rows)
    },
  })
}
