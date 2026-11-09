import type { BugIssueListFilter, BugIssueLog } from '@/entities/bug-issue-log/model/types';
import { defaultXlsxFilename, downloadBinaryFile, } from '@/features/logs/shared/lib/download-binary';
import { getJAKoreaHomepageAdminAPILogsSubset } from '@/shared/api/generated/logs/logs-api';
import { axiosInstance } from '@/shared/instance/axios-instance';
import { toAdminListPage, type AdminListPage } from '@/shared/lib/admin-infinite-list';
import { mapSystemIssuesPageToDomain, toSystemIssuesExportParams, toSystemIssuesParams, } from './mappers';
function logsApi() {
    return getJAKoreaHomepageAdminAPILogsSubset();
}
export async function listBugIssueLogsPageService(filter: BugIssueListFilter, page: number): Promise<AdminListPage<BugIssueLog>> {
    const response = await logsApi().systemIssues(toSystemIssuesParams({ ...filter, page }));
    const { rows, total } = mapSystemIssuesPageToDomain(response);
    return toAdminListPage(rows, page, { page: response.page, totalPages: response.totalPages, totalCount: total });
}
export async function exportBugIssueLogsService(filter: BugIssueListFilter): Promise<'remote-downloaded'> {
    const response = await axiosInstance.get<ArrayBuffer>('/api/admin/logs/system-issues/export', {
        params: toSystemIssuesExportParams(filter),
        responseType: 'arraybuffer',
    });
    downloadBinaryFile({
        data: response.data,
        contentType: (response.headers['content-type'] as string | undefined) ||
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        contentDisposition: response.headers['content-disposition'] as string | undefined,
        filenameFallback: defaultXlsxFilename('버그_이슈_이력'),
    });
    return 'remote-downloaded';
}
