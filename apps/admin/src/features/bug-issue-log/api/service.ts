import type {
  BugIssueListFilter,
  BugIssueListResult,
  BugIssueLog,
} from '@/entities/bug-issue-log/model/types'
import {
  defaultXlsxFilename,
  downloadBinaryFile,
} from '@/features/logs/shared/lib/download-binary'
import { getJAKoreaHomepageAdminAPILogsSubset } from '@/shared/api/generated/logs/logs-api'
import { axiosInstance } from '@/shared/instance/axios-instance'
import { shouldUseBugIssueLogRemoteApi } from './capabilities'
import {
  mapSystemIssuesPageToDomain,
  toSystemIssuesExportParams,
  toSystemIssuesParams,
} from './mappers'
import { listBugIssueLogs, listBugIssueLogsAll } from './store'

function logsApi() {
  return getJAKoreaHomepageAdminAPILogsSubset()
}

export async function listBugIssueLogsService(
  filter: BugIssueListFilter,
): Promise<BugIssueListResult> {
  if (shouldUseBugIssueLogRemoteApi()) {
    const response = await logsApi().systemIssues(toSystemIssuesParams(filter))
    return mapSystemIssuesPageToDomain(response)
  }
  return listBugIssueLogs(filter)
}

export async function exportBugIssueLogsService(
  filter: BugIssueListFilter,
): Promise<'remote-downloaded' | { source: 'local'; rows: BugIssueLog[] }> {
  if (!shouldUseBugIssueLogRemoteApi()) {
    return { source: 'local', rows: listBugIssueLogsAll(filter) }
  }

  const response = await axiosInstance.get<ArrayBuffer>(
    '/api/admin/logs/system-issues/export',
    {
      params: toSystemIssuesExportParams(filter),
      responseType: 'arraybuffer',
    },
  )
  downloadBinaryFile({
    data: response.data,
    contentType:
      (response.headers['content-type'] as string | undefined) ||
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    contentDisposition: response.headers['content-disposition'] as string | undefined,
    filenameFallback: defaultXlsxFilename('버그_이슈_이력'),
  })
  return 'remote-downloaded'
}
