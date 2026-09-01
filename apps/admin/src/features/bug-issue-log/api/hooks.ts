import { useMutation, useQuery } from '@tanstack/react-query'
import type { BugIssueListFilter } from '@/entities/bug-issue-log/model/types'
import { shouldUseBugIssueLogRemoteApi } from './capabilities'
import { bugIssueLogQueryKeys } from './query-keys'
import {
  exportBugIssueLogsService,
  listBugIssueLogsService,
} from './service'

function source(): 'remote' | 'local' {
  return shouldUseBugIssueLogRemoteApi() ? 'remote' : 'local'
}

export function useBugIssueLogsList(filter: BugIssueListFilter) {
  const dataSource = source()
  return useQuery({
    queryKey: bugIssueLogQueryKeys.list(dataSource, filter),
    queryFn: () => listBugIssueLogsService(filter),
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}

export function useExportBugIssueLogs() {
  return useMutation({
    mutationFn: (filter: BugIssueListFilter) => exportBugIssueLogsService(filter),
    retry: false,
  })
}
