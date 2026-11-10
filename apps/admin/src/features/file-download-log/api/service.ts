import type { FileDownloadListFilter, FileDownloadLog } from '@/entities/file-download-log/model/types';
import { defaultXlsxFilename, downloadBinaryFile, } from '@/features/logs/shared/lib/download-binary';
import { getJAKoreaHomepageAdminAPILogsSubset } from '@/shared/api/generated/logs/logs-api';
import { axiosInstance } from '@/shared/instance/axios-instance';
import { toAdminListPage, type AdminListPage } from '@/shared/lib/admin-infinite-list';
import { mapFileDownloadsPageToDomain, toFileDownloadsExportParams, toFileDownloadsParams, } from './mappers';
function logsApi() {
    return getJAKoreaHomepageAdminAPILogsSubset();
}
export async function listFileDownloadLogsPageService(filter: FileDownloadListFilter, page: number): Promise<AdminListPage<FileDownloadLog>> {
    const response = await logsApi().fileDownloads(toFileDownloadsParams({ ...filter, page }));
    const { rows, total } = mapFileDownloadsPageToDomain(response);
    return toAdminListPage(rows, page, { page: response.page, totalPages: response.totalPages, totalCount: total });
}
export async function exportFileDownloadLogsService(filter: FileDownloadListFilter): Promise<'remote-downloaded'> {
    const response = await axiosInstance.get<ArrayBuffer>('/api/admin/logs/file-downloads/export', {
        params: toFileDownloadsExportParams(filter),
        responseType: 'arraybuffer',
    });
    downloadBinaryFile({
        data: response.data,
        contentType: (response.headers['content-type'] as string | undefined) ||
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        // 서버 헤더(영문 file_download_log_*) 대신 한글 파일명을 항상 사용한다.
        filenameFallback: defaultXlsxFilename('파일 다운로드 이력'),
    });
    return 'remote-downloaded';
}
