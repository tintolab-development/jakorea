import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  CorporatePartnerCreateInput,
  CorporatePartnerListFilter,
  CorporatePartnerUpdateInput,
} from '@/entities/corporate-partner/model/types'
import { shouldUseCorporatePartnerRemoteApi } from './capabilities'
import { corporatePartnerQueryKeys } from './query-keys'
import {
  createCorporatePartnerService,
  listCorporatePartnersService,
  removeCorporatePartnersService,
  reorderCorporatePartnersService,
  setCorporatePartnerPublicService,
  updateCorporatePartnerService,
} from './service'

function source(): 'remote' | 'local' {
  return shouldUseCorporatePartnerRemoteApi() ? 'remote' : 'local'
}

export function useCorporatePartnersList(
  filter?: CorporatePartnerListFilter,
  enabled = true
) {
  const dataSource = source()
  return useQuery({
    queryKey: corporatePartnerQueryKeys.list(dataSource, filter),
    queryFn: () => listCorporatePartnersService(filter),
    enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

/** 전체 목록 (필터 없음) — 총 건수·reorder merge 용 */
export function useCorporatePartnersAll(enabled = true) {
  return useCorporatePartnersList(undefined, enabled)
}

export function useCreateCorporatePartner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CorporatePartnerCreateInput) => createCorporatePartnerService(input),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: corporatePartnerQueryKeys.lists() })
    },
  })
}

export function useUpdateCorporatePartner() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: CorporatePartnerUpdateInput }) =>
      updateCorporatePartnerService(id, patch),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: corporatePartnerQueryKeys.lists() })
    },
  })
}

export function useRemoveCorporatePartners() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => removeCorporatePartnersService(ids),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: corporatePartnerQueryKeys.lists() })
    },
  })
}

export function useReorderCorporatePartners() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (orderedIds: string[]) => reorderCorporatePartnersService(orderedIds),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: corporatePartnerQueryKeys.lists() })
    },
  })
}

export function useSetCorporatePartnerPublic() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isPublic }: { id: string; isPublic: boolean }) =>
      setCorporatePartnerPublicService(id, isPublic),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: corporatePartnerQueryKeys.lists() })
    },
  })
}
