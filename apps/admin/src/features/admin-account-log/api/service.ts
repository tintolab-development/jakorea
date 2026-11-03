import type { AdminAccountListFilter, AdminAccountListResult } from '@/entities/admin-account-log/model/types';
import { defaultXlsxFilename, downloadBinaryFile, } from '@/features/logs/shared/lib/download-binary';
import { getJAKoreaHomepageAdminAPILogsSubset } from '@/shared/api/generated/logs/logs-api';
import { axiosInstance } from '@/shared/instance/axios-instance';
import { mapAdminAccountActionsPageToDomain, toAdminAccountActionsExportParams, toAdminAccountActionsParams, } from './mappers';
function logsApi() {
    return getJAKoreaHomepageAdminAPILogsSubset();
}
export async function listAdminAccountLogsService(filter: AdminAccountListFilter): Promise<AdminAccountListResult> {
    const response = await logsApi().adminAccountActions(toAdminAccountActionsParams(filter));
    return mapAdminAccountActionsPageToDomain(response);
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
        contentDisposition: response.headers['content-disposition'] as string | undefined,
        filenameFallback: defaultXlsxFilename('관리자_계정_처리_이력'),
    });
    return 'remote-downloaded';
}
