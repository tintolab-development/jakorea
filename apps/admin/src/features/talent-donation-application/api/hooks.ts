import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  TalentDonationApplication,
  TalentDonationApplicationListFilter,
} from '@/entities/talent-donation-application/model/types'
import { fileDownloadLogQueryKeys } from '@/features/file-download-log/api/query-keys'
import { useAdminInfiniteList } from '@/shared/hooks/use-admin-infinite-list'
import {
  collectInfiniteCachedRows,
  patchInfiniteListRow,
} from '@/shared/lib/admin-infinite-list'
import { shouldUseTalentDonationApplicationRemoteApi } from './capabilities'
import { talentDonationApplicationQueryKeys } from './query-keys'
import {
  confirmTalentDonationApplicationsService,
  exportTalentDonationApplicationsService,
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

export function useTalentDonationApplicationDetail(id: string | null, enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: talentDonationApplicationQueryKeys.detail(dataSource, id ?? ''),
    queryFn: () => getTalentDonationApplicationService(id!, DEFAULT_CONFIRM_ACTOR),
    enabled: Boolean(id) && enabled,
    staleTime: dataSource === 'remote' ? 0 : Number.POSITIVE_INFINITY,
    gcTime: dataSource === 'remote' ? 0 : 15 * 60_000,
    retry: false,
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

/** 엑셀 다운로드 — 성공 시 BE가 남긴 파일 다운로드 이력 목록을 갱신한다. */
export function useExportTalentDonationApplications() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (filter: TalentDonationApplicationListFilter) => exportTalentDonationApplicationsService(filter),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: fileDownloadLogQueryKeys.all })
    },
  })
}
