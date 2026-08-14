import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  FooterAdminDoc,
  FooterOrgInfo,
  FooterOrgInfoSaveInput,
  FooterRelatedLogo,
  FooterRelatedLogoSaveInput,
  FooterTopMenu,
  FooterTopMenuPatch,
} from '@/entities/footer/model/types'
import { shouldUseFooterRemoteApi } from './capabilities'
import { footerQueryKeys } from './query-keys'
import {
  getFooterAdminService,
  reorderFooterRelatedLogosService,
  reorderFooterTopMenusService,
  saveFooterOrgInfoService,
  saveFooterRelatedLogoService,
  saveFooterTopMenusService,
  setFooterRelatedLogoActiveService,
  setFooterTopMenuActiveService,
} from './service'

function source(): 'remote' | 'local' {
  return shouldUseFooterRemoteApi() ? 'remote' : 'local'
}

const localStale = Number.POSITIVE_INFINITY

function adminKey() {
  return footerQueryKeys.admin(source())
}

function patchAdminCache(
  queryClient: ReturnType<typeof useQueryClient>,
  patch: Partial<FooterAdminDoc>,
) {
  queryClient.setQueryData<FooterAdminDoc>(adminKey(), prev =>
    prev ? { ...prev, ...patch } : prev,
  )
}

function useFooterAdminQuery(enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: footerQueryKeys.admin(dataSource),
    queryFn: () => getFooterAdminService(),
    enabled,
    staleTime: dataSource === 'remote' ? 30_000 : localStale,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useFooterTopMenusList(enabled = true) {
  const query = useFooterAdminQuery(enabled)
  return {
    ...query,
    data: query.data?.topMenus,
  }
}

export function useReorderFooterTopMenus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderedIds: string[]) => {
      const cached = queryClient.getQueryData<FooterAdminDoc>(adminKey())?.topMenus
      return reorderFooterTopMenusService(orderedIds, cached)
    },
    retry: false,
    onSuccess: (menus: FooterTopMenu[]) => {
      patchAdminCache(queryClient, { topMenus: menus })
    },
  })
}

export function useSetFooterTopMenuActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => {
      const cached = queryClient.getQueryData<FooterAdminDoc>(adminKey())?.topMenus
      return setFooterTopMenuActiveService(id, isActive, cached)
    },
    retry: false,
    onSuccess: (menus: FooterTopMenu[]) => {
      patchAdminCache(queryClient, { topMenus: menus })
    },
  })
}

export function useSaveFooterTopMenus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (patches: FooterTopMenuPatch[]) => {
      const cached = queryClient.getQueryData<FooterAdminDoc>(adminKey())?.topMenus
      return saveFooterTopMenusService(patches, cached)
    },
    retry: false,
    onSuccess: (menus: FooterTopMenu[]) => {
      patchAdminCache(queryClient, { topMenus: menus })
    },
  })
}

export function useFooterOrgInfo(enabled = true) {
  const query = useFooterAdminQuery(enabled)
  return {
    ...query,
    data: query.data?.orgInfo,
  }
}

export function useSaveFooterOrgInfo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: FooterOrgInfoSaveInput) => {
      const cached = queryClient.getQueryData<FooterAdminDoc>(adminKey())?.orgInfo
      return saveFooterOrgInfoService(input, cached)
    },
    retry: false,
    onSuccess: (orgInfo: FooterOrgInfo) => {
      patchAdminCache(queryClient, { orgInfo })
    },
  })
}

export function useFooterRelatedLogosList(enabled = true) {
  const query = useFooterAdminQuery(enabled)
  return {
    ...query,
    data: query.data?.relatedLogos,
  }
}

export function useReorderFooterRelatedLogos() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderedIds: string[]) => {
      const cached = queryClient.getQueryData<FooterAdminDoc>(adminKey())?.relatedLogos
      return reorderFooterRelatedLogosService(orderedIds, cached)
    },
    retry: false,
    onSuccess: (relatedLogos: FooterRelatedLogo[]) => {
      patchAdminCache(queryClient, { relatedLogos })
    },
  })
}

export function useSetFooterRelatedLogoActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => {
      const cached = queryClient.getQueryData<FooterAdminDoc>(adminKey())?.relatedLogos
      return setFooterRelatedLogoActiveService(id, isActive, cached)
    },
    retry: false,
    onSuccess: (updated: FooterRelatedLogo) => {
      const prev = queryClient.getQueryData<FooterAdminDoc>(adminKey())
      if (!prev) return
      patchAdminCache(queryClient, {
        relatedLogos: prev.relatedLogos.map(row => (row.id === updated.id ? updated : row)),
      })
    },
  })
}

export function useSaveFooterRelatedLogo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: FooterRelatedLogoSaveInput) => {
      const cached = queryClient.getQueryData<FooterAdminDoc>(adminKey())?.relatedLogos
      return saveFooterRelatedLogoService(input, cached)
    },
    retry: false,
    onSuccess: (updated: FooterRelatedLogo) => {
      const prev = queryClient.getQueryData<FooterAdminDoc>(adminKey())
      if (!prev) return
      patchAdminCache(queryClient, {
        relatedLogos: prev.relatedLogos.map(row => (row.id === updated.id ? updated : row)),
      })
    },
  })
}
