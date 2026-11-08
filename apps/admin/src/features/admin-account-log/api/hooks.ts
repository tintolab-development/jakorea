import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { AdminAccountListFilter } from '@/entities/admin-account-log/model/types'
import { useAdminInfiniteList } from '@/shared/hooks/use-admin-infinite-list'
import { fileDownloadLogQueryKeys } from '@/features/file-download-log/api/query-keys'
import { shouldUseAdminAccountLogRemoteApi } from './capabilities'
import { adminAccountLogQueryKeys } from './query-keys'
import {
  exportAdminAccountLogsService,
  listAdminAccountLogsPageService,
} from './service'

function source(): 'remote' | 'local' {
  return shouldUseAdminAccountLogRemoteApi() ? 'remote' : 'local'
}

export function useAdminAccountLogsList(filter: AdminAccountListFilter) {
  return useAdminInfiniteList({
    queryKey: adminAccountLogQueryKeys.list(source(), filter),
    isRemote: shouldUseAdminAccountLogRemoteApi(),
    staleTime: 0,
    retry: false,
    fetchPage: page => listAdminAccountLogsPageService(filter, page),
  })
}

export function useExportAdminAccountLogs() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (filter: AdminAccountListFilter) =>
      exportAdminAccountLogsService(filter),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: fileDownloadLogQueryKeys.all })
      void queryClient.invalidateQueries({ queryKey: adminAccountLogQueryKeys.all })
    },
  })
}
