import type {
  PiiAccessListFilter,
  PiiAccessListResult,
} from '@/entities/pii-access-log/model/types'
import {
  defaultXlsxFilename,
  downloadBinaryFile,
} from '@/features/logs/shared/lib/download-binary'
import { getJAKoreaHomepageAdminAPILogsSubset } from '@/shared/api/generated/logs/logs-api'
import { axiosInstance } from '@/shared/instance/axios-instance'
import { shouldUsePiiAccessLogRemoteApi } from './capabilities'
import {
  mapPrivacyAccessPageToDomain,
  toPrivacyAccessExportParams,
  toPrivacyAccessParams,
} from './mappers'
import { listPiiAccessLogs } from './store'

function logsApi() {
  return getJAKoreaHomepageAdminAPILogsSubset()
}

export async function listPiiAccessLogsService(
  filter: PiiAccessListFilter,
): Promise<PiiAccessListResult> {
  if (shouldUsePiiAccessLogRemoteApi()) {
    const response = await logsApi().privacyAccess(toPrivacyAccessParams(filter))
    return mapPrivacyAccessPageToDomain(response)
  }
  return listPiiAccessLogs(filter)
}

/** remote: 서버 xlsx export / local: 호출측에서 CSV 유지 */
export async function exportPiiAccessLogsService(
  filter: PiiAccessListFilter,
): Promise<'remote-downloaded' | 'use-local-csv'> {
  if (!shouldUsePiiAccessLogRemoteApi()) return 'use-local-csv'

  const response = await axiosInstance.get<ArrayBuffer>(
    '/api/admin/logs/privacy-access/export',
    {
      params: toPrivacyAccessExportParams(filter),
      responseType: 'arraybuffer',
    },
  )
  downloadBinaryFile({
    data: response.data,
    contentType:
      (response.headers['content-type'] as string | undefined) ||
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    contentDisposition: response.headers['content-disposition'] as string | undefined,
    filenameFallback: defaultXlsxFilename('개인정보_조회_이력'),
  })
  return 'remote-downloaded'
}
