import type {
  AdminAccountListFilter,
  AdminAccountListResult,
} from '@/entities/admin-account-log/model/types'
import {
  defaultXlsxFilename,
  downloadBinaryFile,
} from '@/features/logs/shared/lib/download-binary'
import { getJAKoreaHomepageAdminAPILogsSubset } from '@/shared/api/generated/logs/logs-api'
import { axiosInstance } from '@/shared/instance/axios-instance'
import { shouldUseAdminAccountLogRemoteApi } from './capabilities'
import {
  mapAdminAccountActionsPageToDomain,
  toAdminAccountActionsExportParams,
  toAdminAccountActionsParams,
} from './mappers'
import { listAdminAccountLogs } from './store'

function logsApi() {
  return getJAKoreaHomepageAdminAPILogsSubset()
}

export async function listAdminAccountLogsService(
  filter: AdminAccountListFilter,
): Promise<AdminAccountListResult> {
  if (shouldUseAdminAccountLogRemoteApi()) {
    const response = await logsApi().adminAccountActions(
      toAdminAccountActionsParams(filter),
    )
    return mapAdminAccountActionsPageToDomain(response)
  }
  return listAdminAccountLogs(filter)
}

export async function exportAdminAccountLogsService(
  filter: AdminAccountListFilter,
): Promise<'remote-downloaded' | 'use-local-csv'> {
  if (!shouldUseAdminAccountLogRemoteApi()) return 'use-local-csv'

  const response = await axiosInstance.get<ArrayBuffer>(
    '/api/admin/logs/admin-account-actions/export',
    {
      params: toAdminAccountActionsExportParams(filter),
      responseType: 'arraybuffer',
    },
  )
  downloadBinaryFile({
    data: response.data,
    contentType:
      (response.headers['content-type'] as string | undefined) ||
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    contentDisposition: response.headers['content-disposition'] as string | undefined,
    filenameFallback: defaultXlsxFilename('관리자_계정_처리_이력'),
  })
  return 'remote-downloaded'
}
