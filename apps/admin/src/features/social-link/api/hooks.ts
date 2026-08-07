import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { SocialLinkUrlPatch } from '@/entities/social-link/model/types'
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
    mutationFn: (orderedIds: string[]) => reorderSocialLinksService(orderedIds),
    retry: false,
    onSuccess: rows => {
      queryClient.setQueryData(socialLinkQueryKeys.list(source()), rows)
      void queryClient.invalidateQueries({ queryKey: socialLinkQueryKeys.lists() })
    },
  })
}

export function useSetSocialLinkActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setSocialLinkActiveService(id, isActive),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: socialLinkQueryKeys.lists() })
    },
  })
}

export function useSaveSocialLinks() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (patches: SocialLinkUrlPatch[]) => saveSocialLinksService(patches),
    retry: false,
    onSuccess: rows => {
      queryClient.setQueryData(socialLinkQueryKeys.list(source()), rows)
      void queryClient.invalidateQueries({ queryKey: socialLinkQueryKeys.lists() })
    },
  })
}
