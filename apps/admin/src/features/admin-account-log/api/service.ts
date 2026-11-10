import type { AdminAccountListFilter, AdminAccountLog } from '@/entities/admin-account-log/model/types';
import { defaultXlsxFilename, downloadBinaryFile, } from '@/features/logs/shared/lib/download-binary';
import { getJAKoreaHomepageAdminAPILogsSubset } from '@/shared/api/generated/logs/logs-api';
import { axiosInstance } from '@/shared/instance/axios-instance';
import { toAdminListPage, type AdminListPage } from '@/shared/lib/admin-infinite-list';
import { mapAdminAccountActionsPageToDomain, toAdminAccountActionsExportParams, toAdminAccountActionsParams, } from './mappers';
function logsApi() {
    return getJAKoreaHomepageAdminAPILogsSubset();
}
export async function listAdminAccountLogsPageService(filter: AdminAccountListFilter, page: number): Promise<AdminListPage<AdminAccountLog>> {
    const response = await logsApi().adminAccountActions(toAdminAccountActionsParams({ ...filter, page }));
    const { rows, total } = mapAdminAccountActionsPageToDomain(response);
    return toAdminListPage(rows, page, { page: response.page, totalPages: response.totalPages, totalCount: total });
}
export async function exportAdminAccountLogsService(filter: AdminAccountListFilter): Promise<'remote-downloaded'> {
    const response = await axiosInstance.get<ArrayBuffer>('/api/admin/logs/admin-account-actions/export', {
        params: toAdminAccountActionsExportParams(filter),
        responseType: 'arraybuffer',
    });
    downloadBinaryFile({
        data: response.data,
        contentType: (response.headers['content-type'] as string | undefined) ||
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        // 서버 헤더(영문) 대신 한글 파일명을 항상 사용한다.
        filenameFallback: defaultXlsxFilename('관리자 계정 처리 이력'),
    });
    return 'remote-downloaded';
}
