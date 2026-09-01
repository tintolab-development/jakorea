import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  NtsDisclosure,
  ReportCreateInput,
  ReportKind,
  ReportListFilter,
  ReportUpdateInput,
  TransparencyReport,
} from '@/entities/reports-disclosure/model/types'
import { shouldUseReportsDisclosureRemoteApi } from './capabilities'
import { reportsDisclosureQueryKeys } from './query-keys'
import {
  createReportService,
  getNtsDisclosureService,
  listReportsService,
  removeReportsService,
  saveNtsDisclosureService,
  updateReportService,
} from './service'

function source(): 'remote' | 'local' {
  return shouldUseReportsDisclosureRemoteApi() ? 'remote' : 'local'
}

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
  const merged = new Map<string, TransparencyReport>()
  for (const [, rows] of queryClient.getQueriesData<TransparencyReport[]>({
    queryKey: [...reportsDisclosureQueryKeys.reports(), kind],
  })) {
    for (const row of rows ?? []) merged.set(row.id, row)
  }
  return merged.size > 0 ? [...merged.values()] : undefined
}

export function useReportsList(kind: ReportKind, filter: ReportListFilter, enabled = true) {
  const dataSource = source()
  return useQuery({
    queryKey: reportsDisclosureQueryKeys.reportList(kind, dataSource, filterKey(filter)),
    queryFn: () => listReportsService(kind, filter),
    enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
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
  const dataSource = source()
  return useQuery({
    queryKey: reportsDisclosureQueryKeys.ntsDetail(dataSource),
    queryFn: () => getNtsDisclosureService(),
    enabled,
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useSaveNtsDisclosure() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (linkUrl: string) => {
      const cached = queryClient.getQueryData<NtsDisclosure>(
        reportsDisclosureQueryKeys.ntsDetail(source()),
      )
      return saveNtsDisclosureService(linkUrl, cached)
    },
    retry: false,
    onSuccess: data => {
      queryClient.setQueryData(reportsDisclosureQueryKeys.ntsDetail(source()), data)
    },
  })
}
