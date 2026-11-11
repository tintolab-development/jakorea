import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAdminInfiniteList } from '@/shared/hooks/use-admin-infinite-list'
import {
  collectInfiniteCachedRows,
  patchInfiniteListRow,
  removeInfiniteListRows,
} from '@/shared/lib/admin-infinite-list'
import type {
  NtsDisclosure,
  ReportCreateInput,
  ReportKind,
  ReportListFilter,
  ReportUpdateInput,
  TransparencyReport,
} from '@/entities/reports-disclosure/model/types'
import { reportsDisclosureQueryKeys } from './query-keys'
import {
  createReportService,
  getNtsDisclosureService,
  listReportsPageService,
  removeReportsService,
  saveNtsDisclosureService,
  updateReportService,
} from './service'

function filterKey(filter: ReportListFilter): string {
  return JSON.stringify({
    t: filter.title ?? '',
    a: filter.attachmentName ?? '',
    f: filter.createdFrom ?? '',
    to: filter.createdTo ?? '',
  })
}

function collectCachedReports(
  queryClient: ReturnType<typeof useQueryClient>,
  kind: ReportKind,
): TransparencyReport[] | undefined {
  return collectInfiniteCachedRows<TransparencyReport>(queryClient, [
    ...reportsDisclosureQueryKeys.reports(),
    kind,
  ])
}

export function useReportsList(kind: ReportKind, filter: ReportListFilter, enabled = true) {
  return useAdminInfiniteList({
    queryKey: reportsDisclosureQueryKeys.reportList(kind, filterKey(filter)),
    enabled,
    isRemote: true,
    fetchPage: page => listReportsPageService(kind, filter, page),
  })
}

export function useCreateReport(kind: ReportKind) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ReportCreateInput) => createReportService(kind, input),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reportsDisclosureQueryKeys.reports() })
    },
  })
}

export function useUpdateReport(kind: ReportKind) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ReportUpdateInput) =>
      updateReportService(kind, input, collectCachedReports(queryClient, kind)),
    retry: false,
    // 목록은 무한 스크롤 캐시({ pages }) — 배열로 다루면 onSuccess가 throw해 저장 성공이 실패로 보이고
    // 캐시 version이 옛값으로 남아 다음 저장이 OPTIMISTIC_LOCK_CONFLICT가 된다
    onSuccess: data => {
      patchInfiniteListRow(queryClient, [...reportsDisclosureQueryKeys.reports(), kind], data)
    },
  })
}

export function useRemoveReports(kind: ReportKind) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) =>
      removeReportsService(kind, ids, collectCachedReports(queryClient, kind)),
    retry: false,
    onSuccess: (_data, ids) => {
      removeInfiniteListRows(queryClient, [...reportsDisclosureQueryKeys.reports(), kind], ids)
    },
  })
}

export function useNtsDisclosure(enabled = true) {
  return useQuery({
    queryKey: reportsDisclosureQueryKeys.ntsDetail(),
    queryFn: () => getNtsDisclosureService(),
    enabled,
    staleTime: 30_000,
    retry: 1,
  })
}

export function useSaveNtsDisclosure() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (linkUrl: string) => {
      const cached = queryClient.getQueryData<NtsDisclosure>(
        reportsDisclosureQueryKeys.ntsDetail(),
      )
      return saveNtsDisclosureService(linkUrl, cached)
    },
    retry: false,
    onSuccess: data => {
      queryClient.setQueryData(reportsDisclosureQueryKeys.ntsDetail(), data)
    },
  })
}
