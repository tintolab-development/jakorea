import { useQuery } from '@tanstack/react-query'
import type { FileDownloadListFilter } from '@/entities/file-download-log/model/types'
import { shouldUseFileDownloadLogRemoteApi } from './capabilities'
import { fileDownloadLogQueryKeys } from './query-keys'
import { listFileDownloadLogsService } from './service'

function source(): 'remote' | 'local' {
  return shouldUseFileDownloadLogRemoteApi() ? 'remote' : 'local'
}

export function useFileDownloadLogsList(filter: FileDownloadListFilter) {
  const dataSource = source()
  return useQuery({
    queryKey: fileDownloadLogQueryKeys.list(dataSource, filter),
    queryFn: () => listFileDownloadLogsService(filter),
    staleTime: dataSource === 'remote' ? 30_000 : Number.POSITIVE_INFINITY,
    retry: dataSource === 'remote' ? 1 : false,
  })
}
