import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { PiiAccessListFilter } from '@/entities/pii-access-log/model/types'
import { fileDownloadLogQueryKeys } from '@/features/file-download-log/api/query-keys'
import { shouldUsePiiAccessLogRemoteApi } from './capabilities'
import { piiAccessLogQueryKeys } from './query-keys'
import {
  exportPiiAccessLogsService,
  listPiiAccessLogsService,
} from './service'

function source(): 'remote' | 'local' {
  return shouldUsePiiAccessLogRemoteApi() ? 'remote' : 'local'
}

export function usePiiAccessLogsList(filter: PiiAccessListFilter) {
  const dataSource = source()
  return useQuery({
    queryKey: piiAccessLogQueryKeys.list(dataSource, filter),
    queryFn: () => listPiiAccessLogsService(filter),
    staleTime: 0,
    retry: false,
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
