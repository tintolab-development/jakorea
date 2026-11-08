import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { MemberLoginListFilter } from '@/entities/member-login-log/model/types'
import { useAdminInfiniteList } from '@/shared/hooks/use-admin-infinite-list'
import { fileDownloadLogQueryKeys } from '@/features/file-download-log/api/query-keys'
import { shouldUseMemberLoginLogRemoteApi } from './capabilities'
import { memberLoginLogQueryKeys } from './query-keys'
import {
  exportMemberLoginLogsService,
  listMemberLoginLogsPageService,
} from './service'

function source(): 'remote' | 'local' {
  return shouldUseMemberLoginLogRemoteApi() ? 'remote' : 'local'
}

export function useMemberLoginLogsList(filter: MemberLoginListFilter) {
  return useAdminInfiniteList({
    queryKey: memberLoginLogQueryKeys.list(source(), filter),
    isRemote: shouldUseMemberLoginLogRemoteApi(),
    fetchPage: page => listMemberLoginLogsPageService(filter, page),
  })
}

export function useExportMemberLoginLogs() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (filter: MemberLoginListFilter) =>
      exportMemberLoginLogsService(filter),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: fileDownloadLogQueryKeys.all })
    },
  })
}
