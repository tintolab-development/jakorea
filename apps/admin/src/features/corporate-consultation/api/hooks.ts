import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  CorporateConsultation,
  CorporateConsultationListFilter,
} from '@/entities/corporate-consultation/model/types'
import { useAdminInfiniteList } from '@/shared/hooks/use-admin-infinite-list'
import {
  collectInfiniteCachedRows,
  patchInfiniteListRow,
} from '@/shared/lib/admin-infinite-list'
import { shouldUseCorporateConsultationRemoteApi } from './capabilities'
import { corporateConsultationQueryKeys } from './query-keys'
import {
  confirmCorporateConsultationsService,
  getCorporateConsultationService,
  listCorporateConsultationsPageService,
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

function cachedRows(
  queryClient: ReturnType<typeof useQueryClient>,
): CorporateConsultation[] | undefined {
  return collectInfiniteCachedRows<CorporateConsultation>(
    queryClient,
    corporateConsultationQueryKeys.lists(),
  )
}

export function useCorporateConsultationsList(
  filter: CorporateConsultationListFilter = {},
  enabled = true,
) {
  return useAdminInfiniteList({
    queryKey: corporateConsultationQueryKeys.list(source(), filterKey(filter)),
    enabled,
    isRemote: shouldUseCorporateConsultationRemoteApi(),
    fetchPage: page => listCorporateConsultationsPageService(filter, page),
  })
}

export function useCorporateConsultationDetail(
  id: string | null,
  enabled = true,
  revealPii = false,
) {
  const dataSource = source()
  return useQuery({
    queryKey: corporateConsultationQueryKeys.detail(dataSource, id ?? '', revealPii),
    queryFn: () => getCorporateConsultationService(id!, DEFAULT_CONFIRM_ACTOR, { revealPii }),
    enabled: Boolean(id) && enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useRemoveCorporateConsultations(_filter: CorporateConsultationListFilter = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) =>
      removeCorporateConsultationsService(ids, cachedRows(queryClient)),
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

export function useConfirmCorporateConsultations(_filter: CorporateConsultationListFilter = {}) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      ids,
      actorName = DEFAULT_CONFIRM_ACTOR,
    }: {
      ids: string[]
      actorName?: string
    }) =>
      confirmCorporateConsultationsService(ids, actorName, cachedRows(queryClient)),
    retry: false,
    onSuccess: updatedRows => {
      for (const row of updatedRows) {
        queryClient.setQueriesData<CorporateConsultation>(
          { queryKey: corporateConsultationQueryKeys.detail(source(), row.id) },
          existing =>
            existing
              ? {
                  ...existing,
                  status: row.status,
                  confirmedAt: row.confirmedAt,
                  confirmedByName: row.confirmedByName ?? existing.confirmedByName,
                }
              : existing,
        )
        patchInfiniteListRow(queryClient, corporateConsultationQueryKeys.lists(), row)
      }
      if (updatedRows.length === 0) {
        void queryClient.invalidateQueries({ queryKey: corporateConsultationQueryKeys.lists() })
      }
    },
  })
}
