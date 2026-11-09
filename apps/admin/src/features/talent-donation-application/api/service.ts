import type { TalentDonationApplication, TalentDonationApplicationListFilter, } from '@/entities/talent-donation-application/model/types';
import { toAdminListPage, type AdminListPage } from '@/shared/lib/admin-infinite-list';
import { getJAKoreaHomepageAdminAPISponsorshipSubset } from '@/shared/api/generated/sponsorship/sponsorship-api';
import { defaultXlsxFilename, downloadRemoteLogExcel } from '@/features/logs/shared/lib/download-binary';
import { mapTalentApplicationDetailToDomain, mapTalentApplicationListItemToDomain, toTalentApplicationExportParams, toTalentApplicationListParams, toTalentApplicationStatusUpdateRequest, } from './mappers';
import { isAdminForbidden, isAdminNotFound } from '@/features/system-inbox/lib/http-status';
import { downloadHomepageProtectedAttachment, homepageTalentDonationAttachmentUrl } from '@/shared/lib/protected-attachment-download';
import { resolveApplicantRevealPii } from '@/features/auth/lib/applicant-reveal-pii';
function sponsorshipApi() {
    return getJAKoreaHomepageAdminAPISponsorshipSubset();
}
async function listRemote(filter: TalentDonationApplicationListFilter, page: number): Promise<AdminListPage<TalentDonationApplication>> {
    const response = await sponsorshipApi().list13(toTalentApplicationListParams(filter, page));
    return toAdminListPage((response.items ?? []).map(mapTalentApplicationListItemToDomain), page, response);
}
export async function listTalentDonationApplicationsPageService(filter: TalentDonationApplicationListFilter = {}, page = 0): Promise<AdminListPage<TalentDonationApplication>> {
    return listRemote(filter, page);
}
/**
 * 상세 진입 = 개인정보 원문 조회. 버튼 없이 진입 시 바로 원문을 받는다.
 * 단 HOMEPAGE_PII_VIEW가 없는 Program Viewer는 `revealPii=false`로 마스킹 상세를 받는다(권한 설정 V1.2).
 * 열람 기록은 BE가 상세 GET 200마다 남긴다(homepage_admin_audit_log PII_READ · homepage_privacy_access_log) —
 * FE에서 별도 로그 POST를 하지 않는다. 상세 쿼리는 staleTime/gcTime 0이라 진입할 때마다 GET(=로그 1건).
 */
export async function getTalentDonationApplicationService(id: string, actorName?: string): Promise<TalentDonationApplication | null> {
    void actorName;
    const numericId = Number(id);
    if (!Number.isFinite(numericId) || numericId <= 0)
        return null;
    try {
        const row = await sponsorshipApi().detail7(numericId, { revealPii: await resolveApplicantRevealPii() });
        return mapTalentApplicationDetailToDomain(row);
    }
    catch (error) {
        if (isAdminForbidden(error) || isAdminNotFound(error))
            throw error;
        return null;
    }
}
export async function downloadTalentDonationApplicationAttachmentService(id: string, assetId: number | null | undefined, password: string, fallbackFileName: string): Promise<void> {
    const numericId = Number(id);
    if (!Number.isFinite(numericId) || numericId <= 0) {
        throw new Error('첨부파일을 불러오지 못했습니다.');
    }
    await downloadHomepageProtectedAttachment({
        url: homepageTalentDonationAttachmentUrl(numericId, assetId),
        password,
        fallbackFileName,
    });
}
export async function removeTalentDonationApplicationsService(ids: string[], _cachedRows?: TalentDonationApplication[]): Promise<void> {
    void _cachedRows;
    const numericIds = ids
        .map(id => Number(id))
        .filter(id => Number.isFinite(id) && id > 0);
    if (numericIds.length === 0)
        return;
    await sponsorshipApi().delete3(numericIds);
    return;
}
export async function confirmTalentDonationApplicationsService(ids: string[], actorName?: string, _cachedRows?: TalentDonationApplication[]): Promise<TalentDonationApplication[]> {
    void _cachedRows;
    const results: TalentDonationApplication[] = [];
    for (const id of ids) {
        const numericId = Number(id);
        if (!Number.isFinite(numericId) || numericId <= 0)
            continue;
        const updated = await sponsorshipApi().updateStatus(numericId, toTalentApplicationStatusUpdateRequest('confirmed'));
        const mapped = mapTalentApplicationListItemToDomain(updated);
        if (actorName?.trim() && !mapped.confirmedByName) {
            mapped.confirmedByName = actorName.trim();
        }
        results.push(mapped);
    }
    return results;
}
/**
 * 엑셀 다운로드 — BE가 목록과 같은 필터·마스킹으로 xlsx를 만들고
 * 감사 로그(LIST_EXPORT)·파일 다운로드 이력을 남긴다. FE는 받은 파일을 저장만 한다.
 */
export async function exportTalentDonationApplicationsService(filter: TalentDonationApplicationListFilter = {}): Promise<void> {
    await downloadRemoteLogExcel({
        url: '/api/admin/sponsorship/talent-applications/export',
        params: toTalentApplicationExportParams(filter),
        filenameFallback: defaultXlsxFilename('재능기부_신청_목록'),
    });
}
