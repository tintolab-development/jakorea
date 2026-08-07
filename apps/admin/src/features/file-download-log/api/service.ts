import type {
  FileDownloadListFilter,
  FileDownloadListResult,
} from '@/entities/file-download-log/model/types'
import { shouldUseFileDownloadLogRemoteApi } from './capabilities'
import { listFileDownloadLogs } from './store'

const remoteError = 'File download log remote API is not implemented yet'

export async function listFileDownloadLogsService(
  filter: FileDownloadListFilter
): Promise<FileDownloadListResult> {
  if (shouldUseFileDownloadLogRemoteApi()) throw new Error(remoteError)
  return listFileDownloadLogs(filter)
}
