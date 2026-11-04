import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  TalentDonationApplication,
  TalentDonationApplicationListFilter,
} from '@/entities/talent-donation-application/model/types'
import { useAdminInfiniteList } from '@/shared/hooks/use-admin-infinite-list'
import {
  collectInfiniteCachedRows,
  patchInfiniteListRow,
} from '@/shared/lib/admin-infinite-list'
import { shouldUseTalentDonationApplicationRemoteApi } from './capabilities'
import { talentDonationApplicationQueryKeys } from './query-keys'
import {
  confirmTalentDonationApplicationsService,
  getTalentDonationApplicationService,
  listTalentDonationApplicationsPageService,
  removeTalentDonationApplicationsService,
} from './service'
import { DEFAULT_CONFIRM_ACTOR } from './store'

function source(): 'remote' | 'local' {
  return shouldUseTalentDonationApplicationRemoteApi() ? 'remote' : 'local'
}

function filterKey(filter: TalentDonationApplicationListFilter): string {
  return JSON.stringify({
    status: filter.status ?? '',
    name: filter.applicantName ?? '',
    phone: filter.phone ?? '',
    email: filter.email ?? '',
    history: filter.jaProgramHistory ?? '',
    af: filter.appliedFrom ?? '',
    at: filter.appliedTo ?? '',
    cf: filter.confirmedFrom ?? '',
    ct: filter.confirmedTo ?? '',
  })
}

function cachedRows(
  queryClient: ReturnType<typeof useQueryClient>,
): TalentDonationApplication[] | undefined {
  return collectInfiniteCachedRows<TalentDonationApplication>(
    queryClient,
    talentDonationApplicationQueryKeys.lists(),
  )
}

export function useTalentDonationApplicationsList(
  filter: TalentDonationApplicationListFilter = {},
  enabled = true,
) {
  return useAdminInfiniteList({
    queryKey: talentDonationApplicationQueryKeys.list(source(), filterKey(filter)),
    enabled,
    isRemote: shouldUseTalentDonationApplicationRemoteApi(),
    fetchPage: page => listTalentDonationApplicationsPageService(filter, page),
  })
}

export function useTalentDonationApplicationDetail(
  id: string | null,
  enabled = true,
  revealPii = false,
) {
  const dataSource = source()
  return useQuery({
    queryKey: talentDonationApplicationQueryKeys.detail(dataSource, id ?? '', revealPii),
    queryFn: () =>
      getTalentDonationApplicationService(id!, DEFAULT_CONFIRM_ACTOR, { revealPii }),
    enabled: Boolean(id) && enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useRemoveTalentDonationApplications(
  _filter: TalentDonationApplicationListFilter = {},
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) =>
      removeTalentDonationApplicationsService(ids, cachedRows(queryClient)),
    retry: false,
    onSuccess: (_void, ids) => {
      void queryClient.invalidateQueries({ queryKey: talentDonationApplicationQueryKeys.lists() })
      for (const id of ids) {
        queryClient.removeQueries({
          queryKey: talentDonationApplicationQueryKeys.detail(source(), id),
        })
      }
    },
  })
}

export function useConfirmTalentDonationApplications(
  _filter: TalentDonationApplicationListFilter = {},
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      ids,
      actorName = DEFAULT_CONFIRM_ACTOR,
    }: {
      ids: string[]
      actorName?: string
    }) =>
      confirmTalentDonationApplicationsService(ids, actorName, cachedRows(queryClient)),
    retry: false,
    onSuccess: updatedRows => {
      for (const row of updatedRows) {
        // status PATCH 응답은 list item shape — 상세 PII를 덮어쓰지 않는다
        queryClient.setQueriesData<TalentDonationApplication>(
          { queryKey: talentDonationApplicationQueryKeys.detail(source(), row.id) },
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
        patchInfiniteListRow(queryClient, talentDonationApplicationQueryKeys.lists(), row)
      }
      if (updatedRows.length === 0) {
        void queryClient.invalidateQueries({
          queryKey: talentDonationApplicationQueryKeys.lists(),
        })
      }
    },
  })
}
