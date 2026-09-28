import type {
  PiiAccessListFilter,
  PiiAccessListResult,
  PiiAccessLog,
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
import { listPiiAccessLogs, listPiiAccessLogsAll } from './store'

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

/** remote: 서버 xlsx export / local: 필터 전체 CSV (페이지 무시) */
export async function exportPiiAccessLogsService(
  filter: PiiAccessListFilter,
): Promise<'remote-downloaded' | { source: 'local'; rows: PiiAccessLog[] }> {
  if (!shouldUsePiiAccessLogRemoteApi()) {
    return { source: 'local', rows: listPiiAccessLogsAll(filter) }
  }

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
