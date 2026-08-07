import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  FooterOrgInfo,
  FooterRelatedLogoSaveInput,
  FooterTopMenuPatch,
} from '@/entities/footer/model/types'
import { shouldUseFooterRemoteApi } from './capabilities'
import { footerQueryKeys } from './query-keys'
import {
  getFooterOrgInfoService,
  listFooterRelatedLogosService,
  listFooterTopMenusService,
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

export function useFooterTopMenusList(enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: footerQueryKeys.topMenusList(dataSource),
    queryFn: () => listFooterTopMenusService(),
    enabled,
    staleTime: dataSource === 'remote' ? 30_000 : localStale,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useReorderFooterTopMenus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderFooterTopMenusService(orderedIds),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: footerQueryKeys.topMenus() })
    },
  })
}

export function useSetFooterTopMenuActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setFooterTopMenuActiveService(id, isActive),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: footerQueryKeys.topMenus() })
    },
  })
}

export function useSaveFooterTopMenus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (patches: FooterTopMenuPatch[]) => saveFooterTopMenusService(patches),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: footerQueryKeys.topMenus() })
    },
  })
}

export function useFooterOrgInfo(enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: footerQueryKeys.orgInfoDetail(dataSource),
    queryFn: () => getFooterOrgInfoService(),
    enabled,
    staleTime: dataSource === 'remote' ? 30_000 : localStale,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useSaveFooterOrgInfo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: FooterOrgInfo) => saveFooterOrgInfoService(data),
    retry: false,
    onSuccess: data => {
      queryClient.setQueryData(footerQueryKeys.orgInfoDetail(source()), data)
      void queryClient.invalidateQueries({ queryKey: footerQueryKeys.orgInfo() })
    },
  })
}

export function useFooterRelatedLogosList(enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: footerQueryKeys.relatedLogosList(dataSource),
    queryFn: () => listFooterRelatedLogosService(),
    enabled,
    staleTime: dataSource === 'remote' ? 30_000 : localStale,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useReorderFooterRelatedLogos() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderFooterRelatedLogosService(orderedIds),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: footerQueryKeys.relatedLogos() })
    },
  })
}

export function useSetFooterRelatedLogoActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      setFooterRelatedLogoActiveService(id, isActive),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: footerQueryKeys.relatedLogos() })
    },
  })
}

export function useSaveFooterRelatedLogo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: FooterRelatedLogoSaveInput) => saveFooterRelatedLogoService(input),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: footerQueryKeys.relatedLogos() })
    },
  })
}
