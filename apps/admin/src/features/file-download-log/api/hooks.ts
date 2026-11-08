import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { FileDownloadListFilter } from '@/entities/file-download-log/model/types'
import { useAdminInfiniteList } from '@/shared/hooks/use-admin-infinite-list'
import { shouldUseFileDownloadLogRemoteApi } from './capabilities'
import { fileDownloadLogQueryKeys } from './query-keys'
import {
  exportFileDownloadLogsService,
  listFileDownloadLogsPageService,
} from './service'

function source(): 'remote' | 'local' {
  return shouldUseFileDownloadLogRemoteApi() ? 'remote' : 'local'
}

export function useFileDownloadLogsList(filter: FileDownloadListFilter) {
  return useAdminInfiniteList({
    queryKey: fileDownloadLogQueryKeys.list(source(), filter),
    isRemote: shouldUseFileDownloadLogRemoteApi(),
    staleTime: 0,
    retry: false,
    fetchPage: page => listFileDownloadLogsPageService(filter, page),
  })
}

export function useExportFileDownloadLogs() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (filter: FileDownloadListFilter) =>
      exportFileDownloadLogsService(filter),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: fileDownloadLogQueryKeys.all })
    },
  })
}
