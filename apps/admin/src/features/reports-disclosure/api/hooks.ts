import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAdminInfiniteList } from '@/shared/hooks/use-admin-infinite-list'
import { collectInfiniteCachedRows } from '@/shared/lib/admin-infinite-list'
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
    onSuccess: data => {
      queryClient.setQueriesData<TransparencyReport[]>(
        { queryKey: [...reportsDisclosureQueryKeys.reports(), kind] },
        old => {
          if (!old) return old
          const idx = old.findIndex(row => row.id === data.id)
          if (idx < 0) return old
          const next = [...old]
          next[idx] = data
          return next
        },
      )
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
      const idSet = new Set(ids)
      queryClient.setQueriesData<TransparencyReport[]>(
        { queryKey: [...reportsDisclosureQueryKeys.reports(), kind] },
        old => (old ?? []).filter(row => !idSet.has(row.id)),
      )
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
