import type { MemberLoginListFilter, MemberLoginListResult } from '@/entities/member-login-log/model/types';
import { defaultXlsxFilename, downloadBinaryFile, } from '@/features/logs/shared/lib/download-binary';
import { getJAKoreaHomepageAdminAPILogsSubset } from '@/shared/api/generated/logs/logs-api';
import { axiosInstance } from '@/shared/instance/axios-instance';
import { mapMemberLoginsPageToDomain, toMemberLoginsExportParams, toMemberLoginsParams, } from './mappers';
function logsApi() {
    return getJAKoreaHomepageAdminAPILogsSubset();
}
export async function listMemberLoginLogsService(filter: MemberLoginListFilter): Promise<MemberLoginListResult> {
    const response = await logsApi().memberLogins(toMemberLoginsParams(filter));
    return mapMemberLoginsPageToDomain(response);
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
        contentDisposition: response.headers['content-disposition'] as string | undefined,
        filenameFallback: defaultXlsxFilename('회원_로그인_이력'),
    });
    return 'remote-downloaded';
}
