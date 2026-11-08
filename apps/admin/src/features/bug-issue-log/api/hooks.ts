import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { BugIssueListFilter } from '@/entities/bug-issue-log/model/types'
import { useAdminInfiniteList } from '@/shared/hooks/use-admin-infinite-list'
import { fileDownloadLogQueryKeys } from '@/features/file-download-log/api/query-keys'
import { shouldUseBugIssueLogRemoteApi } from './capabilities'
import { bugIssueLogQueryKeys } from './query-keys'
import {
  exportBugIssueLogsService,
  listBugIssueLogsPageService,
} from './service'

function source(): 'remote' | 'local' {
  return shouldUseBugIssueLogRemoteApi() ? 'remote' : 'local'
}

export function useBugIssueLogsList(filter: BugIssueListFilter) {
  return useAdminInfiniteList({
    queryKey: bugIssueLogQueryKeys.list(source(), filter),
    isRemote: shouldUseBugIssueLogRemoteApi(),
    fetchPage: page => listBugIssueLogsPageService(filter, page),
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
