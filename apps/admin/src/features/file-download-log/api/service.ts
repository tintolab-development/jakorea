import type {
  FileDownloadListFilter,
  FileDownloadListResult,
} from '@/entities/file-download-log/model/types'
import {
  defaultXlsxFilename,
  downloadBinaryFile,
} from '@/features/logs/shared/lib/download-binary'
import { getJAKoreaHomepageAdminAPILogsSubset } from '@/shared/api/generated/logs/logs-api'
import { axiosInstance } from '@/shared/instance/axios-instance'
import { shouldUseFileDownloadLogRemoteApi } from './capabilities'
import {
  mapFileDownloadsPageToDomain,
  toFileDownloadsExportParams,
  toFileDownloadsParams,
} from './mappers'
import { listFileDownloadLogs } from './store'

function logsApi() {
  return getJAKoreaHomepageAdminAPILogsSubset()
}

export async function listFileDownloadLogsService(
  filter: FileDownloadListFilter,
): Promise<FileDownloadListResult> {
  if (shouldUseFileDownloadLogRemoteApi()) {
    const response = await logsApi().fileDownloads(toFileDownloadsParams(filter))
    return mapFileDownloadsPageToDomain(response)
  }
  return listFileDownloadLogs(filter)
}

export async function exportFileDownloadLogsService(
  filter: FileDownloadListFilter,
): Promise<'remote-downloaded' | 'use-local-csv'> {
  if (!shouldUseFileDownloadLogRemoteApi()) return 'use-local-csv'

  const response = await axiosInstance.get<ArrayBuffer>(
    '/api/admin/logs/file-downloads/export',
    {
      params: toFileDownloadsExportParams(filter),
      responseType: 'arraybuffer',
    },
  )
  downloadBinaryFile({
    data: response.data,
    contentType:
      (response.headers['content-type'] as string | undefined) ||
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    contentDisposition: response.headers['content-disposition'] as string | undefined,
    filenameFallback: defaultXlsxFilename('파일_다운로드_이력'),
  })
  return 'remote-downloaded'
}
