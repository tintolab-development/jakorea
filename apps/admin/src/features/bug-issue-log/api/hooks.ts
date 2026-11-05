import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { BugIssueListFilter } from '@/entities/bug-issue-log/model/types'
import { fileDownloadLogQueryKeys } from '@/features/file-download-log/api/query-keys'
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
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (filter: BugIssueListFilter) => exportBugIssueLogsService(filter),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: fileDownloadLogQueryKeys.all })
    },
  })
}
