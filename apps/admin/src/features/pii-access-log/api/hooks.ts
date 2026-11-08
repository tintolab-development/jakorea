import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { PiiAccessListFilter } from '@/entities/pii-access-log/model/types'
import { useAdminInfiniteList } from '@/shared/hooks/use-admin-infinite-list'
import { fileDownloadLogQueryKeys } from '@/features/file-download-log/api/query-keys'
import { shouldUsePiiAccessLogRemoteApi } from './capabilities'
import { piiAccessLogQueryKeys } from './query-keys'
import {
  exportPiiAccessLogsService,
  listPiiAccessLogsPageService,
} from './service'

function source(): 'remote' | 'local' {
  return shouldUsePiiAccessLogRemoteApi() ? 'remote' : 'local'
}

export function usePiiAccessLogsList(filter: PiiAccessListFilter) {
  return useAdminInfiniteList({
    queryKey: piiAccessLogQueryKeys.list(source(), filter),
    isRemote: shouldUsePiiAccessLogRemoteApi(),
    staleTime: 0,
    retry: false,
    fetchPage: page => listPiiAccessLogsPageService(filter, page),
  })
}

export function useExportPiiAccessLogs() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (filter: PiiAccessListFilter) => exportPiiAccessLogsService(filter),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: fileDownloadLogQueryKeys.all })
    },
  })
}
