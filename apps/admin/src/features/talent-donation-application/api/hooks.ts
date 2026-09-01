import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  TalentDonationApplication,
  TalentDonationApplicationListFilter,
  TalentDonationApplicationListResult,
} from '@/entities/talent-donation-application/model/types'
import { shouldUseTalentDonationApplicationRemoteApi } from './capabilities'
import { talentDonationApplicationQueryKeys } from './query-keys'
import {
  confirmTalentDonationApplicationsService,
  getTalentDonationApplicationService,
  listTalentDonationApplicationsService,
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

function cachedList(
  queryClient: ReturnType<typeof useQueryClient>,
  filter: TalentDonationApplicationListFilter,
): TalentDonationApplicationListResult | undefined {
  return queryClient.getQueryData<TalentDonationApplicationListResult>(
    talentDonationApplicationQueryKeys.list(source(), filterKey(filter)),
  )
}

function patchApplicationInLists(
  queryClient: ReturnType<typeof useQueryClient>,
  application: TalentDonationApplication,
) {
  queryClient.setQueriesData<TalentDonationApplicationListResult>(
    { queryKey: talentDonationApplicationQueryKeys.lists() },
    old => {
      if (!old) return old
      const idx = old.items.findIndex(row => row.id === application.id)
      if (idx < 0) return old
      const items = [...old.items]
      items[idx] = application
      return { ...old, items }
    },
  )
}

export function useTalentDonationApplicationsList(
  filter: TalentDonationApplicationListFilter = {},
  enabled = true,
) {
  const dataSource = source()
  return useQuery({
    queryKey: talentDonationApplicationQueryKeys.list(dataSource, filterKey(filter)),
    queryFn: () => listTalentDonationApplicationsService(filter),
    enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useTalentDonationApplicationDetail(id: string | null, enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: talentDonationApplicationQueryKeys.detail(dataSource, id ?? ''),
    queryFn: () => getTalentDonationApplicationService(id!, DEFAULT_CONFIRM_ACTOR),
    enabled: Boolean(id) && enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useRemoveTalentDonationApplications(
  filter: TalentDonationApplicationListFilter = {},
) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => {
      const cached = cachedList(queryClient, filter)?.items
      const merged = new Map<string, TalentDonationApplication>()
      for (const [, result] of queryClient.getQueriesData<TalentDonationApplicationListResult>({
        queryKey: talentDonationApplicationQueryKeys.lists(),
      })) {
        for (const row of result?.items ?? []) merged.set(row.id, row)
      }
      return removeTalentDonationApplicationsService(ids, cached ?? [...merged.values()])
    },
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
  filter: TalentDonationApplicationListFilter = {},
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
      confirmTalentDonationApplicationsService(
        ids,
        actorName,
        cachedList(queryClient, filter)?.items,
      ),
    retry: false,
    onSuccess: updatedRows => {
      for (const row of updatedRows) {
        queryClient.setQueryData(
          talentDonationApplicationQueryKeys.detail(source(), row.id),
          row,
        )
        patchApplicationInLists(queryClient, row)
      }
      if (updatedRows.length === 0) {
        void queryClient.invalidateQueries({
          queryKey: talentDonationApplicationQueryKeys.lists(),
        })
      }
    },
  })
}
