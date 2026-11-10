import type { MemberLoginListFilter, MemberLoginLog } from '@/entities/member-login-log/model/types';
import { defaultXlsxFilename, downloadBinaryFile, } from '@/features/logs/shared/lib/download-binary';
import { getJAKoreaHomepageAdminAPILogsSubset } from '@/shared/api/generated/logs/logs-api';
import { axiosInstance } from '@/shared/instance/axios-instance';
import { toAdminListPage, type AdminListPage } from '@/shared/lib/admin-infinite-list';
import { mapMemberLoginsPageToDomain, toMemberLoginsExportParams, toMemberLoginsParams, } from './mappers';
function logsApi() {
    return getJAKoreaHomepageAdminAPILogsSubset();
}
export async function listMemberLoginLogsPageService(filter: MemberLoginListFilter, page: number): Promise<AdminListPage<MemberLoginLog>> {
    const response = await logsApi().memberLogins(toMemberLoginsParams({ ...filter, page }));
    const { rows, total } = mapMemberLoginsPageToDomain(response);
    return toAdminListPage(rows, page, { page: response.page, totalPages: response.totalPages, totalCount: total });
}
export async function exportMemberLoginLogsService(filter: MemberLoginListFilter): Promise<'remote-downloaded'> {
    const response = await axiosInstance.get<ArrayBuffer>('/api/admin/logs/member-logins/export', {
        params: toMemberLoginsExportParams(filter),
        responseType: 'arraybuffer',
    });
    downloadBinaryFile({
        data: response.data,
        contentType: (response.headers['content-type'] as string | undefined) ||
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        // 서버 헤더(영문) 대신 한글 파일명을 항상 사용한다.
        filenameFallback: defaultXlsxFilename('회원 로그인 이력'),
    });
    return 'remote-downloaded';
}
