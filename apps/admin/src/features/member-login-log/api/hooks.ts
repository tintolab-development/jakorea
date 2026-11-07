import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { MemberLoginListFilter } from '@/entities/member-login-log/model/types'
import { fileDownloadLogQueryKeys } from '@/features/file-download-log/api/query-keys'
import { shouldUseMemberLoginLogRemoteApi } from './capabilities'
import { memberLoginLogQueryKeys } from './query-keys'
import {
  exportMemberLoginLogsService,
  listMemberLoginLogsService,
} from './service'

function source(): 'remote' | 'local' {
  return shouldUseMemberLoginLogRemoteApi() ? 'remote' : 'local'
}

export function useMemberLoginLogsList(filter: MemberLoginListFilter) {
  const dataSource = source()
  return useQuery({
    queryKey: memberLoginLogQueryKeys.list(dataSource, filter),
    queryFn: () => listMemberLoginLogsService(filter),
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
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
