import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  ReportCreateInput,
  ReportKind,
  ReportListFilter,
  ReportUpdateInput,
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
    mutationFn: (input: ReportUpdateInput) => updateReportService(kind, input),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reportsDisclosureQueryKeys.reports() })
    },
  })
}

export function useRemoveReports(kind: ReportKind) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => removeReportsService(kind, ids),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: reportsDisclosureQueryKeys.reports() })
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
    mutationFn: (linkUrl: string) => saveNtsDisclosureService(linkUrl),
    retry: false,
    onSuccess: data => {
      queryClient.setQueryData(reportsDisclosureQueryKeys.ntsDetail(source()), data)
      void queryClient.invalidateQueries({ queryKey: reportsDisclosureQueryKeys.nts() })
    },
  })
}
