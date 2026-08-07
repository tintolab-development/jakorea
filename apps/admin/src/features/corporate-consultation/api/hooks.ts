import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CorporateConsultationListFilter } from '@/entities/corporate-consultation/model/types'
import { shouldUseCorporateConsultationRemoteApi } from './capabilities'
import { corporateConsultationQueryKeys } from './query-keys'
import {
  confirmCorporateConsultationsService,
  getCorporateConsultationService,
  listCorporateConsultationsService,
  removeCorporateConsultationsService,
} from './service'
import { DEFAULT_CONFIRM_ACTOR } from './store'

function source(): 'remote' | 'local' {
  return shouldUseCorporateConsultationRemoteApi() ? 'remote' : 'local'
}

export function useCorporateConsultationsList(
  filter: CorporateConsultationListFilter = {},
  enabled = true
) {
  const dataSource = source()
  return useQuery({
    queryKey: corporateConsultationQueryKeys.list(dataSource, filter),
    queryFn: () => listCorporateConsultationsService(filter),
    enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useCorporateConsultationDetail(id: string | null, enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: corporateConsultationQueryKeys.detail(dataSource, id ?? ''),
    queryFn: () => getCorporateConsultationService(id!, DEFAULT_CONFIRM_ACTOR),
    enabled: Boolean(id) && enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useRemoveCorporateConsultations() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => removeCorporateConsultationsService(ids),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: corporateConsultationQueryKeys.all })
    },
  })
}

export function useConfirmCorporateConsultations() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      ids,
      actorName = DEFAULT_CONFIRM_ACTOR,
    }: {
      ids: string[]
      actorName?: string
    }) => confirmCorporateConsultationsService(ids, actorName),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: corporateConsultationQueryKeys.all })
    },
  })
}
