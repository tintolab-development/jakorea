import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  CorporateConsultation,
  CorporateConsultationListFilter,
  CorporateConsultationListResult,
} from '@/entities/corporate-consultation/model/types'
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

function filterKey(filter: CorporateConsultationListFilter): string {
  return JSON.stringify({
    status: filter.status ?? '',
    company: filter.companyName ?? '',
    contact: filter.contactName ?? '',
    dept: filter.departmentTitle ?? '',
    af: filter.appliedFrom ?? '',
    at: filter.appliedTo ?? '',
    cf: filter.confirmedFrom ?? '',
    ct: filter.confirmedTo ?? '',
  })
}

function cachedList(
  queryClient: ReturnType<typeof useQueryClient>,
  filter: CorporateConsultationListFilter,
): CorporateConsultationListResult | undefined {
  return queryClient.getQueryData<CorporateConsultationListResult>(
    corporateConsultationQueryKeys.list(source(), filterKey(filter)),
  )
}

function patchConsultationInLists(
  queryClient: ReturnType<typeof useQueryClient>,
  consultation: CorporateConsultation,
) {
  queryClient.setQueriesData<CorporateConsultationListResult>(
    { queryKey: corporateConsultationQueryKeys.lists() },
    old => {
      if (!old) return old
      const idx = old.items.findIndex(row => row.id === consultation.id)
      if (idx < 0) return old
      const items = [...old.items]
      items[idx] = consultation
      return { ...old, items }
    },
  )
}

export function useCorporateConsultationsList(
  filter: CorporateConsultationListFilter = {},
  enabled = true,
) {
  const dataSource = source()
  return useQuery({
    queryKey: corporateConsultationQueryKeys.list(dataSource, filterKey(filter)),
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

export function useRemoveCorporateConsultations(filter: CorporateConsultationListFilter = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => {
      const cached = cachedList(queryClient, filter)?.items
      const merged = new Map<string, CorporateConsultation>()
      for (const [, result] of queryClient.getQueriesData<CorporateConsultationListResult>({
        queryKey: corporateConsultationQueryKeys.lists(),
      })) {
        for (const row of result?.items ?? []) merged.set(row.id, row)
      }
      return removeCorporateConsultationsService(ids, cached ?? [...merged.values()])
    },
    retry: false,
    onSuccess: (_void, ids) => {
      void queryClient.invalidateQueries({ queryKey: corporateConsultationQueryKeys.lists() })
      for (const id of ids) {
        queryClient.removeQueries({
          queryKey: corporateConsultationQueryKeys.detail(source(), id),
        })
      }
    },
  })
}

export function useConfirmCorporateConsultations(filter: CorporateConsultationListFilter = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      ids,
      actorName = DEFAULT_CONFIRM_ACTOR,
    }: {
      ids: string[]
      actorName?: string
    }) =>
      confirmCorporateConsultationsService(
        ids,
        actorName,
        cachedList(queryClient, filter)?.items,
      ),
    retry: false,
    onSuccess: updatedRows => {
      for (const row of updatedRows) {
        queryClient.setQueryData(
          corporateConsultationQueryKeys.detail(source(), row.id),
          row,
        )
        patchConsultationInLists(queryClient, row)
      }
      if (updatedRows.length === 0) {
        void queryClient.invalidateQueries({ queryKey: corporateConsultationQueryKeys.lists() })
      }
    },
  })
}
